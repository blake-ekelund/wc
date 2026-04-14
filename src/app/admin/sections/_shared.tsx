"use client";

import { type LucideIcon, LayoutDashboard } from "lucide-react";

// ============================================================
// TYPES
// ============================================================

export interface Conversation {
  id: string;
  user_email: string;
  user_name: string;
  subject: string;
  status: "new" | "active" | "resolved" | "closed";
  admin_notes: string;
  last_message_at: string;
  created_at: string;
}

export interface ConvMessage {
  id: string;
  conversation_id: string;
  sender: "user" | "admin" | "bot";
  sender_name: string;
  message: string;
  created_at: string;
}

export interface WorkspaceStat {
  id: string;
  name: string;
  industry: string | null;
  plan: string;
  created_at: string;
  member_count: number;
  contact_count: number;
  task_count: number;
  owner_email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  enabled_plugins: string[];
}

export interface DemoSession {
  id: string;
  email: string;
  name: string;
  industry: string;
  started_at: string;
  last_active_at: string;
  duration_seconds: number;
  pages_visited: string[];
  features_used: string[];
  clicked_signup: boolean;
  clicked_signup_at: string | null;
  converted_to_user: boolean;
  converted_at: string | null;
}

export interface ActivityEvent {
  id: string;
  type: "signup" | "conversion" | "upgrade" | "downgrade" | "support_ticket" | "workspace_created" | "invite_sent";
  description: string;
  user_email?: string;
  workspace_name?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsPoint {
  label: string;
  visitors: number;
  demos: number;
  signups: number;
  conversions: number;
}

export interface PersonRecord {
  id: string;
  email: string;
  name: string;
  type: "user" | "subscriber" | "both";
  workspace_name?: string;
  role?: string;
  subscribed_at?: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "update";
  active: boolean;
  created_at: string;
  expires_at: string | null;
}

export type AdminSection = "overview" | "support" | "revenue" | "workspaces" | "people" | "activity" | "health" | "announcements" | "security" | "usage" | "sales" | "tech-debt" | "ui-ux" | "seo" | "metrics" | "valuation" | "admin-security";

export const statusConfig = {
  new: { label: "New", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
  active: { label: "Active", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  resolved: { label: "Resolved", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
};

export type AuditHistoryRun = { id: string; audit_type: string; trigger: string; summary: Record<string, number>; created_at: string; duration_ms: number };

export type ScanFinding = { id: string; severity: "critical" | "high" | "medium" | "low"; title: string; description: string; category: string };
export type ScanSummaryType = { total: number; critical: number; high: number; medium: number; low: number; scannedAt: string };

// ============================================================
// ADMIN FETCH HELPER
// ============================================================

export async function adminFetch(action: string, body: Record<string, unknown> = {}) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  if (res.status === 401) {
    throw new Error("Unauthorized");
  }
  return res.json();
}

// ============================================================
// FORMAT HELPERS
// ============================================================

export function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffMin < 1440) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

// ============================================================
// SHARED COMPONENTS
// ============================================================

export function KpiCard({ icon: Icon, iconBg, iconColor, value, label, prefix }: {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: number | string;
  label: string;
  prefix?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center mb-2`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="text-2xl font-bold text-gray-900">{typeof prefix === "string" ? "" : ""}{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

export function AuditFindingsList({ findings, dismissed, showDismissed, onToggleDismiss, onToggleShowDismissed }: {
  findings: { id: string; severity: string; title: string; description: string; category: string }[];
  dismissed: Record<string, boolean>;
  showDismissed: boolean;
  onToggleDismiss: (id: string) => void;
  onToggleShowDismissed: () => void;
}) {
  const sevColors: Record<string, { bg: string; text: string; dot: string }> = {
    critical: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    high: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    medium: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    low: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
  };

  const activeItems = findings.filter((f) => !dismissed[f.id]);
  const dismissedItems = findings.filter((f) => dismissed[f.id]);
  const displayItems = showDismissed ? findings : activeItems;

  if (findings.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Findings</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{activeItems.length} active</span>
        </div>
        {dismissedItems.length > 0 && (
          <button onClick={onToggleShowDismissed} className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
            {showDismissed ? "Hide resolved" : `Show ${dismissedItems.length} resolved`}
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {displayItems.map((item) => {
          const isDismissed = dismissed[item.id] || false;
          const colors = sevColors[item.severity] || sevColors.low;
          return (
            <div
              key={item.id}
              onClick={() => onToggleDismiss(item.id)}
              className={`px-5 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors ${isDismissed ? "opacity-40" : ""}`}
            >
              <div className={`mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isDismissed ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`} style={{ width: 18, height: 18 }}>
                {isDismissed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />{item.severity.toUpperCase()}
                  </span>
                  <span className={`text-sm font-medium ${isDismissed ? "line-through text-gray-400" : "text-gray-900"}`}>{item.title}</span>
                </div>
                <p className={`text-xs mt-0.5 leading-relaxed ${isDismissed ? "text-gray-300" : "text-gray-500"}`}>{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Shared severity colors map used by multiple audit sections
export const severityColors: Record<string, { bg: string; text: string; dot: string }> = {
  critical: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  high: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  medium: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  low: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
};

// Shared audit history panel component
export function AuditHistoryPanel({ history, type }: { history: AuditHistoryRun[]; type: "findings" | "health" }) {
  if (history.length === 0) return <div className="p-6 text-center text-xs text-gray-400">No history yet</div>;
  return (
    <div className="divide-y divide-gray-50">
      {history.map((run, i) => {
        const s = run.summary as Record<string, number>;
        if (type === "health") {
          return (
            <div key={run.id} className="px-5 py-3 flex items-center justify-between">
              <div><div className="text-xs font-medium text-gray-900">{new Date(run.created_at).toLocaleString()}</div><div className="text-[10px] text-gray-400 mt-0.5">{run.trigger === "cron" ? "Automated" : "Manual"} &middot; {run.duration_ms}ms</div></div>
              <div className="flex items-center gap-3">
                {(s.down || 0) > 0 && <span className="text-[10px] font-semibold text-red-600">{s.down} down</span>}
                {(s.warning || 0) > 0 && <span className="text-[10px] font-semibold text-amber-600">{s.warning} warn</span>}
                <div className="text-right"><div className="text-sm font-bold text-gray-900">{s.healthy || 0}/{s.total || 0}</div><div className="text-[10px] text-gray-400">healthy</div></div>
              </div>
            </div>
          );
        }
        // findings type
        const prev = history[i + 1];
        const totalNow = s?.total || 0;
        const totalPrev = prev ? (prev.summary?.total || 0) : null;
        const trend = totalPrev !== null ? totalNow - totalPrev : null;
        return (
          <div key={run.id} className="px-5 py-3 flex items-center justify-between">
            <div><div className="text-xs font-medium text-gray-900">{new Date(run.created_at).toLocaleString()}</div><div className="text-[10px] text-gray-400 mt-0.5">{run.trigger === "cron" ? "Automated" : "Manual"} &middot; {run.duration_ms}ms</div></div>
            <div className="flex items-center gap-3">
              {trend !== null && trend !== 0 && (<span className={`text-[10px] font-semibold ${trend < 0 ? "text-emerald-600" : "text-red-600"}`}>{trend > 0 ? "+" : ""}{trend}</span>)}
              <div className="text-right"><div className="text-sm font-bold text-gray-900">{totalNow}</div><div className="text-[10px] text-gray-400">finding(s)</div></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Shared audit summary bar component
export function AuditSummaryBar({ summary, label }: { summary: ScanSummaryType; label: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${summary.critical > 0 ? "bg-red-500 animate-pulse" : summary.high > 0 ? "bg-amber-500" : summary.medium > 0 ? "bg-blue-500" : "bg-emerald-500"}`} />
          <span className="text-sm font-medium text-gray-900">{label}</span>
        </div>
        <span className="text-xs text-gray-400">{summary.total} finding(s)</span>
      </div>
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Total", count: summary.total, color: "text-gray-900" },
          { label: "Critical", count: summary.critical, color: summary.critical > 0 ? "text-red-600" : "text-gray-300" },
          { label: "High", count: summary.high, color: summary.high > 0 ? "text-amber-600" : "text-gray-300" },
          { label: "Medium", count: summary.medium, color: summary.medium > 0 ? "text-blue-600" : "text-gray-300" },
          { label: "Low", count: summary.low, color: summary.low > 0 ? "text-gray-500" : "text-gray-300" },
        ].map((ct) => (
          <div key={ct.label} className="text-center"><div className={`text-xl font-bold ${ct.color}`}>{ct.count}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{ct.label}</div></div>
        ))}
      </div>
    </div>
  );
}
