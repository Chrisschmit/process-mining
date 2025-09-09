"""
Pydantic models for structured JSON output from video analysis.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class EventType(str, Enum):
    """Types of events detected in video analysis."""

    SCREEN_CHANGE = "SCREEN_CHANGE"
    USER_ACTION = "USER_ACTION"
    TRANSCRIPT = "TRANSCRIPT"
    APPLICATION_SWITCH = "APPLICATION_SWITCH"
    WORKFLOW_STEP = "WORKFLOW_STEP"


class ToolIdentification(BaseModel):
    """Information about tools/applications identified in the video."""

    name: str = Field(description="Name of the application or tool")
    type: Optional[str] = Field(None, description="Type of tool (web, desktop, etc.)")
    url: Optional[str] = Field(None, description="URL if web-based tool")
    version: Optional[str] = Field(None, description="Version information if available")


class WorkflowStep(BaseModel):
    """Detailed workflow step analysis."""

    step_number: Optional[int] = Field(None, description="Sequential step number")
    action: Optional[str] = Field(None, description="The specific action taken")
    tool_used: Optional[str] = Field(None, description="Tool/application used for this step")
    data_objects: Optional[List[str]] = Field(default=[], description="Data objects involved")
    screenshot_description: Optional[str] = Field(
        None, description="Detailed description of screen content"
    )


class VideoEvent(BaseModel):
    """Single event extracted from video analysis."""

    timestamp_ms: Optional[int] = Field(None, description="Timestamp in milliseconds from video start")
    event_type: Optional[EventType] = Field(None, description="Type of event detected")
    tool: Optional[ToolIdentification] = Field(
        None, description="Tool information - ALWAYS try to identify what tool/app is being used"
    )
    description: str = Field(description="What's happening in this moment - be specific")
    workflow_step: Optional[WorkflowStep] = Field(
        None, description="Workflow analysis if applicable"
    )
    confidence_score: Optional[float] = Field(
        None, description="Confidence score for this analysis"
    )
    audio_transcript: Optional[str] = Field(
        None, description="Audio transcription for this timeframe"
    )
    screenshot_path: Optional[str] = Field(
        None, description="Path to screenshot image for this event (relative to session directory)"
    )


class SceneInfo(BaseModel):
    """Information about a detected scene in the video."""

    scene_id: int = Field(description="Unique scene identifier")
    start_time_ms: int = Field(description="Scene start time in milliseconds")
    end_time_ms: int = Field(description="Scene end time in milliseconds")
    duration_ms: int = Field(description="Scene duration in milliseconds")
    change_score: float = Field(description="Scene change detection score")
    frame_path: Optional[str] = Field(None, description="Path to representative frame")


class ProcessSummary(BaseModel):
    """High-level summary of the entire process."""

    total_duration_ms: int = Field(description="Total video duration")
    total_events: int = Field(description="Total number of events detected")
    unique_tools: List[str] = Field(description="List of unique tools identified")
    workflow_summary: str = Field(description="High-level workflow description")
    key_insights: List[str] = Field(description="Key insights from process analysis")
    complexity_score: float = Field(ge=0, le=10, description="Process complexity score")


class AudioTranscript(BaseModel):
    """Audio transcript from video analysis."""

    timestamp: Optional[int] = Field(None, description="Timestamp in milliseconds")
    speaker: Optional[str] = Field(None, description="Speaker identifier")
    text: str = Field(description="Transcribed text")
    confidence: Optional[float] = Field(None, description="Confidence score")


class VideoAnalysisResult(BaseModel):
    """Complete video analysis result."""

    session_id: str = Field(description="Unique session identifier")
    user_info: Dict[str, str] = Field(description="User information from frontend")
    processing_timestamp: datetime = Field(default_factory=datetime.now)
    video_metadata: Dict[str, Any] = Field(description="Video file metadata")

    # Core analysis results
    scenes: List[SceneInfo] = Field(description="Detected scenes")
    events: List[VideoEvent] = Field(description="Extracted user action events (non-transcript)")
    transcripts: List[AudioTranscript] = Field(description="Audio transcripts with timestamps")
    process_summary: ProcessSummary = Field(description="Process summary")

    # Processing metadata
    processing_stats: Dict[str, Any] = Field(
        default={}, description="Processing statistics"
    )


class VideoChunk(BaseModel):
    """Video chunk from scene detection."""

    chunk_id: str = Field(description="Unique chunk identifier")
    start_time: float = Field(description="Start time in seconds")
    end_time: float = Field(description="End time in seconds")
    file_path: str = Field(description="Path to chunk file")
    scene_score: Optional[float] = Field(None, description="Scene change score")
