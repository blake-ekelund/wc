"use client";

import { useState } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  CheckSquare,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Mail,
  Calendar,
  FileText,
  Home,
  UserCheck,
  Briefcase,
  Clock,
  Target,
  BarChart3,
  Wrench,
  ClipboardCheck,
  Settings2,
  X,
  GripVertical,
  Activity,
  Percent,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { type Contact, type Touchpoint, type Task, type StageDefinition, formatCurrency, formatDueDate, getTaskStatus } from "../data";

const typeIcons = { call: Phone, email: Mail, meeting: Calendar, note: FileText };

// =============================================
// KPI Metric Definitions
// =============================================

export interface KpiMetricId {
  id: string;
}

interface KpiMetricDef {
  id: string;
  label: string;
  icon: LucideIcon;
  category: string;
  compute: (ctx: KpiContext) => { value: string; change: string; up: boolean };
}

interface KpiContext {
  contacts: Contact[];
  tasks: Task[];
  touchpoints: Touchpoint[];
  stages: StageDefinition[];
  isLive: boolean;
}

function getDateRanges() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  return { now, thirtyDaysAgo, sixtyDaysAgo };
}

const isWonStage = (s: string) =>
  s.toLowerCase().includes("won") || s.toLowerCase().includes("hired") ||
  s.toLowerCase().includes("engaged") || s.toLowerCase().includes("completed") ||
  s.toLowerCase().includes("subscribed");

const isLostStage = (s: string) =>
  s.toLowerCase().includes("lost") || s.toLowerCase().includes("rejected") ||
  s.toLowerCase().includes("cancelled") || s.toLowerCase().includes("churned");

const isTerminal = (s: string) => isWonStage(s) || isLostStage(s);

function pctChange(current: number, prev: number): { change: string; up: boolean } {
  if (prev === 0 && current === 0) return { change: "—", up: true };
  if (prev === 0) return { change: `+${current}`, up: true };
  const pct = Math.round(((current - prev) / prev) * 100);
  if (pct === 0) return { change: "No change", up: true };
  return { change: `${pct > 0 ? "+" : ""}${pct}%`, up: pct >= 0 };
}

function countChange(current: number, prev: number): { change: string; up: boolean } {
  if (current === prev) return { change: "No change", up: true };
  const diff = current - prev;
  return { change: `${diff > 0 ? "+" : ""}${diff} vs prev 30d`, up: diff >= 0 };
}

// All available metrics
const allMetrics: KpiMetricDef[] = [
  {
    id: "pipeline-value", label: "Pipeline Value", icon: DollarSign, category: "Pipeline",
    compute: ({ contacts }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      const val = active.reduce((a, c) => a + c.value, 0);
      return { value: formatCurrency(val), change: `${active.length} active deals`, up: true };
    },
  },
  {
    id: "won-revenue-30d", label: "Won Revenue (30d)", icon: TrendingUp, category: "Pipeline",
    compute: ({ contacts, isLive }) => {
      const { thirtyDaysAgo, sixtyDaysAgo } = getDateRanges();
      const won = contacts.filter((c) => isWonStage(c.stage));
      if (!isLive) {
        const val = won.reduce((a, c) => a + c.value, 0);
        return { value: formatCurrency(val), change: "+8% vs last month", up: true };
      }
      const recent = won.filter((c) => c.stageChangedAt && new Date(c.stageChangedAt) >= thirtyDaysAgo);
      const prev = won.filter((c) => c.stageChangedAt && new Date(c.stageChangedAt) >= sixtyDaysAgo && new Date(c.stageChangedAt) < thirtyDaysAgo);
      const recentVal = recent.reduce((a, c) => a + c.value, 0);
      const prevVal = prev.reduce((a, c) => a + c.value, 0);
      return { value: formatCurrency(recentVal), ...pctChange(recentVal, prevVal) };
    },
  },
  {
    id: "active-deals", label: "Active Deals", icon: Users, category: "Pipeline",
    compute: ({ contacts, isLive }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      if (!isLive) return { value: active.length.toString(), change: "+3 vs last month", up: true };
      const { thirtyDaysAgo, sixtyDaysAgo } = getDateRanges();
      const newRecent = contacts.filter((c) => new Date(c.created) >= thirtyDaysAgo).length;
      const newPrev = contacts.filter((c) => new Date(c.created) >= sixtyDaysAgo && new Date(c.created) < thirtyDaysAgo).length;
      return { value: active.length.toString(), ...countChange(newRecent, newPrev) };
    },
  },
  {
    id: "new-contacts-30d", label: "New Contacts (30d)", icon: Users, category: "Pipeline",
    compute: ({ contacts, isLive }) => {
      const { thirtyDaysAgo, sixtyDaysAgo } = getDateRanges();
      const recent = contacts.filter((c) => new Date(c.created) >= thirtyDaysAgo).length;
      if (!isLive) return { value: recent.toString(), change: "+5 new", up: true };
      const prev = contacts.filter((c) => new Date(c.created) >= sixtyDaysAgo && new Date(c.created) < thirtyDaysAgo).length;
      return { value: recent.toString(), ...countChange(recent, prev) };
    },
  },
  {
    id: "avg-deal-size", label: "Avg. Deal Size", icon: BarChart3, category: "Pipeline",
    compute: ({ contacts }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      const avg = active.length > 0 ? Math.round(active.reduce((a, c) => a + c.value, 0) / active.length) : 0;
      return { value: formatCurrency(avg), change: `${active.length} deals`, up: true };
    },
  },
  {
    id: "win-rate", label: "Win Rate", icon: Percent, category: "Pipeline",
    compute: ({ contacts }) => {
      const won = contacts.filter((c) => isWonStage(c.stage)).length;
      const lost = contacts.filter((c) => isLostStage(c.stage)).length;
      const total = won + lost;
      const rate = total > 0 ? Math.round((won / total) * 100) : 0;
      return { value: `${rate}%`, change: `${won}W / ${lost}L`, up: rate >= 50 };
    },
  },
  {
    id: "open-tasks", label: "Open Tasks", icon: CheckSquare, category: "Tasks",
    compute: ({ tasks, isLive }) => {
      const open = tasks.filter((t) => !t.completed).length;
      const overdue = tasks.filter((t) => !t.completed && t.due && getTaskStatus(t.due, false) === "overdue").length;
      if (!isLive) return { value: open.toString(), change: overdue > 0 ? `${overdue} overdue` : "All on track", up: overdue === 0 };
      return { value: open.toString(), change: overdue > 0 ? `${overdue} overdue` : "All on track", up: overdue === 0 };
    },
  },
  {
    id: "tasks-completed-30d", label: "Tasks Done (30d)", icon: ClipboardCheck, category: "Tasks",
    compute: ({ tasks, isLive }) => {
      const { thirtyDaysAgo, sixtyDaysAgo } = getDateRanges();
      if (!isLive) {
        const done = tasks.filter((t) => t.completed).length;
        return { value: done.toString(), change: "+4 vs last month", up: true };
      }
      const recent = tasks.filter((t) => t.completedAt && new Date(t.completedAt) >= thirtyDaysAgo).length;
      const prev = tasks.filter((t) => t.completedAt && new Date(t.completedAt) >= sixtyDaysAgo && new Date(t.completedAt) < thirtyDaysAgo).length;
      return { value: recent.toString(), ...countChange(recent, prev) };
    },
  },
  {
    id: "task-completion-rate", label: "Completion Rate", icon: Target, category: "Tasks",
    compute: ({ tasks }) => {
      const total = tasks.length;
      const done = tasks.filter((t) => t.completed).length;
      const rate = total > 0 ? Math.round((done / total) * 100) : 0;
      return { value: `${rate}%`, change: `${done}/${total} tasks`, up: rate >= 50 };
    },
  },
  {
    id: "overdue-tasks", label: "Overdue Tasks", icon: Clock, category: "Tasks",
    compute: ({ tasks }) => {
      const overdue = tasks.filter((t) => !t.completed && t.due && getTaskStatus(t.due, false) === "overdue");
      const high = overdue.filter((t) => t.priority === "high").length;
      return { value: overdue.length.toString(), change: high > 0 ? `${high} high priority` : "None critical", up: overdue.length === 0 };
    },
  },
  {
    id: "activities-30d", label: "Activities (30d)", icon: Activity, category: "Activity",
    compute: ({ touchpoints, isLive }) => {
      const { thirtyDaysAgo, sixtyDaysAgo } = getDateRanges();
      if (!isLive) return { value: touchpoints.length.toString(), change: "+6 vs last month", up: true };
      const recent = touchpoints.filter((tp) => { try { return new Date(tp.date) >= thirtyDaysAgo; } catch { return false; } }).length;
      const prev = touchpoints.filter((tp) => { try { const d = new Date(tp.date); return d >= sixtyDaysAgo && d < thirtyDaysAgo; } catch { return false; } }).length;
      return { value: recent.toString(), ...countChange(recent, prev) };
    },
  },
  {
    id: "avg-touchpoints", label: "Avg. Touchpoints/Contact", icon: MessageSquare, category: "Activity",
    compute: ({ contacts, touchpoints }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      const avg = active.length > 0 ? (touchpoints.length / active.length).toFixed(1) : "0";
      return { value: avg, change: `${touchpoints.length} total`, up: parseFloat(avg) >= 2 };
    },
  },
  {
    id: "calls-30d", label: "Calls (30d)", icon: Phone, category: "Activity",
    compute: ({ touchpoints }) => {
      const { thirtyDaysAgo } = getDateRanges();
      const calls = touchpoints.filter((tp) => tp.type === "call");
      const recent = calls.filter((tp) => { try { return new Date(tp.date) >= thirtyDaysAgo; } catch { return false; } }).length;
      return { value: recent.toString(), change: `${calls.length} total`, up: true };
    },
  },
  {
    id: "meetings-30d", label: "Meetings (30d)", icon: Calendar, category: "Activity",
    compute: ({ touchpoints }) => {
      const { thirtyDaysAgo } = getDateRanges();
      const meetings = touchpoints.filter((tp) => tp.type === "meeting");
      const recent = meetings.filter((tp) => { try { return new Date(tp.date) >= thirtyDaysAgo; } catch { return false; } }).length;
      return { value: recent.toString(), change: `${meetings.length} total`, up: true };
    },
  },
  // Industry-specific
  {
    id: "pipeline-arr", label: "Pipeline ARR", icon: BarChart3, category: "SaaS",
    compute: ({ contacts }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      const arr = active.reduce((a, c) => a + c.value * 12, 0);
      return { value: formatCurrency(arr), change: `${active.length} deals`, up: true };
    },
  },
  {
    id: "active-trials", label: "Active Trials", icon: Clock, category: "SaaS",
    compute: ({ contacts }) => {
      const trials = contacts.filter((c) => c.stage.toLowerCase().includes("trial")).length;
      return { value: trials.toString(), change: "—", up: true };
    },
  },
  {
    id: "active-listings", label: "Active Listings", icon: Home, category: "Real Estate",
    compute: ({ contacts }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      return { value: active.length.toString(), change: "—", up: true };
    },
  },
  {
    id: "under-contract", label: "Under Contract", icon: FileText, category: "Real Estate",
    compute: ({ contacts }) => {
      const uc = contacts.filter((c) => c.stage.toLowerCase().includes("contract")).length;
      return { value: uc.toString(), change: "—", up: true };
    },
  },
  {
    id: "active-candidates", label: "Active Candidates", icon: Users, category: "Recruiting",
    compute: ({ contacts }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      return { value: active.length.toString(), change: "—", up: true };
    },
  },
  {
    id: "hires-30d", label: "Hires (30d)", icon: UserCheck, category: "Recruiting",
    compute: ({ contacts, isLive }) => {
      const won = contacts.filter((c) => isWonStage(c.stage));
      if (!isLive) return { value: won.length.toString(), change: "+1", up: true };
      const { thirtyDaysAgo } = getDateRanges();
      const recent = won.filter((c) => c.stageChangedAt && new Date(c.stageChangedAt) >= thirtyDaysAgo).length;
      return { value: recent.toString(), change: "—", up: true };
    },
  },
  {
    id: "active-jobs", label: "Active Jobs", icon: Wrench, category: "Services",
    compute: ({ contacts }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      return { value: active.length.toString(), change: "—", up: true };
    },
  },
  {
    id: "scheduled-jobs", label: "Scheduled", icon: Calendar, category: "Services",
    compute: ({ contacts }) => {
      const scheduled = contacts.filter((c) => c.stage.toLowerCase().includes("scheduled")).length;
      return { value: scheduled.toString(), change: "—", up: true };
    },
  },
];

// Default KPI selections by industry
const defaultKpisByIndustry: Record<string, string[]> = {
  "b2b-sales": ["pipeline-value", "won-revenue-30d", "active-deals", "open-tasks"],
  "b2b": ["pipeline-value", "won-revenue-30d", "active-deals", "open-tasks"],
  "saas": ["pipeline-arr", "won-revenue-30d", "active-trials", "open-tasks"],
  "realestate": ["active-listings", "under-contract", "won-revenue-30d", "activities-30d"],
  "real-estate": ["active-listings", "under-contract", "won-revenue-30d", "activities-30d"],
  "recruiting": ["active-candidates", "hires-30d", "open-tasks", "activities-30d"],
  "consulting": ["pipeline-value", "won-revenue-30d", "activities-30d", "tasks-completed-30d"],
  "services": ["active-jobs", "scheduled-jobs", "won-revenue-30d", "tasks-completed-30d"],
  "home-services": ["active-jobs", "scheduled-jobs", "won-revenue-30d", "tasks-completed-30d"],
};

export function getDefaultKpis(industryId: string): string[] {
  return defaultKpisByIndustry[industryId] || defaultKpisByIndustry["b2b-sales"];
}

// =============================================
// KPI Picker Modal
// =============================================

function KpiPickerModal({ selected, onSave, onClose }: {
  selected: string[];
  onSave: (ids: string[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<string[]>([...selected]);

  const categories = Array.from(new Set(allMetrics.map((m) => m.category)));

  function toggle(id: string) {
    setDraft((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev; // Max 4
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
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-foreground">Customize Dashboard</h3>
            <p className="text-xs text-muted mt-0.5">Choose up to 4 metrics to display</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted hover:text-foreground rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Selected KPIs — reorderable */}
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
                      <button onClick={() => moveUp(id)} disabled={idx === 0} className="text-muted hover:text-foreground disabled:opacity-20"><ArrowUpRight className="w-3 h-3 -rotate-45" /></button>
                      <button onClick={() => moveDown(id)} disabled={idx === draft.length - 1} className="text-muted hover:text-foreground disabled:opacity-20"><ArrowDownRight className="w-3 h-3 rotate-45" /></button>
                    </div>
                    <Icon className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-sm font-medium text-foreground flex-1">{metric.label}</span>
                    <span className="text-[10px] text-muted">{metric.category}</span>
                    <button onClick={() => toggle(id)} className="p-1 text-muted hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Available metrics by category */}
          <div className="px-5 py-3 space-y-4">
            {categories.map((cat) => {
              const metrics = allMetrics.filter((m) => m.category === cat);
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

// =============================================
// Dashboard View
// =============================================

interface DashboardViewProps {
  touchpoints: Touchpoint[];
  tasks: Task[];
  contacts: Contact[];
  stages: StageDefinition[];
  industryId?: string;
  isLive?: boolean;
  isAdmin?: boolean;
  selectedKpis?: string[];
  onUpdateKpis?: (ids: string[]) => void;
  onSelectContact: (id: string) => void;
  onNavigate: (view: "dashboard" | "pipeline" | "contacts" | "activity" | "tasks") => void;
  onSelectTask?: (id: string) => void;
}

export default function DashboardView({ touchpoints, tasks, contacts, stages, industryId, isLive, isAdmin, selectedKpis, onUpdateKpis, onSelectContact, onNavigate, onSelectTask }: DashboardViewProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Determine which KPIs to show
  const kpiIds = selectedKpis && selectedKpis.length > 0
    ? selectedKpis
    : getDefaultKpis(industryId || "b2b-sales");

  // Compute KPI values
  const ctx: KpiContext = { contacts, tasks, touchpoints, stages, isLive: !!isLive };
  const statCards = kpiIds.map((id) => {
    const metric = allMetrics.find((m) => m.id === id);
    if (!metric) return null;
    const result = metric.compute(ctx);
    return { label: metric.label, icon: metric.icon, ...result };
  }).filter(Boolean) as { label: string; icon: LucideIcon; value: string; change: string; up: boolean }[];

  const pipelineCounts = stages.filter((s) => !s.label.toLowerCase().includes("won") && !s.label.toLowerCase().includes("lost") && !s.label.toLowerCase().includes("hired") && !s.label.toLowerCase().includes("rejected") && !s.label.toLowerCase().includes("engaged") && !s.label.toLowerCase().includes("completed") && !s.label.toLowerCase().includes("cancelled")).slice(0, 5).map((s) => ({
    ...s,
    count: contacts.filter((c) => c.stage === s.label).length,
    value: contacts.filter((c) => c.stage === s.label).reduce((a, c) => a + c.value, 0),
  }));

  const maxStageValue = Math.max(...pipelineCounts.map((s) => s.value), 1);
  const recentTouchpoints = touchpoints.slice(0, 5);
  const urgentTasks = tasks.filter((t) => !t.completed).slice(0, 5);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl">
      {/* Stat cards with customize button */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Key Metrics</h2>
          {isAdmin && (
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted hover:text-foreground border border-border hover:border-gray-300 rounded-lg transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Customize
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted font-medium">{stat.label}</span>
                <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-accent" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${stat.change === "—" || stat.change === "No change" ? "text-muted" : stat.up ? "text-emerald-600" : "text-amber-600"}`}>
                {stat.change === "—" ? (
                  <span>—</span>
                ) : stat.change === "No change" ? (
                  <span>No change</span>
                ) : (
                  <>
                    {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline summary */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Pipeline Overview</h3>
            <button
              onClick={() => onNavigate("pipeline")}
              className="text-xs text-accent hover:text-accent-dark font-medium"
            >
              View pipeline
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
          </div>
        </div>

        {/* Urgent tasks */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Tasks</h3>
            <button
              onClick={() => onNavigate("tasks")}
              className="text-xs text-accent hover:text-accent-dark font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-border">
            {urgentTasks.map((t) => {
              const contact = contacts.find((c) => c.id === t.contactId);
              return (
                <div
                  key={t.id}
                  className="px-5 py-3 hover:bg-surface/50 transition-colors cursor-pointer"
                  onClick={() => onSelectTask?.(t.id)}
                >
                  <div className="text-sm text-foreground">{t.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        getTaskStatus(t.due, t.completed) === "overdue"
                          ? "bg-red-100 text-red-700"
                          : getTaskStatus(t.due, t.completed) === "today"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {formatDueDate(t.due)}
                    </span>
                    {contact && (
                      <span className="text-xs text-muted">{contact.name}</span>
                    )}
                  </div>
                </div>
              );
            })}
            {urgentTasks.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted">No upcoming tasks</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          <button
            onClick={() => onNavigate("activity")}
            className="text-xs text-accent hover:text-accent-dark font-medium"
          >
            View all
          </button>
        </div>
        <div className="divide-y divide-border">
          {recentTouchpoints.map((t) => {
            const contact = contacts.find((c) => c.id === t.contactId);
            const Icon = typeIcons[t.type];
            return (
              <div
                key={t.id}
                className="flex gap-3 px-5 py-3 hover:bg-surface/50 transition-colors cursor-pointer"
                onClick={() => contact && onSelectContact(contact.id)}
              >
                <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{t.title}</div>
                  <div className="text-xs text-muted truncate">
                    {contact ? `${contact.name} · ` : ""}{t.type} · {t.date}
                  </div>
                </div>
              </div>
            );
          })}
          {recentTouchpoints.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted">No recent activity</div>
          )}
        </div>
      </div>

      {/* KPI Picker Modal */}
      {showPicker && (
        <KpiPickerModal
          selected={kpiIds}
          onSave={(ids) => onUpdateKpis?.(ids)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
