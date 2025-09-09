"""
Extended Pydantic models for agentic process mapping.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from enum import Enum


class ProcessStepType(str, Enum):
    """Types of process steps for business workflow mapping."""
    TRIGGER = "trigger"
    INPUT = "input" 
    PROCESS = "process"
    DECISION = "decision"
    OUTPUT = "output"


class ProcessStep(BaseModel):
    """A single step in the business process."""
    
    id: str = Field(description="Unique step identifier")
    type: ProcessStepType = Field(description="Type of process step")
    position: Dict[str, int] = Field(description="X,Y coordinates for visualization")
    data: Dict[str, Any] = Field(description="Step data including label and description")
    timestamp_ms: Optional[int] = Field(None, description="Original timestamp from video")
    confidence_score: float = Field(ge=0, le=1, description="Confidence in this step mapping")
    tool_context: Optional[str] = Field(None, description="Application/tool used in this step")


class ProcessEdge(BaseModel):
    """Connection between process steps."""
    
    id: str = Field(description="Unique edge identifier") 
    source: str = Field(description="Source step ID")
    target: str = Field(description="Target step ID")
    animated: bool = Field(default=True, description="Whether edge should be animated")
    label: Optional[str] = Field(None, description="Optional edge label")
    condition: Optional[str] = Field(None, description="Condition for this path if applicable")


class ProcessMap(BaseModel):
    """Complete business process map."""
    
    nodes: List[ProcessStep] = Field(description="All process steps")
    edges: List[ProcessEdge] = Field(description="All connections between steps")
    metadata: Dict[str, Any] = Field(description="Process metadata and statistics")


class WorkflowAnalysis(BaseModel):
    """Analysis of the business workflow from video events."""
    
    workflow_type: Literal["sequential", "parallel", "conditional", "loop"] = Field(
        description="Type of workflow pattern detected"
    )
    steps: List[Dict[str, Any]] = Field(description="Analyzed workflow steps")
    complexity: Optional[Literal["simple", "medium", "complex"]] = Field(
        default="medium",
        description="Complexity assessment of the workflow (must be exactly: simple, medium, or complex)"
    )
    duration_ms: int = Field(description="Total workflow duration")
    tools_involved: List[str] = Field(description="Applications/tools used")
    key_actions: List[str] = Field(description="Key user actions identified")


class AgentState(BaseModel):
    """State tracking for autonomous process mapping agents."""
    
    current_step: str = Field(default="start", description="Current agent step")
    original_data: Dict[str, Any] = Field(default={}, description="Original video analysis data")
    working_data: Dict[str, Any] = Field(default={}, description="Agent working data")
    errors: List[Dict[str, Any]] = Field(default=[], description="Errors encountered")
    iterations: int = Field(default=0, description="Current iteration count")
    max_iterations: int = Field(default=30, description="Maximum iterations allowed")
    step_counter: int = Field(default=0, description="Total steps executed")


class AgentAction(BaseModel):
    """Result of an agent action execution."""
    
    action: str = Field(description="Action that was executed")
    success: bool = Field(description="Whether action succeeded")
    data: Optional[Dict[str, Any]] = Field(None, description="Result data if successful")
    error: Optional[str] = Field(None, description="Error message if failed")
    next_action: Optional[str] = Field(None, description="Suggested next action")
    confidence: float = Field(ge=0, le=1, description="Confidence in the result")


