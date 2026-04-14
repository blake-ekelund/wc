"use client";

import { useState } from "react";
import { Crown, RefreshCw, AlertTriangle, Loader2, TrendingUp } from "lucide-react";
import { adminFetch } from "./_shared";

export default function ValuationSection() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [saasMetrics, setSaasMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function loadSaasMetrics() {
    setLoading(true);
    try { const data = await adminFetch("get-saas-metrics"); setSaasMetrics(data); } catch { /* ignore */ }
    setLoading(false);
  }

  if (!saasMetrics && !loading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl">
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Crown className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Load metrics first</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">Valuation requires SaaS metrics. Load them to see your estimated valuation.</p>
          <button onClick={loadSaasMetrics} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"><Crown className="w-3.5 h-3.5" /> Load & Calculate</button>
        </div>
      </div>
    );
  }
  if (loading) {
    return <div className="p-4 sm:p-6 max-w-5xl"><div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><Loader2 className="w-7 h-7 text-gray-400 animate-spin mx-auto mb-3" /><h3 className="text-sm font-semibold text-gray-900">Computing valuation...</h3></div></div>;
  }

  const m = saasMetrics;
  const arrDollars = m.revenue.arr / 100;
  const mrrDollars = m.revenue.mrr / 100;
  const baseMultiple = arrDollars < 100000 ? 6 : arrDollars < 1000000 ? 8 : arrDollars < 5000000 ? 12 : 15;
  const growthAdj = m.growth.userGrowthRate > 20 ? 4 : m.growth.userGrowthRate > 10 ? 2 : m.growth.userGrowthRate > 0 ? 0.5 : m.growth.userGrowthRate < -10 ? -3 : m.growth.userGrowthRate < 0 ? -1 : 0;
  const retentionAdj = m.retention.userRetention > 90 ? 3 : m.retention.userRetention > 80 ? 1.5 : m.retention.userRetention > 60 ? 0 : -2;
  const monthlyChurn = 100 - m.retention.userRetention;
  const churnAdj = monthlyChurn > 10 ? -4 : monthlyChurn > 5 ? -2 : monthlyChurn > 3 ? -0.5 : 0;
  const concAdj = m.concentration.concentrationPct > 50 ? -3 : m.concentration.concentrationPct > 30 ? -1 : 0;
  const effectiveMultiple = Math.max(baseMultiple + growthAdj + retentionAdj + churnAdj + concAdj, 1);
  const midValuation = arrDollars * effectiveMultiple;
  const lowValuation = midValuation * 0.7;
  const highValuation = midValuation * 1.4;

  const factors = [
    { name: "ARR Base Multiple", value: `${baseMultiple}x`, adj: baseMultiple, color: "text-gray-900", desc: arrDollars < 100000 ? "Pre-seed / early stage" : arrDollars < 1000000 ? "Seed stage" : "Growth stage" },
    { name: "Growth Premium", value: `${growthAdj > 0 ? "+" : ""}${growthAdj}x`, adj: growthAdj, color: growthAdj > 0 ? "text-emerald-600" : growthAdj < 0 ? "text-red-600" : "text-gray-400", desc: `${m.growth.userGrowthRate}% MoM user growth` },
    { name: "Retention Premium", value: `${retentionAdj > 0 ? "+" : ""}${retentionAdj}x`, adj: retentionAdj, color: retentionAdj > 0 ? "text-emerald-600" : retentionAdj < 0 ? "text-red-600" : "text-gray-400", desc: `${m.retention.userRetention}% month-over-month retention` },
    { name: "Churn Penalty", value: `${churnAdj}x`, adj: churnAdj, color: churnAdj < 0 ? "text-red-600" : "text-emerald-600", desc: `${monthlyChurn}% estimated monthly churn` },
    { name: "Concentration Risk", value: `${concAdj}x`, adj: concAdj, color: concAdj < 0 ? "text-red-600" : "text-emerald-600", desc: `${m.concentration.concentrationPct}% revenue from largest customer` },
  ];

  const levers = [
    { action: "Reduce churn by 5%", impact: Math.round(arrDollars * 2), priority: monthlyChurn > 5 },
    { action: "Grow MRR 20% MoM", impact: Math.round(arrDollars * 4), priority: m.growth.userGrowthRate < 20 },
    { action: "Improve retention to 90%+", impact: Math.round(arrDollars * 3), priority: m.retention.userRetention < 90 },
    { action: "Diversify customer base", impact: Math.round(arrDollars * 1.5), priority: m.concentration.concentrationPct > 30 },
  ].filter(l => l.priority).sort((a, b) => b.impact - a.impact);

  const fmt = (v: number) => v < 1000 ? v.toLocaleString() : v < 1000000 ? (v / 1000).toFixed(0) + "K" : (v / 1000000).toFixed(1) + "M";

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-sm font-semibold text-gray-900">Estimated Valuation</h2><p className="text-xs text-gray-400 mt-0.5">Multi-factor model based on your live SaaS metrics</p></div>
        <button onClick={loadSaasMetrics} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Recalculate</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Estimated Valuation</div>
          <div className="text-4xl font-bold text-gray-900">${fmt(midValuation)}</div>
          <div className="text-xs text-gray-500 mt-1">Range: ${fmt(lowValuation)} &mdash; ${fmt(highValuation)}</div>
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center"><div className="text-lg font-bold text-gray-900">${mrrDollars.toLocaleString()}</div><div className="text-[10px] text-gray-400 uppercase">MRR</div></div>
          <div className="text-center"><div className="text-lg font-bold text-gray-900">${arrDollars.toLocaleString()}</div><div className="text-[10px] text-gray-400 uppercase">ARR</div></div>
          <div className="text-center"><div className="text-lg font-bold text-blue-600">{effectiveMultiple.toFixed(1)}x</div><div className="text-[10px] text-gray-400 uppercase">Multiple</div></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Factor Breakdown</h3></div>
        <div className="divide-y divide-gray-50">
          {factors.map((f) => (<div key={f.name} className="px-5 py-3 flex items-center justify-between"><div><div className="text-sm font-medium text-gray-900">{f.name}</div><div className="text-[10px] text-gray-500 mt-0.5">{f.desc}</div></div><div className={`text-sm font-bold ${f.color}`}>{f.value}</div></div>))}
          <div className="px-5 py-3 flex items-center justify-between bg-gray-50"><div className="text-sm font-semibold text-gray-900">Effective Multiple</div><div className="text-sm font-bold text-blue-600">{effectiveMultiple.toFixed(1)}x ARR</div></div>
        </div>
      </div>
      {levers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">What Moves the Needle</h3></div>
          <div className="divide-y divide-gray-50">
            {levers.map((l) => (<div key={l.action} className="px-5 py-3 flex items-center justify-between"><div className="text-sm text-gray-900">{l.action}</div><div className="text-sm font-bold text-emerald-600">+${fmt(l.impact)} valuation</div></div>))}
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">SaaS Benchmarks</h3></div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: "Median Seed ARR", benchmark: "$500K", yours: `$${fmt(arrDollars)}` },
              { label: "Target Churn", benchmark: "<5%/mo", yours: `${monthlyChurn}%/mo` },
              { label: "Target DAU/MAU", benchmark: ">20%", yours: `${m.engagement.dauMauRatio}%` },
              { label: "Target Retention", benchmark: ">80%", yours: `${m.retention.userRetention}%` },
            ].map(b => (<div key={b.label}><div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{b.label}</div><div className="text-xs text-gray-500">Benchmark: <span className="font-semibold">{b.benchmark}</span></div><div className="text-xs text-gray-900">Yours: <span className="font-semibold">{b.yours}</span></div></div>))}
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-surface border border-border">
        <AlertTriangle className="w-4 h-4 text-muted mt-0.5 shrink-0" />
        <p className="text-xs text-muted leading-relaxed">This is an estimated valuation based on a simplified multi-factor model. Actual valuations depend on market conditions, competitive landscape, team, IP, and investor sentiment. This is not financial advice.</p>
      </div>
    </div>
  );
}
