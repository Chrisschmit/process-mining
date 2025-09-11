# FastVLM Design System

A modern, light-themed design system with subtle glassmorphism effects for the FastVLM WebGPU application.

## Table of Contents
- [Overview](#overview)
- [Color Palette](#color-palette)
- [Typography](#typography)
- [Components](#components)
- [Glass Effects](#glass-effects)
- [Layout & Spacing](#layout--spacing)
- [Usage Guidelines](#usage-guidelines)
- [Implementation](#implementation)

## Overview

The FastVLM design system follows modern UI principles inspired by shadcn/ui, featuring:
- **Light theme** with high contrast for readability
- **Subtle glassmorphism** for overlay components
- **Clean typography** with consistent hierarchy
- **Accessible interactions** with proper focus states
- **Consistent shadows** for depth and clarity

### Design Philosophy
- **Clarity over decoration**: Prioritize readability and usability
- **Consistent interactions**: Predictable hover and focus states
- **Accessible by default**: WCAG 2.1 AA compliant color contrasts
- **Modern aesthetics**: Clean lines with subtle glass effects

## Color Palette

### Primary Colors
```css
--background: hsl(0 0% 100%)          /* Pure white */
--foreground: hsl(222.2 84% 4.9%)     /* Near black text */
--card: hsl(0 0% 100%)                /* Card backgrounds */
--card-foreground: hsl(222.2 84% 4.9%) /* Card text */
```

### Interactive Colors
```css
--primary: hsl(222.2 47.4% 11.2%)     /* Dark gray for buttons */
--primary-foreground: hsl(210 40% 98%) /* Light text on primary */
--secondary: hsl(210 40% 96%)         /* Light gray backgrounds */
--secondary-foreground: hsl(222.2 47.4% 11.2%) /* Dark text on secondary */
```

### Status Colors
```css
--success: hsl(142.1 76.2% 36.3%)     /* Green for success states */
--warning: hsl(38.4 92.1% 50.2%)      /* Amber for warnings */
--destructive: hsl(0 72.2% 50.6%)     /* Red for errors/destructive actions */
```

### KPI & Metric Colors
```css
--kpi-primary: hsl(215 25% 27%)        /* Muted dark gray for primary KPI values */
--kpi-success: hsl(142 65% 30%)        /* Muted green for positive metrics */
--kpi-info: hsl(221 65% 35%)           /* Muted blue for informational metrics */  
--kpi-warning: hsl(35 75% 35%)         /* Muted orange for warning metrics */
--kpi-accent: hsl(262 65% 35%)         /* Muted purple for accent metrics */
```

### Glass Effect Colors
```css
--glass: hsla(0, 0%, 100%, 0.8)       /* Semi-transparent white overlay */
--glass-blur: hsla(210, 40%, 98%, 0.95) /* Blurred glass background */
--highlight: rgba(255, 255, 255, 0.15) /* Specular highlight */
```

## Typography

### Hierarchy
```css
/* Display Text */
.display { @apply text-4xl font-bold tracking-tight lg:text-5xl; }

/* Headings */
.h1 { @apply text-3xl font-semibold tracking-tight; }
.h2 { @apply text-2xl font-semibold tracking-tight; }
.h3 { @apply text-xl font-semibold; }
.h4 { @apply text-lg font-semibold; }

/* Body Text */
.large { @apply text-lg font-medium; }
.body { @apply text-sm font-medium; }
.small { @apply text-sm; }
.caption { @apply text-xs; }
```

### Usage Guidelines
- **Display**: For main page titles and hero sections
- **H1-H4**: For section headings with proper hierarchy
- **Large**: For important body content and descriptions
- **Body**: For standard interface text
- **Small/Caption**: For supporting text and metadata

## Components

### Cards
```css
/* Standard Card */
.card {
  @apply bg-white border border-gray-200 rounded-lg shadow-sm;
}

/* Glass Card (for overlays) */
.glass-card {
  @apply bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-lg shadow-lg;
}
```

### Buttons
```css
/* Primary Button */
.button-primary {
  @apply bg-gray-900 text-white hover:bg-gray-800 rounded-md px-4 py-2 font-medium 
         transition-colors focus-visible:outline-none focus-visible:ring-2 
         focus-visible:ring-gray-400 focus-visible:ring-offset-2;
}

/* Secondary Button */
.button-secondary {
  @apply bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-md px-4 py-2 font-medium 
         transition-colors focus-visible:outline-none focus-visible:ring-2 
         focus-visible:ring-gray-400 focus-visible:ring-offset-2;
}
```

### Form Elements
```css
/* Input Fields */
.input {
  @apply flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm 
         ring-offset-white focus-visible:outline-none focus-visible:ring-2 
         focus-visible:ring-gray-400 focus-visible:ring-offset-2;
}
```

## Glass Effects

### GlassContainer Component
The `GlassContainer` component provides sophisticated glassmorphism effects with:

#### Visual Layers (z-index order):
1. **Glass Filter** (z-10): Backdrop blur with distortion
2. **Glass Overlay** (z-20): Semi-transparent color background
3. **Glass Specular** (z-30): Interactive highlight following mouse
4. **Content** (z-40): Component content

#### Implementation:
```tsx
<GlassContainer
  bgColor="hsla(0, 0%, 100%, 0.8)"     // Semi-transparent background
  highlight="hsla(210, 40%, 98%, 0.3)" // Specular highlight color
  className="rounded-2xl shadow-lg"     // Additional styling
>
  {children}
</GlassContainer>
```

#### CSS Variables:
```css
.glass-container {
  --bg-color: hsla(0, 0%, 100%, 0.8);
  --highlight: hsla(210, 40%, 98%, 0.3);
  --text: hsl(222.2 84% 4.9%);
}
```

### Glass Filter Settings
```javascript
const GLASS_SETTINGS = {
  BASE_FREQUENCY: 0.002,  // Subtle distortion
  NUM_OCTAVES: 1,         // Simple pattern
  SCALE: 20,              // Gentle effect
}
```

### Usage Guidelines for Glass Effects
- **Overlays**: Use for floating UI elements over video content
- **Modals**: Enhance focus with backdrop blur
- **Control panels**: Make controls visible over any background
- **Avoid overuse**: Reserve for elements that need to float above content

## Layout & Spacing

### Margins
```javascript
MARGINS: {
  DEFAULT: 20,              // Standard component margins
  BOTTOM: 20,               // Bottom spacing
  BOTTOM_WITH_SCRUBBER: 100 // Extra space when video scrubber is present
}
```

### Component Dimensions
```javascript
DIMENSIONS: {
  PROMPT_WIDTH: 420,        // Prompt input optimal width
  CAPTION_WIDTH: 150,       // Live caption container width
  CAPTION_HEIGHT: 45        // Live caption container height
}
```

### Shadows for Visibility
```css
/* Standard Shadow */
.shadow-standard { @apply shadow-sm; }

/* Enhanced Shadow (for glass components over video) */
.shadow-enhanced { @apply shadow-lg; }
```

## Usage Guidelines

### When to Use Glass Effects
✅ **Do:**
- Overlay controls during video playback/recording
- Floating UI elements that need to be visible over any background
- Modal dialogs and tooltips
- Navigation elements over dynamic content

❌ **Don't:**
- Standard page content (use regular cards)
- Text-heavy interfaces (affects readability)
- When content doesn't need to float over other elements

### Accessibility Considerations
- Maintain WCAG 2.1 AA contrast ratios (4.5:1 for normal text)
- Ensure focus states are clearly visible
- Test glass effects don't interfere with screen readers
- Provide sufficient color contrast even with transparency

### Responsive Behavior
- Glass effects scale appropriately on mobile devices
- Touch targets meet minimum 44px requirements
- Typography scales with viewport (using clamp() functions)

## Implementation

### Using Design Tokens
```tsx
import { DESIGN_TOKENS } from '../constants';

// Typography
<h1 className={DESIGN_TOKENS.typography.display}>Title</h1>

// Components
<div className={DESIGN_TOKENS.components.card}>Content</div>

// Buttons  
<button className={DESIGN_TOKENS.components.buttonPrimary}>
  Action
</button>
```

### Custom Glass Components
```tsx
import GlassContainer from './GlassContainer';

// Standard glass overlay
<GlassContainer className="rounded-xl shadow-lg">
  <div className="p-4">Overlay content</div>
</GlassContainer>

// Custom background color
<GlassContainer 
  bgColor="rgba(59, 130, 246, 0.1)"
  className="p-3"
>
  <Icon />
</GlassContainer>
```

### Enhanced Visibility
For controls over video content, wrap in shadow containers:
```tsx
<div className="shadow-lg">
  <GlassButton>Control</GlassButton>
</div>
```

## Migration Guide

### From Dark Theme
1. Update background colors from gray-900 to white
2. Change text colors from white to gray-900
3. Adjust glass effect opacity for light backgrounds
4. Test contrast ratios meet accessibility requirements

### Legacy Glass Effects
The `GLASS_EFFECTS` constant is maintained for backward compatibility but new components should use `DESIGN_TOKENS.glass`.

## Browser Support
- **WebKit**: Safari 14+, Chrome 76+
- **Firefox**: 103+ (backdrop-filter support)
- **Graceful degradation**: Falls back to standard borders without backdrop-blur

## Performance Notes
- Glass effects use hardware acceleration when available
- SVG filters cached for optimal performance
- Mouse tracking debounced for smooth interactions