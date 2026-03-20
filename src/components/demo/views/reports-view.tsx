"use client";

import { useMemo, useEffect } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  GitBranch,
  BarChart3,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { type Contact, type Task, type Touchpoint, type StageDefinition, formatCurrency, getTaskStatus } from "../data";
import { trackEvent } from "@/lib/track-event";

interface ReportsViewProps {
  contacts: Contact[];
  tasks: Task[];
  touchpoints: Touchpoint[];
  stages: StageDefinition[];
}

export default function ReportsView({ contacts, tasks, touchpoints, stages }: ReportsViewProps) {
  useEffect(() => { trackEvent("reports.viewed"); }, []);
  const activeContacts = contacts.filter((c) => !c.stage.toLowerCase().includes("lost"));
  const wonContacts = contacts.filter((c) => c.stage.toLowerCase().includes("won"));
  const lostContacts = contacts.filter((c) => c.stage.toLowerCase().includes("lost"));

  // Pipeline metrics
  const metrics = useMemo(() => {
    const totalPipeline = activeContacts.reduce((sum, c) => sum + c.value, 0);
    const totalWon = wonContacts.reduce((sum, c) => sum + c.value, 0);
    const avgDealSize = activeContacts.length > 0 ? totalPipeline / activeContacts.length : 0;
    const winRate = (wonContacts.length + lostContacts.length) > 0
      ? Math.round((wonContacts.length / (wonContacts.length + lostContacts.length)) * 100)
      : 0;

    // Task metrics
    const openTasks = tasks.filter((t) => !t.completed);
    const overdueTasks = tasks.filter((t) => t.due && getTaskStatus(t.due, t.completed) === "overdue");
    const completedTasks = tasks.filter((t) => t.completed);
    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    // Activity metrics
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentTouchpoints = touchpoints.filter((t) => new Date(t.date) >= last30Days);
    const avgTouchpointsPerContact = contacts.length > 0
      ? Math.round((touchpoints.length / contacts.length) * 10) / 10
      : 0;

    return {
      totalPipeline,
      totalWon,
      avgDealSize,
      winRate,
      activeDeals: activeContacts.length,
      openTasks: openTasks.length,
      overdueTasks: overdueTasks.length,
      completionRate,
      totalTouchpoints: touchpoints.length,
      recentTouchpoints: recentTouchpoints.length,
      avgTouchpointsPerContact,
    };
  }, [contacts, tasks, touchpoints, activeContacts, wonContacts, lostContacts]);

  // Stage breakdown
  const stageBreakdown = useMemo(() => {
    return stages.map((s) => {
      const stageContacts = contacts.filter((c) => c.stage === s.label);
      const value = stageContacts.reduce((sum, c) => sum + c.value, 0);
      return { ...s, count: stageContacts.length, value };
    }).filter((s) => s.count > 0);
  }, [contacts, stages]);

  const maxStageValue = Math.max(...stageBreakdown.map((s) => s.value), 1);

  // Owner breakdown
  const ownerBreakdown = useMemo(() => {
    const owners = new Map<string, { contacts: number; value: number; tasks: number; completed: number }>();
    contacts.forEach((c) => {
      const existing = owners.get(c.owner) || { contacts: 0, value: 0, tasks: 0, completed: 0 };
      existing.contacts++;
      existing.value += c.value;
      owners.set(c.owner, existing);
    });
    tasks.forEach((t) => {
      const existing = owners.get(t.owner) || { contacts: 0, value: 0, tasks: 0, completed: 0 };
      existing.tasks++;
      if (t.completed) existing.completed++;
      owners.set(t.owner, existing);
    });
    return Array.from(owners.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value);
  }, [contacts, tasks]);

  // Activity by type
  const activityByType = useMemo(() => {
    const types = { call: 0, email: 0, meeting: 0, note: 0 };
    touchpoints.forEach((t) => { types[t.type]++; });
    return types;
  }, [touchpoints]);

  const totalActivity = Object.values(activityByType).reduce((a, b) => a + b, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Reports</h2>
        <p className="text-sm text-muted mt-0.5">Pipeline analytics and team performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pipeline Value", value: formatCurrency(metrics.totalPipeline), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Revenue Won", value: formatCurrency(metrics.totalWon), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Win Rate", value: `${metrics.winRate}%`, icon: CheckCircle2, color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Avg Deal Size", value: formatCurrency(metrics.avgDealSize), icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <div className="text-xl font-bold text-foreground">{kpi.value}</div>
            <div className="text-xs text-muted mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Task & Activity Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="text-2xl font-bold text-foreground">{metrics.openTasks}</div>
          <div className="text-xs text-muted">Open Tasks</div>
          {metrics.overdueTasks > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
              <ArrowDown className="w-3 h-3" />
              {metrics.overdueTasks} overdue
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="text-2xl font-bold text-foreground">{metrics.completionRate}%</div>
          <div className="text-xs text-muted">Task Completion</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="text-2xl font-bold text-foreground">{metrics.recentTouchpoints}</div>
          <div className="text-xs text-muted">Activities (30d)</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="text-2xl font-bold text-foreground">{metrics.avgTouchpointsPerContact}</div>
          <div className="text-xs text-muted">Avg per Contact</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pipeline by Stage */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Pipeline by Stage</h3>
          </div>
          <div className="p-5 space-y-3">
            {stageBreakdown.length > 0 ? stageBreakdown.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bgColor} ${s.color}`}>{s.label}</span>
                    <span className="text-xs text-muted">{s.count} deal{s.count !== 1 ? "s" : ""}</span>
                  </div>
                  <span className="font-semibold text-foreground tabular-nums">{formatCurrency(s.value)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{ width: `${(s.value / maxStageValue) * 100}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-sm text-muted">No pipeline data yet.</div>
            )}
          </div>
        </div>

        {/* Activity Breakdown */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Activity Breakdown</h3>
          </div>
          <div className="p-5">
            {totalActivity > 0 ? (
              <div className="space-y-3">
                {([
                  { type: "call" as const, label: "Calls", color: "bg-blue-500" },
                  { type: "email" as const, label: "Emails", color: "bg-emerald-500" },
                  { type: "meeting" as const, label: "Meetings", color: "bg-violet-500" },
                  { type: "note" as const, label: "Notes", color: "bg-gray-400" },
                ]).map(({ type, label, color }) => {
                  const count = activityByType[type];
                  const pct = totalActivity > 0 ? Math.round((count / totalActivity) * 100) : 0;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-foreground">{label}</span>
                        <span className="text-muted tabular-nums">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted">No activity data yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      {ownerBreakdown.length > 1 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Team Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="text-left text-xs font-medium text-muted px-5 py-2.5">Team Member</th>
                  <th className="text-right text-xs font-medium text-muted px-5 py-2.5">Contacts</th>
                  <th className="text-right text-xs font-medium text-muted px-5 py-2.5">Pipeline Value</th>
                  <th className="text-right text-xs font-medium text-muted px-5 py-2.5">Tasks</th>
                  <th className="text-right text-xs font-medium text-muted px-5 py-2.5">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ownerBreakdown.map((o) => {
                  const completionRate = o.tasks > 0 ? Math.round((o.completed / o.tasks) * 100) : 0;
                  return (
                    <tr key={o.name} className="hover:bg-surface/50">
                      <td className="px-5 py-3 text-sm font-medium text-foreground">{o.name}</td>
                      <td className="px-5 py-3 text-sm text-foreground text-right tabular-nums">{o.contacts}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-foreground text-right tabular-nums">{formatCurrency(o.value)}</td>
                      <td className="px-5 py-3 text-sm text-foreground text-right tabular-nums">{o.tasks}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-sm font-medium tabular-nums ${completionRate >= 75 ? "text-emerald-600" : completionRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                          {completionRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
