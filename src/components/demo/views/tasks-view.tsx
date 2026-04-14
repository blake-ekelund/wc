"use client";

import { useMemo, useState } from "react";
import { Circle, CheckCircle2, AlertTriangle, Clock, CalendarCheck, Calendar, Plus, CheckSquare, Building2, ChevronDown } from "lucide-react";
import { type Task, type TaskSource, type Vendor, contacts as demoContacts, getTaskStatus, formatDueDate } from "../data";

type StatusFilter = "all" | "overdue" | "today" | "upcoming" | "later" | "completed";
type PriorityFilter = "all" | "high" | "medium" | "low";
type SourceFilter = "all" | TaskSource;

interface TasksViewProps {
  tasks: Task[];
  vendors?: Vendor[];
  statusFilter: StatusFilter;
  setStatusFilter: (f: StatusFilter) => void;
  priorityFilter: PriorityFilter;
  setPriorityFilter: (f: PriorityFilter) => void;
  ownerFilter: string;
  setOwnerFilter: (f: string) => void;
  sourceFilter?: SourceFilter;
  setSourceFilter?: (f: SourceFilter) => void;
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  onNewTask: () => void;
  ownerLabels: string[];
}

export default function TasksView({
  tasks: taskState,
  vendors = [],
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  ownerFilter,
  setOwnerFilter,
  sourceFilter = "all",
  setSourceFilter,
  onToggleTask,
  onSelectTask,
  onNewTask,
  ownerLabels,
}: TasksViewProps) {
  const [sortKey, setSortKey] = useState<"due" | "priority" | "title" | "owner">("due");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const statusCounts = useMemo(() => {
    const counts = { all: taskState.length, overdue: 0, today: 0, upcoming: 0, later: 0, completed: 0 };
    taskState.forEach((t) => { counts[getTaskStatus(t.due, t.completed)]++; });
    return counts;
  }, [taskState]);

  const activeSources = useMemo(() => {
    const sources = new Set(taskState.map((t) => t.source || "tasks"));
    return Array.from(sources) as TaskSource[];
  }, [taskState]);

  const filtered = useMemo(() => {
    return taskState
      .filter((t) => {
        const status = getTaskStatus(t.due, t.completed);
        if (sourceFilter !== "all" && (t.source || "tasks") !== sourceFilter) return false;
        if (statusFilter !== "all" && status !== statusFilter) return false;
        if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
        if (ownerFilter !== "All" && t.owner !== ownerFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        switch (sortKey) {
          case "due": {
            // Completed always last
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;
            return a.due.localeCompare(b.due) * dir;
          }
          case "priority": {
            const order = { high: 0, medium: 1, low: 2 };
            return (order[a.priority] - order[b.priority]) * dir;
          }
          case "title": return a.title.localeCompare(b.title) * dir;
          case "owner": return a.owner.localeCompare(b.owner) * dir;
          default: return 0;
        }
      });
  }, [taskState, statusFilter, priorityFilter, ownerFilter, sourceFilter, sortKey, sortDir]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const statusCards = [
    { key: "all" as StatusFilter, label: "All", count: statusCounts.all, icon: CheckSquare, color: "border-gray-200 bg-white", iconColor: "text-gray-500" },
    { key: "overdue" as StatusFilter, label: "Overdue", count: statusCounts.overdue, icon: AlertTriangle, color: "border-red-200 bg-red-50", iconColor: "text-red-500" },
    { key: "today" as StatusFilter, label: "Today", count: statusCounts.today, icon: Clock, color: "border-amber-200 bg-amber-50", iconColor: "text-amber-500" },
    { key: "upcoming" as StatusFilter, label: "Upcoming", count: statusCounts.upcoming, icon: CalendarCheck, color: "border-blue-200 bg-blue-50", iconColor: "text-blue-500" },
    { key: "completed" as StatusFilter, label: "Done", count: statusCounts.completed, icon: CheckCircle2, color: "border-emerald-200 bg-emerald-50", iconColor: "text-emerald-500" },
  ];

  function SortHeader({ label, field }: { label: string; field: typeof sortKey }) {
    const active = sortKey === field;
    return (
      <button onClick={() => toggleSort(field)} className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wider ${active ? "text-accent" : "text-muted"} hover:text-foreground transition-colors`}>
        {label}
        {active && <ChevronDown className={`w-3 h-3 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`} />}
      </button>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
          <p className="text-sm text-muted mt-0.5">{statusCounts.completed}/{statusCounts.all} completed{statusCounts.overdue > 0 && <span className="text-red-600 font-medium"> · {statusCounts.overdue} overdue</span>}</p>
        </div>
        <button onClick={onNewTask} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {statusCards.map((card) => (
          <button
            key={card.key}
            onClick={() => setStatusFilter(statusFilter === card.key ? "all" : card.key)}
            className={`rounded-xl border p-3 text-left transition-all ${
              statusFilter === card.key ? "ring-2 ring-accent border-accent" : `${card.color} hover:shadow-sm`
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <card.icon className={`w-4 h-4 ${statusFilter === card.key ? "text-accent" : card.iconColor}`} />
              <span className="text-xl font-bold text-foreground">{card.count}</span>
            </div>
            <div className="text-[10px] font-medium text-muted uppercase tracking-wider">{card.label}</div>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {/* Column headers with filters */}
        <div className="grid grid-cols-[auto_1fr_100px_100px_100px_80px] gap-2 items-center px-4 py-2.5 border-b border-border bg-surface/50 text-xs">
          <div className="w-6" />
          <SortHeader label="Task" field="title" />
          <SortHeader label="Priority" field="priority" />
          <div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="text-xs font-medium uppercase tracking-wider text-muted bg-transparent border-0 outline-none cursor-pointer p-0 appearance-none hover:text-foreground">
              <option value="all">Status ▾</option>
              <option value="overdue">Overdue</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Done</option>
            </select>
          </div>
          <SortHeader label="Due" field="due" />
          <div>
            <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className="text-xs font-medium uppercase tracking-wider text-muted bg-transparent border-0 outline-none cursor-pointer p-0 appearance-none hover:text-foreground">
              <option value="All">Owner ▾</option>
              {ownerLabels.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border">
          {filtered.map((t) => {
            const contact = t.contactId ? demoContacts.find((c) => c.id === t.contactId) : null;
            const vendor = t.vendorId ? vendors.find((v) => v.id === t.vendorId) : null;
            const status = getTaskStatus(t.due, t.completed);

            return (
              <div
                key={t.id}
                className={`grid grid-cols-[auto_1fr_100px_100px_100px_80px] gap-2 items-center px-4 py-2.5 hover:bg-surface/50 transition-colors cursor-pointer ${t.completed ? "opacity-40" : ""}`}
                onClick={() => onSelectTask(t.id)}
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleTask(t.id); }}
                  className="shrink-0 text-muted hover:text-accent transition-colors"
                  aria-label={t.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                  {t.completed ? <CheckCircle2 className="w-4.5 h-4.5 text-accent" /> : <Circle className={`w-4.5 h-4.5 ${status === "overdue" ? "text-red-400" : ""}`} />}
                </button>

                {/* Task name + linked entity */}
                <div className="min-w-0">
                  <div className={`text-sm font-medium truncate ${t.completed ? "line-through text-muted" : status === "overdue" ? "text-red-700" : "text-foreground"}`}>{t.title}</div>
                  {(contact || vendor) && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {contact && <span className="text-[10px] text-muted truncate">{contact.name}</span>}
                      {vendor && <><Building2 className="w-2.5 h-2.5 text-muted" /><span className="text-[10px] text-muted truncate">{vendor.name}</span></>}
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    t.priority === "high" ? "bg-red-100 text-red-700" : t.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                  }`}>{t.priority}</span>
                </div>

                {/* Status */}
                <div>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    status === "overdue" ? "bg-red-100 text-red-700" : status === "today" ? "bg-amber-100 text-amber-700" : status === "upcoming" ? "bg-blue-100 text-blue-700" : status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                  }`}>{status === "completed" ? "Done" : status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </div>

                {/* Due date */}
                <div className={`text-xs ${status === "overdue" ? "text-red-600 font-medium" : "text-muted"}`}>
                  {formatDueDate(t.due)}
                </div>

                {/* Owner */}
                <div className="text-xs text-muted truncate">{t.owner}</div>
              </div>
            );
          })}
        </div>

        {/* Empty states */}
        {filtered.length === 0 && taskState.length === 0 && (
          <div className="text-center py-16 px-6">
            <CheckSquare className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No tasks yet</h3>
            <p className="text-sm text-muted max-w-md mx-auto mb-6">Create your first task to start tracking work.</p>
            <button onClick={onNewTask} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Create Task
            </button>
          </div>
        )}
        {filtered.length === 0 && taskState.length > 0 && (
          <div className="text-center py-12 text-sm text-muted">No tasks match your filters.</div>
        )}
      </div>
    </div>
  );
}
