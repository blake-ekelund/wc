"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Zap } from "lucide-react";
import { adminFetch } from "./_shared";

export default function UsageSection() {
  const [usageData, setUsageData] = useState<{ topEvents: { name: string; count: number }[]; dailyActivity: { date: string; count: number }[]; totalEvents: number; uniqueEvents: number; uniqueUsers: number; period: number; priorPeriodEvents?: number; priorPeriodUsers?: number } | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usagePeriod, setUsagePeriod] = useState<7 | 30 | 90>(30);

  async function loadFeatureUsage(days: number = usagePeriod) {
    setUsageLoading(true);
    try { const data = await adminFetch("get-feature-usage", { days }); setUsageData(data); } catch { /* silenced */ }
    setUsageLoading(false);
  }

  const uiInventory: { category: string; items: { event: string; label: string; location: string }[] }[] = [
    { category: "Navigation", items: [
      { event: "nav.dashboard", label: "Dashboard", location: "Sidebar" },
      { event: "nav.contacts", label: "Contacts", location: "Sidebar" },
      { event: "nav.pipeline", label: "Pipeline", location: "Sidebar" },
      { event: "nav.tasks", label: "Tasks", location: "Sidebar" },
      { event: "nav.calendar", label: "Calendar", location: "Sidebar" },
      { event: "nav.activity", label: "Activity Feed", location: "Sidebar" },
      { event: "nav.recommendations", label: "Recommendations", location: "Sidebar" },
      { event: "nav.reports", label: "Reports", location: "Sidebar" },
      { event: "nav.settings", label: "Settings", location: "Sidebar" },
      { event: "nav.import", label: "Import", location: "Sidebar" },
      { event: "nav.export", label: "Export", location: "Sidebar" },
    ]},
    { category: "Contacts", items: [
      { event: "contact.created", label: "Create Contact", location: "New Contact Modal" },
      { event: "contact.searched", label: "Search Contacts", location: "Contacts View" },
      { event: "contact.detail_viewed", label: "View Contact Detail", location: "Contact Card" },
      { event: "contact.email_sent", label: "Send Email", location: "Contact Detail" },
      { event: "contact.touchpoint_added", label: "Log Touchpoint", location: "Contact Detail" },
      { event: "contact.stage_changed", label: "Change Stage", location: "Contact Detail" },
      { event: "contact.bulk_action", label: "Bulk Action", location: "Contacts View" },
    ]},
    { category: "Tasks", items: [
      { event: "task.created", label: "Create Task", location: "New Task Modal" },
      { event: "task.completed", label: "Complete Task", location: "Tasks View" },
    ]},
    { category: "Pipeline", items: [
      { event: "pipeline.viewed", label: "View Pipeline", location: "Pipeline View" },
      { event: "pipeline.card_moved", label: "Move Deal", location: "Pipeline Board" },
    ]},
    { category: "Calendar", items: [
      { event: "calendar.viewed", label: "View Calendar", location: "Calendar View" },
      { event: "calendar.navigated", label: "Navigate Months", location: "Calendar View" },
    ]},
    { category: "Reports & Recommendations", items: [
      { event: "reports.viewed", label: "View Reports", location: "Reports View" },
      { event: "recommendations.viewed", label: "View Recommendations", location: "Recommendations View" },
    ]},
    { category: "Data", items: [
      { event: "import.started", label: "Start Import", location: "Import Wizard" },
      { event: "import.completed", label: "Complete Import", location: "Import Wizard" },
      { event: "export.downloaded", label: "Download Export", location: "Export View" },
    ]},
    { category: "Settings", items: [
      { event: "settings.tab_changed", label: "Switch Settings Tab", location: "Settings View" },
      { event: "settings.member_invited", label: "Invite Team Member", location: "Settings > Team" },
      { event: "settings.email_template_saved", label: "Save Email Template", location: "Settings > Templates" },
    ]},
    { category: "Support", items: [
      { event: "support.opened", label: "Open Support Chat", location: "Floating Widget" },
      { event: "support.message_sent", label: "Send Support Message", location: "Chat Widget" },
    ]},
  ];

  const eventCounts: Record<string, number> = {};
  if (usageData?.topEvents) { for (const e of usageData.topEvents) { eventCounts[e.name] = e.count; } }
  const maxCount = Math.max(...Object.values(eventCounts), 1);

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Feature Usage</h2>
          <p className="text-xs text-gray-400 mt-0.5">Track which features your users actually use</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => { setUsagePeriod(d as 7 | 30 | 90); loadFeatureUsage(d); }} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${usagePeriod === d ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}>{d}d</button>
          ))}
          <button onClick={() => loadFeatureUsage()} disabled={usageLoading} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-60 ml-1">
            {usageLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Load
          </button>
        </div>
      </div>

      {usageData && (() => {
        const priorEvents = usageData.priorPeriodEvents || 0;
        const priorUsers = usageData.priorPeriodUsers || 0;
        const eventsDelta = priorEvents > 0 ? Math.round(((usageData.totalEvents - priorEvents) / priorEvents) * 100) : usageData.totalEvents > 0 ? 100 : 0;
        const usersDelta = priorUsers > 0 ? Math.round(((usageData.uniqueUsers - priorUsers) / priorUsers) * 100) : usageData.uniqueUsers > 0 ? 100 : 0;
        return (<>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Total Events", value: usageData.totalEvents.toLocaleString(), color: "text-gray-900", delta: eventsDelta, prior: priorEvents },
                { label: "Unique Features", value: String(usageData.uniqueEvents), color: "text-blue-600", delta: null, prior: null },
                { label: "Active Users", value: String(usageData.uniqueUsers), color: "text-emerald-600", delta: usersDelta, prior: priorUsers },
                { label: "Period", value: `${usageData.period} days`, color: "text-gray-500", delta: null, prior: null },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</div>
                  {s.delta !== null && s.prior !== null && (
                    <div className={`text-[10px] font-semibold mt-1 ${s.delta > 0 ? "text-emerald-600" : s.delta < 0 ? "text-red-600" : "text-gray-400"}`}>
                      {s.delta > 0 ? "+" : ""}{s.delta}% vs prior {usageData.period}d
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {usageData.dailyActivity.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Daily Activity</h3>
              <div className="flex items-end gap-px h-16">
                {usageData.dailyActivity.map((d, i) => {
                  const maxDay = Math.max(...usageData.dailyActivity.map(x => x.count), 1);
                  const height = Math.max((d.count / maxDay) * 100, d.count > 0 ? 4 : 1);
                  return (
                    <div key={i} className="flex-1 group relative" title={`${d.date}: ${d.count} events`}>
                      <div className={`w-full rounded-sm transition-colors ${d.count > 0 ? "bg-gray-900 hover:bg-gray-700" : "bg-gray-100"}`} style={{ height: `${height}%` }} />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-gray-400">{usageData.dailyActivity[0]?.date}</span>
                <span className="text-[10px] text-gray-400">{usageData.dailyActivity[usageData.dailyActivity.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </>);
      })()}

      {!usageData && !usageLoading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Zap className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Load feature usage data</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">See which features your users actually use.</p>
          <button onClick={() => loadFeatureUsage()} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"><Zap className="w-3.5 h-3.5" /> Load Data</button>
        </div>
      )}

      {usageLoading && !usageData && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><Loader2 className="w-7 h-7 text-gray-400 animate-spin mx-auto mb-3" /><h3 className="text-sm font-semibold text-gray-900">Loading usage data...</h3></div>
      )}

      {uiInventory.map(cat => {
        const catTotal = cat.items.reduce((sum, it) => sum + (eventCounts[it.event] || 0), 0);
        return (
          <div key={cat.category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{cat.category}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{cat.items.length}</span>
              </div>
              {usageData && (<span className="text-[10px] text-gray-400 font-mono">{catTotal.toLocaleString()} events</span>)}
            </div>
            <div className="divide-y divide-gray-50">
              {cat.items.map(item => {
                const count = eventCounts[item.event] || 0;
                const barWidth = usageData ? Math.max((count / maxCount) * 100, count > 0 ? 2 : 0) : 0;
                return (
                  <div key={item.event} className="px-5 py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{item.label}</span>
                        <span className="text-[10px] text-gray-400">{item.location}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-300">{item.event}</span>
                    </div>
                    {usageData && (
                      <div className="flex items-center gap-3 shrink-0 w-40">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${count > 0 ? "bg-gray-900" : ""}`} style={{ width: `${barWidth}%` }} />
                        </div>
                        <span className={`text-xs font-mono w-10 text-right ${count > 0 ? "text-gray-700" : "text-gray-300"}`}>{count > 0 ? count.toLocaleString() : "\u2014"}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
