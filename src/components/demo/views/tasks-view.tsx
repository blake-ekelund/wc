"use client";

import { useMemo } from "react";
import { Circle, CheckCircle2, AlertTriangle, Clock, CalendarCheck, Calendar, Plus } from "lucide-react";
import { type Task, contacts, getTaskStatus, formatDueDate } from "../data";

type StatusFilter = "all" | "overdue" | "today" | "upcoming" | "later" | "completed";
type PriorityFilter = "all" | "high" | "medium" | "low";

interface TasksViewProps {
  tasks: Task[];
  statusFilter: StatusFilter;
  setStatusFilter: (f: StatusFilter) => void;
  priorityFilter: PriorityFilter;
  setPriorityFilter: (f: PriorityFilter) => void;
  ownerFilter: string;
  setOwnerFilter: (f: string) => void;
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  onNewTask: () => void;
  ownerLabels: string[];
}

export default function TasksView({
  tasks: taskState,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  ownerFilter,
  setOwnerFilter,
  onToggleTask,
  onSelectTask,
  onNewTask,
  ownerLabels,
}: TasksViewProps) {
  const statusCounts = useMemo(() => {
    const counts = { overdue: 0, today: 0, upcoming: 0, later: 0, completed: 0 };
    taskState.forEach((t) => {
      const s = getTaskStatus(t.due, t.completed);
      counts[s]++;
    });
    return counts;
  }, [taskState]);

  const totalCount = taskState.length;

  const filtered = useMemo(() => {
    return taskState
      .filter((t) => {
        const status = getTaskStatus(t.due, t.completed);

        if (statusFilter !== "all" && status !== statusFilter) return false;
        if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
        if (ownerFilter !== "All" && t.owner !== ownerFilter) return false;

        return true;
      })
      .sort((a, b) => {
        const statusA = getTaskStatus(a.due, a.completed);
        const statusB = getTaskStatus(b.due, b.completed);
        if (statusA === "completed" && statusB !== "completed") return 1;
        if (statusB === "completed" && statusA !== "completed") return -1;
        const statusOrder = { overdue: 0, today: 1, upcoming: 2, later: 3, completed: 4 };
        const statusDiff = statusOrder[statusA] - statusOrder[statusB];
        if (statusDiff !== 0) return statusDiff;
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priDiff !== 0) return priDiff;
        return a.due.localeCompare(b.due);
      });
  }, [taskState, statusFilter, priorityFilter, ownerFilter]);

  const statusCards: { key: StatusFilter; label: string; icon: typeof AlertTriangle; count: number; color: string; iconColor: string }[] = [
    { key: "overdue", label: "Overdue", icon: AlertTriangle, count: statusCounts.overdue, color: "border-red-200 bg-red-50", iconColor: "text-red-500" },
    { key: "today", label: "Due Today", icon: Clock, count: statusCounts.today, color: "border-amber-200 bg-amber-50", iconColor: "text-amber-500" },
    { key: "upcoming", label: "Upcoming", icon: CalendarCheck, count: statusCounts.upcoming, color: "border-blue-200 bg-blue-50", iconColor: "text-blue-500" },
    { key: "later", label: "Later", icon: Calendar, count: statusCounts.later, color: "border-gray-200 bg-gray-50", iconColor: "text-gray-400" },
    { key: "completed", label: "Completed", icon: CheckCircle2, count: statusCounts.completed, color: "border-emerald-200 bg-emerald-50", iconColor: "text-emerald-500" },
  ];

  function getStatusBadge(due: string, completed: boolean) {
    const status = getTaskStatus(due, completed);
    switch (status) {
      case "overdue":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">Overdue</span>;
      case "today":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">Today</span>;
      case "upcoming":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">Upcoming</span>;
      case "later":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">Later</span>;
      case "completed":
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">Done</span>;
    }
  }

  const hasFilters = statusFilter !== "all" || priorityFilter !== "all" || ownerFilter !== "All";

  return (
    <div className="p-4 lg:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
          <p className="text-sm text-muted mt-0.5">
            {statusCounts.completed}/{totalCount} completed
            {statusCounts.overdue > 0 && (
              <span className="text-red-600 font-medium"> · {statusCounts.overdue} overdue</span>
            )}
          </p>
        </div>
        <button
          onClick={onNewTask}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {statusCards.map((card) => (
          <button
            key={card.key}
            onClick={() => setStatusFilter(statusFilter === card.key ? "all" : card.key)}
            className={`rounded-lg border p-3 text-left transition-all ${
              statusFilter === card.key
                ? "ring-1 ring-accent border-accent bg-accent-light"
                : `${card.color} hover:shadow-md`
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <card.icon className={`w-4 h-4 ${statusFilter === card.key ? "text-accent" : card.iconColor}`} />
              <span className="text-lg font-bold text-foreground">{card.count}</span>
            </div>
            <div className="text-xs font-medium text-muted">{card.label}</div>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
          {statusCounts.overdue > 0 && (
            <div
              className="h-full bg-red-400 transition-all duration-300"
              style={{ width: `${(statusCounts.overdue / totalCount) * 100}%` }}
            />
          )}
          {statusCounts.completed > 0 && (
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${(statusCounts.completed / totalCount) * 100}%` }}
            />
          )}
        </div>
        <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Overdue</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent inline-block" /> Completed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200 inline-block" /> Remaining</span>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="priority-filter" className="text-xs font-medium text-muted whitespace-nowrap">Priority</label>
          <select
            id="priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
            className="text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="owner-filter" className="text-xs font-medium text-muted whitespace-nowrap">Owner</label>
          <select
            id="owner-filter"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer"
          >
            <option value="All">All owners</option>
            {ownerLabels.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count + clear */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs text-muted">
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </span>
        {hasFilters && (
          <button
            onClick={() => {
              setStatusFilter("all");
              setPriorityFilter("all");
              setOwnerFilter("All");
            }}
            className="text-xs text-accent hover:text-accent-dark font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Task list */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.map((t) => {
            const contact = contacts.find((c) => c.id === t.contactId);
            const status = getTaskStatus(t.due, t.completed);
            return (
              <div
                key={t.id}
                className={`flex items-start gap-3 px-4 sm:px-5 py-3 hover:bg-surface/50 transition-colors cursor-pointer ${
                  t.completed ? "opacity-50" : ""
                }`}
                onClick={() => onSelectTask(t.id)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(t.id);
                  }}
                  className="mt-0.5 shrink-0 text-muted hover:text-accent transition-colors"
                >
                  {t.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                  ) : (
                    <Circle className={`w-5 h-5 ${status === "overdue" ? "text-red-400" : ""}`} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${t.completed ? "line-through text-muted" : status === "overdue" ? "text-red-700" : "text-foreground"}`}>
                    {t.title}
                  </div>
                  {t.description && (
                    <div className="text-xs text-muted mt-0.5 line-clamp-1">{t.description}</div>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {getStatusBadge(t.due, t.completed)}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        t.priority === "high"
                          ? "bg-red-100 text-red-700"
                          : t.priority === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span className={`text-xs ${status === "overdue" ? "text-red-500 font-medium" : "text-muted"}`}>
                      {formatDueDate(t.due)}
                    </span>
                    {contact && (
                      <>
                        <span className="text-xs text-muted hidden sm:inline">·</span>
                        <div className="hidden sm:flex items-center gap-1">
                          <div
                            className={`w-4 h-4 rounded-full ${contact.avatarColor} flex items-center justify-center text-[7px] font-bold text-white`}
                          >
                            {contact.avatar}
                          </div>
                          <span className="text-xs text-muted">{contact.name}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted shrink-0 hidden sm:block">{t.owner}</span>
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-muted">
            No tasks match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
