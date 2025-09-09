#!/usr/bin/env python3

import json
import os
import argparse
from datetime import datetime
from typing import List, Dict, Any
from pathlib import Path

from .models import VideoAnalysisResult, VideoEvent, AudioTranscript


def format_timestamp(timestamp_ms: int) -> str:
    """Convert milliseconds to MM:SS format."""
    total_seconds = timestamp_ms // 1000
    minutes = total_seconds // 60
    seconds = total_seconds % 60
    return f"{minutes:02d}:{seconds:02d}"


def format_duration(duration_ms: int) -> str:
    """Convert milliseconds to human readable duration."""
    total_seconds = duration_ms // 1000
    if total_seconds < 60:
        return f"{total_seconds}s"
    else:
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        return f"{minutes}m {seconds}s"


def combine_timeline_events(events: List[VideoEvent], transcripts: List[AudioTranscript]) -> List[Dict[str, Any]]:
    """Combine events and transcripts into a chronological timeline."""
    timeline = []
    
    # Add events
    for event in events:
        timeline.append({
            "timestamp_ms": event.timestamp_ms,
            "type": "event",
            "data": event
        })
    
    # Add transcripts
    for transcript in transcripts:
        timeline.append({
            "timestamp_ms": transcript.timestamp,
            "type": "transcript",
            "data": transcript
        })
    
    # Sort by timestamp
    timeline.sort(key=lambda x: x["timestamp_ms"])
    return timeline


def export_to_text(analysis_result: VideoAnalysisResult, output_path: str) -> None:
    """Export VideoAnalysisResult to a human-readable text file."""
    
    lines = []
    
    # Header
    lines.append("=" * 80)
    lines.append("VIDEO PROCESS ANALYSIS REPORT")
    lines.append("=" * 80)
    lines.append("")
    
    # Basic Information
    lines.append("BASIC INFORMATION")
    lines.append("-" * 40)
    lines.append(f"Session ID: {analysis_result.session_id}")
    lines.append(f"Processed: {analysis_result.processing_timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"Video Path: {analysis_result.video_metadata.get('path', 'N/A')}")
    lines.append(f"Duration: {format_duration(analysis_result.process_summary.total_duration_ms)}")
    lines.append("")
    
    # Process Overview
    lines.append("PROCESS OVERVIEW")
    lines.append("-" * 40)
    lines.append(f"Total Events: {analysis_result.process_summary.total_events}")
    lines.append(f"Transcript Entries: {len(analysis_result.transcripts)}")
    lines.append(f"Scene Changes: {len(analysis_result.scenes)}")
    lines.append(f"Complexity Score: {analysis_result.process_summary.complexity_score}/10")
    lines.append("")
    
    # Applications/Tools Used
    tools_used = set()
    for event in analysis_result.events:
        if event.tool and event.tool.name:
            tools_used.add(event.tool.name)
    
    if tools_used:
        lines.append("APPLICATIONS/TOOLS DETECTED")
        lines.append("-" * 40)
        for tool in sorted(tools_used):
            lines.append(f"• {tool}")
        lines.append("")
    
    # Scene Breakdown
    if analysis_result.scenes:
        lines.append("SCENE BREAKDOWN")
        lines.append("-" * 40)
        for i, scene in enumerate(analysis_result.scenes):
            lines.append(f"Scene {i+1}: {format_timestamp(scene.start_time_ms)} - {format_timestamp(scene.end_time_ms)} "
                        f"({format_duration(scene.duration_ms)})")
            if scene.change_score:
                lines.append(f"  Change Score: {scene.change_score:.2f}")
        lines.append("")
    
    # Combined Timeline (Events + Transcripts)
    timeline = combine_timeline_events(analysis_result.events, analysis_result.transcripts)
    
    if timeline:
        lines.append("CHRONOLOGICAL TIMELINE")
        lines.append("-" * 40)
        lines.append("Legend: [T] = Transcript | [A] = User Action | [S] = Screen Change | [W] = App Switch")
        lines.append("")
        
        for item in timeline:
            timestamp_str = format_timestamp(item["timestamp_ms"])
            
            if item["type"] == "transcript":
                transcript: AudioTranscript = item["data"]
                # Clean up transcript text and format nicely
                text = transcript.text.strip()
                if text and text not in ["N/A", ""]:
                    lines.append(f"[T] {timestamp_str} | {text}")
                    if transcript.confidence and transcript.confidence < 0.8:
                        lines.append(f"    ^ Low confidence: {transcript.confidence:.2f}")
            
            elif item["type"] == "event":
                event: VideoEvent = item["data"]
                
                # Event type indicator
                if event.event_type == "USER_ACTION":
                    indicator = "[A]"
                elif event.event_type == "SCREEN_CHANGE":
                    indicator = "[S]"
                elif event.event_type == "APPLICATION_SWITCH":
                    indicator = "[W]"
                else:
                    indicator = "[?]"
                
                # Tool context
                tool_info = ""
                if event.tool:
                    tool_info = f" ({event.tool.name})"
                
                lines.append(f"{indicator} {timestamp_str}{tool_info} | {event.description}")
                
                # Additional context
                if event.confidence_score < 0.8:
                    lines.append(f"    ^ Low confidence: {event.confidence_score:.2f}")
        
        lines.append("")
    
    # Process Summary
    lines.append("PROCESS WORKFLOW SUMMARY")
    lines.append("-" * 40)
    lines.append(analysis_result.process_summary.workflow_summary)
    lines.append("")
    
    # Key Insights
    if analysis_result.process_summary.key_insights:
        lines.append("KEY INSIGHTS")
        lines.append("-" * 40)
        for insight in analysis_result.process_summary.key_insights:
            lines.append(f"• {insight}")
        lines.append("")
    
    # Processing Statistics
    lines.append("PROCESSING STATISTICS")
    lines.append("-" * 40)
    stats = analysis_result.processing_stats
    if stats:
        for key, value in stats.items():
            # Format key nicely
            formatted_key = key.replace("_", " ").title()
            lines.append(f"{formatted_key}: {value}")
    lines.append("")
    
    # Event Type Breakdown
    event_counts = {}
    for event in analysis_result.events:
        event_type = event.event_type
        event_counts[event_type] = event_counts.get(event_type, 0) + 1
    
    if event_counts:
        lines.append("EVENT TYPE BREAKDOWN")
        lines.append("-" * 40)
        for event_type, count in sorted(event_counts.items()):
            lines.append(f"{event_type.replace('_', ' ').title()}: {count}")
        lines.append("")
    
    # Footer
    lines.append("=" * 80)
    lines.append(f"Report generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("=" * 80)
    
    # Write to file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))


def export_analysis_file(json_path: str, output_dir: str = None) -> str:
    """
    Export a JSON analysis file to human-readable text format.
    
    Args:
        json_path: Path to the JSON analysis file
        output_dir: Optional output directory (defaults to same as input)
    
    Returns:
        Path to the generated text file
    """
    
    # Validate input
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"JSON file not found: {json_path}")
    
    # Load JSON data
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Parse into VideoAnalysisResult
    try:
        analysis_result = VideoAnalysisResult.model_validate(data)
    except Exception as e:
        raise ValueError(f"Invalid JSON structure: {e}")
    
    # Determine output path
    if output_dir is None:
        output_dir = os.path.dirname(json_path)
    
    # Generate output filename
    input_name = Path(json_path).stem
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_filename = f"{input_name}_report_{timestamp}.txt"
    output_path = os.path.join(output_dir, output_filename)
    
    # Export to text
    export_to_text(analysis_result, output_path)
    
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Export video analysis JSON to human-readable text report"
    )
    parser.add_argument("json_path", help="Path to JSON analysis file")
    parser.add_argument(
        "--output-dir", 
        help="Output directory (defaults to same directory as input file)"
    )
    parser.add_argument(
        "--print-path", 
        action="store_true", 
        help="Print the output file path"
    )
    
    args = parser.parse_args()
    
    try:
        output_path = export_analysis_file(args.json_path, args.output_dir)
        
        print(f"✅ Text report generated successfully!")
        if args.print_path:
            print(f"📁 Output file: {output_path}")
        else:
            print(f"📁 Saved to: {os.path.basename(output_path)}")
            
    except Exception as e:
        print(f"❌ Error exporting analysis: {str(e)}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())