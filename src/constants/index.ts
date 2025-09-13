// Modern Design System (shadcn/ui inspired)
export const DESIGN_TOKENS = {
  // Colors
  colors: {
    // Light theme primary
    background: "hsl(0 0% 100%)",        // Pure white
    foreground: "hsl(222.2 84% 4.9%)",   // Near black text
    
    // Card and surface colors
    card: "hsl(0 0% 100%)",
    cardForeground: "hsl(222.2 84% 4.9%)",
    
    // Subtle backgrounds
    muted: "hsl(210 40% 98%)",
    mutedForeground: "hsl(215.4 16.3% 46.9%)",
    
    // Interactive elements
    primary: "hsl(222.2 47.4% 11.2%)",
    primaryForeground: "hsl(210 40% 98%)",
    
    // Secondary actions
    secondary: "hsl(210 40% 96%)",
    secondaryForeground: "hsl(222.2 47.4% 11.2%)",
    
    // Borders and accents
    border: "hsl(214.3 31.8% 91.4%)",
    accent: "hsl(210 40% 96%)",
    accentForeground: "hsl(222.2 47.4% 11.2%)",
    
    // Status colors
    success: "hsl(142.1 76.2% 36.3%)",
    warning: "hsl(38.4 92.1% 50.2%)",
    destructive: "hsl(0 72.2% 50.6%)",
    
    // KPI & Metric colors
    kpiPrimary: "hsl(215 25% 27%)",
    kpiSuccess: "hsl(142 65% 30%)",
    kpiInfo: "hsl(221 65% 35%)",
    kpiWarning: "hsl(35 75% 35%)",
    kpiAccent: "hsl(262 65% 35%)",
    
    // Overlays (subtle glass effect)
    glass: "hsla(0, 0%, 100%, 0.8)",
    glassBlur: "hsla(210, 40%, 98%, 0.95)",
  },

  // Typography
  typography: {
    // Display text
    display: "text-4xl font-bold tracking-tight lg:text-5xl",
    
    // Headings
    h1: "text-3xl font-semibold tracking-tight",
    h2: "text-2xl font-semibold tracking-tight", 
    h3: "text-xl font-semibold",
    h4: "text-lg font-semibold",
    
    // Body text
    large: "text-lg font-medium",
    body: "text-sm font-medium",
    small: "text-sm",
    
    // Interactive text
    button: "text-sm font-medium",
    caption: "text-xs",
  },

  // Component styles
  components: {
    // Container styles
    card: "bg-white border border-gray-200 rounded-lg shadow-sm",
    
    // Buttons
    buttonPrimary: "bg-gray-900 text-white hover:bg-gray-800 rounded-md px-4 py-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",
    buttonSecondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-md px-4 py-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",
    
    // Modern glass effect (subtle)
    glassCard: "bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-lg shadow-lg",
    
    // Form elements
    input: "flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",
  },

  // Subtle glass effects for overlay components
  glass: {
    BASE_FREQUENCY: 0.002, // Reduced for subtlety
    NUM_OCTAVES: 1,         // Reduced for subtlety  
    SCALE: 20,              // Reduced for subtlety
  }
} as const;

// Legacy support - gradually migrate away from this
export const GLASS_EFFECTS = {
  BASE_FREQUENCY: DESIGN_TOKENS.glass.BASE_FREQUENCY,
  NUM_OCTAVES: DESIGN_TOKENS.glass.NUM_OCTAVES,
  SCALE: DESIGN_TOKENS.glass.SCALE,
  COLORS: {
    DEFAULT_BG: DESIGN_TOKENS.colors.glass,
    SUCCESS_BG: `hsla(142.1, 76.2%, 36.3%, 0.1)`,
    ERROR_BG: `hsla(0, 72.2%, 50.6%, 0.1)`,
    BUTTON_BG: DESIGN_TOKENS.colors.primary,
    HIGHLIGHT: "rgba(255, 255, 255, 0.15)",
    TEXT: DESIGN_TOKENS.colors.foreground,
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

const DEFAULT_PROMPT = `Your task is to describe in detail what you observe and provide a summary of the process being performed.`;

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
