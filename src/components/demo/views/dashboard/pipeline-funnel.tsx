"use client";

import { GitBranch } from "lucide-react";
import { type Contact, type StageDefinition, formatCurrency } from "../../data";

interface PipelineFunnelProps {
  contacts: Contact[];
  stages: StageDefinition[];
  onSelectContact?: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onNavigate?: (view: any) => void;
}

const isTerminalLabel = (label: string) => {
  const l = label.toLowerCase();
  return (
    l.includes("won") || l.includes("lost") || l.includes("hired") ||
    l.includes("rejected") || l.includes("engaged") || l.includes("completed") ||
    l.includes("cancelled") || l.includes("subscribed") || l.includes("churned")
  );
};

export default function PipelineFunnel({ contacts, stages, onSelectContact, onNavigate }: PipelineFunnelProps) {
  const pipelineCounts = stages
    .filter((s) => !isTerminalLabel(s.label))
    .slice(0, 5)
    .map((s) => ({
      ...s,
      count: contacts.filter((c) => c.stage === s.label).length,
      value: contacts.filter((c) => c.stage === s.label).reduce((a, c) => a + c.value, 0),
    }));

  const maxStageValue = Math.max(...pipelineCounts.map((s) => s.value), 1);

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Pipeline</h3>
        <button
          onClick={() => onNavigate?.("contacts")}
          className="text-xs text-accent hover:text-accent-dark font-medium"
        >
          View all
        </button>
      </div>
      <div className="p-5 space-y-4">
        {pipelineCounts.map((s) => (
          <div key={s.label}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bgColor} ${s.color}`}>
                  {s.label}
                </span>
                <span className="text-xs text-muted">{s.count} deals</span>
              </div>
              <span className="text-sm font-semibold text-foreground tabular-nums">
                {formatCurrency(s.value)}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${(s.value / maxStageValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {pipelineCounts.length === 0 && (
          <div className="py-6 text-center">
            <GitBranch className="w-8 h-8 text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-muted">No pipeline data</p>
          </div>
        )}
      </div>
    </div>
  );
}
