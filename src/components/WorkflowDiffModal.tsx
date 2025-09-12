import React, { useRef, useMemo } from 'react';
import ReactFlow, { Controls, Background, BackgroundVariant, MarkerType } from 'reactflow';
import { DESIGN_TOKENS } from '../constants';

interface WorkflowDiffModalProps {
  open: boolean;
  onClose: () => void;
}

type MiniNode = { 
  id: string; 
  data: { label: string; duration?: string; tool?: string }; 
  position: { x: number; y: number }; 
  style?: any; 
};

type MiniEdge = { 
  id: string; 
  source: string; 
  target: string; 
  label?: string;
  type?: string;
};

// Enhanced workflow data with meaningful differences
function buildSampleNodes(person: 'sarah' | 'mike'): MiniNode[] {
  const baseNodes: MiniNode[] = [
    { 
      id: 'n1', 
      data: { label: 'Capture Client Info', duration: '5 min', tool: 'HubSpot' }, 
      position: { x: 120, y: 0 } 
    },
    { 
      id: 'n2', 
      data: { label: 'Create CRM Record', duration: '3 min', tool: 'HubSpot' }, 
      position: { x: 120, y: 120 } 
    },
    { 
      id: 'n3', 
      data: { label: 'Send Welcome Email', duration: '2 min', tool: 'Gmail' }, 
      position: { x: 120, y: 240 } 
    },
    { 
      id: 'n4', 
      data: { label: 'Schedule Kickoff', duration: '4 min', tool: 'Calendly' }, 
      position: { x: 120, y: 360 } 
    },
    { 
      id: 'n5', 
      data: { label: 'Activate Account', duration: '3 min', tool: 'HubSpot' }, 
      position: { x: 120, y: 480 } 
    },
  ];

  if (person === 'mike') {
    // Mike has different workflow variations
    return [
      { 
        id: 'n1', 
        data: { label: 'Capture Client Info', duration: '7 min', tool: 'Excel' }, 
        position: { x: 140, y: 0 } 
      },
      { 
        id: 'n2', 
        data: { label: 'Create CRM Record', duration: '5 min', tool: 'HubSpot' }, 
        position: { x: 140, y: 120 } 
      },
      { 
        id: 'n2a', 
        data: { label: 'Data Validation', duration: '3 min', tool: 'Excel' }, 
        position: { x: 280, y: 180 } 
      },
      { 
        id: 'n3', 
        data: { label: 'Send Intro Email', duration: '4 min', tool: 'Outlook' }, 
        position: { x: 140, y: 280 } 
      },
      { 
        id: 'n4', 
        data: { label: 'Share Docs & Schedule', duration: '8 min', tool: 'DocuSign' }, 
        position: { x: 140, y: 400 } 
      },
      { 
        id: 'n5', 
        data: { label: 'Activate Account', duration: '2 min', tool: 'HubSpot' }, 
        position: { x: 140, y: 520 } 
      },
    ];
  }

  return baseNodes;
}

function buildSampleEdges(person: 'sarah' | 'mike'): MiniEdge[] {
  const baseEdges: MiniEdge[] = [
    { id: 'e1', source: 'n1', target: 'n2', label: 'Direct', type: 'default' },
    { id: 'e2', source: 'n2', target: 'n3', label: 'Auto', type: 'default' },
    { id: 'e3', source: 'n3', target: 'n4', label: 'Manual', type: 'default' },
    { id: 'e4', source: 'n4', target: 'n5', label: 'System', type: 'default' },
  ];

  if (person === 'mike') {
    // Mike has additional validation step
    return [
      { id: 'e1', source: 'n1', target: 'n2', label: 'Manual', type: 'default' },
      { id: 'e2a', source: 'n2', target: 'n2a', label: 'Review', type: 'default' },
      { id: 'e2b', source: 'n2a', target: 'n3', label: 'Verified', type: 'default' },
      { id: 'e3', source: 'n3', target: 'n4', label: 'Combined', type: 'default' },
      { id: 'e4', source: 'n4', target: 'n5', label: 'Complete', type: 'default' },
    ];
  }

  return baseEdges;
}

function ReactFlowMini({ nodes, edges, color }: { 
  nodes: MiniNode[]; 
  edges: MiniEdge[]; 
  color: string;
}) {
  const instanceRef = useRef<any>(null);

  const onInit = (inst: any) => {
    instanceRef.current = inst;
    requestAnimationFrame(() => applyTopAnchor(inst));
    setTimeout(() => applyTopAnchor(inst), 80);
  };

  const applyTopAnchor = (inst: any) => {
    if (!inst) return;
    inst.fitView({ padding: 0.15 });
    const vp = inst.getViewport();
    const minY = Math.min(...nodes.map((n) => n.position.y));
    inst.setViewport({ x: vp.x, y: -minY + 48, zoom: Math.min(1.0, Math.max(0.5, vp.zoom * 0.9)) });
  };

  const styledNodes = nodes.map((n) => ({
    ...n,
    style: {
      border: `2px solid ${color}`,
      borderRadius: 12,
      padding: 8,
      background: '#fff',
      color: DESIGN_TOKENS.colors.foreground,
      width: 200,
      fontSize: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
  }));

  const styledEdges = edges.map((e) => ({
    ...e,
    markerEnd: { 
      type: MarkerType.ArrowClosed, 
      width: 20, 
      height: 20, 
      color: color 
    },
    animated: true,
    style: { 
      stroke: color, 
      strokeWidth: 2,
    },
    labelStyle: {
      fontSize: '10px',
      fontWeight: 500,
      fill: color,
      background: 'rgba(255,255,255,0.9)',
      padding: '2px 4px',
      borderRadius: '4px',
    },
  }));

  const CustomNodeComponent = ({ data }: { data: any }) => (
    <div className="workflow-node">
      <div className={`${DESIGN_TOKENS.typography.body} font-semibold mb-1`}>
        {data.label}
      </div>
      <div className={`${DESIGN_TOKENS.typography.caption} text-gray-500 mb-1`}>
        {data.duration}
      </div>
      <div className={`${DESIGN_TOKENS.typography.caption} font-medium text-blue-600`}>
        {data.tool}
      </div>
    </div>
  );

  const nodeTypes = useMemo(() => ({ default: CustomNodeComponent }), []);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowDiffModal({ open, onClose }: WorkflowDiffModalProps) {
  if (!open) return null;

  const sarahNodes = buildSampleNodes('sarah');
  const mikeNodes = buildSampleNodes('mike');
  const sarahEdges = buildSampleEdges('sarah');
  const mikeEdges = buildSampleEdges('mike');

  // Calculate workflow metrics for comparison
  const sarahTotalTime = sarahNodes.reduce((sum, node) => 
    sum + parseInt(node.data.duration?.replace(' min', '') || '0'), 0
  );
  const mikeTotalTime = mikeNodes.reduce((sum, node) => 
    sum + parseInt(node.data.duration?.replace(' min', '') || '0'), 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[96vw] h-[92vh] border border-gray-200 overflow-hidden">
        
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h3 className={`${DESIGN_TOKENS.typography.h2} text-gray-900 mb-2`}>
              Workflow Process Comparison
            </h3>
            <p className={`${DESIGN_TOKENS.typography.body} text-gray-600`}>
              New Client Onboarding: Sarah Chen vs Mike Rodriguez
            </p>
            <div className="flex gap-4 mt-3">
              <div className={`${DESIGN_TOKENS.typography.caption} text-gray-500`}>
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#2563eb' }}></span>
                Sarah: {sarahTotalTime} min total | {sarahNodes.length} steps
              </div>
              <div className={`${DESIGN_TOKENS.typography.caption} text-gray-500`}>
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#7c3aed' }}></span>
                Mike: {mikeTotalTime} min total | {mikeNodes.length} steps
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
          
          {/* Sarah's Workflow */}
          <div className={`${DESIGN_TOKENS.components.card} overflow-hidden flex flex-col`}>
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <h4 className={`${DESIGN_TOKENS.typography.h4} text-blue-700`}>
                  Sarah Chen - Streamlined Process
                </h4>
                <div className={`${DESIGN_TOKENS.typography.caption} text-blue-600 bg-blue-100 px-3 py-1 rounded-full`}>
                  Efficient: {sarahTotalTime} min
                </div>
              </div>
              <p className={`${DESIGN_TOKENS.typography.small} text-blue-600 mt-2`}>
                Direct workflow with minimal steps and automation
              </p>
            </div>
            <div className="flex-1 p-2" style={{ minHeight: '400px' }}>
              <ReactFlowMini
                color="#2563eb"
                nodes={sarahNodes}
                edges={sarahEdges}
              />
            </div>
          </div>

          {/* Mike's Workflow */}
          <div className={`${DESIGN_TOKENS.components.card} overflow-hidden flex flex-col`}>
            <div className="p-4 border-b border-gray-200 bg-purple-50">
              <div className="flex items-center justify-between">
                <h4 className={`${DESIGN_TOKENS.typography.h4} text-purple-700`}>
                  Mike Rodriguez - Thorough Process
                </h4>
                <div className={`${DESIGN_TOKENS.typography.caption} text-purple-600 bg-purple-100 px-3 py-1 rounded-full`}>
                  Detailed: {mikeTotalTime} min
                </div>
              </div>
              <p className={`${DESIGN_TOKENS.typography.small} text-purple-600 mt-2`}>
                Comprehensive workflow with validation and additional tools
              </p>
            </div>
            <div className="flex-1 p-2" style={{ minHeight: '400px' }}>
              <ReactFlowMini
                color="#7c3aed"
                nodes={mikeNodes}
                edges={mikeEdges}
              />
            </div>
          </div>
        </div>

        {/* Analysis Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className={`${DESIGN_TOKENS.typography.h4}`} style={{ color: 'hsl(221 65% 35%)' }}>
                +{Math.abs(mikeTotalTime - sarahTotalTime)} min
              </div>
              <div className={`${DESIGN_TOKENS.typography.caption} text-gray-600`}>
                Time Difference
              </div>
            </div>
            <div>
              <div className={`${DESIGN_TOKENS.typography.h4}`} style={{ color: 'hsl(221 65% 35%)' }}>
                {mikeNodes.length - sarahNodes.length} extra steps
              </div>
              <div className={`${DESIGN_TOKENS.typography.caption} text-gray-600`}>
                Process Complexity
              </div>
            </div>
            <div>
              <div className={`${DESIGN_TOKENS.typography.h4}`} style={{ color: 'hsl(142 65% 30%)' }}>
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