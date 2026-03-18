"use client";

import { ChevronRight, MoreHorizontal, Phone, Mail, Calendar } from "lucide-react";

const stages = [
  { label: "Lead", count: 12, color: "bg-blue-100 text-blue-700" },
  { label: "Qualified", count: 8, color: "bg-purple-100 text-purple-700" },
  { label: "Proposal", count: 5, color: "bg-amber-100 text-amber-700" },
  { label: "Closed", count: 3, color: "bg-emerald-100 text-emerald-700" },
];

const contacts = [
  {
    name: "Sarah Chen",
    company: "Volta Labs",
    stage: "Proposal",
    stageColor: "bg-amber-100 text-amber-700",
    value: "$12,400",
    avatar: "SC",
    avatarColor: "bg-blue-500",
  },
  {
    name: "Marcus Rivera",
    company: "Kinetic Supply",
    stage: "Qualified",
    stageColor: "bg-purple-100 text-purple-700",
    value: "$8,200",
    avatar: "MR",
    avatarColor: "bg-emerald-500",
  },
  {
    name: "Jamie Liu",
    company: "Nomad Freight",
    stage: "Lead",
    stageColor: "bg-blue-100 text-blue-700",
    value: "$5,600",
    avatar: "JL",
    avatarColor: "bg-violet-500",
  },
  {
    name: "Anika Patel",
    company: "Greenfield Co",
    stage: "Closed",
    stageColor: "bg-emerald-100 text-emerald-700",
    value: "$22,000",
    avatar: "AP",
    avatarColor: "bg-rose-500",
  },
];

export function CrmPreview() {
  return (
    <div className="rounded-xl border border-border bg-white shadow-xl shadow-gray-200/50 overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <span className="text-xs text-muted font-medium">Pipeline Overview</span>
        <MoreHorizontal className="w-4 h-4 text-muted" />
      </div>

      {/* Funnel stats */}
      <div className="grid grid-cols-4 gap-px bg-border">
        {stages.map((s) => (
          <div key={s.label} className="bg-white px-3 py-3 text-center">
            <div className="text-lg font-bold text-foreground">{s.count}</div>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.color}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Contact rows */}
      <div className="divide-y divide-border">
        {contacts.map((c) => (
          <div
            key={c.name}
            className="flex items-center gap-3 px-4 py-3 hover:bg-surface/60 transition-colors"
          >
            <div
              className={`w-8 h-8 rounded-full ${c.avatarColor} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}
            >
              {c.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
              <div className="text-xs text-muted truncate">{c.company}</div>
            </div>
            <span
              className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${c.stageColor}`}
            >
              {c.stage}
            </span>
            <span className="text-sm font-semibold text-foreground tabular-nums">{c.value}</span>
            <ChevronRight className="w-4 h-4 text-muted shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailedCrmMock() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Customer list card */}
      <div className="rounded-xl border border-border bg-white shadow-lg shadow-gray-200/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface">
          <h4 className="text-sm font-semibold text-foreground">Contacts</h4>
        </div>
        <div className="divide-y divide-border">
          {contacts.map((c) => (
            <div key={c.name} className="flex items-center gap-3 px-4 py-3">
              <div
                className={`w-8 h-8 rounded-full ${c.avatarColor} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}
              >
                {c.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{c.name}</div>
                <div className="text-xs text-muted">{c.company}</div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.stageColor}`}>
                {c.stage}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Touchpoints card */}
      <div className="rounded-xl border border-border bg-white shadow-lg shadow-gray-200/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface">
          <h4 className="text-sm font-semibold text-foreground">Recent Touchpoints</h4>
        </div>
        <div className="divide-y divide-border">
          {[
            { icon: Phone, label: "Call with Sarah Chen", time: "Today, 2:30 PM", note: "Discussed pricing for Q2 rollout" },
            { icon: Mail, label: "Email to Marcus Rivera", time: "Yesterday", note: "Sent product comparison sheet" },
            { icon: Calendar, label: "Meeting with Anika Patel", time: "Mar 14", note: "Contract review and sign-off" },
            { icon: Phone, label: "Call with Jamie Liu", time: "Mar 12", note: "Initial discovery call — interested in team plan" },
          ].map((t, i) => (
            <div key={i} className="flex gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                <t.icon className="w-3.5 h-3.5 text-accent" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">{t.label}</div>
                <div className="text-xs text-muted mt-0.5">{t.note}</div>
                <div className="text-[10px] text-muted/70 mt-1">{t.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task tracking card */}
      <div className="rounded-xl border border-border bg-white shadow-lg shadow-gray-200/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface">
          <h4 className="text-sm font-semibold text-foreground">Upcoming Tasks</h4>
        </div>
        <div className="divide-y divide-border">
          {[
            { task: "Follow up with Sarah on proposal", due: "Today", owner: "You", priority: "bg-red-100 text-red-700" },
            { task: "Send onboarding docs to Anika", due: "Tomorrow", owner: "Lisa", priority: "bg-amber-100 text-amber-700" },
            { task: "Schedule demo for Jamie Liu", due: "Mar 20", owner: "You", priority: "bg-blue-100 text-blue-700" },
            { task: "Prepare quarterly pipeline review", due: "Mar 22", owner: "Team", priority: "bg-gray-100 text-gray-600" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <input type="checkbox" readOnly className="w-4 h-4 rounded border-border accent-accent" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground">{t.task}</div>
                <div className="text-xs text-muted mt-0.5">
                  {t.due} · {t.owner}
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${t.priority}`}>
                {t.due}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel summary card */}
      <div className="rounded-xl border border-border bg-white shadow-lg shadow-gray-200/40 overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface">
          <h4 className="text-sm font-semibold text-foreground">Funnel Summary</h4>
        </div>
        <div className="p-4 space-y-4">
          {[
            { label: "Lead", count: 12, value: "$48,200", width: "100%" },
            { label: "Qualified", count: 8, value: "$34,600", width: "67%" },
            { label: "Proposal", count: 5, value: "$22,400", width: "42%" },
            { label: "Closed Won", count: 3, value: "$22,000", width: "25%" },
          ].map((s) => (
            <div key={s.label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium text-foreground">
                  {s.label} <span className="text-muted font-normal">({s.count})</span>
                </span>
                <span className="text-muted tabular-nums">{s.value}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: s.width }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
