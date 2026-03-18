"use client";

import { useMemo } from "react";
import {
  Sunrise,
  AlertTriangle,
  Clock,
  PhoneOff,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  Users,
  CalendarCheck,
  Target,
  Zap,
} from "lucide-react";
import {
  type Contact,
  type Task,
  type Touchpoint,
  formatCurrency,
  getTaskStatus,
  formatDueDate,
} from "../data";

interface AlertSettings {
  staleDays: number;
  atRiskTouchpoints: number;
  highValueThreshold: number;
  overdueAlerts: boolean;
  todayAlerts: boolean;
  negotiationAlerts: boolean;
  staleContactAlerts: boolean;
  atRiskAlerts: boolean;
}

interface RecommendationsViewProps {
  contacts: Contact[];
  tasks: Task[];
  touchpoints: Touchpoint[];
  alertSettings: AlertSettings;
  onSelectContact: (id: string) => void;
  onSelectTask: (id: string) => void;
  userName?: string;
}

interface Recommendation {
  id: string;
  type: "risk" | "overdue" | "stale" | "follow-up" | "win";
  title: string;
  description: string;
  contactId?: string;
  taskId?: string;
  priority: "high" | "medium" | "low";
}

const typeConfig = {
  risk: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 border-red-200", iconBg: "bg-red-100", label: "At Risk" },
  overdue: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200", iconBg: "bg-amber-100", label: "Overdue" },
  stale: { icon: PhoneOff, color: "text-orange-600", bg: "bg-orange-50 border-orange-200", iconBg: "bg-orange-100", label: "Needs Attention" },
  "follow-up": { icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", iconBg: "bg-blue-100", label: "Follow Up" },
  win: { icon: Target, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", iconBg: "bg-emerald-100", label: "Opportunity" },
};

export default function RecommendationsView({ contacts, tasks, touchpoints, alertSettings, onSelectContact, onSelectTask, userName }: RecommendationsViewProps) {
  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    const activeContacts = contacts.filter((c) => !c.stage.toLowerCase().includes("won") && !c.stage.toLowerCase().includes("lost"));

    // 1. Deals with no touchpoints (stale contacts)
    if (alertSettings.staleContactAlerts) {
      const contactsWithNoRecentTouchpoint = activeContacts.filter((c) => {
        const contactTps = touchpoints.filter((t) => t.contactId === c.id);
        return contactTps.length === 0;
      });
      contactsWithNoRecentTouchpoint.forEach((c) => {
        recs.push({
          id: `stale-${c.id}`,
          type: "stale",
          title: `No touchpoints recorded for ${c.name}`,
          description: `${c.company} is in ${c.stage} stage with a ${formatCurrency(c.value)} deal — reach out to keep momentum.`,
          contactId: c.id,
          priority: c.value > alertSettings.highValueThreshold ? "high" : "medium",
        });
      });
    }

    // 2. Overdue tasks
    if (alertSettings.overdueAlerts) {
      const overdueTasks = tasks.filter((t) => getTaskStatus(t.due, t.completed) === "overdue");
      overdueTasks.forEach((t) => {
        const contact = contacts.find((c) => c.id === t.contactId);
        recs.push({
          id: `overdue-${t.id}`,
          type: "overdue",
          title: `Overdue: ${t.title}`,
          description: `${formatDueDate(t.due)}${contact ? ` — ${contact.name} at ${contact.company}` : ""}. ${t.priority === "high" ? "This is high priority!" : "Don't let this slip."}`,
          contactId: t.contactId,
          taskId: t.id,
          priority: t.priority,
        });
      });
    }

    // 3. High-value deals in early stages (push forward)
    const highValueEarlyStage = activeContacts.filter(
      (c) => c.value >= alertSettings.highValueThreshold && !c.stage.toLowerCase().includes("won") && !c.stage.toLowerCase().includes("lost") && !c.stage.toLowerCase().includes("negotiation") && !c.stage.toLowerCase().includes("proposal")
    );
    highValueEarlyStage.forEach((c) => {
      recs.push({
        id: `push-${c.id}`,
        type: "win",
        title: `Move ${c.name} forward`,
        description: `${formatCurrency(c.value)} deal still in ${c.stage}. Consider scheduling a demo or sending a proposal to advance this opportunity.`,
        contactId: c.id,
        priority: "medium",
      });
    });

    // 4. Deals in negotiation — close the loop
    if (alertSettings.negotiationAlerts) {
      const negotiationDeals = activeContacts.filter((c) => c.stage.toLowerCase().includes("negotiation"));
      negotiationDeals.forEach((c) => {
        const pendingTasks = tasks.filter((t) => t.contactId === c.id && !t.completed);
        recs.push({
          id: `close-${c.id}`,
          type: "follow-up",
          title: `Close the loop with ${c.name}`,
          description: `${formatCurrency(c.value)} deal in Negotiation${pendingTasks.length > 0 ? ` with ${pendingTasks.length} open task${pendingTasks.length > 1 ? "s" : ""}` : ""}. Follow up to push toward close.`,
          contactId: c.id,
          priority: "high",
        });
      });
    }

    // 5. Tasks due today
    if (alertSettings.todayAlerts) {
      const todayTasks = tasks.filter((t) => getTaskStatus(t.due, t.completed) === "today");
      todayTasks.forEach((t) => {
        const contact = contacts.find((c) => c.id === t.contactId);
        recs.push({
          id: `today-${t.id}`,
          type: "follow-up",
          title: `Due today: ${t.title}`,
          description: `${contact ? `For ${contact.name} at ${contact.company}. ` : ""}Make sure to complete this before end of day.`,
          contactId: t.contactId,
          taskId: t.id,
          priority: t.priority === "high" ? "high" : "medium",
        });
      });
    }

    // 6. At-risk proposals with limited engagement
    if (alertSettings.atRiskAlerts) {
      const proposalDeals = activeContacts.filter((c) => c.stage.toLowerCase().includes("proposal"));
      proposalDeals.forEach((c) => {
        const recentTps = touchpoints.filter((t) => t.contactId === c.id);
        if (recentTps.length <= alertSettings.atRiskTouchpoints) {
          recs.push({
            id: `risk-${c.id}`,
            type: "risk",
            title: `${c.name} may be going cold`,
            description: `${formatCurrency(c.value)} proposal with limited engagement (${recentTps.length} touchpoint${recentTps.length !== 1 ? "s" : ""}). Schedule a check-in to stay top of mind.`,
            contactId: c.id,
            priority: "high",
          });
        }
      });
    }

    // Sort: high priority first, then by type importance
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const typeOrder = { risk: 0, overdue: 1, stale: 2, "follow-up": 3, win: 4 };
    recs.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return typeOrder[a.type] - typeOrder[b.type];
    });

    return recs;
  }, [contacts, tasks, touchpoints, alertSettings]);

  const overdueTasks = tasks.filter((t) => getTaskStatus(t.due, t.completed) === "overdue");
  const todayTasks = tasks.filter((t) => getTaskStatus(t.due, t.completed) === "today");
  const activeDeals = contacts.filter((c) => !c.stage.toLowerCase().includes("won") && !c.stage.toLowerCase().includes("lost"));
  const highPriorityCount = recommendations.filter((r) => r.priority === "high").length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      {/* Morning briefing header */}
      <div className="bg-gradient-to-br from-accent/10 via-blue-50 to-violet-50 rounded-xl border border-accent/20 p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
            <Sunrise className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{greeting}, {userName ? userName.split(" ")[0] : "there"}</h2>
            <p className="text-sm text-muted mt-0.5">
              Here&apos;s your daily briefing — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/70 backdrop-blur rounded-lg px-3 py-2.5 border border-white/50">
            <div className="text-lg font-bold text-foreground">{highPriorityCount}</div>
            <div className="text-[11px] text-muted">Urgent items</div>
          </div>
          <div className="bg-white/70 backdrop-blur rounded-lg px-3 py-2.5 border border-white/50">
            <div className="text-lg font-bold text-foreground">{overdueTasks.length}</div>
            <div className="text-[11px] text-muted">Overdue tasks</div>
          </div>
          <div className="bg-white/70 backdrop-blur rounded-lg px-3 py-2.5 border border-white/50">
            <div className="text-lg font-bold text-foreground">{todayTasks.length}</div>
            <div className="text-[11px] text-muted">Due today</div>
          </div>
          <div className="bg-white/70 backdrop-blur rounded-lg px-3 py-2.5 border border-white/50">
            <div className="text-lg font-bold text-foreground">{activeDeals.length}</div>
            <div className="text-[11px] text-muted">Active deals</div>
          </div>
        </div>
      </div>

      {/* Summary callout if there are urgent items */}
      {highPriorityCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 mb-6">
          <Zap className="w-4 h-4 text-red-600 shrink-0" />
          <span className="text-sm text-red-800">
            You have <span className="font-semibold">{highPriorityCount} high-priority item{highPriorityCount !== 1 ? "s" : ""}</span> that need{highPriorityCount === 1 ? "s" : ""} your attention today.
          </span>
        </div>
      )}

      {/* Recommendations list */}
      <div className="space-y-3">
        {recommendations.map((rec) => {
          const config = typeConfig[rec.type];
          const Icon = config.icon;
          const contact = rec.contactId ? contacts.find((c) => c.id === rec.contactId) : null;

          return (
            <div
              key={rec.id}
              className={`rounded-xl border p-4 transition-all hover:shadow-md ${config.bg}`}
            >
              <div className="flex gap-3">
                <div className={`w-9 h-9 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{rec.title}</span>
                        {rec.priority === "high" && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-red-100 text-red-700">Urgent</span>
                        )}
                      </div>
                      <p className="text-sm text-muted mt-1 leading-relaxed">{rec.description}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.iconBg} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-3">
                    {contact && (
                      <button
                        onClick={() => onSelectContact(contact.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-white border border-border hover:border-accent hover:text-accent rounded-lg transition-colors"
                      >
                        <div className={`w-4 h-4 rounded-full ${contact.avatarColor} flex items-center justify-center text-[7px] font-bold text-white`}>
                          {contact.avatar}
                        </div>
                        View {contact.name}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                    {rec.taskId && (
                      <button
                        onClick={() => onSelectTask(rec.taskId!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-white border border-accent/30 hover:bg-accent-light rounded-lg transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Open Task
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-16 text-sm text-muted">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <div className="font-medium text-foreground mb-1">You&apos;re all caught up!</div>
          No recommendations right now. Keep up the great work.
        </div>
      )}

      {/* Footer note */}
      <div className="mt-8 text-center">
        <p className="text-[11px] text-muted">
          Recommendations refresh daily based on your pipeline, tasks, and activity. Last updated: {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
