import os
import json
import yaml
import time
from pathlib import Path
from typing import List, Dict, Any
from dotenv import load_dotenv
import google.generativeai as genai
from .models import (
    VideoEvent,
    EventType,
    AudioTranscript,
    VideoChunk,
    ToolIdentification,
    WorkflowStep,
)

load_dotenv()


# Helper functions to generate Gemini schemas from our domain models
def generate_video_events_schema():
    """Generate JSON schema for Gemini API video events response"""
    return {
        "type": "object",
        "properties": {
            "events": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "timestamp": {"type": "integer"},
                        "event_type": {
                            "type": "string",
                            "enum": [
                                "SCREEN_CHANGE",
                                "USER_ACTION",
                                "APPLICATION_SWITCH",
                                "WORKFLOW_STEP",
                                "TRANSCRIPT",
                            ],
                        },
                        "tool": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "type": {"type": "string"},
                                "url": {"type": "string"},
                                "version": {"type": "string"},
                            },
                            "required": ["name"],  # Only name is required for tools
                        },
                        "description": {"type": "string"},
                        "workflow_step": {
                            "type": "object",
                            "properties": {
                                "step_number": {"type": "integer"},
                                "action": {"type": "string"},
                                "tool_used": {"type": "string"},
                                "data_objects": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                                "screenshot_description": {"type": "string"},
                            },
                        },
                        "confidence": {"type": "number"},
                    },
                    "required": ["description"],  # Only description is truly required
                },
            }
        },
        "required": ["events"],
    }


def generate_audio_transcripts_schema():
    """Generate JSON schema for Gemini API audio transcripts response"""
    return {
        "type": "object",
        "properties": {
            "transcripts": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "timestamp": {"type": "integer"},
                        "speaker": {"type": "string"},
                        "text": {"type": "string"},
                        "confidence": {"type": "number"},
                    },
                    "required": ["text"],  # Only text is truly required
                },
            }
        },
        "required": ["transcripts"],
    }


def parse_video_events_response(response_data: Dict[str, Any]) -> List[VideoEvent]:
    """Parse Gemini response into VideoEvent domain models"""
    events = []
    for event_data in response_data.get("events", []):
        # Create tool if present
        tool = None
        if event_data.get("tool"):
            tool = ToolIdentification(
                name=event_data["tool"].get("name", "Unknown"),
                type=event_data["tool"].get("type"),
                url=event_data["tool"].get("url"),
                version=event_data["tool"].get("version"),
            )
        
        # Create workflow step if present
        workflow_step = None
        if event_data.get("workflow_step"):
            ws = event_data["workflow_step"]
            workflow_step = WorkflowStep(
                step_number=ws.get("step_number"),
                action=ws.get("action"),
                tool_used=ws.get("tool_used"),
                data_objects=ws.get("data_objects", []),
                screenshot_description=ws.get("screenshot_description"),
            )
        
        # Create VideoEvent
        event = VideoEvent(
            timestamp_ms=event_data.get("timestamp"),
            event_type=EventType(event_data["event_type"]) if event_data.get("event_type") else None,
            tool=tool,
            description=event_data.get("description", ""),
            workflow_step=workflow_step,
            confidence_score=event_data.get("confidence"),
        )
        events.append(event)
    
    return events


def parse_audio_transcripts_response(response_data: Dict[str, Any]) -> List[AudioTranscript]:
    """Parse Gemini response into AudioTranscript domain models"""
    transcripts = []
    for transcript_data in response_data.get("transcripts", []):
        # Handle timestamp conversion if needed
        timestamp = transcript_data.get("timestamp", 0)
        
        # Create AudioTranscript
        transcript = AudioTranscript(
            timestamp=timestamp,
            speaker=transcript_data.get("speaker"),
            text=transcript_data.get("text", ""),
            confidence=transcript_data.get("confidence"),
        )
        transcripts.append(transcript)
    
    return transcripts


class GeminiClient:
    def __init__(self, prompts_file: str = "prompts.yaml"):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")

        genai.configure(api_key=self.api_key)
        self.client = genai.GenerativeModel("gemini-1.5-pro")

        # Load prompts from YAML file - resolve path relative to this module
        if not os.path.isabs(prompts_file):
            module_dir = Path(__file__).parent
            prompts_file = module_dir / prompts_file
        
        with open(prompts_file, "r") as f:
            self.prompts = yaml.safe_load(f)

    def _upload_file_with_retry(self, file_path: str, max_retries: int = 3):
        """Upload file to Gemini with retry logic for ACTIVE state"""
        for attempt in range(max_retries):
            try:
                uploaded_file = genai.upload_file(file_path)

                # Wait for file to become active
                for _ in range(10):  # Wait up to 10 seconds
                    if uploaded_file.state.name == "ACTIVE":
                        return uploaded_file
                    time.sleep(1)
                    uploaded_file = genai.get_file(uploaded_file.name)

                # If still not active, try again
                if uploaded_file.state.name != "ACTIVE":
                    print(
                        f"File {uploaded_file.name} not active, attempt {attempt + 1}"
                    )
                    if attempt < max_retries - 1:
                        time.sleep(2)
                        continue
                    else:
                        raise Exception(
                            f"File {uploaded_file.name} never became active"
                        )

                return uploaded_file

            except Exception as e:
                if attempt < max_retries - 1:
                    print(f"Upload attempt {attempt + 1} failed: {str(e)}, retrying...")
                    time.sleep(2)
                else:
                    raise e

    def analyze_video_chunk(
        self, video_path: str, chunk: VideoChunk
    ) -> List[VideoEvent]:
        """
        Analyze a video chunk using Gemini API with structured output enforcement

        Args:
            video_path: Path to the video file
            chunk: VideoChunk object with timing information

        Returns:
            List of VideoEvent objects
        """
        try:
            # Upload video file to Gemini with retry logic
            uploaded_file = self._upload_file_with_retry(video_path)

            # Create focused prompt (schema handles structure)
            analysis_prompt = (
                self.prompts["video_analysis"]
                + f"""
            
            Analyze the video segment from {chunk.start_time}s to {chunk.end_time}s.
            
            Remember: timestamps in milliseconds (7 seconds = 7000ms)
            
            For EVERY event:
            1. Include the tool/application name (Gmail, HubSpot, browser, etc.)
            2. Describe what's happening clearly
            """
            )

            # Generate schema for Gemini API
            response_schema = generate_video_events_schema()

            # Generation config with structured output enforcement
            generation_config = {
                "response_mime_type": "application/json",
                "response_schema": response_schema,
                "temperature": 0.1,  # Lower temperature for more consistent output
                "top_p": 0.95,
                "top_k": 40,
            }

            # Generate content with schema enforcement
            response = self.client.generate_content(
                [uploaded_file, analysis_prompt], generation_config=generation_config
            )

            # Parse JSON response and convert to domain models
            try:
                result_json = json.loads(response.text)
                events = parse_video_events_response(result_json)
                return events

            except (json.JSONDecodeError, ValueError) as e:
                print(
                    f"Error parsing/validating response for chunk {chunk.chunk_id}: {str(e)}"
                )
                # Fallback: create a single event with error info
                return [
                    VideoEvent(
                        timestamp_ms=int(chunk.start_time * 1000),
                        event_type=EventType.SCREEN_CHANGE,
                        description=f"Analysis error: {str(e)}. Raw response: {response.text[:500]}",
                        confidence_score=0.3,
                    )
                ]

        except Exception as e:
            print(f"Error analyzing chunk {chunk.chunk_id}: {str(e)}")
            return []

    def transcribe_audio(self, video_path: str) -> List[AudioTranscript]:
        """
        Transcribe audio from video using Gemini API with structured output enforcement

        Args:
            video_path: Path to the video file

        Returns:
            List of AudioTranscript objects
        """
        try:
            uploaded_file = self._upload_file_with_retry(video_path)

            transcription_prompt = (
                self.prompts["audio_transcription"]
                + """
            
            CRITICAL: All timestamps MUST be in milliseconds from the start of the video.
            For example: 1 second = 1000ms, 14 seconds = 14000ms, 1 minute = 60000ms.
            
            Provide accurate timestamps IN MILLISECONDS and speaker attribution where identifiable.
            Include all spoken dialogue, narration, and verbal instructions.
            Each transcript entry should have its precise timestamp in milliseconds.
            """
            )

            # Generate schema for Gemini API
            response_schema = generate_audio_transcripts_schema()

            # Generation config with structured output enforcement
            generation_config = {
                "response_mime_type": "application/json",
                "response_schema": response_schema,
                "temperature": 0.1,  # Low temperature for accurate transcription
                "top_p": 0.95,
                "top_k": 40,
            }

            # Generate content with schema enforcement
            response = self.client.generate_content(
                [uploaded_file, transcription_prompt],
                generation_config=generation_config,
            )

            try:
                result_json = json.loads(response.text)
                transcripts = parse_audio_transcripts_response(result_json)
                return transcripts

            except (json.JSONDecodeError, ValueError) as e:
                print(f"Error parsing/validating audio transcription: {str(e)}")
                # Fallback: return error info
                return [
                    AudioTranscript(
                        timestamp=0,
                        text=f"Transcription error: {str(e)}",
                        confidence=0.0,
                    )
                ]

        except Exception as e:
            print(f"Error transcribing audio: {str(e)}")
            return []

    def batch_analyze_chunks(
        self, video_path: str, chunks: List[VideoChunk]
    ) -> List[VideoEvent]:
        """
        Analyze multiple video chunks in sequence

        Args:
            video_path: Path to the video file
            chunks: List of VideoChunk objects

        Returns:
            List of all VideoEvent objects from all chunks
        """
        all_events = []

        for i, chunk in enumerate(chunks):
            print(f"Analyzing chunk {i+1}/{len(chunks)}: {chunk.chunk_id}")
            chunk_events = self.analyze_video_chunk(video_path, chunk)
            all_events.extend(chunk_events)

        # Sort events by timestamp
        all_events.sort(key=lambda x: x.timestamp_ms)
        return all_events

    def generate_process_summary(self, events: List[VideoEvent]) -> str:
        """
        Generate a comprehensive process summary from extracted events using Gemini.

        Args:
            events: List of VideoEvent objects from video analysis

        Returns:
            Natural language summary of the business process
        """
        try:
            # Convert events to a simple format for the prompt
            events_text = []
            for event in events:
                time_sec = event.timestamp_ms / 1000 if event.timestamp_ms else 0
                tool_name = (
                    event.tool.name
                    if event.tool and hasattr(event.tool, "name")
                    else "Unknown"
                )
                event_type = str(event.event_type) if event.event_type else "Unknown"

                events_text.append(
                    f"[{time_sec:.1f}s] {tool_name} - {event_type}: {event.description}"
                )

            # Create the prompt with all events
            summary_prompt = (
                self.prompts.get("process_summary", "")
                + "\n\nEvents extracted from the video:\n\n"
            )
            summary_prompt += "\n".join(events_text)
            summary_prompt += (
                "\n\nNow provide a comprehensive analysis of this business process."
            )

            # Generate summary using Gemini
            response = self.client.generate_content(summary_prompt)

            if response and response.text:
                return response.text
            else:
                return "Unable to generate process summary."

        except Exception as e:
            print(f"Error generating process summary: {e}")
            return f"Error generating summary: {str(e)}"
