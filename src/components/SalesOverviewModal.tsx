import React, { useMemo, useState } from 'react';
import { DESIGN_TOKENS } from '../constants';

type Mode = 'workflow' | 'system';

type EmployeeBreakdown = {
  name: string;
  // minutes spent per category
  workflows: Record<string, number>;
  systems: Record<string, number>;
};

export default function SalesOverviewModal({
  open,
  onClose,
  employees,
  summaryHours = 29,
  coreWorkflows = 4,
}: {
  open: boolean;
  onClose: () => void;
  employees: EmployeeBreakdown[];
  summaryHours?: number;
  coreWorkflows?: number;
}) {
  const [mode, setMode] = useState<Mode>('workflow');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    label: string;
    time: number;
    pct: number;
    who: string;
  }>({ visible: false, x: 0, y: 0, label: '', time: 0, pct: 0, who: '' });

  // Use design-system palette
  const paletteWorkflow = [
    DESIGN_TOKENS.colors.kpiAccent,   // purple
    DESIGN_TOKENS.colors.kpiInfo,     // blue
    DESIGN_TOKENS.colors.kpiWarning,  // orange
    DESIGN_TOKENS.colors.destructive, // red
    DESIGN_TOKENS.colors.success,     // green
    DESIGN_TOKENS.colors.accentForeground, // dark text tone as fallback
  ];
  const paletteSystem = [
    DESIGN_TOKENS.colors.kpiInfo,     // blue
    DESIGN_TOKENS.colors.kpiAccent,   // purple
    DESIGN_TOKENS.colors.success,     // green
    DESIGN_TOKENS.colors.kpiWarning,  // orange
    DESIGN_TOKENS.colors.destructive, // red
    DESIGN_TOKENS.colors.accentForeground,
  ];

  const allKeys = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      const src = mode === 'workflow' ? e.workflows : e.systems;
      Object.keys(src).forEach((k) => set.add(k));
    });
    return Array.from(set);
  }, [employees, mode]);

  const PROCESS_COLOR_MAP: Record<string, string> = {
    'Inbound Sales Development': DESIGN_TOKENS.colors.kpiAccent,
    'Client Follow-up': DESIGN_TOKENS.colors.kpiWarning,
    'Invoice Processing': DESIGN_TOKENS.colors.success,
    'New Client Onboarding': DESIGN_TOKENS.colors.kpiInfo,
  };
  const SYSTEM_COLOR_MAP: Record<string, string> = {
    Gmail: DESIGN_TOKENS.colors.kpiInfo,
    LinkedIn: DESIGN_TOKENS.colors.kpiAccent,
    HubSpot: DESIGN_TOKENS.colors.kpiWarning,
    Excel: DESIGN_TOKENS.colors.success,
    Slack: DESIGN_TOKENS.colors.accentForeground,
  };

  const colorFor = (key: string) => {
    if (mode === 'workflow' && PROCESS_COLOR_MAP[key]) return PROCESS_COLOR_MAP[key];
    if (mode === 'system' && SYSTEM_COLOR_MAP[key]) return SYSTEM_COLOR_MAP[key];
    const arr = mode === 'workflow' ? paletteWorkflow : paletteSystem;
    const idx = Math.abs(hashCode(key)) % arr.length;
    return arr[idx];
  };

  const totalsByEmployee = useMemo(() => {
    return employees.map((e) => {
      const src = mode === 'workflow' ? e.workflows : e.systems;
      const total = Object.values(src).reduce((a, b) => a + b, 0);
      return total || 1; // avoid divide-by-zero
    });
  }, [employees, mode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={`relative ${DESIGN_TOKENS.components.card} w-[96vw] max-w-6xl h-[92vh] border border-gray-200 rounded-xl overflow-hidden bg-white`}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className={`${DESIGN_TOKENS.typography.h3} text-gray-900`}>Sales Department Overview</h3>
            <p className={`${DESIGN_TOKENS.typography.small} text-gray-600`}>Comparative view of workflows and system usage across team members</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className={`${DESIGN_TOKENS.components.buttonSecondary} text-sm`}>
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 h-[calc(92vh-72px)] overflow-y-auto bg-gray-50">
          {/* Context Row (Last 7 days) */}
          <div className="flex flex-col gap-2">
            <div className={`${DESIGN_TOKENS.typography.small} text-gray-600`}>Last 7 days overview</div>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Last week</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{employees.length} employees</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{coreWorkflows} core workflows</span>
            </div>
          </div>
          {/* High-Level Summary */}
          <div className={`${DESIGN_TOKENS.components.card} p-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className={`${DESIGN_TOKENS.typography.h1} text-gray-900`}>
                  4 Core Workflows Driving 80% of Team Activity
                </div>
                <div className={`${DESIGN_TOKENS.typography.small} text-gray-600 mt-1`}>
                  The user spread across 3 main Systems: Gmail, HubSpot, and Excel.
                </div>
              </div>
            </div>
          </div>

          {/* Comparative Stacked Bars */}
          <div className={`${DESIGN_TOKENS.components.card} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`${DESIGN_TOKENS.typography.h4} text-gray-900`}>
                {mode === 'workflow' ? 'Workflow Breakdown by Employee' : 'System Usage Breakdown by Employee'}
              </h4>
              <div className="flex items-center gap-3">
                <div className="flex items-center p-1 rounded-lg border border-gray-200 bg-gray-100">
                  <button
                    onClick={() => setMode('workflow')}
                    className={`${mode === 'workflow' ? 'bg-gray-900 text-white shadow' : 'text-gray-900'} rounded-md px-3 py-1 text-sm`}
                  >
                    Workflows
                  </button>
                  <button
                    onClick={() => setMode('system')}
                    className={`${mode === 'system' ? 'bg-gray-900 text-white shadow' : 'text-gray-900'} rounded-md px-3 py-1 text-sm`}
                  >
                    Systems
                  </button>
                </div>
              </div>
            </div>

            {/* Bars */}
            <div className="space-y-6">
              {employees.map((e, idx) => {
                const src = mode === 'workflow' ? e.workflows : e.systems;
                const total = totalsByEmployee[idx] || 1;
                const keys = Object.keys(src).sort((a, b) => src[b] - src[a]);
                return (
                  <div key={e.name} className="">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`${DESIGN_TOKENS.typography.body} text-gray-900`}>{e.name}</div>
                      <div className={`${DESIGN_TOKENS.typography.caption} text-gray-500`}>{Math.round(total)} min</div>
                    </div>
                    <div className="w-full h-8 rounded overflow-hidden border border-gray-200 bg-gray-100 relative">
                      <div className="flex h-full">
                        {keys.map((k) => {
                          const val = src[k];
                          const pct = (val / total) * 100;
                          return (
                            <div
                              key={k}
                              className="h-full transition-opacity"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: colorFor(k),
                                opacity: activeKey && activeKey !== k ? 0.28 : 1,
                              }}
                              onMouseEnter={(ev) => {
                                setTooltip({
                                  visible: true,
                                  x: ev.clientX,
                                  y: ev.clientY,
                                  label: k,
                                  time: val,
                                  pct: Math.round(pct),
                                  who: e.name,
                                });
                              }}
                              onMouseMove={(ev) => {
                                setTooltip((t) => ({ ...t, x: ev.clientX, y: ev.clientY }));
                              }}
                              onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
                              title={`${k}: ${Math.round(val)} min (${Math.round(pct)}%)`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {allKeys.map((k) => {
                const selected = activeKey === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setActiveKey((prev) => (prev === k ? null : k))}
                    className={`flex items-center gap-2 text-left rounded-md px-2 py-1 border transition-colors ${
                      selected ? 'border-gray-300 bg-gray-100' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: colorFor(k) }} />
                    <span className={`${DESIGN_TOKENS.typography.caption} text-gray-700`}>{k}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Identified Processes removed as redundant */}

          {/* Tooltip */}
          {tooltip.visible && (
            <div
              className="fixed pointer-events-none z-[60] px-3 py-2 rounded-md border border-gray-200 bg-white shadow-md"
              style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
            >
              <div className={`${DESIGN_TOKENS.typography.small} text-gray-900`}>{tooltip.label}</div>
              <div className={`${DESIGN_TOKENS.typography.caption} text-gray-600`}>
                {tooltip.who} · {Math.round(tooltip.time)} min · {tooltip.pct}%
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple deterministic hash for color picking
function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // Convert to 32bit int
  }
  return h;
}

