/**
 * Admin Dashboard for Process Mining - Main Component
 * Provides comprehensive overview of all analysis and recordings across departments
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DESIGN_TOKENS } from '../constants';
import ReactFlow, { MiniMap, Controls, Background, useReactFlow, Panel, BackgroundVariant, MarkerType, Handle, Position, type ReactFlowInstance } from 'reactflow';
import 'reactflow/dist/style.css';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite raw import returns a string
import leadQualificationJsonRaw from '../../output/session_20250909_152907_87683105/process_map_f3e0945d-1725-487a-9404-6db921a60d38_20250909_155959.json?raw';
import SalesOverviewModal from './SalesOverviewModal';
import WorkflowDiffModal from './WorkflowDiffModal';
import WorkflowDetailModal from './WorkflowDetailModal';

interface Project {
  id: string;
  name: string;
  department: string;
  participantCount: number;
  completedCount: number;
  totalMinutesAnalyzed: number;
  createdDate: string;
  status: 'active' | 'completed' | 'draft';
}

interface Participant {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'completed' | 'pending' | 'in-progress' | 'not-started';
  recordingDuration?: number;
  completionDate?: string;
  assignedDate: string;
}

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

// TypeScript interfaces for React Flow data structures
interface NodeData {
  label: string;
  description?: string;
  tool?: string;
  timestamp_ms?: number;
}

interface ProcessNode {
  id: string;
  position: { x: number; y: number };
  type?: string;
  data: NodeData;
  timestamp_ms?: number;
}

interface ProcessEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  markerEnd?: any;
  type?: string;
  style?: any;
  labelStyle?: any;
}


export default function AdminDashboard() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInsight | null>(null);
  const [viewLevel, setViewLevel] = useState<'overview' | 'workflow' | 'raw-data'>('overview');
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState<boolean>(false);
  const [isSalesOverviewOpen, setIsSalesOverviewOpen] = useState<boolean>(false);
  const [isWorkflowDiffOpen, setIsWorkflowDiffOpen] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleSeekVideo = (seconds: number) => {
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = Math.max(0, seconds);
        // Optional: autoplay on seek for quick feedback
        void videoRef.current.play();
      } catch (error) {
        console.warn('Failed to seek video:', error);
      }
    }
  };

  console.log('AdminDashboard render - selectedProject:', selectedProject);
  console.log('AdminDashboard render - viewLevel:', viewLevel);

  // Mock data - in production this would come from API
  const mockProjects: Project[] = useMemo(() => [
    {
      id: 'proj-001', 
      name: 'Sales Processes',
      department: 'Sales Department',
      participantCount: 3,
      completedCount: 3,
      totalMinutesAnalyzed: 29,
      createdDate: '2024-01-10',
      status: 'active'
    },
    {
      id: 'proj-002',
      name: 'Accounting Processes',
      department: 'Accounting Department',
      participantCount: 8,
      completedCount: 6,
      totalMinutesAnalyzed: 1247,
      createdDate: '2024-01-15',
      status: 'active'
    }
    
  ], []);

  const mockWorkflowInsights: WorkflowInsight[] = useMemo(() => [
    {
      id: 'wf-001',
      name: 'Inbound Sales Development',
      description: 'Lead intake, enrichment, CRM updates, and follow-ups across Gmail, LinkedIn, HubSpot, Slack, and Notion',
      frequency: 14,
      avgDuration: 8,
      efficiency: 0.85,
      systems: ['Gmail', 'LinkedIn', 'HubSpot', 'Slack', 'Notion'],
      category: 'communication'
    },
    {
      id: 'wf-002',
      name: 'Client Follow-up',
      description: 'Automated data entry from email attachments to ERP system',
      frequency: 26,
      avgDuration: 4,
      efficiency: 0.72,
      systems: ['Outlook', 'SAP', 'Excel'],
      category: 'data-entry'
    },
    {
      id: 'wf-003',
      name: 'Invoice Processing',
      description: 'Automated data entry from email attachments to ERP system',
      frequency: 18,
      avgDuration: 3,
      efficiency: 0.72,
      systems: ['Outlook', 'SAP', 'Excel'],
      category: 'data-entry'
    },
    {
      id: 'wf-004',
      name: 'New Client Onboarding', 
      description: 'Complete workflow from initial contact to account activation',
      frequency: 5,
      avgDuration: 32,
      efficiency: 0.85,
      systems: ['Hubspot', 'DocuSign', 'MSTeams'],
      category: 'communication'
    }
  ], []);

  const mockParticipants: Participant[] = useMemo(() => [
    {
      id: 'part-001',
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
      department: 'Sales',
      status: 'completed',
      recordingDuration: 156,
      completionDate: '2024-01-28',
      assignedDate: '2024-01-20'
    },
    {
      id: 'part-002',
      name: 'Mike Rodriguez',
      email: 'mike.rodriguez@company.com', 
      department: 'Sales',
      status: 'completed',
      assignedDate: '2024-01-22'
    }, {
      id: 'part-003',
      name: 'Emily Watson',
      email: 'emily.watson@company.com', 
      department: 'Sales',
      status: 'completed',
      assignedDate: '2024-01-22'
    }
  ], []);

  // Build team-level comparative data (workflows + systems) using participant names
  const salesEmployeesData = useMemo(() => {
    // totals (minutes) per person — use provided recordingDuration if available
    const totals: Record<string, number> = {
      'Sarah Chen': mockParticipants.find(p => p.name === 'Sarah Chen')?.recordingDuration || 29,
      'Mike Rodriguez': 120,
      'Emily Watson': 90,
    };

    // workflow breakdowns (minutes)
    const workflows: Record<string, Record<string, number>> = {
      'Sarah Chen': {
        'Inbound Sales Development': Math.round(totals['Sarah Chen'] * 0.65),
        'Client Follow-up': Math.round(totals['Sarah Chen'] * 0.18),
        'Invoice Processing': Math.round(totals['Sarah Chen'] * 0.12),
        'New Client Onboarding': Math.round(totals['Sarah Chen'] * 0.05),
      },
      'Mike Rodriguez': {
        'Inbound Sales Development': Math.round(totals['Mike Rodriguez'] * 0.42),
        'Client Follow-up': Math.round(totals['Mike Rodriguez'] * 0.34),
        'Invoice Processing': Math.round(totals['Mike Rodriguez'] * 0.18),
        'New Client Onboarding': Math.round(totals['Mike Rodriguez'] * 0.06),
      },
      'Emily Watson': {
        'Inbound Sales Development': Math.round(totals['Emily Watson'] * 0.30),
        'Client Follow-up': Math.round(totals['Emily Watson'] * 0.40),
        'Invoice Processing': Math.round(totals['Emily Watson'] * 0.20),
        'New Client Onboarding': Math.round(totals['Emily Watson'] * 0.10),
      },
    };

    // system breakdowns (minutes)
    const systems: Record<string, Record<string, number>> = {
      'Sarah Chen': {
        'Gmail': Math.round(totals['Sarah Chen'] * 0.28),
        'LinkedIn': Math.round(totals['Sarah Chen'] * 0.12),
        'HubSpot': Math.round(totals['Sarah Chen'] * 0.35),
        'Slack': Math.round(totals['Sarah Chen'] * 0.08),
        'Excel': Math.round(totals['Sarah Chen'] * 0.17), // moved Notion share into Excel
      },
      'Mike Rodriguez': {
        'Gmail': Math.round(totals['Mike Rodriguez'] * 0.22),
        'LinkedIn': Math.round(totals['Mike Rodriguez'] * 0.18),
        'HubSpot': Math.round(totals['Mike Rodriguez'] * 0.30),
        'Slack': Math.round(totals['Mike Rodriguez'] * 0.12),
        'Excel': Math.round(totals['Mike Rodriguez'] * 0.18),
      },
      'Emily Watson': {
        'Gmail': Math.round(totals['Emily Watson'] * 0.26), // replaced Outlook
        'LinkedIn': Math.round(totals['Emily Watson'] * 0.14),
        'HubSpot': Math.round(totals['Emily Watson'] * 0.28),
        'Slack': Math.round(totals['Emily Watson'] * 0.12),
        'Excel': Math.round(totals['Emily Watson'] * 0.20),
      },
    };

    return ['Sarah Chen', 'Mike Rodriguez', 'Emily Watson'].map((name) => ({
      name,
      workflows: workflows[name],
      systems: systems[name],
    }));
  }, [mockParticipants]);

  // Auto-select first project on mount
  useEffect(() => {
    if (!selectedProject && mockProjects.length > 0) {
      setSelectedProject(mockProjects[0]);
    }
  }, [selectedProject, mockProjects]);

  // Calculate KPIs for selected project
  const projectKPIs = useMemo(() => {
    if (!selectedProject) return null;

    const topApplications = [
      { name: 'Hubspot', percentage: 45 },
      { name: 'Outlook', percentage: 28 },
      { name: 'Excel', percentage: 22 }
    ];

    return {
      completionRate: `${selectedProject.completedCount}/${selectedProject.participantCount}`,
      completionPercentage: Math.round((selectedProject.completedCount / selectedProject.participantCount) * 100),
      totalAnalyzed: selectedProject.totalMinutesAnalyzed,
      topApplications
    };
  }, [selectedProject]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border border-green-200' + ' ' + 'text-[hsl(142_65%_30%)]';
      case 'in-progress': return 'text-gray-600 bg-gray-50 border border-gray-200';
      case 'not-started': return 'text-gray-600 bg-gray-50 border border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border border-gray-200';
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
    return usageMap[system] || 0;
  };


  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 flex">
      {/* Left Sidebar - Project & Participant Navigation */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className={`${DESIGN_TOKENS.typography.h3} text-gray-900`}>Admin Dashboard</h1>
            
          </div>
          <p className={`${DESIGN_TOKENS.typography.small} text-gray-600`}>Process Mining Overview</p>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h2 className={`${DESIGN_TOKENS.typography.h4} text-gray-900 mb-4`}>Projects</h2>
            <div className="space-y-2">
              {mockProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`${DESIGN_TOKENS.components.card} p-4 cursor-pointer transition-all ${
                    selectedProject?.id === project.id
                      ? 'ring-2 ring-gray-900 bg-gray-100'
                      : 'hover:shadow-md hover:bg-gray-50'
                  }`}
                >
                  <div className={`${DESIGN_TOKENS.typography.body} text-gray-900 mb-1`}>{project.name}</div>
                  <div className={`${DESIGN_TOKENS.typography.small} text-gray-600`}>{project.department}</div>
                  {/* <div className={`${DESIGN_TOKENS.typography.caption} text-gray-500 mt-2 flex justify-between`}>
                    <span>{project.completedCount}/{project.participantCount} complete</span>
                    <span className={`px-2 py-1 rounded-full ${
                      project.status === 'completed' ? 'bg-green-100 text-green-700' :
                      project.status === 'active' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {project.status}
                    </span>
                  </div> */}
                </div>
              ))}
            </div>
          </div>

          {/* Participants List */}
          {selectedProject && (
            <div className="p-4 border-t border-gray-200">
              <h3 className={`${DESIGN_TOKENS.typography.h4} text-gray-900 mb-3`}>Participants</h3>
              <div className="space-y-2">
                {mockParticipants.map((participant) => (
                  <div key={participant.id} className={`${DESIGN_TOKENS.components.card} p-3`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`${DESIGN_TOKENS.typography.body} text-gray-900`}>{participant.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(participant.status)}`}>
                        {participant.status}
                      </span>
                    </div>
                    <div className={`${DESIGN_TOKENS.typography.caption} text-gray-600`}>{participant.email}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {!selectedProject ? (
          /* Welcome State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="text-6xl mb-4">📊</div>
              <h2 className={`${DESIGN_TOKENS.typography.h2} text-gray-900 mb-2`}>Select a Project</h2>
              <p className={`${DESIGN_TOKENS.typography.body} text-gray-600`}>Choose a project from the sidebar to view detailed analytics and insights.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Fixed Department Overview Header */}
            <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
              <h3 className={`${DESIGN_TOKENS.typography.h3} text-gray-900 mb-4`}>Sales Department Overview</h3>
              <div className={`${DESIGN_TOKENS.components.card} p-6`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`${DESIGN_TOKENS.typography.h4} text-gray-900 mb-2`}>Review your team's process discovery</h4>
                    <p className={`${DESIGN_TOKENS.typography.body} text-gray-700 mb-4 leading-relaxed`}>
                      Last 7 days: we processed <strong>10 hours</strong> across <strong>3 Sales team members</strong>.
                      AI identified <strong>4 core workflows</strong> covering <strong>~80% of activity time</strong>.
                      
                    </p>
                    <div className="flex gap-3 items-center">
                      <button
                        onClick={() => setIsSalesOverviewOpen(true)}
                        className={`${DESIGN_TOKENS.components.buttonPrimary} px-6 py-3`}
                      >
                        Team Overview
                      </button>
                      <button 
                        onClick={() => setIsWorkflowDiffOpen(true)} 
                        className={`${DESIGN_TOKENS.components.buttonSecondary} ml-3 px-6 py-3`}
                      >
                        Compare workflows
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area - Workflow Insights */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {/* Main Content - Workflow Insights */}
              <div className="p-6">
                {viewLevel === 'overview' && (
                  <div>
                    <div className="mb-6">
                      <h3 className={`${DESIGN_TOKENS.typography.h3} text-gray-900 mb-2`}>Workflow Insights</h3>
                      <p className={`${DESIGN_TOKENS.typography.body} text-gray-600`}>AI-identified processes and patterns from video analysis</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {mockWorkflowInsights.map((workflow) => (
                        <div
                          key={workflow.id}
                          onClick={() => {
                            setSelectedWorkflow(workflow);
                            setIsWorkflowModalOpen(true);
                          }}
                          className={`${DESIGN_TOKENS.components.card} p-6 cursor-pointer hover:shadow-lg transition-all duration-200`}
                        >
                          <h4 className={`${DESIGN_TOKENS.typography.h4} text-gray-900 mb-2`}>{workflow.name}</h4>
                          <p className={`${DESIGN_TOKENS.typography.small} text-gray-600 mb-4 h-12 leading-4 overflow-hidden`}>{workflow.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className={`${DESIGN_TOKENS.typography.h4}`} style={{color: 'hsl(221 65% 35%)'}}>{workflow.frequency}</div>
                              <div className={`${DESIGN_TOKENS.typography.caption} text-gray-500`}>Occurrences</div>
                            </div>
                            <div>
                              <div className={`${DESIGN_TOKENS.typography.h4}`} style={{color: 'hsl(221 65% 35%)'}}>{workflow.avgDuration} min</div>
                              <div className={`${DESIGN_TOKENS.typography.caption} text-gray-500`}>Avg Duration</div>
                            </div>
                          </div>


                          <div className="flex flex-wrap gap-1">
                            {workflow.systems.slice(0, 3).map((system) => (
                              <span key={system} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                {system}
                              </span>
                            ))}
                            {workflow.systems.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                +{workflow.systems.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {viewLevel === 'workflow' && selectedWorkflow && (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`${DESIGN_TOKENS.typography.h3} text-gray-900 mb-2`}>{selectedWorkflow.name}</h3>
                          <p className={`${DESIGN_TOKENS.typography.body} text-gray-600`}>{selectedWorkflow.description}</p>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => setViewLevel('raw-data')}
                            className={`${DESIGN_TOKENS.components.buttonSecondary}`}
                          >
                            View Raw Data
                          </button>
                          <button
                            onClick={() => setViewLevel('overview')}
                            className={`${DESIGN_TOKENS.components.buttonPrimary}`}
                          >
                            Back to Overview
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Process Map Visualization */}
                      <div className={`${DESIGN_TOKENS.components.card} p-6`}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className={`${DESIGN_TOKENS.typography.h4} text-gray-900`}>Process Flow</h4>
                          {selectedWorkflow.name === 'Inbound Sales Development' && (
                            <ExpandProcessMapButton />
                          )}
                        </div>
                        {selectedWorkflow.name === 'Inbound Sales Development' ? (
                          <div className="rounded-lg overflow-hidden" style={{ height: 520 }}>
                            <ReactFlowDraft />
                          </div>
                        ) : (
                          <div className="bg-gray-100 rounded-lg p-8 text-center">
                            <div className={`${DESIGN_TOKENS.typography.body} text-gray-600 mb-2`}>Process Map Visualization</div>
                            <div className={`${DESIGN_TOKENS.typography.small} text-gray-500`}>Interactive flowchart would be rendered here</div>
                            <div className={`${DESIGN_TOKENS.typography.caption} text-gray-400 mt-2`}>Showing: {selectedWorkflow.systems.join(' → ')}</div>
                          </div>
                        )}
                      </div>

                      {/* Key Metrics */}
                      <div className={`${DESIGN_TOKENS.components.card} p-6`}>
                        <h4 className={`${DESIGN_TOKENS.typography.h4} text-gray-900 mb-4`}>Key Metrics</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className={`${DESIGN_TOKENS.typography.body} text-gray-600`}>Average Completion Time</span>
                            <span className={`${DESIGN_TOKENS.typography.body} text-gray-900 font-medium`}>{selectedWorkflow.avgDuration} minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className={`${DESIGN_TOKENS.typography.body} text-gray-600`}>Total Occurrences</span>
                            <span className={`${DESIGN_TOKENS.typography.body} text-gray-900 font-medium`}>{selectedWorkflow.frequency}</span>
                          </div>
                          <div>
                            <div className={`${DESIGN_TOKENS.typography.body} text-gray-600 mb-2`}>Most Common Systems</div>
                            <div className="space-y-1">
                              {selectedWorkflow.systems.map((system, index) => (
                                <div key={system} className="flex justify-between">
                                  <span className={`${DESIGN_TOKENS.typography.small} text-gray-700`}>{index + 1}. {system}</span>
                                  <span className={`${DESIGN_TOKENS.typography.small} text-gray-500`}>
                                    {getSystemUsagePercentage(system)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {viewLevel === 'raw-data' && (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center justify-between">
                        <h3 className={`${DESIGN_TOKENS.typography.h3} text-gray-900 mb-2`}>Raw Data Analysis</h3>
                        <button
                          onClick={() => setViewLevel('workflow')}
                          className={`${DESIGN_TOKENS.components.buttonPrimary}`}
                        >
                          Back to Workflow
                        </button>
                      </div>
                      <p className={`${DESIGN_TOKENS.typography.body} text-gray-600`}>Detailed event data for validation and deep analysis</p>
                    </div>

                    <div className={`${DESIGN_TOKENS.components.card} overflow-hidden`}>
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h4 className={`${DESIGN_TOKENS.typography.h4} text-gray-900`}>Event Timeline</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className={`px-6 py-3 text-left ${DESIGN_TOKENS.typography.caption} text-gray-600 uppercase tracking-wider font-medium`}>Timestamp</th>
                              <th className={`px-6 py-3 text-left ${DESIGN_TOKENS.typography.caption} text-gray-600 uppercase tracking-wider font-medium`}>Application/System</th>
                              <th className={`px-6 py-3 text-left ${DESIGN_TOKENS.typography.caption} text-gray-600 uppercase tracking-wider font-medium`}>Action</th>
                              <th className={`px-6 py-3 text-left ${DESIGN_TOKENS.typography.caption} text-gray-600 uppercase tracking-wider font-medium`}>Participant</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {/* Mock data - would come from API */}
                            <tr>
                              <td className={`px-6 py-4 whitespace-nowrap ${DESIGN_TOKENS.typography.small} text-gray-900`}>14:32:15</td>
                              <td className={`px-6 py-4 whitespace-nowrap ${DESIGN_TOKENS.typography.small} text-gray-900`}>Outlook</td>
                              <td className={`px-6 py-4 whitespace-nowrap ${DESIGN_TOKENS.typography.small} text-gray-900`}>Opened email attachment</td>
                              <td className={`px-6 py-4 whitespace-nowrap ${DESIGN_TOKENS.typography.small} text-gray-900`}>Sarah Chen</td>
                            </tr>
                            <tr>
                              <td className={`px-6 py-4 whitespace-nowrap ${DESIGN_TOKENS.typography.small} text-gray-900`}>14:32:47</td>
                              <td className={`px-6 py-4 whitespace-nowrap ${DESIGN_TOKENS.typography.small} text-gray-900`}>SAP</td>
                              <td className={`px-6 py-4 whitespace-nowrap ${DESIGN_TOKENS.typography.small} text-gray-900`}>Navigated to invoice entry form</td>
                              <td className={`px-6 py-4 whitespace-nowrap ${DESIGN_TOKENS.typography.small} text-gray-900`}>Sarah Chen</td>
                            </tr>
                            <tr>
                              <td className={`px-6 py-4 whitespace-nowrap ${DESIGN_TOKENS.typography.small} text-gray-900`}>14:33:12</td>
                              <td className={`px-6 py-4 whitespace-nowrap ${DESIGN_TOKENS.typography.small} text-gray-900`}>SAP</td>
                              <td className={`px-6 py-4 whitespace-nowrap ${DESIGN_TOKENS.typography.small} text-gray-900`}>Entered vendor information</td>
                              <td className={`px-6 py-4 whitespace-nowrap ${DESIGN_TOKENS.typography.small} text-gray-900`}>Sarah Chen</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <WorkflowDetailModal
              open={isWorkflowModalOpen}
              onClose={() => setIsWorkflowModalOpen(false)}
              workflow={selectedWorkflow}
              onSeek={handleSeekVideo}
            >
              {selectedWorkflow?.name === 'Inbound Sales Development' ? (
                <ReactFlowDraft onSeek={handleSeekVideo} />
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center h-full flex items-center justify-center">
                  <div>
                    <div className={`${DESIGN_TOKENS.typography.body} text-gray-600 mb-2`}>Process Map Visualization</div>
                    <div className={`${DESIGN_TOKENS.typography.small} text-gray-500`}>Interactive flowchart would be rendered here</div>
                    <div className={`${DESIGN_TOKENS.typography.caption} text-gray-400 mt-2`}>Showing: {selectedWorkflow?.systems.join(' → ')}</div>
                  </div>
                </div>
              )}
            </WorkflowDetailModal>
          </>
        )}
      </div>
      {isSalesOverviewOpen && (
        <SalesOverviewModal
          open={isSalesOverviewOpen}
          onClose={() => setIsSalesOverviewOpen(false)}
          employees={salesEmployeesData}
          summaryHours={29}
          coreWorkflows={4}
        />
      )}
      
      <WorkflowDiffModal 
        open={isWorkflowDiffOpen} 
        onClose={() => setIsWorkflowDiffOpen(false)} 
      />
    </div>
  );
}

// Inline helper components
// Removed old iframe-based embed

function ExpandProcessMapButton() {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${DESIGN_TOKENS.components.buttonSecondary} text-sm`}
      >
        Expand
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-[92vw] h-[86vh] border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <div className={`${DESIGN_TOKENS.typography.small} text-gray-700`}>Inbound Sales Development — Process Map</div>
              <button
                onClick={() => setOpen(false)}
                className={`${DESIGN_TOKENS.components.buttonSecondary} text-sm`}
              >
                Close
              </button>
            </div>
            <div className="w-full h-[calc(86vh-44px)]">
              <div className="h-full">
                <ReactFlowDraft />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Simple switcher to try a React Flow-based rendering (draft)
// Removed embed/selector – ReactFlow is the single renderer now

// Draft React Flow renderer – loads the same JSON and renders nodes/edges; zoom and pan are built-in
function ReactFlowDraft({ onSeek }: { onSeek?: (seconds: number) => void }) {
  const data = useMemo(() => {
    try {
      return JSON.parse(leadQualificationJsonRaw as unknown as string);
    } catch {
      return null;
    }
  }, []);

  // Custom node for collapsible details
  const NodeCard = ({ data }: { data: NodeData }) => {
    const [collapsed, setCollapsed] = useState<boolean>(true);
    return (
      <div style={{ width: 240 }} className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <Handle type="target" position={Position.Top} style={{ background: '#64748b', width: 8, height: 8 }} />
        <div className="flex items-start justify-between p-2 cursor-pointer" onClick={() => setCollapsed((v) => !v)}>
          <div className="font-medium text-gray-900 text-sm pr-2">{data.label}</div>
          {data.tool && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {data.tool}
            </span>
          )}
        </div>
        {!collapsed && (
          <div className="px-2 pb-2 text-[12px] text-gray-700 leading-snug">
            {data.description || 'No description'}
          </div>
        )}
        <Handle type="source" position={Position.Bottom} style={{ background: '#64748b', width: 8, height: 8 }} />
      </div>
    );
  };

  const nodeTypes = useMemo(() => ({ card: NodeCard }), []);

  // Build nodes/edges from JSON
  const baseNodes = useMemo(() => {
    if (!data?.nodes) return [] as ProcessNode[];
    return data.nodes.map((n: ProcessNode) => ({
      id: n.id,
      type: 'card',
      position: { x: n.position.x, y: n.position.y },
      data: {
        label: n.data?.label || n.id,
        description: n.data?.description,
        tool: n.data?.tool,
        timestamp_ms: n.timestamp_ms,
      },
    }));
  }, [data]);

  const baseEdges = useMemo(() => {
    if (!data?.edges) return [] as ProcessEdge[];
    return data.edges.map((e: ProcessEdge) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.animated !== false,
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
      type: 'smoothstep' as const,
      style: { stroke: '#64748b' },
      label: e.label || '',
      labelStyle: { fill: '#374151', fontSize: 11, fontWeight: 500, backgroundColor: 'rgba(255,255,255,0.85)' },
    }));
  }, [data]);

  // Dagre auto-layout (optional)
  const layouted = useMemo(() => {
    let dagre: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      dagre = require('dagre');
    } catch {
      return { nodes: baseNodes, edges: baseEdges };
    }

    const g = new dagre.graphlib.Graph();
    // Use top-to-bottom layout and tighten spacing significantly
    g.setGraph({ rankdir: 'TB', nodesep: 12, ranksep: 28, marginx: 6, marginy: 6 });
    g.setDefaultEdgeLabel(() => ({}));

    baseNodes.forEach((n: ProcessNode) => g.setNode(n.id, { width: 240, height: 56 }));
    baseEdges.forEach((e: ProcessEdge) => g.setEdge(e.source, e.target));
    dagre.layout(g);

    const nodes = baseNodes.map((n: ProcessNode) => {
      const pos = g.node(n.id);
      return { ...n, position: { x: pos.x - 120, y: pos.y - 40 } };
    });
    return { nodes, edges: baseEdges };
  }, [baseNodes, baseEdges]);

  const [nodes] = useState<ProcessNode[]>(layouted.nodes);
  const [edges] = useState<ProcessEdge[]>(layouted.edges);
  const instanceRef = useRef<ReactFlowInstance | null>(null);
  const nodeById = useMemo(() => {
    const map: Record<string, any> = {};
    nodes.forEach((n: ProcessNode) => { map[n.id] = n; });
    return map;
  }, [nodes]);

  // Fit helpers
  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.85 }), []);
  const FitButton = () => {
    const { setViewport, fitView, getViewport } = useReactFlow();
    const handleReset = () => {
      if (!nodes || nodes.length === 0) return;
      // First center horizontally using fitView
      fitView({ padding: 0.15 });
      // Then anchor to the top with extra padding and slight zoom-in
      const vp = getViewport();
      const minY = Math.min(...nodes.map((n: ProcessNode) => n.position.y));
      const topPadding = 48; // extra space above the first node
      const targetZoom = Math.min(1.25, Math.max(0.6, vp.zoom * 1.1));
      setViewport({ x: vp.x, y: -minY + topPadding, zoom: targetZoom });
    };
    return (
      <Panel position="top-right">
        <button
          onClick={handleReset}
          className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50"
        >
          Reset view
        </button>
      </Panel>
    );
  };

  // Helper to snap viewport to the top-left of the flow
  function TopLeftViewport({ nodes: viewNodes }: { nodes: ProcessNode[] }) {
    const { setViewport, fitView, getViewport } = useReactFlow();
    React.useEffect(() => {
      if (!viewNodes || viewNodes.length === 0) return;
      // First center horizontally
      fitView({ padding: 0.15 });
      const vp = getViewport();
      const minY = Math.min(...viewNodes.map((n: ProcessNode) => n.position.y));
      const topPadding = 48;
      const targetZoom = Math.min(1.25, Math.max(0.6, vp.zoom * 1.1));
      setViewport({ x: vp.x, y: -minY + topPadding, zoom: targetZoom });
    }, [viewNodes, setViewport]);
    return null;
  }

  // Re-apply top-anchored centering when RF initializes and when nodes become available
  const applyTopAnchorCentered = React.useCallback(() => {
    const inst = instanceRef.current;
    if (!inst || !nodes || nodes.length === 0) return;
    inst.fitView({ padding: 0.15 });
    const vp = inst.getViewport();
    const minY = Math.min(...nodes.map((n: ProcessNode) => n.position.y));
    const topPadding = 48;
    const targetZoom = Math.min(1.25, Math.max(0.6, vp.zoom * 1.1));
    inst.setViewport({ x: vp.x, y: -minY + topPadding, zoom: targetZoom });
  }, [nodes]);

  React.useEffect(() => {
    // slight delay to ensure modal sizing has settled
    const id = setTimeout(applyTopAnchorCentered, 50);
    return () => clearTimeout(id);
  }, [applyTopAnchorCentered]);

  return (
    <div className="relative h-full" style={{ backgroundColor: '#f8fafc' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        defaultViewport={defaultViewport}
        fitViewOptions={{ padding: 0 }}
        defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 }, style: { stroke: '#64748b' } }}
        onInit={(inst) => {
          instanceRef.current = inst;
          // run twice to catch container size adjustments
          requestAnimationFrame(applyTopAnchorCentered);
          setTimeout(applyTopAnchorCentered, 80);
        }}
        onNodeClick={(_, n) => {
          // If the node has a timestamp, seek video. Fallback: try to read attached timestamp_ms
          const seconds = (n as any).data?.timestamp_ms ? ((n as any).data.timestamp_ms / 1000) : undefined;
          if (seconds != null && onSeek) onSeek(seconds);
        }}
        onEdgeClick={(_, e) => {
          const src = nodeById[e.source as string];
          const tgt = nodeById[e.target as string];
          const sMs = src?.data?.timestamp_ms;
          const tMs = tgt?.data?.timestamp_ms;
          let seconds: number | undefined;
          if (sMs != null && tMs != null) {
            seconds = (sMs + tMs) / 2000; // midpoint between steps
          } else if (sMs != null) {
            seconds = sMs / 1000;
          } else if (tMs != null) {
            seconds = tMs / 1000;
          }
          if (seconds != null && onSeek) onSeek(seconds);
        }}
      >
        <TopLeftViewport nodes={nodes} />
        <FitButton />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#94a3b8" />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
}

