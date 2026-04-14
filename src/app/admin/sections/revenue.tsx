"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { DollarSign, TrendingUp, Crown, CreditCard, Building2, BarChart3, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { adminFetch, type WorkspaceStat } from "./_shared";

interface RevenueSectionProps { workspaces: WorkspaceStat[]; }

export default function RevenueSection({ workspaces }: RevenueSectionProps) {
  const [revenueHistory, setRevenueHistory] = useState<{ label: string; mrr: number; seats: number; workspaces: number; newBusiness: number; churned: number }[]>([]);
  const [revenueForecast, setRevenueForecast] = useState<{ label: string; mrr: number; seats: number; workspaces: number }[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<{ currentMrr: number; totalChurned: number; totalNewBiz: number; avgChurnRate: number; avgNewRate: number; avgGrowth: number }>({ currentMrr: 0, totalChurned: 0, totalNewBiz: 0, avgChurnRate: 0, avgNewRate: 0, avgGrowth: 0 });
  const [revenueLoading, setRevenueLoading] = useState(false);

  const revenueStats = useMemo(() => {
    const businessCount = workspaces.filter((w) => w.plan === "business").length;
    const freeCount = workspaces.filter((w) => w.plan !== "business").length;
    const totalSeats = workspaces.filter((w) => w.plan === "business").reduce((sum, w) => sum + w.member_count, 0);
    const mrr = totalSeats * 900;
    return { businessCount, freeCount, totalSeats, mrr };
  }, [workspaces]);

  const loadRevenueAnalytics = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const res = await adminFetch("get-revenue-analytics");
      if (res.history) setRevenueHistory(res.history);
      if (res.forecast) setRevenueForecast(res.forecast);
      if (res.summary) setRevenueSummary(res.summary);
    } catch { /* handled */ }
    setRevenueLoading(false);
  }, []);

  useEffect(() => { loadRevenueAnalytics(); }, [loadRevenueAnalytics]);

  const chartData = [
    ...revenueHistory.map((h) => ({ ...h, type: "actual" as const, forecastMrr: null as number | null })),
    ...revenueForecast.map((f) => ({ label: f.label, mrr: null as number | null, seats: f.seats, workspaces: f.workspaces, newBusiness: 0, churned: 0, type: "forecast" as const, forecastMrr: f.mrr })),
  ];
  if (chartData.length > 0 && revenueHistory.length > 0) {
    const lastActualIdx = revenueHistory.length - 1;
    chartData[lastActualIdx] = { ...chartData[lastActualIdx], forecastMrr: revenueHistory[lastActualIdx].mrr };
  }
  const totalChurned12m = revenueHistory.reduce((s, m) => s + m.churned, 0);
  const totalNew12m = revenueHistory.reduce((s, m) => s + m.newBusiness, 0);
  const peakMrr = Math.max(...revenueHistory.map((h) => h.mrr), 0);
  const avgMrr = revenueHistory.length > 0 ? Math.round(revenueHistory.reduce((s, h) => s + h.mrr, 0) / revenueHistory.length) : 0;
  const churnRate = revenueStats.businessCount > 0 ? ((revenueSummary.avgChurnRate / revenueStats.businessCount) * 100).toFixed(1) : "0";

  return (
    <div className="p-4 sm:p-6 max-w-7xl space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Current MRR", value: `$${(revenueStats.mrr / 100).toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "ARR", value: `$${((revenueStats.mrr / 100) * 12).toLocaleString()}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Paid Workspaces", value: revenueStats.businessCount, icon: Crown, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Paid Seats", value: revenueStats.totalSeats, icon: CreditCard, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Free Workspaces", value: revenueStats.freeCount, icon: Building2, color: "text-gray-500", bg: "bg-gray-100" },
          { label: "Avg Revenue/WS", value: revenueStats.businessCount > 0 ? `$${Math.round(revenueStats.mrr / 100 / revenueStats.businessCount)}` : "$0", icon: BarChart3, color: "text-pink-600", bg: "bg-pink-50" },
        ].map((kpi) => { const Icon = kpi.icon; return (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3"><div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}><Icon className={`w-4 h-4 ${kpi.color}`} /></div></div>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">{kpi.label}</div>
          </div>
        ); })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div><h3 className="text-sm font-semibold text-gray-900">MRR Trend & 3-Month Forecast</h3><p className="text-[11px] text-gray-400 mt-0.5">Solid line = actual, dashed line = projected</p></div>
          <button onClick={loadRevenueAnalytics} className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"><RefreshCw className={`w-3.5 h-3.5 ${revenueLoading ? "animate-spin" : ""}`} /></button>
        </div>
        <div className="p-4 h-72">
          {revenueLoading ? (<div className="h-full flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300" /></div>
          ) : chartData.length === 0 ? (<div className="h-full flex items-center justify-center text-sm text-gray-400">No revenue data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs><linearGradient id="revMrr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} formatter={(val, name) => { if (val === null || val === undefined) return ["-", String(name)]; return [String(name) === "forecastMrr" ? `$${val} (projected)` : `$${val}`, String(name) === "forecastMrr" ? "Forecast" : "MRR"]; }} />
                <Area type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} fill="url(#revMrr)" name="MRR" connectNulls={false} />
                <Area type="monotone" dataKey="forecastMrr" stroke="#10b981" strokeWidth={2} strokeDasharray="6 4" fill="none" name="Forecast" connectNulls />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Churn (12 Months)</h3></div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Workspaces Churned</span><span className={`text-lg font-bold ${totalChurned12m > 0 ? "text-red-600" : "text-gray-900"}`}>{totalChurned12m}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Avg Monthly Churn</span><span className="text-lg font-bold text-gray-900">{revenueSummary.avgChurnRate}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Churn Rate</span><span className={`text-lg font-bold ${Number(churnRate) > 5 ? "text-red-600" : "text-emerald-600"}`}>{churnRate}%</span></div>
            <div className="border-t border-gray-100 pt-3"><div className="h-24"><ResponsiveContainer width="100%" height="100%"><BarChart data={revenueHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={14}><XAxis dataKey="label" tick={{ fontSize: 8, fill: "#9ca3af" }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 8, fill: "#9ca3af" }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "11px" }} /><Bar dataKey="churned" fill="#ef4444" radius={[2, 2, 0, 0]} name="Churned" /></BarChart></ResponsiveContainer></div></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Growth (12 Months)</h3></div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm text-gray-500">New Paid Workspaces</span><span className="text-lg font-bold text-emerald-600">{totalNew12m}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Avg Monthly New</span><span className="text-lg font-bold text-gray-900">{revenueSummary.avgNewRate}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Net Growth</span><span className={`text-lg font-bold ${totalNew12m - totalChurned12m >= 0 ? "text-emerald-600" : "text-red-600"}`}>{totalNew12m - totalChurned12m >= 0 ? "+" : ""}{totalNew12m - totalChurned12m}</span></div>
            <div className="border-t border-gray-100 pt-3"><div className="h-24"><ResponsiveContainer width="100%" height="100%"><BarChart data={revenueHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={14}><XAxis dataKey="label" tick={{ fontSize: 8, fill: "#9ca3af" }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 8, fill: "#9ca3af" }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "11px" }} /><Bar dataKey="newBusiness" fill="#10b981" radius={[2, 2, 0, 0]} name="New Paid" /></BarChart></ResponsiveContainer></div></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">3-Month Forecast</h3></div>
          <div className="p-5 space-y-4">
            <div className="text-[11px] text-gray-400 mb-2">Based on 3-month trailing averages</div>
            {revenueForecast.map((f) => (
              <div key={f.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div><div className="text-sm font-medium text-gray-900">{f.label}</div><div className="text-[10px] text-gray-400">{f.seats} seats &middot; {f.workspaces} workspaces</div></div>
                <div className="text-right"><div className="text-lg font-bold text-emerald-600">${f.mrr}</div><div className="text-[10px] text-gray-400">{revenueSummary.currentMrr > 0 ? `${((f.mrr / revenueSummary.currentMrr - 1) * 100).toFixed(0)}% vs now` : "\u2014"}</div></div>
              </div>
            ))}
            {revenueForecast.length === 0 && (<div className="text-sm text-gray-400 text-center py-4">Not enough data for forecast</div>)}
            <div className="border-t border-gray-100 pt-3 mt-2"><div className="flex items-center justify-between"><span className="text-sm text-gray-500">Avg MRR Growth/mo</span><span className={`text-sm font-bold ${revenueSummary.avgGrowth >= 0 ? "text-emerald-600" : "text-red-600"}`}>{revenueSummary.avgGrowth >= 0 ? "+" : ""}${revenueSummary.avgGrowth}</span></div></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Seat Growth (12 Months)</h3></div>
          <div className="p-4 h-52">
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}><defs><linearGradient id="revSeats" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" /><XAxis dataKey="label" tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "11px" }} /><Area type="monotone" dataKey="seats" stroke="#6366f1" strokeWidth={2} fill="url(#revSeats)" name="Paid Seats" /></AreaChart></ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Revenue Summary</h3></div>
          <div className="p-5 space-y-3">
            {[
              { label: "Peak MRR (12m)", value: `$${peakMrr}` },
              { label: "Average MRR (12m)", value: `$${avgMrr}` },
              { label: "Revenue per Seat", value: "$9/mo" },
              { label: "Conversion (Free \u2192 Paid)", value: `${workspaces.length > 0 ? ((revenueStats.businessCount / workspaces.length) * 100).toFixed(0) : 0}%` },
              { label: "Projected ARR (3m out)", value: `$${revenueForecast.length > 0 ? (revenueForecast[revenueForecast.length - 1].mrr * 12).toLocaleString() : 0}`, color: "text-emerald-600" },
            ].map((row, i) => (<div key={row.label} className={`flex items-center justify-between py-2 ${i > 0 ? "border-t border-gray-50" : ""}`}><span className="text-sm text-gray-500">{row.label}</span><span className={`text-sm font-bold ${row.color || "text-gray-900"}`}>{row.value}</span></div>))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Workspace Plans</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Workspace</th>
              <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Owner</th>
              <th className="text-center px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="text-center px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Seats</th>
              <th className="text-right px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">MRR</th>
              <th className="text-center px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Stripe</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {workspaces.map((w) => { const isBusiness = w.plan === "business"; const seatMrr = isBusiness ? w.member_count * 5 : 0; return (
                <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{w.name}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">{w.owner_email}</td>
                  <td className="px-5 py-3 text-center"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isBusiness ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{isBusiness && <Crown className="w-2.5 h-2.5" />}{isBusiness ? "Business" : "Free"}</span></td>
                  <td className="px-5 py-3 text-center">{w.member_count}</td>
                  <td className="px-5 py-3 text-right font-medium">{isBusiness ? `$${seatMrr}` : "\u2014"}</td>
                  <td className="px-5 py-3 text-center">{w.stripe_customer_id ? (<span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium"><CheckCircle2 className="w-3 h-3" /> Connected</span>) : (<span className="text-[10px] text-gray-400">{"\u2014"}</span>)}</td>
                </tr>
              ); })}
              {workspaces.length === 0 && (<tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No workspaces</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
