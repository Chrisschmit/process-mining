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
    BOTTOM_WITH_SCRUBBER: 100,
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
  FRAME_CAPTURE_DELAY: 500, // Capture every 500ms (2 fps) - good balance for process analysis
} as const;

const DEFAULT_PROMPT = `As an expert Senior IT Consultant specializing in workflow analysis and mapping, your task is to observe a series of screen recordings of a back-office knowledge worker. Your goal is to provide a highly detailed analysis of what you see on the screen to enable automated process mining.`;

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
