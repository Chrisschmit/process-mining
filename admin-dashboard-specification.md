# Admin Dashboard for Process Mining - Specification Document

## Executive Summary

This specification defines an Admin Dashboard for the FastVLM WebGPU Process Mining application, enabling administrators to oversee multiple projects, participants, and workflow analyses across different organizational departments. The dashboard provides three levels of analytical depth: high-level overview, workflow-specific insights, and granular detail examination.

## Stakeholders

### Primary Users
- **System Administrators**: Need comprehensive oversight of all process mining activities
- **Department Managers**: Require visibility into their team's workflow analysis progress
- **Process Improvement Analysts**: Need detailed workflow insights for optimization recommendations

### Secondary Users  
- **Executive Leadership**: Require high-level completion metrics and ROI insights
- **IT Support Teams**: Need access to technical metadata and error tracking

## Functional Requirements

### FR-001: Project Management Dashboard
**Description**: Display all active and completed projects with hierarchical organization by department
**Priority**: High
**Acceptance Criteria**:
- [ ] Display projects grouped by department (e.g., "Accounting Department", "Sales Operations")
- [ ] Show project status indicators (Active, Completed, Paused, Error)
- [ ] Display project creation date and last updated timestamp
- [ ] Support project filtering by status, department, and date range
- [ ] Show project completion percentage based on participant recordings

### FR-002: Participant Status Tracking
**Description**: Track individual participant recording status within each project
**Priority**: High
**Acceptance Criteria**:
- [ ] List all participants enrolled in selected project
- [ ] Display participant status: Completed, In Progress, Pending, Failed
- [ ] Show recording metadata: duration, file size, processing status
- [ ] Display participant information: name, role, department
- [ ] Support participant filtering and search functionality

### FR-003: Key Performance Indicators (KPI) Header
**Description**: Display aggregate metrics across all projects and participants
**Priority**: High
**Acceptance Criteria**:
- [ ] Show completion rate as fraction and percentage (e.g., "3/5 Recordings Completed - 60%")
- [ ] Display total data analyzed in minutes with automatic unit conversion
- [ ] List top 3 applications by cumulative usage time across all recordings
- [ ] Update KPIs in real-time as new data is processed
- [ ] Support KPI filtering by date range and project selection

### FR-004: Workflow Insights Card (Level 1)
**Description**: High-level overview of most frequent and time-consuming workflows
**Priority**: High  
**Acceptance Criteria**:
- [ ] Display top 3-5 workflows ranked by frequency or total time consumption
- [ ] Show workflow names (e.g., "Invoice Processing", "New Client Onboarding")
- [ ] Display aggregate metrics: average completion time, participant count
- [ ] Support switching between frequency and time-based ranking
- [ ] Enable drill-down navigation to Level 2 workflow details

### FR-005: Workflow-Specific View (Level 2)
**Description**: Detailed analysis for individual workflows including process maps
**Priority**: High
**Acceptance Criteria**:
- [ ] Render interactive process map using directed graph visualization
- [ ] Display workflow key metrics panel with average completion time
- [ ] List most commonly used systems/applications for the workflow
- [ ] Identify and highlight common deviations from standard process
- [ ] Show workflow complexity score and efficiency indicators
- [ ] Support process map node interaction for additional details

### FR-006: Raw Data Table (Level 3)
**Description**: Granular event-level data with filtering and export capabilities
**Priority**: Medium
**Acceptance Criteria**:
- [ ] Display tabular data with columns: Timestamp, Application/System, Action, Duration
- [ ] Support multi-column filtering with text search and date ranges
- [ ] Enable column sorting and custom column selection
- [ ] Provide pagination for large datasets (100 rows per page default)
- [ ] Support data export to CSV and JSON formats
- [ ] Include participant and session context in each row

### FR-007: Navigation Integration
**Description**: Integrate dashboard as new route accessible from welcome screen
**Priority**: Medium
**Acceptance Criteria**:
- [ ] Add "Admin Dashboard" option to welcome screen navigation
- [ ] Implement role-based access control for admin features
- [ ] Support deep linking to specific projects and workflows
- [ ] Maintain navigation state when switching between dashboard levels
- [ ] Provide breadcrumb navigation for current location context

### FR-008: Real-time Data Updates
**Description**: Automatically refresh dashboard data as new recordings are processed
**Priority**: Medium
**Acceptance Criteria**:
- [ ] Implement WebSocket connection for real-time updates
- [ ] Update KPIs and project status without page refresh
- [ ] Show loading indicators during data refresh operations
- [ ] Handle connection failures gracefully with retry logic
- [ ] Support manual refresh with last updated timestamp display

## User Stories

### Epic: Project Overview Management

#### Story: ADMIN-001 - Project List Display
**As a** system administrator  
**I want** to view all projects organized by department  
**So that** I can quickly assess organizational process mining coverage

**Acceptance Criteria** (EARS format):
- **WHEN** administrator loads the dashboard **THEN** all projects are displayed grouped by department
- **IF** project has no recordings **THEN** status shows as "Empty" with creation date
- **FOR** each project **VERIFY** completion percentage is accurately calculated

**Technical Notes**:
- Integrate with existing VideoAnalysisResult model for data source
- Implement department-based grouping in frontend state management

**Story Points**: 8
**Priority**: High

#### Story: ADMIN-002 - Participant Status Overview
**As a** department manager  
**I want** to see which team members have completed their recordings  
**So that** I can follow up with pending participants

**Acceptance Criteria** (EARS format):
- **WHEN** project is selected **THEN** participant list displays with current status
- **IF** recording failed **THEN** error details are accessible via status indicator
- **FOR** completed recordings **VERIFY** processing timestamp and file metadata are shown

**Technical Notes**:
- Extend user_info structure in VideoAnalysisResult model
- Implement status mapping from processing pipeline

**Story Points**: 5
**Priority**: High

### Epic: Workflow Analysis Dashboard

#### Story: ADMIN-003 - KPI Header Display
**As a** executive leader  
**I want** to see aggregate completion and analysis metrics  
**So that** I can understand process mining program effectiveness

**Acceptance Criteria** (EARS format):
- **WHEN** dashboard loads **THEN** KPIs display current completion rate and total analyzed time
- **IF** no data exists **THEN** KPIs show "0" with appropriate messaging
- **FOR** application usage ranking **VERIFY** top 3 applications are accurate based on tool identification

**Technical Notes**:
- Aggregate data from ToolIdentification models across all sessions
- Implement efficient caching for KPI calculations

**Story Points**: 13
**Priority**: High

#### Story: ADMIN-004 - Workflow Insights Card
**As a** process improvement analyst  
**I want** to identify the most significant workflows across the organization  
**So that** I can prioritize optimization efforts

**Acceptance Criteria** (EARS format):
- **WHEN** insights card loads **THEN** top workflows are ranked by frequency and time consumption
- **IF** workflow has insufficient data **THEN** confidence indicators are displayed
- **FOR** each workflow **VERIFY** participant count and average duration are accurate

**Technical Notes**:
- Analyze WorkflowStep patterns from video events
- Implement clustering algorithm for workflow identification

**Story Points**: 13
**Priority**: High

#### Story: ADMIN-005 - Interactive Process Map
**As a** process analyst  
**I want** to visualize workflow process maps  
**So that** I can identify bottlenecks and optimization opportunities

**Acceptance Criteria** (EARS format):
- **WHEN** workflow is selected **THEN** process map renders with nodes and edges
- **IF** step has variations **THEN** alternative paths are highlighted
- **FOR** each process node **VERIFY** step timing and frequency data are accessible

**Technical Notes**:
- Integrate with ProcessMap model from process_mapper
- Use React Flow or similar library for interactive visualization

**Story Points**: 21
**Priority**: High

#### Story: ADMIN-006 - Raw Data Table with Filtering
**As a** data analyst  
**I want** to examine granular event data with filtering capabilities  
**So that** I can perform detailed analysis and export findings

**Acceptance Criteria** (EARS format):
- **WHEN** raw data view is accessed **THEN** all events display in paginated table
- **IF** filters are applied **THEN** data refreshes with matching results only
- **FOR** export functionality **VERIFY** filtered data exports in CSV and JSON formats

**Technical Notes**:
- Source data from VideoEvent model with efficient pagination
- Implement client-side filtering with server-side data fetching

**Story Points**: 8
**Priority**: Medium

## Technical Requirements

### Frontend Architecture

#### Component Structure
```
src/components/admin/
├── AdminDashboard.tsx          # Main dashboard container
├── ProjectSidebar.tsx          # Left sidebar with project navigation
├── KPIHeader.tsx              # Top header with key metrics
├── WorkflowInsightsCard.tsx   # Level 1 overview card
├── WorkflowDetailView.tsx     # Level 2 workflow-specific view
├── RawDataTable.tsx           # Level 3 granular data table
├── ProcessMapVisualization.tsx # Interactive process map component
└── ParticipantStatusList.tsx   # Participant tracking component
```

#### State Management
```typescript
interface AdminDashboardState {
  selectedProject: string | null;
  selectedWorkflow: string | null;
  viewLevel: 1 | 2 | 3;
  filters: {
    dateRange: { start: Date; end: Date };
    department: string[];
    status: ParticipantStatus[];
  };
  realTimeConnection: WebSocket | null;
}
```

#### Routing Integration
```typescript
// Update AppState type to include admin dashboard
export type AppState = "welcome" | "source-selection" | "loading" | "captioning" | "admin-dashboard";

// Add route handling in App.tsx
{appState === "admin-dashboard" && <AdminDashboard />}
```

### Backend Extensions

#### New API Endpoints
```python
# backend/api/routers/admin.py

@router.get("/projects")
async def get_all_projects() -> List[ProjectSummary]:
    """Get all projects with participant status and completion metrics."""

@router.get("/projects/{project_id}/participants") 
async def get_project_participants(project_id: str) -> List[ParticipantStatus]:
    """Get all participants for a specific project."""

@router.get("/kpis")
async def get_dashboard_kpis() -> DashboardKPIs:
    """Get aggregate KPIs across all projects."""

@router.get("/workflows/insights")
async def get_workflow_insights() -> List[WorkflowInsight]:
    """Get top workflows ranked by frequency and time consumption."""

@router.get("/workflows/{workflow_id}/process-map")
async def get_process_map(workflow_id: str) -> ProcessMap:
    """Get process map visualization data for specific workflow."""

@router.get("/events/raw")
async def get_raw_events(
    project_id: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    filters: Optional[dict] = None
) -> List[VideoEvent]:
    """Get paginated raw event data with optional filtering."""

@router.websocket("/ws/dashboard-updates")
async def dashboard_websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time dashboard updates."""
```

## Data Model Requirements

### New Models

```python
# backend/admin/models.py

class ParticipantStatus(BaseModel):
    """Participant recording and processing status."""
    
    participant_id: str
    name: str
    role: str
    department: str
    recording_status: Literal["completed", "in_progress", "pending", "failed"]
    recording_duration_ms: Optional[int] = None
    file_size_bytes: Optional[int] = None
    processing_status: Literal["completed", "processing", "queued", "failed"] = "queued"
    created_at: datetime
    updated_at: datetime
    error_message: Optional[str] = None

class ProjectSummary(BaseModel):
    """High-level project information for admin dashboard."""
    
    project_id: str
    name: str
    department: str
    status: Literal["active", "completed", "paused", "error"]
    participant_count: int
    completed_recordings: int
    total_analysis_time_ms: int
    created_at: datetime
    last_updated: datetime

class DashboardKPIs(BaseModel):
    """Key performance indicators for admin dashboard header."""
    
    completion_rate: float  # 0.0 to 1.0
    completed_recordings: int
    total_recordings: int
    total_analysis_time_ms: int
    top_applications: List[Dict[str, Any]]  # [{name, usage_time_ms, frequency}]
    active_projects: int
    total_participants: int

class WorkflowInsight(BaseModel):
    """High-level workflow insights for Level 1 display."""
    
    workflow_id: str
    name: str
    frequency_rank: int
    time_rank: int
    total_occurrences: int
    avg_duration_ms: int
    participant_count: int
    complexity_score: float
    common_applications: List[str]
    efficiency_score: float  # 0.0 to 1.0

class AdminDashboardFilters(BaseModel):
    """Filter options for dashboard data."""
    
    project_ids: Optional[List[str]] = None
    departments: Optional[List[str]] = None
    date_range: Optional[Dict[str, datetime]] = None
    participant_status: Optional[List[str]] = None
    workflow_types: Optional[List[str]] = None
```

## API Endpoint Specifications

### GET /api/v1/admin/projects
**Purpose**: Retrieve all projects with summary information
**Response**: 200 OK
```json
{
  "projects": [
    {
      "project_id": "proj_accounting_2024",
      "name": "Accounting Department",
      "department": "Finance",
      "status": "active",
      "participant_count": 5,
      "completed_recordings": 3,
      "total_analysis_time_ms": 75000,
      "created_at": "2024-01-15T10:00:00Z",
      "last_updated": "2024-01-20T14:30:00Z"
    }
  ]
}
```

### GET /api/v1/admin/kpis
**Purpose**: Get dashboard KPIs for header display
**Parameters**: Optional query params for filtering
**Response**: 200 OK
```json
{
  "completion_rate": 0.6,
  "completed_recordings": 12,
  "total_recordings": 20,
  "total_analysis_time_ms": 1500000,
  "top_applications": [
    {"name": "Excel", "usage_time_ms": 450000, "frequency": 89},
    {"name": "SAP", "usage_time_ms": 320000, "frequency": 67},
    {"name": "Chrome", "usage_time_ms": 280000, "frequency": 134}
  ],
  "active_projects": 3,
  "total_participants": 20
}
```

### GET /api/v1/admin/workflows/insights
**Purpose**: Get top workflows for Level 1 insights card
**Parameters**: 
- `limit`: Number of workflows to return (default: 5)
- `sort_by`: "frequency" | "time" (default: "frequency")
**Response**: 200 OK
```json
{
  "workflows": [
    {
      "workflow_id": "workflow_invoice_processing",
      "name": "Invoice Processing",
      "frequency_rank": 1,
      "time_rank": 2,
      "total_occurrences": 45,
      "avg_duration_ms": 180000,
      "participant_count": 8,
      "complexity_score": 7.2,
      "common_applications": ["Excel", "SAP", "Email"],
      "efficiency_score": 0.73
    }
  ]
}
```

### WebSocket /api/v1/admin/ws/dashboard-updates
**Purpose**: Real-time updates for dashboard data
**Message Types**:
```json
{
  "type": "kpi_update",
  "data": { "completion_rate": 0.65, "completed_recordings": 13 }
}
```

```json
{
  "type": "participant_status_change",
  "data": { "participant_id": "p123", "status": "completed" }
}
```

## Non-Functional Requirements

### NFR-001: Performance
**Description**: Dashboard must respond quickly to user interactions
**Metrics**: 
- Initial dashboard load time < 3 seconds
- KPI updates < 500ms
- Process map rendering < 2 seconds for workflows with <50 steps
- Raw data table pagination < 1 second

### NFR-002: Scalability
**Description**: Support growing number of projects and participants
**Metrics**:
- Handle up to 100 concurrent projects
- Support 1000+ participants across all projects
- Process maps with up to 100 workflow steps
- Raw data tables with 100,000+ events

### NFR-003: Security
**Description**: Protect sensitive organizational workflow data
**Requirements**:
- Role-based access control (RBAC) for admin features
- Audit logging for all admin actions
- Data encryption for sensitive workflow information
- Session timeout for inactive admin users (30 minutes)

### NFR-004: Accessibility
**Description**: Dashboard must be accessible to users with disabilities
**Requirements**:
- WCAG 2.1 Level AA compliance
- Keyboard navigation support for all interactive elements
- Screen reader compatibility for data tables
- High contrast mode support

### NFR-005: Browser Compatibility
**Description**: Support modern web browsers
**Requirements**:
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- WebGL support for process map visualization
- WebSocket support for real-time updates

## Constraints

### Technical Constraints
- Must integrate with existing FastAPI backend architecture
- Leverage existing Pydantic models and data structures
- Compatible with current React 19 and TypeScript frontend
- Use existing authentication and session management

### Business Constraints
- Development timeline: 6-8 weeks for full implementation
- Must not impact existing captioning functionality
- Admin features require separate access control from regular users

### Regulatory Requirements
- Comply with data privacy regulations (GDPR, CCPA)
- Audit trail requirements for admin actions
- Data retention policies for archived projects

## Assumptions

- Administrators have sufficient technical knowledge to interpret process maps
- Network connectivity is reliable for real-time updates
- Projects will typically contain 5-50 participants
- Workflow complexity will generally not exceed 100 steps
- Data export functionality will be used primarily for reporting

## Out of Scope

### Phase 1 Exclusions
- User management and role assignment (use existing system)
- Advanced analytics and predictive modeling
- Integration with external BI tools (Tableau, Power BI)
- Mobile-specific admin interface
- Automated report generation and scheduling
- Process improvement recommendation engine
- Multi-language support for international deployments

## Success Criteria

### Functional Success
- Administrators can oversee all projects from single dashboard
- Three levels of analytical depth provide appropriate information granularity
- Real-time updates keep dashboard data current
- Process maps effectively communicate workflow structures

### Performance Success
- Dashboard loads within 3 seconds on standard hardware
- Supports 10+ concurrent admin users without degradation
- Handles datasets with 100,000+ events efficiently

### User Experience Success
- Intuitive navigation between dashboard levels
- Clear visual hierarchy and information architecture
- Responsive design works on desktop and tablet devices

## Implementation Roadmap

### Phase 1: Core Infrastructure (Weeks 1-2)
- Backend API endpoints for project and participant data
- Basic frontend components and routing
- Database schema extensions for admin data

### Phase 2: Level 1 Dashboard (Weeks 3-4)
- KPI header implementation
- Project sidebar with navigation
- Workflow insights card with basic metrics

### Phase 3: Level 2 Analysis (Weeks 4-5)
- Process map visualization component
- Workflow-specific metrics and details
- Interactive drill-down functionality

### Phase 4: Level 3 Detail & Polish (Weeks 6-8)
- Raw data table with filtering and export
- Real-time WebSocket implementation
- Performance optimization and testing
- Documentation and deployment preparation

This specification provides a comprehensive foundation for implementing the Admin Dashboard for Process Mining, ensuring clear requirements, technical feasibility, and successful integration with the existing FastVLM WebGPU application.