import React, { useRef, useMemo, useState } from 'react';
import ReactFlow, { Controls, Background, BackgroundVariant, MarkerType, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { DESIGN_TOKENS } from '../constants';

interface WorkflowDiffModalProps {
  open: boolean;
  onClose: () => void;
}

interface NodeData {
  label: string;
  description?: string;
  tool?: string;
  type?: 'process' | 'decision';
}

type ProcessNode = { 
  id: string; 
  type: string;
  data: NodeData; 
  position: { x: number; y: number }; 
};

type ProcessEdge = { 
  id: string; 
  source: string; 
  target: string; 
  label?: string;
  animated?: boolean;
  style?: any;
  markerEnd?: any;
  labelStyle?: any;
};

// Synthesized workflow nodes (left side)
function buildSynthesizedNodes(): ProcessNode[] {
  const centerX = 200;
  const leftBranchX = 80;
  const rightBranchX = 320;
  
  return [
    { 
      id: 'n1', 
      type: 'card',
      data: { 
        label: 'Inbound Intake', 
        description: 'Lead arrives via email or form',
        tool: 'Gmail'
      }, 
      position: { x: centerX, y: 50 } 
    },
    { 
      id: 'n2', 
      type: 'card',
      data: { 
        label: 'Create CRM Record', 
        description: 'HubSpot entry with basic details',
        tool: 'HubSpot'
      }, 
      position: { x: centerX, y: 180 } 
    },
    { 
      id: 'n3', 
      type: 'card',
      data: { 
        label: 'Initial Qualification Check', 
        description: 'Assess fit based on criteria',
        tool: 'HubSpot'
      }, 
      position: { x: centerX, y: 310 } 
    },
    { 
      id: 'n4', 
      type: 'decision',
      data: { 
        label: 'Qualified?', 
        description: 'Decision point based on ICP fit',
        type: 'decision'
      }, 
      position: { x: centerX, y: 440 } 
    },
    { 
      id: 'n5', 
      type: 'card',
      data: { 
        label: 'Update Status: Qualified', 
        description: 'Mark as qualified lead',
        tool: 'HubSpot'
      }, 
      position: { x: leftBranchX, y: 570 } 
    },
    { 
      id: 'n6', 
      type: 'card',
      data: { 
        label: 'Handover to AE', 
        description: 'Notify via Slack and assign',
        tool: 'Slack'
      }, 
      position: { x: leftBranchX, y: 700 } 
    },
    { 
      id: 'n7', 
      type: 'card',
      data: { 
        label: 'Update Status: Unqualified', 
        description: 'Mark as unqualified',
        tool: 'HubSpot'
      }, 
      position: { x: rightBranchX, y: 570 } 
    },
  ];
}

// Detailed observations nodes (right side) 
function buildDetailedNodes(): ProcessNode[] {
  const centerX = 180;
  const leftBranchX = 50;
  const rightBranchX = 320;
  const verticalSpacing = 120; // Increased spacing between nodes
  
  return [
    { id: 'n1', type: 'card', data: { label: 'Inbound email received', tool: 'Gmail' }, position: { x: centerX, y: 30 } },
    { id: 'n2', type: 'card', data: { label: 'Auto acknowledgement sent', tool: 'Gmail' }, position: { x: centerX, y: 30 + verticalSpacing } },
    { id: 'n3', type: 'decision', data: { label: 'Human contact?', description: 'Check for suspicious or automated sender', type: 'decision' }, position: { x: centerX, y: 30 + verticalSpacing * 2 } },
    { id: 'n4', type: 'card', data: { label: 'Mark as Not sales relevant', description: 'Stop processing - automated sender', tool: 'HubSpot' }, position: { x: rightBranchX + 80, y: 30 + verticalSpacing * 3 } },
    { id: 'n5', type: 'card', data: { label: 'Extract contact details', tool: 'Gmail' }, position: { x: centerX, y: 30 + verticalSpacing * 3 } },
    { id: 'n6', type: 'card', data: { label: 'Validate email format', tool: 'HubSpot' }, position: { x: centerX, y: 30 + verticalSpacing * 4 } },
    { id: 'n7', type: 'card', data: { label: 'Identify primary contact', tool: 'HubSpot' }, position: { x: centerX, y: 30 + verticalSpacing * 5 } },
    { id: 'n8', type: 'card', data: { label: 'HubSpot duplicate check', tool: 'HubSpot' }, position: { x: centerX, y: 30 + verticalSpacing * 6 } },
    { id: 'n9', type: 'decision', data: { label: 'Duplicate found?', type: 'decision' }, position: { x: centerX, y: 30 + verticalSpacing * 7 } },
    { id: 'n10', type: 'card', data: { label: 'Attach to existing contact', tool: 'HubSpot' }, position: { x: leftBranchX, y: 30 + verticalSpacing * 8 } },
    { id: 'n11', type: 'card', data: { label: 'Create new contact', tool: 'HubSpot' }, position: { x: rightBranchX, y: 30 + verticalSpacing * 8 } },
    { id: 'n12', type: 'card', data: { label: 'Enrich firmographics', tool: 'LinkedIn' }, position: { x: centerX, y: 30 + verticalSpacing * 9 } },
    { id: 'n13', type: 'card', data: { label: 'Record legal basis', tool: 'HubSpot' }, position: { x: centerX, y: 30 + verticalSpacing * 10 } },
    { id: 'n14', type: 'decision', data: { label: 'Data complete?', type: 'decision' }, position: { x: centerX, y: 30 + verticalSpacing * 11 } },
    { id: 'n15', type: 'card', data: { label: 'Apply ICP fit score', tool: 'HubSpot' }, position: { x: leftBranchX, y: 30 + verticalSpacing * 12 } },
    { id: 'n16', type: 'card', data: { label: 'Request missing details', tool: 'Gmail' }, position: { x: rightBranchX, y: 30 + verticalSpacing * 12 } },
    { id: 'n17', type: 'decision', data: { label: 'ICP fit above threshold?', type: 'decision' }, position: { x: leftBranchX, y: 30 + verticalSpacing * 13 } },
  ];
}

// Synthesized workflow edges
function buildSynthesizedEdges(): ProcessEdge[] {
  return [
    { id: 'e1', source: 'n1', target: 'n2', animated: true },
    { id: 'e2', source: 'n2', target: 'n3', animated: true },
    { id: 'e3', source: 'n3', target: 'n4', animated: true },
    { id: 'e4', source: 'n4', target: 'n5', label: 'Yes', animated: true },
    { id: 'e5', source: 'n5', target: 'n6', animated: true },
    { id: 'e6', source: 'n4', target: 'n7', label: 'No', animated: true },
  ];
}

// Detailed observations edges
function buildDetailedEdges(): ProcessEdge[] {
  return [
    { id: 'e1', source: 'n1', target: 'n2', animated: true },
    { id: 'e2', source: 'n2', target: 'n3', animated: true },
    { id: 'e3', source: 'n3', target: 'n4', label: 'No', animated: true },
    { id: 'e4', source: 'n3', target: 'n5', label: 'Yes', animated: true },
    { id: 'e5', source: 'n5', target: 'n6', animated: true },
    { id: 'e6', source: 'n6', target: 'n7', animated: true },
    { id: 'e7', source: 'n7', target: 'n8', animated: true },
    { id: 'e8', source: 'n8', target: 'n9', animated: true },
    { id: 'e9', source: 'n9', target: 'n10', label: 'Yes', animated: true },
    { id: 'e10', source: 'n9', target: 'n11', label: 'No', animated: true },
    { id: 'e11', source: 'n10', target: 'n12', animated: true },
    { id: 'e12', source: 'n11', target: 'n12', animated: true },
    { id: 'e13', source: 'n12', target: 'n13', animated: true },
    { id: 'e14', source: 'n13', target: 'n14', animated: true },
    { id: 'e15', source: 'n14', target: 'n15', label: 'Yes', animated: true },
    { id: 'e16', source: 'n14', target: 'n16', label: 'No', animated: true },
    { id: 'e17', source: 'n16', target: 'n15', animated: true },
    { id: 'e18', source: 'n15', target: 'n17', animated: true },
  ];
}

// NodeCard component with AdminDashboard styling
const NodeCard = ({ data }: { data: NodeData }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div 
      className={`${
        data.type === 'decision' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
      } border-2 rounded-lg p-3 min-w-[280px] shadow-sm relative`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!bg-gray-400 !border-2 !border-gray-300 !w-3 !h-3" 
        style={{ top: -6 }}
      />
      
      {/* Tool badge in top right */}
      {data.tool && (
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
            {data.tool}
          </span>
        </div>
      )}
      
      <div className="space-y-2 pr-16">
        <div className={`${DESIGN_TOKENS.typography.body} font-semibold text-gray-900`}>
          {data.label}
        </div>
        
        {data.description && (
          <div className={`${DESIGN_TOKENS.typography.small} text-gray-600 ${
            isExpanded ? 'block' : 'line-clamp-2'
          }`}>
            {data.description}
          </div>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!bg-gray-400 !border-2 !border-gray-300 !w-3 !h-3" 
        style={{ bottom: -6 }}
      />
    </div>
  );
};

function ReactFlowMini({ nodes, edges, color, isLeftSide = false }: { 
  nodes: ProcessNode[]; 
  edges: ProcessEdge[]; 
  color: string | undefined;
  isLeftSide?: boolean;
}) {
  const instanceRef = useRef<any>(null);

  const onInit = (inst: any) => {
    instanceRef.current = inst;
    requestAnimationFrame(() => applyAutoLayout(inst));
    setTimeout(() => applyAutoLayout(inst), 100);
  };

  const applyAutoLayout = (inst: any) => {
    if (!inst) return;
    // Different zoom behavior for left vs right side
    const padding = isLeftSide ? 0.2 : 0.3;
    const zoomMultiplier = isLeftSide ? 1.1 : 0.85;
    const maxZoom = isLeftSide ? 1.2 : 0.8;
    const minZoom = isLeftSide ? 0.6 : 0.4;
    
    inst.fitView({ padding });
    const vp = inst.getViewport();
    
    inst.setViewport({ 
      x: vp.x, 
      y: vp.y, 
      zoom: Math.min(maxZoom, Math.max(minZoom, vp.zoom * zoomMultiplier))
    });
  };

  const styledEdges = edges.map((e) => ({
    ...e,
    type: 'straight',
    markerEnd: { 
      type: MarkerType.ArrowClosed, 
      width: 20, 
      height: 20, 
      color: '#6b7280' 
    },
    animated: true,
    style: { 
      stroke: '#6b7280', 
      strokeWidth: 2,
    },
    labelStyle: {
      fontSize: '10px',
      fontWeight: 500,
      fill: '#374151',
      background: 'rgba(255,255,255,0.9)',
      padding: '2px 4px',
      borderRadius: '4px',
    },
  }));

  const nodeTypes = useMemo(() => ({ 
    card: NodeCard,
    decision: NodeCard,
    default: NodeCard 
  }), []);

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#f8fafc' }}>
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#94a3b8" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowDiffModal({ open, onClose }: WorkflowDiffModalProps) {
  const [selectedSession, setSelectedSession] = React.useState('sarah-20250909');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  // Mock sessions data
  const sessions = [
    { id: 'sarah-20250909', name: 'Sarah Chen', date: '20250909', label: 'Sarah Chen-20250909' },
    { id: 'emily-20250910', name: 'Emily Watson', date: '20250910', label: 'Emily Watson-20250910' },
    { id: 'mike-20250908', name: 'Mike Rodriguez', date: '20250908', label: 'Mike Rodriguez-20250908' },
  ];

  const currentSession = sessions.find(s => s.id === selectedSession) || sessions[0];

  if (!open) return null;

  const synthesizedNodes = buildSynthesizedNodes();
  const detailedNodes = buildDetailedNodes();
  const synthesizedEdges = buildSynthesizedEdges();
  const detailedEdges = buildDetailedEdges();

  // Calculate workflow metrics for comparison
  const synthesizedSteps = synthesizedNodes.length;
  const detailedSteps = detailedNodes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[96vw] h-[92vh] border border-gray-200 overflow-hidden">
        
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h3 className={`${DESIGN_TOKENS.typography.h2} text-gray-900 mb-2`}>
              Lead Generation Process Analysis
            </h3>
            <p className={`${DESIGN_TOKENS.typography.body} text-gray-600`}>
              Synthesized Core Workflow vs Detailed Observations
            </p>
            <div className="flex gap-4 mt-3">
              <div className={`${DESIGN_TOKENS.typography.caption} text-gray-500`}>
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: DESIGN_TOKENS.colors.kpiInfo }}></span>
                Synthesized: {synthesizedSteps} core steps
              </div>
              <div className={`${DESIGN_TOKENS.typography.caption} text-gray-500`}>
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: DESIGN_TOKENS.colors.kpiWarning }}></span>
                Detailed: {detailedSteps} observed steps
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className={`${DESIGN_TOKENS.components.buttonSecondary} px-6 py-3`}
          >
            Close
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-[calc(92vh-140px)]">
          
          {/* Synthesized Workflow */}
          <div className={`${DESIGN_TOKENS.components.card} overflow-hidden flex flex-col border-2`} style={{ borderColor: DESIGN_TOKENS.colors.kpiInfo }}>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className={`${DESIGN_TOKENS.typography.h4} text-gray-900`}>
                  Synthesized Process: Inbound Sales Development
                </h4>
              </div>
              <p className={`${DESIGN_TOKENS.typography.small} text-gray-600 mt-2`}>
                90% Overlapping with the observed processes performed by the 3 operators
              </p>
            </div>
            <div className="flex-1 p-2" style={{ minHeight: '400px' }}>
              <ReactFlowMini
                color={DESIGN_TOKENS.colors.kpiInfo}
                nodes={synthesizedNodes}
                edges={synthesizedEdges}
                isLeftSide={true}
              />
            </div>
          </div>

          {/* Detailed Observations Workflow */}
          <div className={`${DESIGN_TOKENS.components.card} overflow-hidden flex flex-col border-2`} style={{ borderColor: DESIGN_TOKENS.colors.kpiWarning }}>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className={`${DESIGN_TOKENS.typography.h4} text-gray-900`}>
                  {currentSession.name}: Inbound Sales Development
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
              <p className={`${DESIGN_TOKENS.typography.small} text-gray-600`}>
                Detailed view of the individual steps performed by the operators.
              </p>
            </div>
            <div className="flex-1 p-2" style={{ minHeight: '400px' }}>
              <ReactFlowMini
                color={DESIGN_TOKENS.colors.kpiWarning}
                nodes={detailedNodes}
                edges={detailedEdges}
                isLeftSide={false}
              />
            </div>
          </div>
        </div>

        {/* Analysis Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className={`${DESIGN_TOKENS.typography.h4}`} style={{ color: DESIGN_TOKENS.colors.kpiInfo }}>
                {Math.round(((detailedSteps - synthesizedSteps) / synthesizedSteps) * 100)}%
              </div>
              <div className={`${DESIGN_TOKENS.typography.caption} text-gray-600`}>
                Process Complexity Increase
              </div>
            </div>
            <div>
              <div className={`${DESIGN_TOKENS.typography.h4}`} style={{ color: DESIGN_TOKENS.colors.kpiInfo }}>
                {detailedSteps - synthesizedSteps} extra steps
              </div>
              <div className={`${DESIGN_TOKENS.typography.caption} text-gray-600`}>
                Additional Observations
              </div>
            </div>
            <div>
              <div className={`${DESIGN_TOKENS.typography.h4}`} style={{ color: DESIGN_TOKENS.colors.kpiSuccess }}>
                Optimization Potential
              </div>
              <div className={`${DESIGN_TOKENS.typography.caption} text-gray-600`}>
                Standardize validation step
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}