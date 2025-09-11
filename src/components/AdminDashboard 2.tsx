/**
 * Admin Dashboard for Process Mining - Main Component
 * Provides comprehensive overview of all analysis and recordings across departments
 */

import React, { useState, useEffect, useMemo } from 'react';

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

interface AdminDashboardProps {
  onBack?: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowInsight | null>(null);
  const [viewLevel, setViewLevel] = useState<'overview' | 'workflow' | 'raw-data'>('overview');

  console.log('AdminDashboard render - selectedProject:', selectedProject);
  console.log('AdminDashboard render - viewLevel:', viewLevel);

  // Mock data - in production this would come from API
  const mockProjects: Project[] = useMemo(() => [
    {
      id: 'proj-001',
      name: 'Accounting Department Analysis',
      department: 'Accounting',
      participantCount: 8,
      completedCount: 6,
      totalMinutesAnalyzed: 1247,
      createdDate: '2024-01-15',
      status: 'active'
    },
    {
      id: 'proj-002', 
      name: 'Sales Process Optimization',
      department: 'Sales',
      participantCount: 2,
      completedCount: 1,
      totalMinutesAnalyzed: 2156,
      createdDate: '2024-01-10',
      status: 'active'
    },
    {
      id: 'proj-003',
      name: 'HR Onboarding Review',
      department: 'Human Resources',
      participantCount: 5,
      completedCount: 5,
      totalMinutesAnalyzed: 892,
      createdDate: '2024-01-05',
      status: 'completed'
    }
  ], []);

  const mockWorkflowInsights: WorkflowInsight[] = useMemo(() => [
    {
      id: 'wf-001',
      name: 'Invoice Processing',
      description: 'Automated data entry from email attachments to ERP system',
      frequency: 12,
      avgDuration: 3.2,
      efficiency: 0.72,
      systems: ['Outlook', 'SAP', 'Excel'],
      category: 'data-entry'
    },
    {
      id: 'wf-002',
      name: 'New Client Onboarding', 
      description: 'Complete workflow from initial contact to account activation',
      frequency: 8,
      avgDuration: 12.5,
      efficiency: 0.85,
      systems: ['Salesforce', 'DocuSign', 'Slack'],
      category: 'communication'
    },
    {
      id: 'wf-003',
      name: 'CRM Data Entry & Cleanup',
      description: 'Standardized updates and data quality improvements in Salesforce',
      frequency: 203,
      avgDuration: 2.1,
      efficiency: 0.68,
      systems: ['Salesforce', 'Excel', 'Chrome'],
      category: 'data-entry'
    }
  ], []);

  const mockParticipants: Participant[] = useMemo(() => [
    {
      id: 'part-001',
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
      department: 'Accounting',
      status: 'completed',
      recordingDuration: 156,
      completionDate: '2024-01-28',
      assignedDate: '2024-01-20'
    },
    {
      id: 'part-002',
      name: 'Mike Rodriguez',
      email: 'mike.rodriguez@company.com', 
      department: 'Accounting',
      status: 'in-progress',
      assignedDate: '2024-01-22'
    },
    {
      id: 'part-003',
      name: 'Emily Watson',
      email: 'emily.watson@company.com',
      department: 'Accounting', 
      status: 'pending',
      assignedDate: '2024-01-25'
    }
  ], []);

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
      { name: 'Salesforce', percentage: 45 },
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
      case 'completed': return 'text-green-400 bg-green-900/20';
      case 'in-progress': return 'text-blue-400 bg-blue-900/20';
      case 'pending': return 'text-yellow-400 bg-yellow-900/20';
      case 'not-started': return 'text-gray-400 bg-gray-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 0.8) return 'text-green-400';
    if (efficiency >= 0.6) return 'text-blue-400';
    if (efficiency >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex">
      {/* Left Sidebar - Project & Participant Navigation */}
      <div className="w-80 flex-shrink-0 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            {onBack && (
              <button
                onClick={onBack}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                Back
              </button>
            )}
          </div>
          <p className="text-sm text-gray-400">Process Mining Overview</p>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Projects</h2>
            <div className="space-y-2">
              {mockProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedProject?.id === project.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-medium mb-1">{project.name}</div>
                  <div className="text-sm opacity-75">{project.department}</div>
                  <div className="text-xs mt-2 flex justify-between">
                    <span>{project.completedCount}/{project.participantCount} complete</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      project.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                      project.status === 'active' ? 'bg-blue-900/30 text-blue-400' :
                      'bg-gray-900/30 text-gray-400'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Participants List */}
          {selectedProject && (
            <div className="p-4 border-t border-gray-700">
              <h3 className="text-md font-semibold text-white mb-3">Participants</h3>
              <div className="space-y-2">
                {mockParticipants.map((participant) => (
                  <div key={participant.id} className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{participant.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(participant.status)}`}>
                        {participant.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{participant.email}</div>
                    {participant.recordingDuration && (
                      <div className="text-xs text-gray-500 mt-1">
                        {participant.recordingDuration}min recorded
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-900">
        {!selectedProject ? (
          /* Welcome State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-semibold mb-2">Select a Project</h2>
              <p>Choose a project from the sidebar to view detailed analytics and insights.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Top Header - KPIs */}
            <div className="bg-gray-800 border-b border-gray-700 p-6">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedProject.name}</h2>
                <p className="text-gray-400">Department: {selectedProject.department}</p>
              </div>

              {projectKPIs && (
                <div className="grid grid-cols-4 gap-6">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-400">{projectKPIs.completionRate}</div>
                    <div className="text-sm text-gray-400">Recordings Completed</div>
                    <div className="text-xs text-gray-500 mt-1">{projectKPIs.completionPercentage}% complete</div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-400">{projectKPIs.totalAnalyzed}</div>
                    <div className="text-sm text-gray-400">Minutes Analyzed</div>
                    <div className="text-xs text-gray-500 mt-1">Total processed time</div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-lg font-bold text-purple-400">
                      {projectKPIs.topApplications[0]?.name}
                    </div>
                    <div className="text-sm text-gray-400">Top Application</div>
                    <div className="text-xs text-gray-500 mt-1">{projectKPIs.topApplications[0]?.percentage}% usage</div>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-400">{mockWorkflowInsights.length}</div>
                    <div className="text-sm text-gray-400">Workflows Identified</div>
                    <div className="text-xs text-gray-500 mt-1">AI-clustered processes</div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Content - Workflow Insights */}
            <div className="flex-1 p-6 overflow-y-auto">
              {viewLevel === 'overview' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Workflow Insights</h3>
                    <p className="text-gray-400">AI-identified processes and patterns from video analysis</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {mockWorkflowInsights.map((workflow) => (
                      <div
                        key={workflow.id}
                        onClick={() => {
                          setSelectedWorkflow(workflow);
                          setViewLevel('workflow');
                        }}
                        className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-750 transition-colors"
                      >
                        <h4 className="text-lg font-semibold text-white mb-2">{workflow.name}</h4>
                        <p className="text-sm text-gray-400 mb-4">{workflow.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-xl font-bold text-blue-400">{workflow.frequency}</div>
                            <div className="text-xs text-gray-500">Occurrences</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-green-400">{workflow.avgDuration}m</div>
                            <div className="text-xs text-gray-500">Avg Duration</div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-gray-400">Efficiency</span>
                            <span className={`text-sm font-medium ${getEfficiencyColor(workflow.efficiency)}`}>
                              {Math.round(workflow.efficiency * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                workflow.efficiency >= 0.8 ? 'bg-green-500' :
                                workflow.efficiency >= 0.6 ? 'bg-blue-500' :
                                workflow.efficiency >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${workflow.efficiency * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {workflow.systems.slice(0, 3).map((system) => (
                            <span key={system} className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                              {system}
                            </span>
                          ))}
                          {workflow.systems.length > 3 && (
                            <span className="px-2 py-1 bg-gray-600/20 text-gray-400 text-xs rounded">
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
                        <h3 className="text-xl font-semibold text-white mb-2">{selectedWorkflow.name}</h3>
                        <p className="text-gray-400">{selectedWorkflow.description}</p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setViewLevel('raw-data')}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          View Raw Data
                        </button>
                        <button
                          onClick={() => setViewLevel('overview')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          Back to Overview
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Process Map Placeholder */}
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Process Flow</h4>
                      <div className="bg-gray-700 rounded-lg p-8 text-center">
                        <div className="text-gray-500 mb-2">Process Map Visualization</div>
                        <div className="text-sm text-gray-600">Interactive flowchart would be rendered here</div>
                        <div className="text-xs text-gray-600 mt-2">Showing: {selectedWorkflow.systems.join(' → ')}</div>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="bg-gray-800 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Key Metrics</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Average Completion Time</span>
                          <span className="text-white font-medium">{selectedWorkflow.avgDuration} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Occurrences</span>
                          <span className="text-white font-medium">{selectedWorkflow.frequency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Efficiency Score</span>
                          <span className={`font-medium ${getEfficiencyColor(selectedWorkflow.efficiency)}`}>
                            {Math.round(selectedWorkflow.efficiency * 100)}%
                          </span>
                        </div>
                        <div>
                          <div className="text-gray-400 mb-2">Most Common Systems</div>
                          <div className="space-y-1">
                            {selectedWorkflow.systems.map((system, index) => (
                              <div key={system} className="flex justify-between text-sm">
                                <span className="text-gray-300">{index + 1}. {system}</span>
                                <span className="text-gray-500">
                                  {Math.round((selectedWorkflow.systems.length - index) / selectedWorkflow.systems.length * 100)}%
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
                      <h3 className="text-xl font-semibold text-white mb-2">Raw Data Analysis</h3>
                      <button
                        onClick={() => setViewLevel('workflow')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Back to Workflow
                      </button>
                    </div>
                    <p className="text-gray-400">Detailed event data for validation and deep analysis</p>
                  </div>

                  <div className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-700">
                      <h4 className="text-lg font-semibold text-white">Event Timeline</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Application/System</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Participant</th>
                          </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                          {/* Mock data - would come from API */}
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">14:32:15</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Outlook</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Opened email attachment</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Sarah Chen</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">14:32:47</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">SAP</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Navigated to invoice entry form</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Sarah Chen</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">14:33:12</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">SAP</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Entered vendor information</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">Sarah Chen</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}