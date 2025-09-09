#!/usr/bin/env python3

import os
import json
import argparse
from datetime import datetime
from pathlib import Path

# from .scene_detector import SceneDetector  # Commented out - bypassing scene detection
from backend.video_processing.gemini_client import GeminiClient
from backend.video_processing.models import (
    VideoAnalysisResult,
    VideoEvent,
    VideoChunk,
    ProcessSummary,
    SceneInfo,
)
from backend.video_processing.export_analysis import export_analysis_file
from backend.video_processing.screenshot_extractor import ScreenshotExtractor
import uuid


def process_video(
    video_path: str,
    output_dir: str = "output",
    scene_threshold: float = 80.0,
    max_chunks: int = None,
) -> VideoAnalysisResult:
    """
    Main video processing pipeline that implements the multi-stage approach

    Args:
        video_path: Path to input video file (.webm or other format)
        output_dir: Directory to save processing results
        scene_threshold: Sensitivity threshold for scene detection
        max_chunks: Maximum number of chunks to process (for testing/cost control)

    Returns:
        AnalysisResult object with all extracted data
    """

    print(f"Starting video processing pipeline for: {video_path}")

    # Validate input
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    # Create session-specific output directory
    import uuid

    session_id = str(uuid.uuid4())[:8]  # Short session ID
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    session_folder = f"session_{timestamp}_{session_id}"
    session_dir = os.path.join(output_dir, session_folder)
    Path(session_dir).mkdir(parents=True, exist_ok=True)

    print(f"Session folder: {session_dir}")

    # Stage 1: Scene Detection (BYPASSED - using whole video as single chunk)
    print("Stage 1: Scene Detection (BYPASSED)")

    # Comment out actual scene detection for now
    # detector = SceneDetector(threshold=scene_threshold)
    # chunks = detector.detect_scenes(video_path, output_dir=session_dir)

    # Instead, create a single chunk for the entire video
    # We'll use a default duration of 300 seconds (5 minutes) as a placeholder
    # In production, you'd want to get the actual video duration
    # Create single chunk for entire video
    # Using 300 seconds (5 min) as default, adjust if needed
    video_duration = 371.0  # Default 5 minutes, adjust based on your videos

    chunks = [
        VideoChunk(
            chunk_id="chunk_full_video",
            start_time=0.0,
            end_time=video_duration,
            file_path=video_path,
            scene_score=1.0,
        )
    ]

    print(f"Using entire video as single chunk (duration: {video_duration}s)")

    # Original max_chunks logic (kept but won't trigger with single chunk)
    if max_chunks:
        chunks = chunks[:max_chunks]
        print(f"Limiting processing to {max_chunks} chunks for cost control")

    print(f"Processing {len(chunks)} chunk(s)")

    # Stage 2: Gemini API Analysis
    print("Stage 2: AI Analysis with Gemini")
    client = GeminiClient()

    # Analyze video chunks
    events = client.batch_analyze_chunks(video_path, chunks)
    print(f"Extracted {len(events)} process events")

    # Transcribe audio
    print("Transcribing audio...")
    transcripts = client.transcribe_audio(video_path)
    print(f"Generated {len(transcripts)} audio transcripts")

    # Keep transcripts separate - don't convert to events
    # Filter out any TRANSCRIPT type events from video analysis
    action_events = [e for e in events if e.event_type != "TRANSCRIPT"]

    # Stage 2.5: Screenshot Extraction
    print("Stage 2.5: Extracting Event Screenshots")
    screenshot_extractor = ScreenshotExtractor()
    action_events = screenshot_extractor.extract_event_screenshots(
        video_path, action_events, session_dir
    )

    # Sort events by timestamp
    action_events.sort(key=lambda x: x.timestamp_ms)
    transcripts.sort(key=lambda x: x.timestamp)

    # Stage 3: Data Synthesis
    print("Stage 3: Data Synthesis")

    # Generate AI-powered process summary
    print("Generating AI process summary...")
    ai_process_summary = ""
    if action_events:
        ai_process_summary = client.generate_process_summary(action_events)
        print("AI process summary generated")

    # Calculate total duration from chunks
    total_duration = max(chunk.end_time for chunk in chunks) if chunks else 0.0

    # Generate summary (using action events only for now)
    summary = generate_summary(action_events, total_duration, ai_process_summary)

    # Create final result

    # Convert chunks to SceneInfo objects
    scene_infos = []
    for i, chunk in enumerate(chunks):
        scene_info = SceneInfo(
            scene_id=i,
            start_time_ms=int(chunk.start_time * 1000),
            end_time_ms=int(chunk.end_time * 1000),
            duration_ms=int((chunk.end_time - chunk.start_time) * 1000),
            change_score=chunk.scene_score or 1.0,
        )
        scene_infos.append(scene_info)

    # Create process summary
    process_summary = ProcessSummary(
        total_duration_ms=int(total_duration * 1000),
        total_events=len(action_events),
        unique_tools=[],
        workflow_summary=summary,
        key_insights=["Process mining analysis completed"],
        complexity_score=5.0,
    )

    result = VideoAnalysisResult(
        session_id=str(uuid.uuid4()),
        user_info={"user": "system"},
        video_metadata={"path": video_path, "duration": total_duration},
        scenes=scene_infos,
        events=action_events,  # User action events only
        transcripts=transcripts,  # Separate transcript field
        process_summary=process_summary,
        processing_stats={
            "processed_at": datetime.now().isoformat(),
            "scene_threshold": scene_threshold,
            "total_chunks": len(chunks),
            "action_events": len(action_events),
            "transcript_events": len(transcripts),
        },
    )

    # Save results
    output_file = os.path.join(session_dir, f"analysis_result_{timestamp}.json")
    with open(output_file, "w") as f:
        json.dump(result.model_dump(), f, indent=2, default=str)

    print(f"Processing complete! Results saved to: {output_file}")

    # Generate text report
    try:
        text_report_path = export_analysis_file(output_file)
        print(f"Text report generated: {os.path.basename(text_report_path)}")
    except Exception as e:
        print(f"Warning: Could not generate text report: {str(e)}")

    print(f"All session files available in: {session_dir}")

    return result


def generate_summary(
    events: list[VideoEvent], total_duration: float, ai_summary: str = ""
) -> str:
    """Generate a comprehensive process summary from the detected events"""

    if not events:
        return "No events were detected in the video."

    # Count event types and collect tools
    event_counts = {}
    tools_used = set()
    workflow_steps = []

    for event in events:
        # Count event types
        if event.event_type:
            event_type = str(event.event_type)
            event_counts[event_type] = event_counts.get(event_type, 0) + 1

        # Collect tools used
        if event.tool and hasattr(event.tool, "name"):
            tools_used.add(event.tool.name)
        elif event.tool:
            tools_used.add(str(event.tool))

        # Collect workflow steps with tools
        if event.description:
            timestamp_sec = event.timestamp_ms / 1000 if event.timestamp_ms else 0
            tool_name = (
                event.tool.name
                if event.tool and hasattr(event.tool, "name")
                else "Unknown Tool"
            )
            workflow_steps.append(
                {
                    "time": timestamp_sec,
                    "tool": tool_name,
                    "description": event.description,
                }
            )

    # Build comprehensive summary
    summary_parts = [
        "=" * 60,
        "PROCESS MINING ANALYSIS SUMMARY",
        "=" * 60,
        "",
        f"Overview:",
        f"  Duration: {total_duration:.1f} seconds ({int(total_duration/60)}:{int(total_duration%60):02d})",
        f"  Total Events Detected: {len(events)}",
        f"  Unique Tools/Applications: {len(tools_used)}",
        "",
    ]

    # Tools summary
    if tools_used:
        summary_parts.extend(
            [
                "Tools & Applications Used:",
            ]
        )
        for tool in sorted(tools_used):
            tool_events = sum(
                1
                for e in events
                if e.tool and hasattr(e.tool, "name") and e.tool.name == tool
            )
            summary_parts.append(f"  {tool} ({tool_events} interactions)")
        summary_parts.append("")

    # Event type breakdown
    if event_counts:
        summary_parts.extend(
            [
                "Event Type Breakdown:",
            ]
        )
        for event_type, count in sorted(event_counts.items()):
            percentage = (count / len(events)) * 100
            summary_parts.append(f"  {event_type}: {count} ({percentage:.1f}%)")
        summary_parts.append("")

    # Process Flow Summary
    if workflow_steps:
        summary_parts.extend(
            ["Process Flow Summary:", "  Key steps detected in the workflow:", ""]
        )

        # Group steps by tool for better readability
        tool_sequences = []
        current_tool = None
        current_sequence = []

        for step in workflow_steps[:20]:  # Show first 20 steps
            if step["tool"] != current_tool:
                if current_sequence:
                    tool_sequences.append(
                        {"tool": current_tool, "steps": current_sequence}
                    )
                current_tool = step["tool"]
                current_sequence = [step]
            else:
                current_sequence.append(step)

        if current_sequence:
            tool_sequences.append({"tool": current_tool, "steps": current_sequence})

        # Display tool sequences
        for i, sequence in enumerate(
            tool_sequences[:10], 1
        ):  # Limit to first 10 sequences
            time_range = f"{sequence['steps'][0]['time']:.0f}s"
            if len(sequence["steps"]) > 1:
                time_range += f"-{sequence['steps'][-1]['time']:.0f}s"

            summary_parts.append(f"  {i}. [{time_range}] {sequence['tool']}:")
            for step in sequence["steps"][:3]:  # Show max 3 steps per tool
                desc_preview = (
                    step["description"][:60] + "..."
                    if len(step["description"]) > 60
                    else step["description"]
                )
                summary_parts.append(f"     -> {desc_preview}")
            if len(sequence["steps"]) > 3:
                summary_parts.append(
                    f"     -> ... and {len(sequence['steps']) - 3} more actions"
                )

        if len(tool_sequences) > 10:
            summary_parts.append(
                f"\n  ... and {len(tool_sequences) - 10} more tool transitions"
            )

        summary_parts.append("")

    # Process Insights
    summary_parts.extend(
        [
            "Process Insights:",
        ]
    )

    # Calculate some basic metrics
    if len(tools_used) > 1:
        summary_parts.append(
            f"  Multi-tool workflow detected ({len(tools_used)} different applications)"
        )

    if event_counts.get("APPLICATION_SWITCH", 0) > 5:
        summary_parts.append(
            f"  High context switching ({event_counts.get('APPLICATION_SWITCH', 0)} app switches)"
        )

    if event_counts.get("USER_ACTION", 0) > 10:
        summary_parts.append(
            f"  Interactive process with {event_counts.get('USER_ACTION', 0)} user actions"
        )

    # Identify potential automation opportunities
    if event_counts.get("USER_ACTION", 0) > 20:
        summary_parts.append(
            "  High manual interaction - potential automation opportunity"
        )

    summary_parts.extend(["", "=" * 60])

    # Add AI-generated process summary if available
    if ai_summary and ai_summary.strip():
        summary_parts.extend(
            [
                "",
                "AI-GENERATED BUSINESS PROCESS ANALYSIS",
                "=" * 60,
                "",
                ai_summary,
                "",
                "=" * 60,
            ]
        )

    return "\n".join(summary_parts)


def main():
    parser = argparse.ArgumentParser(
        description="Process video for process mining analysis"
    )
    parser.add_argument("video_path", help="Path to input video file")
    parser.add_argument(
        "--output-dir", default="output", help="Output directory for results"
    )
    parser.add_argument(
        "--scene-threshold", type=float, default=80.0, help="Scene detection threshold"
    )
    parser.add_argument(
        "--max-chunks", type=int, help="Maximum chunks to process (for testing)"
    )
    parser.add_argument(
        "--print-summary", action="store_true", help="Print summary to console"
    )

    args = parser.parse_args()

    try:
        result = process_video(
            args.video_path, args.output_dir, args.scene_threshold, args.max_chunks
        )

        if args.print_summary:
            print("\n" + "=" * 50)
            print("PROCESSING SUMMARY")
            print("=" * 50)
            print(result.process_summary.workflow_summary)
            print("=" * 50)

    except Exception as e:
        print(f"L Error processing video: {str(e)}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
