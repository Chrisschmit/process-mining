# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend Development

- `npm run dev` - Start development server (Vite)
- `npm run build` - TypeScript check and production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier (120 char width)
- `tsc -b` - Run TypeScript type checking

### Backend Development

- `cd backend && pip install -r requirements.txt` - Install Python dependencies
- `python start_api.py` - Start PE Analytics API server (FastAPI on port 8000)
- `python run_video_processing.py /path/to/video.webm` - Process video for mining analysis
- `python simple_process_mapper.py` - Run process mapper
- `python process_mapper/main.py` - Run main process analysis
- `make clean` - Clean Python cache files
- `make lint-backend` - Lint Python code with ruff
- `make lint` - Lint both frontend and backend

## Architecture

### Tech Stack

- **Frontend**: React 19 with TypeScript, Vite, TailwindCSS
- **Backend**: Python 3.12+ with Gemini API integration
- **AI/ML**:
  - Frontend: Hugging Face Transformers.js with WebGPU
  - Backend: Google Generative AI (Gemini 2.5 Flash)
- **Models**:
  - Frontend: FastVLM-0.5B ONNX for real-time captioning
  - Backend: Gemini for video process analysis

### Core Application Flow

#### Frontend Flow

1. **Welcome Screen** → User initiates the app
2. **Source Selection** → Choose webcam, screen share, or file upload
3. **Model Loading** → FastVLM model loads via WebGPU
4. **Live Captioning** → Real-time video analysis and caption generation
5. **PE Analytics** → Click "PE Analytics" button to analyze workflows and generate insights

#### Backend Flow

1. **Video Ingestion** → Process .webm files from `backend/input/`
2. **Scene Detection** → PySceneDetect identifies key frames and segments
3. **AI Analysis** → Gemini API analyzes video chunks with structured prompts
4. **Process Mining** → Generate process maps and workflow analysis
5. **Output Generation** → JSON results and visualizations in `backend/output/`

### Key Components

#### Frontend Components

##### State Management

- `src/App.tsx` - Main app orchestrator with state machine (`AppState`)
- `src/context/VLMContext.tsx` - Vision-Language Model context managing model loading and inference
- App states: `"welcome" | "source-selection" | "loading" | "captioning" | "pe-analytics"`

##### Video Processing Pipeline

- `CaptioningView` - Main captioning interface orchestrating video capture and inference loop
- `useCaptioningLoop` hook - Manages continuous inference with abort control
- Video sources handled: webcam stream, screen capture, or file upload
- Canvas-based frame extraction for ML processing
- Updated `src/components/InputSourceDialog.tsx` - Enhanced input source selection
- Updated `src/utils/RecordingManager.ts` - Improved recording management

##### Model Integration

- WebGPU-accelerated inference using ONNX runtime
- Model: `onnx-community/FastVLM-0.5B-ONNX`
- Quantized weights (q4 for vision encoder/decoder, fp16 for embeddings)
- Streaming text generation with customizable prompts

##### Analytics Dashboard

- `WorkflowAnalysisView` - Main PE analytics dashboard with tabbed interface
- `VideoTimeline` - WebGL-accelerated timeline visualization with event markers
- `WorkflowClusters` - Interactive workflow segment visualization and analysis
- `AutomationOpportunities` - ROI-driven automation recommendations with implementation roadmaps
- `PEInsightsDashboard` - Executive summary with key metrics and cost-benefit analysis
- `MultiSessionComparison` - Cross-session trends, benchmarking, and pattern recognition

#### Backend Components

##### Process Mining Pipeline

- `backend/simple_process_mapper.py` - Main process mapping entry point
- `backend/process_mapper/` - Core process analysis modules
  - `main.py` - Primary orchestrator
  - `process_models.py` - Pydantic models for structured data
  - `__init__.py` - Package initialization

##### Video Processing

- `backend/video_processing/` - Video analysis pipeline
  - `process_video.py` - Main video processing logic
  - `scene_detector.py` - PySceneDetect integration
  - `screenshot_extractor.py` - Frame extraction utilities
  - `gemini_client.py` - Gemini API integration
  - `export_analysis.py` - Output formatting and export
  - `models.py` - Data models
  - `prompts.yaml` - Centralized prompt management

##### PE Workflow Analyzer

- `backend/workflow_analyzer/` - Private Equity workflow analysis engine
  - `workflow_clusterer.py` - DBSCAN clustering for workflow segmentation
  - `pe_analytics.py` - PE-specific analytics and automation opportunity identification
  - `video_integration.py` - Video timestamp navigation and timeline integration
  - `multi_session_analyzer.py` - Cross-session comparison and benchmarking
  - `models.py` - Pydantic models for  analytics data structures

##### API Services

- `backend/api/` - FastAPI application for PE analytics
  - `main.py` - FastAPI app with CORS and routing setup
  - `routers/workflow_analysis.py` - Workflow clustering and analysis endpoints
  - `routers/pe_insights.py` - PE-specific insights and metrics endpoints
  - `routers/automation.py` - Automation opportunities and ROI analysis endpoints
  - `routers/multi_session.py` - Multi-session comparison and trends endpoints

##### Configuration & Dependencies

- `requirements.txt` - Python dependencies (FastAPI, scikit-learn, Gemini AI, Pydantic, PySceneDetect, OpenCV)
- `.env` - API keys and environment configuration
- `backend/input/` - Input video files (.webm)
- `backend/output/` - Analysis results and process maps

### Component Patterns

- Glass morphism UI components (`GlassContainer`, `GlassButton`)
- Draggable containers with boundary detection
- Custom video scrubber for file playbook control
- Real-time caption display with typing animation
- Structured JSON output with Pydantic models
- Multi-stage video processing pipeline
- Scene-based intelligent sampling for cost optimization
- RESTful API endpoints for PE analytics integration
- WebGL-accelerated timeline visualization for performance
- Cross-session workflow comparison and benchmarking

## PE Analytics API Usage

### Start the Backend API Server

```bash
cd backend
pip install -r requirements.txt
python start_api.py
```

The API server will start on http://localhost:8000 with automatic reload enabled.

### API Endpoints

#### Workflow Analysis
- `POST /api/v1/analyze-workflows` - Analyze workflows from JSON input
- `GET /api/v1/sessions/{session_id}/workflow-segments` - Get workflow segments
- `GET /api/v1/sessions/{session_id}/video-timeline` - Get video timeline data

#### PE Insights
- `GET /api/v1/pe-analytics/{session_id}` - Get PE-specific analytics
- `GET /api/v1/pe-analytics/{session_id}/efficiency-breakdown` - Get efficiency analysis
- `GET /api/v1/pe-analytics/{session_id}/cost-benefit` - Get cost-benefit analysis

#### Automation Opportunities
- `GET /api/v1/automation-opportunities` - Get automation opportunities with filtering
- `GET /api/v1/automation-roadmap` - Get implementation roadmap
- `GET /api/v1/automation-tools/recommendations` - Get tool recommendations

#### Multi-Session Analysis
- `GET /api/v1/multi-session-analysis` - Compare multiple sessions
- `GET /api/v1/sessions/{session_id}/benchmarks` - Get industry benchmarks
- `GET /api/v1/trends/efficiency` - Get efficiency trends over time

### Example Usage

```bash
# Analyze workflows from JSON file
curl -X POST "http://localhost:8000/api/v1/analyze-workflows-from-file" \
  -F "file=@output/session_20250909_144411_66934b80/analysis_result_20250909_144411.json"

# Get PE insights for a session
curl "http://localhost:8000/api/v1/pe-analytics/session_12345"

# Get automation opportunities with high ROI filter
curl "http://localhost:8000/api/v1/automation-opportunities?min_roi=3.0"
```
