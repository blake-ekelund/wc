"use client";

import { useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { ArrowUpRight, ArrowDownRight, X } from "lucide-react";
import { allMetrics } from "./kpi-cards";

// Category → required plugin mapping
const categoryPluginReq: Record<string, string | undefined> = {
  Pipeline: "crm",
  Activity: "crm",
  SaaS: "crm",
  "Real Estate": "crm",
  Recruiting: "crm",
  Services: "crm",
  "Customer Contracts": "crm",
  Tasks: undefined, // always shown
  Vendors: "vendors",
};

interface KpiPickerModalProps {
  selected: string[];
  enabledPlugins?: string[];
  onSave: (ids: string[]) => void;
  onClose: () => void;
}

export default function KpiPickerModal({ selected, enabledPlugins, onSave, onClose }: KpiPickerModalProps) {
  const trapRef = useFocusTrap<HTMLDivElement>();
  const [draft, setDraft] = useState<string[]>([...selected]);

  const plugins = enabledPlugins || [];

  // Filter categories by enabled plugins
  const allCategories = Array.from(new Set(allMetrics.map((m) => m.category)));
  const visibleCategories = allCategories.filter((cat) => {
    const req = categoryPluginReq[cat];
    if (req === undefined) return true; // always show (Tasks)
    return plugins.includes(req);
  });

  // Filter metrics to only those from visible categories
  const visibleMetrics = allMetrics.filter((m) => visibleCategories.includes(m.category));

  function toggle(id: string) {
    setDraft((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  function moveUp(id: string) {
    setDraft((prev) => {
      const idx = prev.indexOf(id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }

  function moveDown(id: string) {
    setDraft((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div ref={trapRef} className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-foreground">Customize Dashboard</h3>
            <p className="text-xs text-muted mt-0.5">Choose up to 4 metrics to display</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-gray-100 transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Selected KPIs - reorderable */}
          <div className="px-5 py-3 bg-surface/50 border-b border-border">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Selected ({draft.length}/4)</div>
            {draft.length === 0 && <p className="text-xs text-muted py-2">No metrics selected. Pick up to 4 below.</p>}
            <div className="space-y-1.5">
              {draft.map((id, idx) => {
                const metric = allMetrics.find((m) => m.id === id);
                if (!metric) return null;
                const Icon = metric.icon;
                return (
                  <div key={id} className="flex items-center gap-2 bg-white border border-accent/30 rounded-lg px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveUp(id)} disabled={idx === 0} className="text-muted hover:text-foreground disabled:opacity-20" aria-label="Move up"><ArrowUpRight className="w-3 h-3 -rotate-45" /></button>
                      <button onClick={() => moveDown(id)} disabled={idx === draft.length - 1} className="text-muted hover:text-foreground disabled:opacity-20" aria-label="Move down"><ArrowDownRight className="w-3 h-3 rotate-45" /></button>
                    </div>
                    <Icon className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-sm font-medium text-foreground flex-1">{metric.label}</span>
                    <span className="text-[10px] text-muted">{metric.category}</span>
                    <button onClick={() => toggle(id)} className="p-1 text-muted hover:text-red-500 transition-colors" aria-label="Remove metric">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Available metrics by category */}
          <div className="px-5 py-3 space-y-4">
            {visibleCategories.map((cat) => {
              const metrics = visibleMetrics.filter((m) => m.category === cat);
              if (metrics.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">{cat}</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {metrics.map((m) => {
                      const Icon = m.icon;
                      const isSelected = draft.includes(m.id);
                      const isFull = draft.length >= 4;
                      return (
                        <button
                          key={m.id}
                          onClick={() => toggle(m.id)}
                          disabled={!isSelected && isFull}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                            isSelected
                              ? "bg-accent/10 text-accent border border-accent/30"
                              : isFull
                              ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                              : "bg-white border border-border text-foreground hover:border-accent hover:text-accent"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate text-xs">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-border flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-foreground border border-border hover:bg-gray-50 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onSave(draft); onClose(); }}
            disabled={draft.length === 0}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-50"
          >
            Save Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
