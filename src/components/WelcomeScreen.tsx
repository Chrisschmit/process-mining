import { useState } from "react";
import GlassContainer from "./GlassContainer";
import GlassButton from "./GlassButton";

interface WelcomeScreenProps {
  onStart: (userInfo: { name: string; function: string }) => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [name, setName] = useState<string>("");
  const [userFunction, setUserFunction] = useState<string>("");
  const [showInputs, setShowInputs] = useState<boolean>(false);

  const handleStartClick = () => {
    if (!showInputs) {
      setShowInputs(true);
      return;
    }

    if (name.trim() && userFunction.trim()) {
      onStart({ name: name.trim(), function: userFunction.trim() });
    }
  };

  return (
    <div className="absolute inset-0 text-white flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Main Title Card */}
        <GlassContainer
          className="rounded-3xl shadow-2xl hover:scale-105 transition-transform duration-200"
          role="banner"
        >
          <div className="p-8 text-center">
            <h1 className="text-5xl font-bold text-gray-100 mb-4">Showcase your expertise in everyday workflows</h1>
            <p className="text-gray-300">
              Work as you normally do. This tool helps you capture your know-how and spoken explanations, then turns
              them into a clear step-by-step summary. Use it to highlight your expertise, make training smoother, and
              ensure your contribution is visible and valued.{" "}
            </p>
          </div>
        </GlassContainer>

        {/* User Information Form */}
        {showInputs && (
          <GlassContainer className="rounded-2xl shadow-2xl">
            <div className="p-6 space-y-4">
              <h3 className="text-xl font-semibold text-gray-200 text-center mb-6">Please provide your information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Your Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                    placeholder="Enter your full name"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Your Function/Role *</label>
                  <input
                    type="text"
                    value={userFunction}
                    onChange={(e) => setUserFunction(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                    placeholder="e.g., Data Analyst, Project Manager, Software Developer"
                    maxLength={50}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-4">
                This information will be used in the output file names for identification
              </p>
            </div>
          </GlassContainer>
        )}

        {/* Start Button */}
        <div className="flex flex-col items-center space-y-4">
          <GlassButton
            onClick={handleStartClick}
            className={`px-8 py-4 rounded-2xl transition-all duration-200 ${
              showInputs && (!name.trim() || !userFunction.trim()) ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
            }`}
            disabled={showInputs && (!name.trim() || !userFunction.trim())}
            aria-label="Start live captioning with AI model"
          >
            <span className="font-semibold text-lg">
              {!showInputs ? "Start my Session" : "Continue to Video Source"}
            </span>
          </GlassButton>

          <p className="text-sm text-gray-400 opacity-80 text-center">
            {!showInputs ? "AI model will load when you click start" : "Please fill in both fields to continue"}
          </p>
        </div>
      </div>
    </div>
  );
}
