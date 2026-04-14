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
  Activity,
  Percent,
  MessageSquare,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { type Contact, type Touchpoint, type Task, type StageDefinition, type Vendor, type VendorContract, type CustomerContract, formatCurrency, getTaskStatus } from "../../data";
import KpiPickerModal from "./kpi-picker";

// =============================================
// KPI Metric Definitions
// =============================================

export interface KpiMetricDef {
  id: string;
  label: string;
  icon: LucideIcon;
  category: string;
  pluginReq?: string; // which plugin is needed: "crm" | "vendors" | undefined (always)
  compute: (ctx: KpiContext) => { value: string; change: string; up: boolean };
}

export interface KpiContext {
  contacts: Contact[];
  tasks: Task[];
  touchpoints: Touchpoint[];
  stages: StageDefinition[];
  isLive: boolean;
  vendors: Vendor[];
  vendorContracts: VendorContract[];
  customerContracts: CustomerContract[];
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
  if (prev === 0 && current === 0) return { change: "\u2014", up: true };
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
export const allMetrics: KpiMetricDef[] = [
  // Pipeline (CRM)
  {
    id: "pipeline-value", label: "Pipeline Value", icon: DollarSign, category: "Pipeline", pluginReq: "crm",
    compute: ({ contacts }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      const val = active.reduce((a, c) => a + c.value, 0);
      return { value: formatCurrency(val), change: `${active.length} active deals`, up: true };
    },
  },
  {
    id: "won-revenue-30d", label: "Won Revenue (30d)", icon: TrendingUp, category: "Pipeline", pluginReq: "crm",
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
    id: "active-deals", label: "Active Deals", icon: Users, category: "Pipeline", pluginReq: "crm",
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
    id: "new-contacts-30d", label: "New Contacts (30d)", icon: Users, category: "Pipeline", pluginReq: "crm",
    compute: ({ contacts, isLive }) => {
      const { thirtyDaysAgo, sixtyDaysAgo } = getDateRanges();
      const recent = contacts.filter((c) => new Date(c.created) >= thirtyDaysAgo).length;
      if (!isLive) return { value: recent.toString(), change: "+5 new", up: true };
      const prev = contacts.filter((c) => new Date(c.created) >= sixtyDaysAgo && new Date(c.created) < thirtyDaysAgo).length;
      return { value: recent.toString(), ...countChange(recent, prev) };
    },
  },
  {
    id: "avg-deal-size", label: "Avg. Deal Size", icon: BarChart3, category: "Pipeline", pluginReq: "crm",
    compute: ({ contacts }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      const avg = active.length > 0 ? Math.round(active.reduce((a, c) => a + c.value, 0) / active.length) : 0;
      return { value: formatCurrency(avg), change: `${active.length} deals`, up: true };
    },
  },
  {
    id: "win-rate", label: "Win Rate", icon: Percent, category: "Pipeline", pluginReq: "crm",
    compute: ({ contacts }) => {
      const won = contacts.filter((c) => isWonStage(c.stage)).length;
      const lost = contacts.filter((c) => isLostStage(c.stage)).length;
      const total = won + lost;
      const rate = total > 0 ? Math.round((won / total) * 100) : 0;
      return { value: `${rate}%`, change: `${won}W / ${lost}L`, up: rate >= 50 };
    },
  },
  // Tasks (always)
  {
    id: "open-tasks", label: "Open Tasks", icon: CheckSquare, category: "Tasks",
    compute: ({ tasks }) => {
      const open = tasks.filter((t) => !t.completed).length;
      const overdue = tasks.filter((t) => !t.completed && t.due && getTaskStatus(t.due, false) === "overdue").length;
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
  // Activity (CRM)
  {
    id: "activities-30d", label: "Activities (30d)", icon: Activity, category: "Activity", pluginReq: "crm",
    compute: ({ touchpoints, isLive }) => {
      const { thirtyDaysAgo, sixtyDaysAgo } = getDateRanges();
      if (!isLive) return { value: touchpoints.length.toString(), change: "+6 vs last month", up: true };
      const recent = touchpoints.filter((tp) => { try { return new Date(tp.date) >= thirtyDaysAgo; } catch { return false; } }).length;
      const prev = touchpoints.filter((tp) => { try { const d = new Date(tp.date); return d >= sixtyDaysAgo && d < thirtyDaysAgo; } catch { return false; } }).length;
      return { value: recent.toString(), ...countChange(recent, prev) };
    },
  },
  {
    id: "avg-touchpoints", label: "Avg. Touchpoints/Contact", icon: MessageSquare, category: "Activity", pluginReq: "crm",
    compute: ({ contacts, touchpoints }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      const avg = active.length > 0 ? (touchpoints.length / active.length).toFixed(1) : "0";
      return { value: avg, change: `${touchpoints.length} total`, up: parseFloat(avg) >= 2 };
    },
  },
  {
    id: "calls-30d", label: "Calls (30d)", icon: Phone, category: "Activity", pluginReq: "crm",
    compute: ({ touchpoints }) => {
      const { thirtyDaysAgo } = getDateRanges();
      const calls = touchpoints.filter((tp) => tp.type === "call");
      const recent = calls.filter((tp) => { try { return new Date(tp.date) >= thirtyDaysAgo; } catch { return false; } }).length;
      return { value: recent.toString(), change: `${calls.length} total`, up: true };
    },
  },
  {
    id: "meetings-30d", label: "Meetings (30d)", icon: Calendar, category: "Activity", pluginReq: "crm",
    compute: ({ touchpoints }) => {
      const { thirtyDaysAgo } = getDateRanges();
      const meetings = touchpoints.filter((tp) => tp.type === "meeting");
      const recent = meetings.filter((tp) => { try { return new Date(tp.date) >= thirtyDaysAgo; } catch { return false; } }).length;
      return { value: recent.toString(), change: `${meetings.length} total`, up: true };
    },
  },
  // Industry-specific (CRM)
  {
    id: "pipeline-arr", label: "Pipeline ARR", icon: BarChart3, category: "SaaS", pluginReq: "crm",
    compute: ({ contacts }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      const arr = active.reduce((a, c) => a + c.value * 12, 0);
      return { value: formatCurrency(arr), change: `${active.length} deals`, up: true };
    },
  },
  {
    id: "active-trials", label: "Active Trials", icon: Clock, category: "SaaS", pluginReq: "crm",
    compute: ({ contacts }) => {
      const trials = contacts.filter((c) => c.stage.toLowerCase().includes("trial")).length;
      return { value: trials.toString(), change: "\u2014", up: true };
    },
  },
  {
    id: "active-listings", label: "Active Listings", icon: Home, category: "Real Estate", pluginReq: "crm",
    compute: ({ contacts }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      return { value: active.length.toString(), change: "\u2014", up: true };
    },
  },
  {
    id: "under-contract", label: "Under Contract", icon: FileText, category: "Real Estate", pluginReq: "crm",
    compute: ({ contacts }) => {
      const uc = contacts.filter((c) => c.stage.toLowerCase().includes("contract")).length;
      return { value: uc.toString(), change: "\u2014", up: true };
    },
  },
  {
    id: "active-candidates", label: "Active Candidates", icon: Users, category: "Recruiting", pluginReq: "crm",
    compute: ({ contacts }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      return { value: active.length.toString(), change: "\u2014", up: true };
    },
  },
  {
    id: "hires-30d", label: "Hires (30d)", icon: UserCheck, category: "Recruiting", pluginReq: "crm",
    compute: ({ contacts, isLive }) => {
      const won = contacts.filter((c) => isWonStage(c.stage));
      if (!isLive) return { value: won.length.toString(), change: "+1", up: true };
      const { thirtyDaysAgo } = getDateRanges();
      const recent = won.filter((c) => c.stageChangedAt && new Date(c.stageChangedAt) >= thirtyDaysAgo).length;
      return { value: recent.toString(), change: "\u2014", up: true };
    },
  },
  {
    id: "active-jobs", label: "Active Jobs", icon: Wrench, category: "Services", pluginReq: "crm",
    compute: ({ contacts }) => {
      const active = contacts.filter((c) => !isTerminal(c.stage));
      return { value: active.length.toString(), change: "\u2014", up: true };
    },
  },
  {
    id: "scheduled-jobs", label: "Scheduled", icon: Calendar, category: "Services", pluginReq: "crm",
    compute: ({ contacts }) => {
      const scheduled = contacts.filter((c) => c.stage.toLowerCase().includes("scheduled")).length;
      return { value: scheduled.toString(), change: "\u2014", up: true };
    },
  },
  // Vendor KPIs
  {
    id: "vendor-total", label: "Total Vendors", icon: Truck, category: "Vendors", pluginReq: "vendors",
    compute: ({ vendors }) => {
      return { value: vendors.length.toString(), change: "\u2014", up: true };
    },
  },
  {
    id: "vendor-active-contracts", label: "Active Contracts", icon: FileText, category: "Vendors", pluginReq: "vendors",
    compute: ({ vendorContracts }) => {
      const active = vendorContracts.filter((c) => c.status === "active").length;
      return { value: active.toString(), change: `${vendorContracts.length} total`, up: true };
    },
  },
  {
    id: "vendor-expiring-30d", label: "Expiring (30d)", icon: Clock, category: "Vendors", pluginReq: "vendors",
    compute: ({ vendorContracts }) => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const expiring = vendorContracts.filter((c) => {
        if (c.status !== "active" || !c.endDate) return false;
        const end = new Date(c.endDate);
        return end >= now && end <= thirtyDaysFromNow;
      }).length;
      return { value: expiring.toString(), change: expiring > 0 ? "Action needed" : "All clear", up: expiring === 0 };
    },
  },
  // Customer Contract KPIs
  {
    id: "customer-contracts-active", label: "Active Contracts", icon: FileText, category: "Customer Contracts", pluginReq: "crm",
    compute: ({ customerContracts }) => {
      const active = customerContracts.filter((c) => c.status === "active").length;
      const totalValue = customerContracts.filter((c) => c.status === "active").reduce((a, c) => a + (c.value || 0), 0);
      return { value: active.toString(), change: formatCurrency(totalValue), up: true };
    },
  },
  {
    id: "customer-contracts-draft", label: "Draft Contracts", icon: FileText, category: "Customer Contracts", pluginReq: "crm",
    compute: ({ customerContracts }) => {
      const draft = customerContracts.filter((c) => c.status === "draft").length;
      return { value: draft.toString(), change: draft > 0 ? "Needs review" : "None pending", up: draft === 0 };
    },
  },
];

// Default KPI selections by industry
export const defaultKpisByIndustry: Record<string, string[]> = {
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
// KPI Cards Component
// =============================================

interface KpiCardsProps {
  contacts: Contact[];
  tasks: Task[];
  touchpoints: Touchpoint[];
  stages: StageDefinition[];
  vendors?: Vendor[];
  vendorContracts?: VendorContract[];
  customerContracts?: CustomerContract[];
  enabledPlugins?: string[];
  selectedKpis?: string[];
  onUpdateKpis?: (ids: string[]) => void;
  isAdmin?: boolean;
  industryId?: string;
  isLive?: boolean;
}

export default function KpiCards({
  contacts, tasks, touchpoints, stages, vendors, vendorContracts, customerContracts,
  enabledPlugins, selectedKpis, onUpdateKpis, isAdmin, industryId, isLive,
}: KpiCardsProps) {
  const [showPicker, setShowPicker] = useState(false);

  const kpiIds = selectedKpis && selectedKpis.length > 0
    ? selectedKpis
    : getDefaultKpis(industryId || "b2b-sales");

  const ctx: KpiContext = {
    contacts, tasks, touchpoints, stages, isLive: !!isLive,
    vendors: vendors || [], vendorContracts: vendorContracts || [], customerContracts: customerContracts || [],
  };

  const statCards = kpiIds.map((id) => {
    const metric = allMetrics.find((m) => m.id === id);
    if (!metric) return null;
    const result = metric.compute(ctx);
    return { label: metric.label, icon: metric.icon, ...result };
  }).filter(Boolean) as { label: string; icon: LucideIcon; value: string; change: string; up: boolean }[];

  return (
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
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${stat.change === "\u2014" || stat.change === "No change" ? "text-muted" : stat.up ? "text-emerald-600" : "text-amber-600"}`}>
              {stat.change === "\u2014" ? (
                <span>{"\u2014"}</span>
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

      {showPicker && (
        <KpiPickerModal
          selected={kpiIds}
          enabledPlugins={enabledPlugins}
          onSave={(ids) => onUpdateKpis?.(ids)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
