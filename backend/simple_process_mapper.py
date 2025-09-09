#!/usr/bin/env python3
"""
Simple Process Mapper - Convert video events to process map without complex agents.
Direct, straightforward transformation from events to visual workflow.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from video_processing.models import VideoEvent, ToolIdentification, EventType

from process_mapper.process_models import (
    ProcessMap,
    ProcessStep,
    ProcessEdge,
    ProcessStepType,
)
import os
import google.generativeai as genai


def _summarize_step_description(raw_description: str, tool_name: str) -> str:
    """Use LLM to create a concise summary of the workflow step."""
    try:
        # Initialize Gemini if API key is available
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            # Fallback to simple truncation if no API key
            return (
                raw_description[:40] + "..."
                if len(raw_description) > 40
                else raw_description
            )

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            "gemini-1.5-flash"
        )  # Use faster model for simple summarization

        prompt = f"""
        Summarize this workflow step in 2-4 words that capture the main action:
        
        Tool: {tool_name}
        Action: {raw_description}
        
        Provide a concise business action phrase like:
        - "Read email"
        - "Search LinkedIn" 
        - "Create contact"
        - "Login to system"
        
        Return only the short phrase, nothing else.
        """

        response = model.generate_content(prompt)
        summary = response.text.strip()

        # Clean up the response (remove quotes, extra text)
        summary = summary.replace('"', "").replace("'", "").strip()
        if len(summary) > 25:  # If still too long, truncate
            summary = summary[:22] + "..."

        return summary or "Process step"

    except Exception as e:
        print(f"LLM summarization failed: {e}")
        # Fallback to simple truncation
        return (
            raw_description[:40] + "..."
            if len(raw_description) > 40
            else raw_description
        )


def create_process_map_from_events(events: List[VideoEvent]) -> ProcessMap:
    """
    Convert a list of VideoEvent objects into a ProcessMap.
    Simple, direct transformation without agents or complex reasoning.

    Args:
        events: List of VideoEvent objects from video analysis

    Returns:
        ProcessMap: Visual workflow representation
    """
    if not events:
        return ProcessMap(nodes=[], edges=[], metadata={})

    nodes = []
    edges = []

    # Group events by workflow steps to create logical steps
    tool_sequences = _group_events_by_workflow_steps(events)

    # Create nodes from tool sequences
    y_position = 50
    prev_node_id = None

    for i, (tool_name, tool_events) in enumerate(tool_sequences):
        node_id = f"step_{i+1}"

        # Determine step type based on event types and position
        step_type = _determine_step_type(tool_events, i, len(tool_sequences))

        # Create description from events - use LLM summarization for task title
        raw_description = _create_step_description(tool_events)
        task_title = _summarize_step_description(raw_description, tool_name)

        # Create detailed description showing user action sequence
        detailed_description = _create_detailed_description(tool_events, tool_name)

        # Get timestamp from first event in the sequence
        timestamp_ms = tool_events[0].timestamp_ms if tool_events[0].timestamp_ms else 0

        # Create process step with new structure: Task as label, Tool below
        node = ProcessStep(
            id=node_id,
            type=step_type,
            position={"x": 200, "y": y_position},
            data={
                "label": task_title,  # Task as headline
                "description": detailed_description,  # Detailed sequence
                "tool": tool_name,  # Tool used
            },
            timestamp_ms=timestamp_ms,
            confidence_score=_calculate_average_confidence(tool_events),
            tool_context=tool_name,
        )

        nodes.append(node)

        # Create edge from previous node (ALWAYS create an edge if there's a previous node)
        if prev_node_id:
            edge = ProcessEdge(
                id=f"edge_{prev_node_id}_to_{node_id}",
                source=prev_node_id,
                target=node_id,
                animated=True,
                label=_create_transition_label(
                    tool_sequences[i - 1][1] if i > 0 else [], tool_events
                ),
            )
            edges.append(edge)

        prev_node_id = node_id
        y_position += 250

    # Ensure we have edges connecting all nodes (safety check)
    if len(nodes) > 1 and len(edges) != len(nodes) - 1:
        # Fix missing edges
        for i in range(len(nodes) - 1):
            edge_exists = any(
                e.source == nodes[i].id and e.target == nodes[i + 1].id for e in edges
            )
            if not edge_exists:
                edge = ProcessEdge(
                    id=f"edge_fix_{i}",
                    source=nodes[i].id,
                    target=nodes[i + 1].id,
                    animated=True,
                    label="Continue",
                )
                edges.append(edge)

    # Calculate metadata with process title
    total_duration = (
        events[-1].timestamp_ms - events[0].timestamp_ms if len(events) > 1 else 0
    )
    unique_tools = list(set(tool_name for tool_name, _ in tool_sequences))

    # Generate process title based on workflow
    process_title = _generate_process_title(tool_sequences, unique_tools)

    metadata = {
        "title": process_title,
        "generated_at": datetime.now().isoformat(),
        "total_events": len(events),
        "unique_tools": len(unique_tools),
        "tools": unique_tools,
        "total_duration_ms": total_duration,
        "confidence": (
            sum(e.confidence_score or 0.8 for e in events) / len(events)
            if events
            else 0.8
        ),
    }

    return ProcessMap(nodes=nodes, edges=edges, metadata=metadata)


def _group_events_by_workflow_steps(
    events: List[VideoEvent],
) -> List[tuple[str, List[VideoEvent]]]:
    """Create one step per event without any grouping or filtering."""
    if not events:
        return []

    sequences = []
    
    # Convert each event to its own step without any grouping or filtering
    for event in events:
        tool_name = (
            event.tool.name if event.tool and event.tool.name else "Unknown Tool"
        )
        # Each event becomes its own individual step
        sequences.append((tool_name, [event]))
    
    return sequences


def _is_simple_app_switch(description: str) -> bool:
    """No longer filtering app switches - always return False to keep all events."""
    # Removed filtering logic - keep all events
    return False


def _is_new_logical_step(current_events: List[VideoEvent], new_event: VideoEvent) -> bool:
    """No longer determining logical steps - always return True for individual events."""
    # Removed logical step detection - each event is its own step
    return True


def _has_meaningful_content(events: List[VideoEvent]) -> bool:
    """No longer filtering by meaningful content - always return True."""
    # Removed content filtering - all events are considered meaningful
    return True


def _split_into_distinct_actions(tool: str, events: List[VideoEvent]) -> List[tuple[str, List[VideoEvent]]]:
    """No splitting - return each event as its own action."""
    # No splitting logic - each event becomes its own action
    return [(tool, [event]) for event in events]


def _are_similar_actions(event1: VideoEvent, event2: VideoEvent) -> bool:
    """No longer grouping similar actions - always return False."""
    # Removed similarity logic - each event is treated as distinct
    return False


def _determine_step_type(
    events: List[VideoEvent], position: int, total_steps: int
) -> ProcessStepType:
    """Determine the type of process step based on events and position."""

    # First step is usually a trigger
    if position == 0:
        return ProcessStepType.TRIGGER

    # Last step is usually output
    if position == total_steps - 1:
        return ProcessStepType.OUTPUT

    # Look at event types to determine step type
    event_types = [str(e.event_type) for e in events if e.event_type]

    if "USER_ACTION" in event_types:
        return ProcessStepType.PROCESS
    elif "APPLICATION_SWITCH" in event_types:
        return ProcessStepType.INPUT
    else:
        return ProcessStepType.PROCESS


def _create_step_description(events: List[VideoEvent]) -> str:
    """Create a description for a step based on its events."""
    if not events:
        return "No description available"

    # Take up to 3 most descriptive events
    descriptions = []
    for event in events[:3]:
        if event.description and len(event.description.strip()) > 10:
            # Truncate long descriptions
            desc = event.description.strip()
            if len(desc) > 60:
                desc = desc[:57] + "..."
            descriptions.append(desc)

    if not descriptions:
        return "Process step"

    if len(descriptions) == 1:
        return descriptions[0]

    # Combine multiple descriptions
    return "; ".join(descriptions)


def _create_detailed_description(events: List[VideoEvent], tool_name: str) -> str:
    """Create a detailed description showing user action sequence."""
    if not events:
        return "No actions recorded"

    try:
        # Use LLM to create a detailed workflow description
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return _create_fallback_detailed_description(events, tool_name)

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        # Gather event details
        event_details = []
        for event in events[:5]:  # Limit to 5 events to avoid token limits
            if event.description:
                event_details.append(f"- {event.description}")

        event_text = (
            "\n".join(event_details) if event_details else "User performed actions"
        )

        prompt = f"""
        Create a detailed workflow description for this business process step:
        
        Tool: {tool_name}
        User Actions:
        {event_text}
        
        Write a 2-3 sentence description that explains what the user accomplished:
        - Start with "User [action]..."
        - Focus on the business purpose/outcome
        - Mention key details like what they clicked, searched for, or created
        - Keep it professional and clear
        
        Example: "User receives inquiry email about mapping solution, clicks to open and reads content to understand the business opportunity and client requirements."
        
        Return only the description, nothing else.
        """

        response = model.generate_content(prompt)
        detailed_desc = response.text.strip()

        # Clean up the response
        detailed_desc = detailed_desc.replace('"', "").replace("'", "").strip()
        if len(detailed_desc) > 200:  # Reasonable limit
            detailed_desc = detailed_desc[:197] + "..."

        return detailed_desc or _create_fallback_detailed_description(events, tool_name)

    except Exception as e:
        print(f"LLM detailed description failed: {e}")
        return _create_fallback_detailed_description(events, tool_name)


def _create_fallback_detailed_description(
    events: List[VideoEvent], tool_name: str
) -> str:
    """Create detailed description without LLM."""
    if not events:
        return "No actions recorded"

    # Count action types
    action_count = len(events)
    unique_descriptions = list(set(e.description for e in events if e.description))[:3]

    if unique_descriptions:
        actions = ", ".join(unique_descriptions)
        return f"User performed {action_count} actions in {tool_name}: {actions}"
    else:
        return f"User performed {action_count} actions in {tool_name}"


def _generate_process_title(
    tool_sequences: List[tuple[str, List[VideoEvent]]], unique_tools: List[str]
) -> str:
    """Generate a descriptive title for the process map."""
    try:
        # Use LLM to create a smart process title
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return _create_fallback_process_title(unique_tools)

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        # Get first and last tools for workflow context
        first_tool = tool_sequences[0][0] if tool_sequences else "Unknown"
        last_tool = tool_sequences[-1][0] if tool_sequences else "Unknown"
        tools_list = ", ".join(unique_tools)

        # Get some sample actions for context
        sample_actions = []
        for tool_name, events in tool_sequences[:3]:  # First 3 sequences
            for event in events[:2]:  # First 2 events per sequence
                if event.description:
                    sample_actions.append(f"{tool_name}: {event.description}")

        actions_context = "; ".join(sample_actions)

        prompt = f"""
        Generate a concise business process title (4-8 words) for this workflow:
        
        Tools used: {tools_list}
        Workflow: {first_tool} → ... → {last_tool}
        Sample actions: {actions_context}
        
        Focus on the main business objective. Examples:
        - "Customer Inquiry to Deal Creation"
        - "Email Processing and Contact Management"
        - "Lead Research and CRM Update"
        - "Support Ticket Resolution Process"
        
        Return only the title, nothing else.
        """

        response = model.generate_content(prompt)
        title = response.text.strip()

        # Clean up the response
        title = title.replace('"', "").replace("'", "").strip()
        if len(title) > 50:  # Reasonable limit
            title = title[:47] + "..."

        return title or _create_fallback_process_title(unique_tools)

    except Exception as e:
        print(f"LLM process title generation failed: {e}")
        return _create_fallback_process_title(unique_tools)


def _create_fallback_process_title(unique_tools: List[str]) -> str:
    """Create process title without LLM."""
    if not unique_tools:
        return "Business Process Workflow"

    if len(unique_tools) == 1:
        return f"{unique_tools[0]} Workflow"
    elif len(unique_tools) <= 3:
        return f"{' & '.join(unique_tools)} Process"
    else:
        return f"Multi-Application Process ({len(unique_tools)} tools)"


def _create_transition_label(
    prev_events: List[VideoEvent], current_events: List[VideoEvent]
) -> str:
    """Create a label for the transition between steps."""
    # Simple transition based on application switch
    prev_tool = (
        prev_events[0].tool.name if prev_events and prev_events[0].tool else "Unknown"
    )
    current_tool = (
        current_events[0].tool.name
        if current_events and current_events[0].tool
        else "Unknown"
    )

    if prev_tool != current_tool:
        return f"Switch to {current_tool}"
    else:
        return "Continue"


def _calculate_average_confidence(events: List[VideoEvent]) -> float:
    """Calculate average confidence score for a group of events."""
    scores = [e.confidence_score for e in events if e.confidence_score is not None]
    if not scores:
        return 0.8  # Default confidence
    return sum(scores) / len(scores)


# Simple function to replace the complex orchestrator
def generate_simple_process_map(video_data: Dict[str, Any]) -> ProcessMap:
    """
    Main entry point - replace the complex agentic orchestrator with this simple function.

    Args:
        video_data: Video analysis data with events

    Returns:
        ProcessMap: Generated process map
    """
    events = video_data.get("events", [])

    if not events:
        return ProcessMap(
            nodes=[],
            edges=[],
            metadata={
                "generated_at": datetime.now().isoformat(),
                "error": "No events found in video data",
            },
        )

    # Convert events to VideoEvent objects if they aren't already
    if events and not isinstance(events[0], VideoEvent):
        # They're likely dictionaries, convert them
        video_events = []
        for event_data in events:
            if isinstance(event_data, dict):

                tool = None
                if event_data.get("tool"):
                    tool = ToolIdentification(
                        name=event_data["tool"].get("name", "Unknown"),
                        type=event_data["tool"].get("type"),
                        url=event_data["tool"].get("url"),
                        version=event_data["tool"].get("version"),
                    )

                event = VideoEvent(
                    timestamp_ms=event_data.get("timestamp_ms"),
                    event_type=(
                        EventType(event_data["event_type"])
                        if event_data.get("event_type")
                        else None
                    ),
                    tool=tool,
                    description=event_data.get("description", ""),
                    confidence_score=event_data.get("confidence_score", 0.8),
                )
                video_events.append(event)
        events = video_events

    return create_process_map_from_events(events)
