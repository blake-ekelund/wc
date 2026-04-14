"use client";

import { useState } from "react";
import { Loader2, TrendingUp, RefreshCw } from "lucide-react";
import { adminFetch } from "./_shared";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface MetricsSectionProps { onMetricsLoaded?: (m: any) => void; }

export default function MetricsSection({ onMetricsLoaded }: MetricsSectionProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [saasMetrics, setSaasMetrics] = useState<any>(null);
  const [saasLoading, setSaasLoading] = useState(false);

  async function loadSaasMetrics() {
    setSaasLoading(true);
    try {
      const data = await adminFetch("get-saas-metrics");
      setSaasMetrics(data);
      onMetricsLoaded?.(data);
    } catch { /* ignore */ }
    setSaasLoading(false);
  }

  if (!saasMetrics && !saasLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Load SaaS Metrics</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">DAU/WAU/MAU, retention, unit economics, and growth metrics from your live data.</p>
          <button onClick={loadSaasMetrics} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"><TrendingUp className="w-3.5 h-3.5" /> Load Metrics</button>
        </div>
      </div>
    );
  }
  if (saasLoading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><Loader2 className="w-7 h-7 text-gray-400 animate-spin mx-auto mb-3" /><h3 className="text-sm font-semibold text-gray-900">Computing metrics...</h3></div>
      </div>
    );
  }
  const m = saasMetrics;
  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-sm font-semibold text-gray-900">SaaS Metrics</h2><p className="text-xs text-gray-400 mt-0.5">Real-time metrics from your live data</p></div>
        <button onClick={loadSaasMetrics} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Engagement</h3></div>
        <div className="p-5 grid grid-cols-4 gap-6">
          <div className="text-center"><div className="text-2xl font-bold text-gray-900">{m.engagement.dau}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">DAU</div><div className="text-[10px] text-gray-500 mt-0.5">Today</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-gray-900">{m.engagement.wau}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">WAU</div><div className="text-[10px] text-gray-500 mt-0.5">7 days</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-gray-900">{m.engagement.mau}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">MAU</div><div className="text-[10px] text-gray-500 mt-0.5">30 days</div></div>
          <div className="text-center"><div className={`text-2xl font-bold ${m.engagement.dauMauRatio >= 20 ? "text-emerald-600" : m.engagement.dauMauRatio >= 10 ? "text-amber-600" : "text-red-600"}`}>{m.engagement.dauMauRatio}%</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">DAU/MAU</div><div className="text-[10px] text-gray-500 mt-0.5">{m.engagement.dauMauRatio >= 20 ? "Strong" : m.engagement.dauMauRatio >= 10 ? "Average" : "Low"}</div></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Retention</h3></div>
        <div className="p-5 grid grid-cols-3 gap-6">
          <div className="text-center"><div className={`text-2xl font-bold ${m.retention.userRetention >= 80 ? "text-emerald-600" : m.retention.userRetention >= 60 ? "text-amber-600" : "text-red-600"}`}>{m.retention.userRetention}%</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">User Retention</div><div className="text-[10px] text-gray-500 mt-0.5">Month-over-month</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-gray-900">{m.retention.retainedUsers}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Retained Users</div><div className="text-[10px] text-gray-500 mt-0.5">Active both months</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-gray-900">{m.retention.priorMau}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Prior MAU</div><div className="text-[10px] text-gray-500 mt-0.5">Last month</div></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Unit Economics</h3></div>
        <div className="p-5 grid grid-cols-4 gap-6">
          <div className="text-center"><div className="text-2xl font-bold text-gray-900">${(m.revenue.mrr / 100).toLocaleString()}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">MRR</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-gray-900">${(m.revenue.arr / 100).toLocaleString()}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">ARR</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-gray-900">${(m.revenue.arpu / 100).toFixed(0)}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">ARPU</div><div className="text-[10px] text-gray-500 mt-0.5">Per workspace/mo</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-gray-900">${(m.revenue.revenuePerSeat / 100).toFixed(0)}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Rev/Seat</div><div className="text-[10px] text-gray-500 mt-0.5">$9/seat/mo</div></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Growth</h3></div>
        <div className="p-5 grid grid-cols-4 gap-6">
          <div className="text-center"><div className="text-2xl font-bold text-gray-900">{m.growth.totalUsers}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Total Users</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-emerald-600">{m.growth.usersThisMonth}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">New (30d)</div></div>
          <div className="text-center"><div className="text-2xl font-bold text-gray-500">{m.growth.usersLastMonth}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Prior (30d)</div></div>
          <div className="text-center"><div className={`text-2xl font-bold ${m.growth.userGrowthRate > 0 ? "text-emerald-600" : m.growth.userGrowthRate < 0 ? "text-red-600" : "text-gray-400"}`}>{m.growth.userGrowthRate > 0 ? "+" : ""}{m.growth.userGrowthRate}%</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Growth Rate</div></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Funnel (30d)</h3></div>
        <div className="p-5">
          <div className="flex items-center gap-3">
            {[
              { label: "Visitors", value: m.funnel.visitors, pct: 100 },
              { label: "Demos", value: m.funnel.demos, pct: m.funnel.visitors > 0 ? Math.round((m.funnel.demos / m.funnel.visitors) * 100) : 0 },
              { label: "Converted", value: m.funnel.demoConverted, pct: m.funnel.demos > 0 ? Math.round((m.funnel.demoConverted / m.funnel.demos) * 100) : 0 },
              { label: "Paid", value: m.revenue.businessCount, pct: m.growth.totalUsers > 0 ? Math.round((m.revenue.businessCount / m.growth.totalUsers) * 100) : 0 },
            ].map((step, i) => (
              <div key={step.label} className="flex-1">
                <div className="h-8 rounded-lg bg-gray-100 relative overflow-hidden"><div className="h-full rounded-lg bg-gray-900 transition-all" style={{ width: `${Math.max(step.pct, 4)}%` }} /></div>
                <div className="mt-2 text-center"><div className="text-sm font-bold text-gray-900">{step.value.toLocaleString()}</div><div className="text-[10px] text-gray-400">{step.label}</div>{i > 0 && <div className="text-[10px] text-gray-500">{step.pct}%</div>}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
