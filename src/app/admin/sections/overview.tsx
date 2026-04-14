"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { DollarSign, Building2, Users, Mail, CreditCard, Loader2, ArrowRight, Crown, Sparkles, TrendingUp, TrendingDown, Activity, Zap } from "lucide-react";
import { formatDate, statusConfig, type WorkspaceStat, type Conversation, type DemoSession, type AnalyticsPoint, type AdminSection } from "./_shared";

interface OverviewSectionProps {
  workspaces: WorkspaceStat[];
  totalUsers: number;
  totalContacts: number;
  conversations: Conversation[];
  demoSessions: DemoSession[];
  analyticsData: AnalyticsPoint[];
  analyticsRange: "30d" | "12m";
  analyticsLoading: boolean;
  loadAnalytics: (range: "30d" | "12m") => void;
  setAnalyticsRange: (r: "30d" | "12m") => void;
  setSection: (s: AdminSection) => void;
  setConvFilter: (f: "all" | "new" | "active" | "resolved" | "closed") => void;
  setSelectedWorkspace: (w: WorkspaceStat) => void;
  subscriberCount: number;
  assistantStats: { sentiment: { positive: number; neutral: number; negative: number }; ctas: Record<string, number>; ctaClicks: number; totalConversations: number; totalMessages: number } | null;
}

export default function OverviewSection(props: OverviewSectionProps) {
  const { workspaces, totalUsers, totalContacts, conversations, demoSessions, analyticsData, analyticsRange, analyticsLoading, loadAnalytics, setAnalyticsRange, setSection, setConvFilter, setSelectedWorkspace, subscriberCount, assistantStats } = props;

  const revenueStats = useMemo(() => {
    const businessCount = workspaces.filter((w) => w.plan === "business").length;
    const freeCount = workspaces.filter((w) => w.plan !== "business").length;
    const totalSeats = workspaces.filter((w) => w.plan === "business").reduce((sum, w) => sum + w.member_count, 0);
    const mrr = totalSeats * 900;
    return { businessCount, freeCount, totalSeats, mrr };
  }, [workspaces]);

  const demoTotal = demoSessions.length;
  const demoConverted = demoSessions.filter((d) => d.converted_to_user).length;
  const demoClickedSignup = demoSessions.filter((d) => d.clicked_signup).length;
  const demoAvgDuration = demoTotal > 0 ? Math.floor(demoSessions.reduce((sum, d) => sum + d.duration_seconds, 0) / demoTotal) : 0;
  const demoConvRate = demoTotal > 0 ? ((demoConverted / demoTotal) * 100).toFixed(1) : "0";
  const planData = [
    { name: "Business", value: revenueStats.businessCount, color: "#10b981" },
    { name: "Free", value: revenueStats.freeCount, color: "#e5e7eb" },
  ].filter((d) => d.value > 0);
  const demoFunnelData = [
    { stage: "Demos", value: demoTotal, color: "#6366f1" },
    { stage: "Clicked Signup", value: demoClickedSignup, color: "#3b82f6" },
    { stage: "Converted", value: demoConverted, color: "#10b981" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "MRR", value: `$${(revenueStats.mrr / 100).toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Workspaces", value: workspaces.length, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Users", value: totalUsers, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Subscribers", value: subscriberCount, icon: Mail, color: "text-pink-600", bg: "bg-pink-50" },
          { label: "CRM Contacts", value: totalContacts.toLocaleString(), icon: Users, color: "text-gray-600", bg: "bg-gray-100" },
          { label: "Paid Seats", value: revenueStats.totalSeats, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((kpi) => { const Icon = kpi.icon; return (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3"><div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}><Icon className={`w-4 h-4 ${kpi.color}`} /></div></div>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">{kpi.label}</div>
          </div>
        ); })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Activity Trend</h3>
            <div className="flex items-center gap-1">
              {(["30d", "12m"] as const).map((r) => (<button key={r} onClick={() => { setAnalyticsRange(r); loadAnalytics(r); }} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${analyticsRange === r ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"}`}>{r === "30d" ? "30 Days" : "12 Months"}</button>))}
            </div>
          </div>
          <div className="p-4 h-64">
            {analyticsLoading ? (<div className="h-full flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
            ) : analyticsData.length === 0 ? (<div className="h-full flex items-center justify-center text-sm text-gray-400">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ovVisitors" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                    <linearGradient id="ovSignups" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                  <Area type="monotone" dataKey="visitors" stroke="#6366f1" strokeWidth={2} fill="url(#ovVisitors)" name="Visitors" />
                  <Area type="monotone" dataKey="signups" stroke="#10b981" strokeWidth={2} fill="url(#ovSignups)" name="Signups" />
                  <Area type="monotone" dataKey="demos" stroke="#f59e0b" strokeWidth={1.5} fill="transparent" strokeDasharray="4 3" name="Demos" />
                  <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Plan Distribution</h3></div>
          <div className="p-4 flex flex-col items-center">
            <div className="h-44 w-full">
              {planData.length === 0 ? (<div className="h-full flex items-center justify-center text-sm text-gray-400">No workspaces</div>) : (
                <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={planData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">{planData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}</Pie><Tooltip formatter={(val) => [`${val} workspace${val !== 1 ? "s" : ""}`, ""]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} /></PieChart></ResponsiveContainer>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-xs text-gray-600">Business ({revenueStats.businessCount})</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-200" /><span className="text-xs text-gray-600">Free ({revenueStats.freeCount})</span></div>
            </div>
            <div className="mt-3 w-full border-t border-gray-100 pt-3 grid grid-cols-2 gap-2 text-center">
              <div><div className="text-lg font-bold text-emerald-600">${(revenueStats.mrr / 100).toFixed(0)}</div><div className="text-[10px] text-gray-500">MRR</div></div>
              <div><div className="text-lg font-bold text-gray-900">{revenueStats.totalSeats}</div><div className="text-[10px] text-gray-500">Paid Seats</div></div>
            </div>
          </div>
        </div>
      </div>

      {assistantStats && assistantStats.totalMessages > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4"><Sparkles className="w-4 h-4 text-accent" /><h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3><span className="text-[10px] text-gray-400 ml-auto">{assistantStats.totalConversations} chats &middot; {assistantStats.totalMessages} messages</span></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(() => { const total = assistantStats.sentiment.positive + assistantStats.sentiment.neutral + assistantStats.sentiment.negative; return [
              { label: "Positive", count: assistantStats.sentiment.positive, pct: total > 0 ? Math.round((assistantStats.sentiment.positive / total) * 100) : 0, icon: TrendingUp, color: "text-emerald-600" },
              { label: "Neutral", count: assistantStats.sentiment.neutral, pct: total > 0 ? Math.round((assistantStats.sentiment.neutral / total) * 100) : 0, icon: Activity, color: "text-gray-500" },
              { label: "Negative", count: assistantStats.sentiment.negative, pct: total > 0 ? Math.round((assistantStats.sentiment.negative / total) * 100) : 0, icon: TrendingDown, color: "text-red-600" },
            ].map((s) => (<div key={s.label} className="text-center"><s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} /><div className={`text-lg font-bold ${s.color}`}>{s.pct}%</div><div className="text-[10px] text-gray-400">{s.label} ({s.count})</div></div>)); })()}
            <div className="text-center"><Zap className="w-4 h-4 text-accent mx-auto mb-1" /><div className="text-lg font-bold text-gray-900">{assistantStats.ctaClicks}</div><div className="text-[10px] text-gray-400">CTA Clicks</div></div>
          </div>
          {Object.keys(assistantStats.ctas).length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
              {Object.entries(assistantStats.ctas).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cta, count]) => (<span key={cta} className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium bg-gray-50 border border-gray-200 rounded-full text-gray-600">{cta.replace(/-/g, " ")} <span className="text-gray-400">{count as number}</span></span>))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-900">Support Queue</h3><button onClick={() => setSection("support")} className="text-xs text-accent hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button></div>
          <div className="grid grid-cols-4 divide-x divide-gray-200">
            {(["new", "active", "resolved", "closed"] as const).map((s) => { const count = conversations.filter((c) => c.status === s).length; const cfg = statusConfig[s]; const colors = { new: "text-red-600 bg-red-50", active: "text-blue-600 bg-blue-50", resolved: "text-emerald-600 bg-emerald-50", closed: "text-gray-500 bg-gray-50" }; return (
              <div key={s} className="p-4 text-center cursor-pointer hover:bg-gray-50/80 transition-colors" onClick={() => { setSection("support"); setConvFilter(s); }}>
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${colors[s]} mb-2`}><span className="text-lg font-bold">{count}</span></div>
                <div className="text-[11px] text-gray-500 font-medium">{cfg.label}</div>
              </div>
            ); })}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-900">Demo Funnel</h3><span className="text-xs text-gray-400">{demoConvRate}% conversion</span></div>
          <div className="p-4">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demoFunnelData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={32}>
                  <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>{demoFunnelData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-2 px-1">
              <div className="text-center"><div className="text-[10px] text-gray-400">Avg Duration</div><div className="text-sm font-semibold text-gray-700">{Math.floor(demoAvgDuration / 60)}m {demoAvgDuration % 60}s</div></div>
              <div className="text-center"><div className="text-[10px] text-gray-400">Signup Rate</div><div className="text-sm font-semibold text-blue-600">{demoTotal > 0 ? ((demoClickedSignup / demoTotal) * 100).toFixed(1) : 0}%</div></div>
              <div className="text-center"><div className="text-[10px] text-gray-400">Conv Rate</div><div className="text-sm font-semibold text-emerald-600">{demoConvRate}%</div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between"><h3 className="text-sm font-semibold text-gray-900">Recent Workspaces</h3><button onClick={() => setSection("workspaces")} className="text-xs text-accent hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Workspace</th>
              <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="text-center px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Members</th>
              <th className="text-center px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Contacts</th>
              <th className="text-center px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
              <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {workspaces.slice(0, 5).map((w) => (
                <tr key={w.id} className="hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => { setSection("workspaces"); setSelectedWorkspace(w); }}>
                  <td className="px-5 py-3"><div className="font-medium text-gray-900">{w.name}</div><div className="text-[11px] text-gray-400">{w.owner_email}</div></td>
                  <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${w.plan === "business" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{w.plan === "business" && <Crown className="w-2.5 h-2.5" />}{w.plan === "business" ? "Business" : "Free"}</span></td>
                  <td className="px-5 py-3 text-center text-gray-700">{w.member_count}</td>
                  <td className="px-5 py-3 text-center text-gray-700">{w.contact_count}</td>
                  <td className="px-5 py-3 text-center text-gray-700">{w.task_count}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(w.created_at)}</td>
                </tr>
              ))}
              {workspaces.length === 0 && (<tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No workspaces yet</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
