import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DESIGN_TOKENS } from "../constants";

interface WelcomeScreenProps {
  onStart: (userInfo: { name: string; function: string }) => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [name, setName] = useState<string>("");
  const [userFunction, setUserFunction] = useState<string>("");
  const [showInputs, setShowInputs] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleAdminDashboard = () => {
    navigate('/admin-dashboard');
  };

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
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-6">
        {/* Main Title Card */}
        <div
          className={`${DESIGN_TOKENS.components.card} p-8 text-center hover:shadow-lg transition-all duration-300`}
          role="banner"
        >
          <div className="space-y-4">
            <h1 className={`${DESIGN_TOKENS.typography.display} text-gray-900`}>
              Showcase your expertise in everyday workflows
            </h1>
            <p className={`${DESIGN_TOKENS.typography.large} text-gray-600 leading-relaxed max-w-xl mx-auto`}>
              Work as you normally do. This tool helps you capture your know-how and spoken explanations, then turns them into a clear step-by-step summary.
            </p>
          </div>
        </div>

        {/* User Information Form */}
        {showInputs && (
          <div className={`${DESIGN_TOKENS.components.card} p-6`}>
            <div className="space-y-4">
              <h3 className={`${DESIGN_TOKENS.typography.h3} text-gray-900 text-center`}>
                Please provide your information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className={`block ${DESIGN_TOKENS.typography.body} text-gray-700 mb-1.5`}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${DESIGN_TOKENS.components.input} placeholder-gray-400`}
                    placeholder="Enter your full name"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className={`block ${DESIGN_TOKENS.typography.body} text-gray-700 mb-1.5`}>
                    Your Function/Role *
                  </label>
                  <input
                    type="text"
                    value={userFunction}
                    onChange={(e) => setUserFunction(e.target.value)}
                    className={`${DESIGN_TOKENS.components.input} placeholder-gray-400`}
                    placeholder="e.g., Data Analyst, Project Manager, Software Developer"
                    maxLength={50}
                  />
                </div>
              </div>
              <p className={`${DESIGN_TOKENS.typography.caption} text-gray-500 text-center mt-3`}>
                This information will be used in the output file names for identification
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col items-center space-y-3">
          <button
            onClick={handleStartClick}
            className={`${DESIGN_TOKENS.components.buttonPrimary} px-8 py-3 text-lg ${
              showInputs && (!name.trim() || !userFunction.trim()) 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:shadow-lg hover:-translate-y-0.5"
            } transition-all duration-200`}
            disabled={showInputs && (!name.trim() || !userFunction.trim())}
            aria-label="Start live captioning with AI model"
          >
            {!showInputs ? "Start my Session" : "Continue to Video Source"}
          </button>

          <p className={`${DESIGN_TOKENS.typography.small} text-gray-500 text-center`}>
            {!showInputs ? "AI model will load when you click start" : "Please fill in both fields to continue"}
          </p>
          
          <button
            onClick={handleAdminDashboard}
            className={`${DESIGN_TOKENS.components.buttonSecondary} px-8 py-3 text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 mt-2`}
            aria-label="View Mining Output Admin Dashboard"
          >
            View Mining Output
          </button>
        </div>
      </div>
    </div>
  );
}
