import { useNavigate } from "react-router-dom";
import { DESIGN_TOKENS } from "../constants";

interface WelcomeScreenProps {
  onStart: (userInfo: { name: string; function: string }) => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const navigate = useNavigate();

  const handleAdminDashboard = () => {
    navigate('/admin-dashboard');
  };

  const handleStartClick = () => {
    // Pre-filled user information since they were invited by admin
    onStart({ name: 'Christophe', function: 'Sales Associate' });
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
              Hi Christophe!
            </h1>
            <p className={`${DESIGN_TOKENS.typography.large} text-gray-600 leading-relaxed max-w-xl mx-auto`}>
              You were invited by <strong>Felix</strong> to showcase the <strong>Lead Generation Process</strong>. This will be used to enhance and improve the processes of our sales department.
            </p>
            <p className={`${DESIGN_TOKENS.typography.body} text-gray-500 leading-relaxed max-w-lg mx-auto mt-3`}>
              Work as you normally do. This tool will capture your know-how, then turn them into a clear step-by-step summary.
            </p>
          </div>
        </div>


        {/* Action Buttons */}
        <div className="flex flex-col items-center space-y-3">
          <button
            onClick={handleStartClick}
            className={`${DESIGN_TOKENS.components.buttonPrimary} px-8 py-3 text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
            aria-label="Start live captioning with AI model"
          >
            Start my Session
          </button>

          
          <button
            onClick={handleAdminDashboard}
            className={`${DESIGN_TOKENS.components.buttonSecondary} px-8 py-3 text-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 mt-2`}
            aria-label="View Mining Output Admin Dashboard"
          >
            View Mining Results
          </button>
        </div>
      </div>
    </div>
  );
}
