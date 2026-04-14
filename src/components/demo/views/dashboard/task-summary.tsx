"use client";

import { CheckSquare, Clock } from "lucide-react";
import { type Task, formatDueDate, getTaskStatus } from "../../data";

interface TaskSummaryProps {
  tasks: Task[];
  onSelectTask?: (id: string) => void;
}

export default function TaskSummary({ tasks, onSelectTask }: TaskSummaryProps) {
  const openTasks = tasks.filter((t) => !t.completed);
  const sorted = [...openTasks].sort((a, b) => {
    const aStatus = a.due ? getTaskStatus(a.due, false) : "upcoming";
    const bStatus = b.due ? getTaskStatus(b.due, false) : "upcoming";
    // Overdue first, then today, then upcoming
    const order: Record<string, number> = { overdue: 0, today: 1, upcoming: 2, later: 3, completed: 4 };
    const aDue = a.due ? new Date(a.due).getTime() : Infinity;
    const bDue = b.due ? new Date(b.due).getTime() : Infinity;
    const orderDiff = (order[aStatus] ?? 2) - (order[bStatus] ?? 2);
    if (orderDiff !== 0) return orderDiff;
    return aDue - bDue;
  });
  const display = sorted.slice(0, 5);

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Upcoming Tasks</h3>
        <span className="text-xs text-muted">{openTasks.length} open</span>
      </div>
      <div className="divide-y divide-border">
        {display.map((t) => {
          const status = t.due ? getTaskStatus(t.due, false) : "upcoming";
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
                    status === "overdue"
                      ? "bg-red-100 text-red-700"
                      : status === "today"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {t.due ? formatDueDate(t.due) : "No date"}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    t.priority === "high"
                      ? "bg-red-50 text-red-600"
                      : t.priority === "medium"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-gray-50 text-gray-500"
                  }`}
                >
                  {t.priority}
                </span>
              </div>
            </div>
          );
        })}
        {display.length === 0 && (
          <div className="px-5 py-8 text-center">
            <CheckSquare className="w-8 h-8 text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-muted">No upcoming tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}
