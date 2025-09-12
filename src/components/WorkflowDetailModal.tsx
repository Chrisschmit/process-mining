import React, { useRef } from 'react';
import { DESIGN_TOKENS } from '../constants';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite handles static asset imports
import salesVideoUrl from '../../backend/input/sales_video.webm';

interface WorkflowInsight {
  id: string;
  name: string;
  description: string;
  frequency: number;
  avgDuration: number;
  efficiency: number;
  systems: string[];
  category: 'data-entry' | 'communication' | 'analysis' | 'reporting' | 'other';
}

interface WorkflowDetailModalProps {
  open: boolean;
  onClose: () => void;
  workflow: WorkflowInsight | null;
  onSeek?: (seconds: number) => void;
  children?: React.ReactNode; // For the ReactFlow process visualization
}

// System color mapping from SalesOverviewModal
const SYSTEM_COLOR_MAP: Record<string, string> = {
  Gmail: DESIGN_TOKENS.colors.kpiInfo,
  LinkedIn: DESIGN_TOKENS.colors.kpiAccent,
  HubSpot: DESIGN_TOKENS.colors.kpiWarning,
  Excel: DESIGN_TOKENS.colors.success,
  Slack: DESIGN_TOKENS.colors.accentForeground,
  Notion: DESIGN_TOKENS.colors.kpiPrimary,
  Outlook: DESIGN_TOKENS.colors.kpiInfo,
  SAP: DESIGN_TOKENS.colors.kpiWarning,
  DocuSign: DESIGN_TOKENS.colors.kpiAccent,
  MSTeams: DESIGN_TOKENS.colors.kpiInfo,
};

// Donut Chart Component for Systems Usage
function SystemsDonutChart({ systems, getSystemUsagePercentage }: { 
  systems: string[]; 
  getSystemUsagePercentage: (system: string) => number; 
}) {
  const data = systems.map(system => ({
    name: system,
    percentage: getSystemUsagePercentage(system),
    color: SYSTEM_COLOR_MAP[system] || DESIGN_TOKENS.colors.kpiPrimary
  }));

  // Sort data by percentage in descending order
  data.sort((a, b) => b.percentage - a.percentage);

  const total = data.reduce((sum, item) => sum + item.percentage, 0);
  
  let cumulativePercentage = 0;
  const segments = data.map((item) => {
    const percentage = (item.percentage / total) * 100;
    const startAngle = (cumulativePercentage / 100) * 360 - 90; // Start from top
    const endAngle = ((cumulativePercentage + percentage) / 100) * 360 - 90;
    cumulativePercentage += percentage;

    const largeArc = percentage > 50 ? 1 : 0;
    const x1 = 50 + 35 * Math.cos((startAngle * Math.PI) / 180);
    const y1 = 50 + 35 * Math.sin((startAngle * Math.PI) / 180);
    const x2 = 50 + 35 * Math.cos((endAngle * Math.PI) / 180);
    const y2 = 50 + 35 * Math.sin((endAngle * Math.PI) / 180);

    const pathData = [
      "M", 50, 50,
      "L", x1, y1,
      "A", 35, 35, 0, largeArc, 1, x2, y2,
      "Z"
    ].join(" ");

    return {
      path: pathData,
      color: item.color,
      name: item.name,
      percentage: item.percentage
    };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <svg width="180" height="180" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="8"
          />
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.path}
              fill={segment.color}
              opacity="0.8"
            />
          ))}
          <circle
            cx="50"
            cy="50"
            r="20"
            fill="white"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`${DESIGN_TOKENS.typography.body} text-gray-500`}>Systems</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1">
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: item.color }}
              />
              <span className={`${DESIGN_TOKENS.typography.small} text-gray-700 flex-shrink-0`}>
                {item.name}
              </span>
              <span className={`${DESIGN_TOKENS.typography.small} text-gray-500 ml-2`}>
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// Insight Card for Process Discrepancy
function ProcessDiscrepancyCard({ workflow }: { workflow: WorkflowInsight }) {
  // Calculate variance percentage (mock data)
  const discrepancy = 45; // Static value for demonstration

  return (
    <div className={`${DESIGN_TOKENS.components.card} p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className={`${DESIGN_TOKENS.typography.h4} text-gray-900 mb-1`}>
            Process Variance
          </h4>
          <p className={`${DESIGN_TOKENS.typography.small} text-gray-600`}>
            {discrepancy}% deviations between team members
          </p>
        </div>
        <button 
          onClick={() => console.log('Visualize Diff clicked')}
          className={`${DESIGN_TOKENS.components.buttonSecondary} px-6 py-2`}
        >
          Visualize Diff
        </button>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <p className={`${DESIGN_TOKENS.typography.small} text-gray-600`}>
          <strong>Recommendation:</strong> {workflow.name === 'Inbound Sales Development' ? 
            'Standardize lead qualification checklist and provide additional training for data entry efficiency.' :
            'Review process documentation and provide training to align team performance.'
          }
        </p>
      </div>
    </div>
  );
}

export default function WorkflowDetailModal({ 
  open, 
  onClose, 
  workflow, 
  onSeek,
  children 
}: WorkflowDetailModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedSession, setSelectedSession] = React.useState('sarah-20250909');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  // Mock sessions data
  const sessions = [
    { id: 'sarah-20250909', name: 'Sarah Chen', date: '20250909', label: 'Sarah Chen-20250909' },
    { id: 'emily-20250910', name: 'Emily Watson', date: '20250910', label: 'Emily Watson-20250910' },
    { id: 'mike-20250908', name: 'Mike Rodriguez', date: '20250908', label: 'Mike Rodriguez-20250908' },
  ];

  const currentSession = sessions.find(s => s.id === selectedSession) || sessions[0];

  // Handle video seeking when nodes/edges are clicked
  const handleSeekVideo = (seconds: number) => {
    console.log('Seeking to:', seconds, 'seconds');
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = Math.max(0, seconds);
        void videoRef.current.play();
      } catch (error) {
        console.warn('Failed to seek video:', error);
      }
    }
    // Also call the external onSeek if provided
    if (onSeek) {
      onSeek(seconds);
    }
  };

  const getSystemUsagePercentage = (system: string) => {
    const usageMap: Record<string, number> = {
      'HubSpot': 43,
      'Gmail': 25,
      'LinkedIn': 12,
      'Slack': 8,
      'Notion': 2,
      'Outlook': 30,
      'SAP': 40,
      'Excel': 15,
      'DocuSign': 20,
      'MSTeams': 25
    };
    return usageMap[system] || Math.floor(Math.random() * 30) + 10;
  };

  if (!open || !workflow) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[96vw] h-[92vh] border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h3 className={`${DESIGN_TOKENS.typography.h2} text-gray-900 mb-2`}>{workflow.name}</h3>
            <p className={`${DESIGN_TOKENS.typography.body} text-gray-600`}>{workflow.description}</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => {
                console.log('Generate Product Spec clicked for workflow:', workflow.name);
              }}
              className={`${DESIGN_TOKENS.components.buttonPrimary} px-6 py-3`}
            >
              Generate Product Spec
            </button>
            <button 
              onClick={onClose} 
              className={`${DESIGN_TOKENS.components.buttonSecondary} px-6 py-3`}
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-[calc(92vh-140px)] overflow-y-auto">
          
          {/* Left Column: Process Flow */}
          <div className={`${DESIGN_TOKENS.components.card} p-6 h-full`}>
            <h4 className={`${DESIGN_TOKENS.typography.h4} text-gray-900 mb-4`}>Process Flow</h4>
            <div className="h-[calc(100%-2rem)] rounded-lg overflow-hidden">
              {children ? (
                // Clone children and pass our handleSeekVideo function
                React.cloneElement(children as React.ReactElement, { onSeek: handleSeekVideo })
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center h-full flex items-center justify-center">
                  <div>
                    <div className={`${DESIGN_TOKENS.typography.body} text-gray-600 mb-2`}>Process Map Visualization</div>
                    <div className={`${DESIGN_TOKENS.typography.small} text-gray-500`}>Interactive flowchart would be rendered here</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Video, Metrics & Insights */}
          <div className="space-y-6 h-full overflow-y-auto">
            
            {/* Video Preview */}
            <div className={`${DESIGN_TOKENS.components.card} p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`${DESIGN_TOKENS.typography.h4} text-gray-900`}>
                  Recording Preview
                </h4>
                
                {/* Session Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`${DESIGN_TOKENS.components.buttonSecondary} px-4 py-2 flex items-center gap-2`}
                  >
                    <span className={`${DESIGN_TOKENS.typography.small}`}>
                      {currentSession.label}
                    </span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      {sessions.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => {
                            setSelectedSession(session.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                            session.id === selectedSession ? 'bg-gray-50' : ''
                          } ${sessions[0].id === session.id ? 'rounded-t-lg' : ''} ${
                            sessions[sessions.length - 1].id === session.id ? 'rounded-b-lg' : ''
                          }`}
                        >
                          <div className={`${DESIGN_TOKENS.typography.small} text-gray-900`}>
                            {session.label}
                          </div>
                          <div className={`${DESIGN_TOKENS.typography.caption} text-gray-500 mt-1`}>
                            {session.name} • {session.date}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <video
                ref={videoRef}
                src={salesVideoUrl as unknown as string}
                controls
                className="w-full rounded-lg bg-black aspect-video"
              />
            </div>

            {/* Enhanced Key Metrics */}
            <div className={`${DESIGN_TOKENS.components.card} p-6`}>
              <h4 className={`${DESIGN_TOKENS.typography.h4} text-gray-900 mb-6`}>Key Metrics</h4>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className={`${DESIGN_TOKENS.typography.h3}`} style={{color: 'hsl(221 65% 35%)'}}>{workflow.avgDuration} min</div>
                  <div className={`${DESIGN_TOKENS.typography.small} text-gray-600`}>Avg Duration</div>
                </div>
                <div>
                  <div className={`${DESIGN_TOKENS.typography.h3}`} style={{color: 'hsl(221 65% 35%)'}}>{workflow.frequency}</div>
                  <div className={`${DESIGN_TOKENS.typography.small} text-gray-600`}>Total Occurrences</div>
                </div>
              </div>

              {/* Systems Donut Chart */}
              <div>
                <div className={`${DESIGN_TOKENS.typography.body} text-gray-600 mb-4`}>System Usage Breakdown</div>
                <SystemsDonutChart 
                  systems={workflow.systems}
                  getSystemUsagePercentage={getSystemUsagePercentage}
                />
              </div>
            </div>

            {/* Process Discrepancy Insight Card */}
            <ProcessDiscrepancyCard workflow={workflow} />
          </div>
        </div>
      </div>
    </div>
  );
}