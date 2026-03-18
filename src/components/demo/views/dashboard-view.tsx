"use client";

import {
  TrendingUp,
  Users,
  DollarSign,
  CheckSquare,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Mail,
  Calendar,
  FileText,
  Home,
  UserCheck,
  Briefcase,
  Clock,
  Target,
  BarChart3,
  Wrench,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import { type Contact, type Touchpoint, type Task, type StageDefinition, formatCurrency, formatDueDate, getTaskStatus } from "../data";

const typeIcons = { call: Phone, email: Mail, meeting: Calendar, note: FileText };

interface StatCard {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: LucideIcon;
}

interface DashboardViewProps {
  touchpoints: Touchpoint[];
  tasks: Task[];
  contacts: Contact[];
  stages: StageDefinition[];
  industryId?: string;
  onSelectContact: (id: string) => void;
  onNavigate: (view: "dashboard" | "pipeline" | "contacts" | "activity" | "tasks") => void;
  onSelectTask?: (id: string) => void;
}

function getIndustryStats(industryId: string, contacts: Contact[], tasks: Task[]): StatCard[] {
  const activeContacts = contacts.filter((c) => !c.stage.toLowerCase().includes("won") && !c.stage.toLowerCase().includes("lost") && !c.stage.toLowerCase().includes("hired") && !c.stage.toLowerCase().includes("rejected") && !c.stage.toLowerCase().includes("engaged") && !c.stage.toLowerCase().includes("completed") && !c.stage.toLowerCase().includes("cancelled"));
  const wonContacts = contacts.filter((c) => c.stage.toLowerCase().includes("won") || c.stage.toLowerCase().includes("hired") || c.stage.toLowerCase().includes("engaged") || c.stage.toLowerCase().includes("completed"));
  const openTasks = tasks.filter((t) => !t.completed).length;

  switch (industryId) {
    case "saas": {
      const totalMRR = contacts.filter((c) => c.stage.toLowerCase().includes("won")).reduce((a, c) => a + c.value, 0);
      const trialContacts = contacts.filter((c) => c.stage.toLowerCase().includes("trial")).length;
      const demoContacts = contacts.filter((c) => c.stage.toLowerCase().includes("demo")).length;
      const hasData = contacts.length > 0;
      return [
        { label: "Pipeline ARR", value: formatCurrency(activeContacts.reduce((a, c) => a + c.value * 12, 0)), change: hasData ? "+18%" : "—", up: hasData, icon: BarChart3 },
        { label: "Active MRR", value: formatCurrency(totalMRR), change: hasData ? "+12%" : "—", up: hasData, icon: DollarSign },
        { label: "Active Trials", value: trialContacts.toString(), change: hasData ? "+2" : "—", up: hasData, icon: Clock },
        { label: "Demos Scheduled", value: demoContacts.toString(), change: hasData ? "+1" : "—", up: hasData, icon: Target },
      ];
    }
    case "realestate": {
      const underContract = contacts.filter((c) => c.stage.toLowerCase().includes("contract")).length;
      const avgValue = activeContacts.length > 0 ? Math.round(activeContacts.reduce((a, c) => a + c.value, 0) / activeContacts.length) : 0;
      const closedValue = wonContacts.reduce((a, c) => a + c.value, 0);
      const hasData = contacts.length > 0;
      return [
        { label: "Active Listings", value: activeContacts.length.toString(), change: hasData ? "+3" : "—", up: hasData, icon: Home },
        { label: "Under Contract", value: underContract.toString(), change: hasData ? "+1" : "—", up: hasData, icon: FileText },
        { label: "Closed Volume", value: formatCurrency(closedValue), change: hasData ? "+15%" : "—", up: hasData, icon: DollarSign },
        { label: "Avg. Deal Size", value: formatCurrency(avgValue), change: hasData ? "+8%" : "—", up: hasData, icon: TrendingUp },
      ];
    }
    case "recruiting": {
      const offerStage = contacts.filter((c) => c.stage.toLowerCase().includes("offer")).length;
      const interviewStage = contacts.filter((c) => c.stage.toLowerCase().includes("interview") || c.stage.toLowerCase().includes("final")).length;
      const hired = wonContacts.length;
      const hasData = contacts.length > 0;
      return [
        { label: "Active Candidates", value: activeContacts.length.toString(), change: hasData ? "+4" : "—", up: hasData, icon: Users },
        { label: "In Interviews", value: interviewStage.toString(), change: hasData ? "+2" : "—", up: hasData, icon: Calendar },
        { label: "Pending Offers", value: offerStage.toString(), change: hasData ? "+1" : "—", up: hasData, icon: Target },
        { label: "Hires This Month", value: hired.toString(), change: hasData ? "+1" : "—", up: hasData, icon: UserCheck },
      ];
    }
    case "consulting": {
      const engagedValue = wonContacts.reduce((a, c) => a + c.value, 0);
      const proposalValue = contacts.filter((c) => c.stage.toLowerCase().includes("proposal") || c.stage.toLowerCase().includes("sow")).reduce((a, c) => a + c.value, 0);
      const hasData = contacts.length > 0;
      return [
        { label: "Pipeline Value", value: formatCurrency(activeContacts.reduce((a, c) => a + c.value, 0)), change: hasData ? "+22%" : "—", up: hasData, icon: Briefcase },
        { label: "Active Engagements", value: wonContacts.length.toString(), change: hasData ? "+1" : "—", up: hasData, icon: CheckSquare },
        { label: "Revenue Booked", value: formatCurrency(engagedValue), change: hasData ? "+18%" : "—", up: hasData, icon: DollarSign },
        { label: "Proposals Out", value: formatCurrency(proposalValue), change: hasData ? "+2" : "—", up: hasData, icon: FileText },
      ];
    }
    case "services": {
      const scheduledJobs = contacts.filter((c) => c.stage.toLowerCase().includes("scheduled")).length;
      const inProgress = contacts.filter((c) => c.stage.toLowerCase().includes("progress")).length;
      const completedValue = wonContacts.reduce((a, c) => a + c.value, 0);
      const svcOpenTasks = tasks.filter((t) => !t.completed).length;
      const hasData = contacts.length > 0;
      return [
        { label: "Active Jobs", value: (scheduledJobs + inProgress).toString(), change: hasData ? "+3" : "—", up: hasData, icon: Wrench },
        { label: "Scheduled", value: scheduledJobs.toString(), change: hasData ? "+2" : "—", up: hasData, icon: Calendar },
        { label: "Completed Revenue", value: formatCurrency(completedValue), change: hasData ? "+15%" : "—", up: hasData, icon: DollarSign },
        { label: "Open Tasks", value: svcOpenTasks.toString(), change: hasData ? "-1" : "—", up: false, icon: ClipboardCheck },
      ];
    }
    default: {
      // B2B Sales (default)
      const totalValue = contacts.filter((c) => !c.stage.toLowerCase().includes("lost")).reduce((a, c) => a + c.value, 0);
      const wonValue = wonContacts.reduce((a, c) => a + c.value, 0);
      const hasData = contacts.length > 0;
      return [
        { label: "Pipeline Value", value: formatCurrency(totalValue), change: hasData ? "+12% vs last month" : "—", up: hasData, icon: DollarSign },
        { label: "Won This Month", value: formatCurrency(wonValue), change: hasData ? "+8% vs last month" : "—", up: hasData, icon: TrendingUp },
        { label: "Active Deals", value: activeContacts.length.toString(), change: hasData ? "+3 vs last month" : "—", up: hasData, icon: Users },
        { label: "Open Tasks", value: openTasks.toString(), change: hasData && openTasks > 0 ? "-2 vs last month" : "—", up: !(hasData && openTasks > 0), icon: CheckSquare },
      ];
    }
  }
}

export default function DashboardView({ touchpoints, tasks, contacts, stages, industryId, onSelectContact, onNavigate, onSelectTask }: DashboardViewProps) {
  const totalValue = contacts.filter((c) => !c.stage.toLowerCase().includes("lost")).reduce((a, c) => a + c.value, 0);

  const statCards = getIndustryStats(industryId || "b2b", contacts, tasks);

  const pipelineCounts = stages.filter((s) => !s.label.toLowerCase().includes("won") && !s.label.toLowerCase().includes("lost") && !s.label.toLowerCase().includes("hired") && !s.label.toLowerCase().includes("rejected") && !s.label.toLowerCase().includes("engaged") && !s.label.toLowerCase().includes("completed") && !s.label.toLowerCase().includes("cancelled")).slice(0, 5).map((s) => ({
    ...s,
    count: contacts.filter((c) => c.stage === s.label).length,
    value: contacts.filter((c) => c.stage === s.label).reduce((a, c) => a + c.value, 0),
  }));

  const maxStageValue = Math.max(...pipelineCounts.map((s) => s.value), 1);

  const recentTouchpoints = touchpoints.slice(0, 5);
  const urgentTasks = tasks.filter((t) => !t.completed).slice(0, 5);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted font-medium">{stat.label}</span>
              <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-accent" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${stat.change === "—" ? "text-muted" : stat.up ? "text-emerald-600" : "text-amber-600"}`}>
              {stat.change === "—" ? (
                <span>—</span>
              ) : (
                <>
                  {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline summary */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Pipeline Overview</h3>
            <button
              onClick={() => onNavigate("pipeline")}
              className="text-xs text-accent hover:text-accent-dark font-medium"
            >
              View pipeline
            </button>
          </div>
          <div className="p-5 space-y-4">
            {pipelineCounts.map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bgColor} ${s.color}`}>
                      {s.label}
                    </span>
                    <span className="text-xs text-muted">{s.count} deals</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {formatCurrency(s.value)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${(s.value / maxStageValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent tasks */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Upcoming Tasks</h3>
            <button
              onClick={() => onNavigate("tasks")}
              className="text-xs text-accent hover:text-accent-dark font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-border">
            {urgentTasks.map((t) => {
              const contact = contacts.find((c) => c.id === t.contactId);
              return (
                <div
                  key={t.id}
                  className="px-5 py-3 hover:bg-surface/50 transition-colors cursor-pointer"
                  onClick={() => onSelectTask?.(t.id)}
                >
                  <div className="text-sm text-foreground">{t.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        getTaskStatus(t.due, t.completed) === "overdue"
                          ? "bg-red-100 text-red-700"
                          : getTaskStatus(t.due, t.completed) === "today"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {formatDueDate(t.due)}
                    </span>
                    {contact && (
                      <span className="text-xs text-muted">{contact.name}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
          <button
            onClick={() => onNavigate("activity")}
            className="text-xs text-accent hover:text-accent-dark font-medium"
          >
            View all
          </button>
        </div>
        <div className="divide-y divide-border">
          {recentTouchpoints.map((t) => {
            const contact = contacts.find((c) => c.id === t.contactId);
            const Icon = typeIcons[t.type];
            return (
              <div
                key={t.id}
                className="flex gap-3 px-5 py-3 hover:bg-surface/50 transition-colors cursor-pointer"
                onClick={() => contact && onSelectContact(contact.id)}
              >
                <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{t.title}</div>
                  <div className="text-xs text-muted mt-0.5 line-clamp-1">{t.description}</div>
                </div>
                <div className="text-right shrink-0">
                  {contact && (
                    <div className="text-xs font-medium text-foreground">{contact.name}</div>
                  )}
                  <div className="text-[10px] text-muted mt-0.5">{t.date}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
