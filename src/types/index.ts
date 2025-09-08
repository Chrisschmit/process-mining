export type AppState = "welcome" | "source-selection" | "loading" | "captioning";
export interface GlassEffectProps {
  baseFrequency?: number;
  numOctaves?: number;
  scale?: number;
  bgColor?: string;
  highlight?: string;
}


export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export type InitialPosition = "bottom-left" | "bottom-right" | Position;
