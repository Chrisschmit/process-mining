import { PROMPTS, GLASS_EFFECTS } from "../constants";
import GlassContainer from "./GlassContainer";

interface LiveCaptionProps {
  caption: string;
  isRunning?: boolean;
  error?: string | null;
}

export default function LiveCaption({ caption, isRunning, error }: LiveCaptionProps) {
  // Limit caption text to prevent overflow - truncate to ~500 characters
  const truncatedCaption = caption && caption.length > 750 ? caption.substring(0, 700) + '...' : caption;
  const content = error || truncatedCaption;

  const { color, label } = error
    ? { color: "bg-red-500", label: "ERROR" }
    : isRunning
      ? { color: "bg-green-500 animate-pulse", label: "RUNNING" }
      : { color: "bg-yellow-500 animate-pulse", label: "STOPPED" };

  return (
    <GlassContainer
      bgColor={error ? GLASS_EFFECTS.COLORS.ERROR_BG : GLASS_EFFECTS.COLORS.DEFAULT_BG}
      className={`w-150 h-70 rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-200 ${
        error ? "border border-red-500/30" : ""
      }`}
    >
      <div className="p-5 flex flex-col flex-start h-full" style={{ color: "var(--text)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold opacity-90">Live Caption</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-sm opacity-70">{label}</span>
          </div>
        </div>

        <div className="min-h-[6rem] flex flex-col">
          {content ? (
            <div className={`text-sm opacity-85 leading-relaxed flex-1 ${error ? "text-red-300" : ""}`}>
              <span>{content || PROMPTS.fallbackCaption}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border border-blue-400 border-t-transparent" />
              <p className="text-sm opacity-80 italic">{PROMPTS.processingMessage}</p>
            </div>
          )}
        </div>
      </div>
    </GlassContainer>
  );
}
