"use client";

import { useState, useCallback, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2, Eye, UserPlus, CheckCircle2, TrendingUp, Clock } from "lucide-react";
import { adminFetch, KpiCard, type AnalyticsPoint, type DemoSession } from "./_shared";

export default function ActivitySection() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsPoint[]>([]);
  const [analyticsRange, setAnalyticsRange] = useState<"30d" | "12m">("30d");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [demoSessions, setDemoSessions] = useState<DemoSession[]>([]);
  const [demoFilter, setDemoFilter] = useState<"all" | "converted" | "clicked" | "bounced">("all");

  const loadAnalytics = useCallback(async (range: "30d" | "12m") => {
    setAnalyticsLoading(true);
    try { const res = await adminFetch("get-analytics", { range }); if (res.data) setAnalyticsData(res.data); } catch { /* handled */ }
    setAnalyticsLoading(false);
  }, []);

  const loadDemoSessions = useCallback(async () => {
    try { const res = await adminFetch("get-demo-sessions"); if (res.data) setDemoSessions(res.data); } catch { /* handled */ }
  }, []);

  useEffect(() => { loadAnalytics("30d"); loadDemoSessions(); }, [loadAnalytics, loadDemoSessions]);

  const total = demoSessions.length;
  const clickedSignup = demoSessions.filter((d) => d.clicked_signup).length;
  const converted = demoSessions.filter((d) => d.converted_to_user).length;
  const avgDuration = total > 0 ? Math.floor(demoSessions.reduce((sum, d) => sum + d.duration_seconds, 0) / total) : 0;
  const convRate = total > 0 ? ((converted / total) * 100).toFixed(1) : "0";

  return (
    <div className="p-4 sm:p-6 max-w-7xl space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Activity Over Time</h3>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => { setAnalyticsRange("30d"); loadAnalytics("30d"); }} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${analyticsRange === "30d" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Last 30 Days</button>
            <button onClick={() => { setAnalyticsRange("12m"); loadAnalytics("12m"); }} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${analyticsRange === "12m" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>Last 12 Months</button>
          </div>
        </div>
        <div className="p-4" style={{ height: 320 }}>
          {analyticsLoading ? (<div className="h-full flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : analyticsData.length === 0 ? (<div className="h-full flex items-center justify-center text-sm text-gray-400">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                  <linearGradient id="colorDemos" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} interval={analyticsRange === "30d" ? 4 : 0} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }} labelStyle={{ fontWeight: 600, marginBottom: 4 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#6366f1" fill="url(#colorVisitors)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="demos" name="Demos" stroke="#3b82f6" fill="url(#colorDemos)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="signups" name="Signups" stroke="#10b981" fill="url(#colorSignups)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="conversions" name="Conversions" stroke="#f59e0b" fill="url(#colorConversions)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <KpiCard icon={Eye} iconBg="bg-gray-100" iconColor="text-gray-600" value={total} label="Total Demos" />
        <KpiCard icon={UserPlus} iconBg="bg-blue-50" iconColor="text-blue-600" value={clickedSignup} label="Clicked Signup" />
        <KpiCard icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" value={converted} label="Converted" />
        <KpiCard icon={TrendingUp} iconBg="bg-violet-50" iconColor="text-violet-600" value={`${convRate}%`} label="Conv. Rate" prefix="" />
        <KpiCard icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" value={`${Math.floor(avgDuration / 60)}m`} label="Avg Duration" prefix="" />
      </div>

      <div className="flex items-center gap-2">
        {(["all", "converted", "clicked", "bounced"] as const).map((f) => (
          <button key={f} onClick={() => setDemoFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${demoFilter === f ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700 bg-gray-100"}`}>
            {f === "all" ? "All" : f === "converted" ? "Converted" : f === "clicked" ? "Clicked Signup" : "Bounced"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Demo Sessions</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">User</th>
              <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Industry</th>
              <th className="text-center px-5 py-2 text-xs font-medium text-gray-500">Duration</th>
              <th className="text-center px-5 py-2 text-xs font-medium text-gray-500">Pages</th>
              <th className="text-center px-5 py-2 text-xs font-medium text-gray-500">Features</th>
              <th className="text-center px-5 py-2 text-xs font-medium text-gray-500">Status</th>
              <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Started</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {demoSessions.filter((d) => { if (demoFilter === "converted") return d.converted_to_user; if (demoFilter === "clicked") return d.clicked_signup && !d.converted_to_user; if (demoFilter === "bounced") return !d.clicked_signup; return true; }).map((d) => {
                const mins = Math.floor(d.duration_seconds / 60); const secs = d.duration_seconds % 60;
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3"><div className="font-medium text-gray-900">{d.name || "Anonymous"}</div><div className="text-xs text-gray-400">{d.email || "No email"}</div></td>
                    <td className="px-5 py-3 text-gray-500 capitalize text-xs">{d.industry?.replace(/-/g, " ") || "\u2014"}</td>
                    <td className="px-5 py-3 text-center text-gray-600">{mins}m {secs}s</td>
                    <td className="px-5 py-3 text-center text-xs text-gray-500">{d.pages_visited?.length || 0}</td>
                    <td className="px-5 py-3 text-center text-xs text-gray-500">{d.features_used?.length || 0}</td>
                    <td className="px-5 py-3 text-center">{d.converted_to_user ? (<span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">Converted</span>) : d.clicked_signup ? (<span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">Clicked Signup</span>) : (<span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">Browsing</span>)}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(d.started_at).toLocaleString()}</td>
                  </tr>
                );
              })}
              {demoSessions.length === 0 && (<tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No demo sessions recorded</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
