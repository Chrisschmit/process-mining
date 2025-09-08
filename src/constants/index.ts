export const GLASS_EFFECTS = {
  BASE_FREQUENCY: 0.008,
  NUM_OCTAVES: 2,
  SCALE: 77,
  COLORS: {
    DEFAULT_BG: "rgba(0, 0, 0, 0.25)",
    SUCCESS_BG: "rgba(0, 50, 0, 0.25)",
    ERROR_BG: "rgba(50, 0, 0, 0.25)",
    BUTTON_BG: "rgba(59, 130, 246, 0.25)",
    HIGHLIGHT: "rgba(255, 255, 255, 0.15)",
    TEXT: "#ffffff",
  },
} as const;

export const LAYOUT = {
  MARGINS: {
    DEFAULT: 20,
    BOTTOM: 20,
    BOTTOM_WITH_SCRUBBER:100,
  },
  DIMENSIONS: {
    PROMPT_WIDTH: 420,
    CAPTION_WIDTH: 150,
    CAPTION_HEIGHT: 45,
  },
  TRANSITIONS: {
    SCALE_DURATION: 200,
    OPACITY_DURATION: 200,
    TRANSFORM_DURATION: 400,
  },
} as const;

export const TIMING = {
  FRAME_CAPTURE_DELAY: 50,
  VIDEO_RECOVERY_INTERVAL: 1000,
  RESIZE_DEBOUNCE: 50,
  SUGGESTION_DELAY: 50,
} as const;

const DEFAULT_PROMPT = `As an expert Senior IT Consultant specializing in process analysis and digital workflow optimization, your task is to observe a series of screen recordings of a back-office knowledge worker. Your goal is to provide a highly detailed, structured summary of their activities to enable automated process mining.

Your analysis should be broken down into the following sections:

**1. Activity Log:**
Provide a chronological, step-by-step description of the user's actions. Use specific and concise language. For each step, identify the action taken (e.g., "opened spreadsheet," "typed data into a field," "copied text," "navigated to URL").

**2. Tools and Environment:**
Identify all applications, websites, and documents visible on the screen. For web-based tools, list the specific URL or service name. For desktop applications, provide the application name (e.g., "Microsoft Excel," "SAP ERP," "Chrome browser").

**3. Workflow Analysis Summary:**
Synthesize the actions and environment into a high-level summary. Describe the goal of the current task or sub-process the user is performing. For example, "The user is completing the monthly expense report process by gathering data from a CRM, validating it in an ERP system, and entering it into a finance spreadsheet."

This output will be used by our process mining tool to automatically infer process models, cluster tasks, and build a definitive taxonomy of back-office workflows. Ensure the information is granular and factual.`;

export const PROMPTS = {  
  default: DEFAULT_PROMPT,
  placeholder: DEFAULT_PROMPT,

  suggestions: [
    DEFAULT_PROMPT,
    "What is the color of my shirt?",
    "Identify any text or written content visible.",
    "What emotions or actions are being portrayed?",
    "Name the object I am holding in my hand.",
  ],

  fallbackCaption: "Waiting for first caption...",
  processingMessage: "Starting analysis...",
} as const;
