"use client";

import { useState, useEffect } from "react";
import { Loader2, Activity, Server } from "lucide-react";
import { adminFetch, type AuditHistoryRun, AuditHistoryPanel } from "./_shared";

export default function HealthSection() {
  const [healthFindings, setHealthFindings] = useState<{ id: string; status: "healthy" | "warning" | "degraded" | "down"; title: string; description: string; category: string; metric?: string }[]>([]);
  const [healthSummary, setHealthSummary] = useState<{ total: number; healthy: number; warning: number; degraded: number; down: number; checkedAt: string } | null>(null);
  const [healthChecking, setHealthChecking] = useState(false);
  const [lastHealthTime, setLastHealthTime] = useState<string | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditHistoryRun[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedHealth = localStorage.getItem("admin-health-findings");
        const savedHealthSummary = localStorage.getItem("admin-health-summary");
        if (savedHealth) setHealthFindings(JSON.parse(savedHealth));
        if (savedHealthSummary) setHealthSummary(JSON.parse(savedHealthSummary));
        setLastHealthTime(localStorage.getItem("admin-last-health-time"));
      } catch { /* ignore */ }
    }
    adminFetch("get-latest-audit", { audit_type: "health_check" }).then((data) => {
      if (data.run) {
        setHealthFindings(data.run.findings || []);
        setHealthSummary(data.run.summary || null);
        setLastHealthTime(data.run.created_at);
      }
    }).catch(() => {});
  }, []);

  async function runHealthCheck() {
    setHealthChecking(true);
    try {
      const data = await adminFetch("run-health-check");
      if (data.findings) {
        setHealthFindings(data.findings);
        setHealthSummary(data.summary);
        const now = new Date().toISOString();
        setLastHealthTime(now);
        localStorage.setItem("admin-last-health-time", now);
        localStorage.setItem("admin-health-findings", JSON.stringify(data.findings));
        localStorage.setItem("admin-health-summary", JSON.stringify(data.summary));
      }
    } catch { /* silenced */ }
    setHealthChecking(false);
  }

  async function loadAuditHistory() {
    try {
      const data = await adminFetch("get-audit-history", { audit_type: "health_check", limit: 10 });
      if (data.runs) setAuditHistory(data.runs);
    } catch { /* ignore */ }
  }

  const statusColors: Record<string, { dot: string; badge: string; text: string }> = {
    healthy: { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700", text: "Healthy" },
    warning: { dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700", text: "Warning" },
    degraded: { dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700", text: "Degraded" },
    down: { dot: "bg-red-500", badge: "bg-red-100 text-red-700", text: "Down" },
  };
  const healthCategories = [...new Set(healthFindings.map(f => f.category))];
  const issueCount = healthFindings.filter(f => f.status !== "healthy").length;

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">System Health</h2>
          <p className="text-xs text-gray-400 mt-0.5">{lastHealthTime ? `Last check: ${new Date(lastHealthTime).toLocaleString()}` : "No checks run yet"}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setHistoryExpanded(!historyExpanded); if (!auditHistory.length) loadAuditHistory(); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{historyExpanded ? "Hide History" : "History"}</button>
          <button onClick={runHealthCheck} disabled={healthChecking} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-60">
            {healthChecking ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...</>) : (<><Activity className="w-3.5 h-3.5" /> Run Check</>)}
          </button>
        </div>
      </div>

      {healthSummary && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${healthSummary.down > 0 ? "bg-red-500 animate-pulse" : healthSummary.degraded > 0 ? "bg-orange-500 animate-pulse" : healthSummary.warning > 0 ? "bg-amber-500" : "bg-emerald-500"}`} />
              <span className="text-sm font-medium text-gray-900">
                {healthSummary.down > 0 ? "Services Down" : healthSummary.degraded > 0 ? "Performance Degraded" : healthSummary.warning > 0 ? "Warnings Detected" : "All Systems Operational"}
              </span>
            </div>
            <span className="text-xs text-gray-400">{issueCount === 0 ? "No issues" : `${issueCount} issue${issueCount !== 1 ? "s" : ""}`}</span>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Checks", count: healthSummary.total, color: "text-gray-900" },
              { label: "Healthy", count: healthSummary.healthy, color: healthSummary.healthy > 0 ? "text-emerald-600" : "text-gray-300" },
              { label: "Warning", count: healthSummary.warning, color: healthSummary.warning > 0 ? "text-amber-600" : "text-gray-300" },
              { label: "Degraded", count: healthSummary.degraded, color: healthSummary.degraded > 0 ? "text-orange-600" : "text-gray-300" },
              { label: "Down", count: healthSummary.down, color: healthSummary.down > 0 ? "text-red-600" : "text-gray-300" },
            ].map(c => (
              <div key={c.label} className="text-center">
                <div className={`text-xl font-bold ${c.color}`}>{c.count}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {healthFindings.length === 0 && !healthChecking && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Server className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Run your first health check</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">Tests live connectivity to Supabase, Stripe, and SMTP. Checks database integrity, growth trends, and proactively flags potential issues.</p>
          <button onClick={runHealthCheck} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"><Activity className="w-3.5 h-3.5" /> Run Check</button>
        </div>
      )}

      {healthChecking && healthFindings.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Loader2 className="w-7 h-7 text-gray-400 animate-spin mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Checking your system...</h3>
          <p className="text-xs text-gray-500">Testing services, database, endpoints, and growth trends...</p>
        </div>
      )}

      {healthCategories.map(cat => {
        const catFindings = healthFindings.filter(f => f.category === cat);
        const catIssues = catFindings.filter(f => f.status !== "healthy").length;
        return (
          <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{cat}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{catFindings.length}</span>
              </div>
              <span className="text-[10px] text-gray-400">{catIssues === 0 ? "All healthy" : `${catIssues} issue${catIssues !== 1 ? "s" : ""}`}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {catFindings.map(f => {
                const colors = statusColors[f.status];
                return (
                  <div key={f.id} className="px-5 py-3 flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors.dot} ${f.status === "down" ? "animate-pulse" : ""}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-gray-900 truncate">{f.title}</span>
                      </div>
                      <p className="text-xs text-gray-500">{f.description}</p>
                    </div>
                    {f.metric && (<span className="text-xs font-mono text-gray-400 shrink-0">{f.metric}</span>)}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {historyExpanded && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Check History</h3></div>
          <AuditHistoryPanel history={auditHistory} type="health" />
        </div>
      )}
    </div>
  );
}
