"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  FileText,
  Circle,
  CheckCircle2,
} from "lucide-react";
import { type Task, type Touchpoint, type Contact, formatCurrency } from "../data";

const typeIcons = { call: Phone, email: Mail, meeting: CalendarIcon, note: FileText };
const priorityColors = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-gray-400",
};
const priorityBorder = {
  high: "border-red-200 bg-red-50",
  medium: "border-amber-200 bg-amber-50",
  low: "border-gray-200 bg-gray-50",
};
const touchpointColors = {
  call: "bg-blue-500",
  email: "bg-emerald-500",
  meeting: "bg-violet-500",
  note: "bg-slate-400",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface CalendarViewProps {
  tasks: Task[];
  touchpoints: Touchpoint[];
  contacts: Contact[];
  onSelectContact: (id: string) => void;
  onSelectTask: (id: string) => void;
}

function parseTouchpointDate(dateStr: string): Date | null {
  const now = new Date();
  const lower = dateStr.toLowerCase();

  if (lower.startsWith("today")) {
    return now;
  }
  if (lower.startsWith("yesterday")) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }

  // Try "Mar 14, 3:00 PM" or "Mar 14" format
  const monthMatch = dateStr.match(/^([A-Z][a-z]+)\s+(\d{1,2})/);
  if (monthMatch) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIdx = monthNames.findIndex((m) => monthMatch[1].startsWith(m));
    if (monthIdx !== -1) {
      const day = parseInt(monthMatch[2], 10);
      const year = now.getFullYear();
      return new Date(year, monthIdx, day);
    }
  }

  return null;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface DayItem {
  type: "task" | "touchpoint";
  task?: Task;
  touchpoint?: Touchpoint;
  contact?: Contact;
}

export default function CalendarView({ tasks, touchpoints, contacts, onSelectContact, onSelectTask }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Build a map of date -> items
  const itemsByDate = useMemo(() => {
    const map: Record<string, DayItem[]> = {};

    function addItem(key: string, item: DayItem) {
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }

    tasks.forEach((t) => {
      const contact = contacts.find((c) => c.id === t.contactId);
      addItem(t.due, { type: "task", task: t, contact });
    });

    touchpoints.forEach((tp) => {
      const d = parseTouchpointDate(tp.date);
      if (d) {
        const contact = contacts.find((c) => c.id === tp.contactId);
        addItem(dateKey(d), { type: "touchpoint", touchpoint: tp, contact });
      }
    });

    return map;
  }, [tasks, touchpoints, contacts]);

  // Calendar grid
  const firstDay = new Date(currentMonth.year, currentMonth.month, 1);
  const lastDay = new Date(currentMonth.year, currentMonth.month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = dateKey(new Date());

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  function prevMonth() {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
    setSelectedDate(null);
  }

  function goToday() {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDate(today);
  }

  // Selected day items
  const selectedItems = selectedDate ? itemsByDate[selectedDate] || [] : [];
  const selectedDay = selectedDate ? new Date(selectedDate + "T00:00:00") : null;

  // Stats for current month
  const monthTaskCount = useMemo(() => {
    return tasks.filter((t) => {
      const d = new Date(t.due + "T00:00:00");
      return d.getMonth() === currentMonth.month && d.getFullYear() === currentMonth.year;
    }).length;
  }, [tasks, currentMonth]);

  const monthTouchpointCount = useMemo(() => {
    let count = 0;
    touchpoints.forEach((tp) => {
      const d = parseTouchpointDate(tp.date);
      if (d && d.getMonth() === currentMonth.month && d.getFullYear() === currentMonth.year) count++;
    });
    return count;
  }, [touchpoints, currentMonth]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl">
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar grid */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-foreground">
                {MONTHS[currentMonth.month]} {currentMonth.year}
              </h3>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 text-xs text-muted mr-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  {monthTaskCount} tasks
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-500" />
                  {monthTouchpointCount} touchpoints
                </span>
              </div>
              <button
                onClick={goToday}
                className="px-3 py-1.5 text-xs font-medium text-accent border border-accent/30 hover:bg-accent-light rounded-lg transition-colors"
              >
                Today
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS.map((day) => (
              <div key={day} className="px-2 py-2 text-center text-[11px] font-medium text-muted uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="divide-y divide-border">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 divide-x divide-border">
                {week.map((day, di) => {
                  if (day === null) {
                    return <div key={di} className="min-h-[90px] bg-surface/30" />;
                  }
                  const dk = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const items = itemsByDate[dk] || [];
                  const isToday = dk === today;
                  const isSelected = dk === selectedDate;
                  const taskItems = items.filter((i) => i.type === "task");
                  const tpItems = items.filter((i) => i.type === "touchpoint");

                  return (
                    <button
                      key={di}
                      onClick={() => setSelectedDate(dk === selectedDate ? null : dk)}
                      className={`min-h-[90px] p-1.5 text-left transition-colors relative ${
                        isSelected
                          ? "bg-accent/5 ring-2 ring-inset ring-accent/30"
                          : items.length > 0
                          ? "hover:bg-surface/60"
                          : "hover:bg-surface/30"
                      }`}
                    >
                      <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-accent text-white"
                          : isSelected
                          ? "text-accent font-bold"
                          : "text-foreground"
                      }`}>
                        {day}
                      </div>

                      {/* Compact item indicators */}
                      <div className="space-y-0.5">
                        {taskItems.slice(0, 2).map((item) => (
                          <div
                            key={item.task!.id}
                            className={`flex items-center gap-1 px-1 py-0.5 rounded text-[9px] truncate ${
                              item.task!.completed
                                ? "bg-emerald-50 text-emerald-700 line-through opacity-60"
                                : priorityBorder[item.task!.priority]
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.task!.completed ? "bg-emerald-400" : priorityColors[item.task!.priority]}`} />
                            <span className="truncate">{item.task!.title.slice(0, 18)}</span>
                          </div>
                        ))}
                        {tpItems.slice(0, 1).map((item) => (
                          <div
                            key={item.touchpoint!.id}
                            className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] bg-violet-50 text-violet-700 truncate"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${touchpointColors[item.touchpoint!.type]}`} />
                            <span className="truncate">{item.touchpoint!.title.slice(0, 18)}</span>
                          </div>
                        ))}
                        {items.length > 3 && (
                          <div className="text-[9px] text-muted pl-1 font-medium">+{items.length - 3} more</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Day detail panel */}
        <div className="space-y-4">
          {/* Selected day */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">
                {selectedDay
                  ? selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                  : "Select a day"}
              </h3>
              {selectedDate && (
                <p className="text-xs text-muted mt-0.5">
                  {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            {!selectedDate && (
              <div className="px-4 py-8 text-center text-sm text-muted">
                <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                Click a day to see details
              </div>
            )}

            {selectedDate && selectedItems.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted">
                Nothing scheduled for this day.
              </div>
            )}

            {selectedDate && selectedItems.length > 0 && (
              <div className="divide-y divide-border">
                {/* Tasks first */}
                {selectedItems.filter((i) => i.type === "task").map((item) => {
                  const t = item.task!;
                  const Icon = t.completed ? CheckCircle2 : Circle;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onSelectTask(t.id)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface/50 transition-colors"
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${
                        t.completed ? "text-emerald-500" : t.priority === "high" ? "text-red-500" : t.priority === "medium" ? "text-amber-500" : "text-gray-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${t.completed ? "line-through text-muted" : "text-foreground"}`}>
                          {t.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                            t.priority === "high" ? "bg-red-100 text-red-700" : t.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {t.priority}
                          </span>
                          <span className="text-xs text-muted">{t.owner}</span>
                          {item.contact && (
                            <span className="text-xs text-muted">· {item.contact.name}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {/* Touchpoints */}
                {selectedItems.filter((i) => i.type === "touchpoint").map((item) => {
                  const tp = item.touchpoint!;
                  const Icon = typeIcons[tp.type];
                  return (
                    <button
                      key={tp.id}
                      onClick={() => item.contact && onSelectContact(item.contact.id)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-surface/50 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        tp.type === "call" ? "bg-blue-100" : tp.type === "email" ? "bg-emerald-100" : tp.type === "meeting" ? "bg-violet-100" : "bg-gray-100"
                      }`}>
                        <Icon className={`w-3.5 h-3.5 ${
                          tp.type === "call" ? "text-blue-600" : tp.type === "email" ? "text-emerald-600" : tp.type === "meeting" ? "text-violet-600" : "text-gray-500"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground">{tp.title}</div>
                        <div className="text-xs text-muted mt-0.5 line-clamp-2">{tp.description}</div>
                        {item.contact && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className={`w-4 h-4 rounded-full ${item.contact.avatarColor} flex items-center justify-center text-[6px] font-bold text-white`}>
                              {item.contact.avatar}
                            </div>
                            <span className="text-xs text-muted">{item.contact.name}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl border border-border p-4">
            <h4 className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="w-2 h-2 rounded-full bg-red-500" /> High priority task
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Medium priority task
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="w-2 h-2 rounded-full bg-gray-400" /> Low priority task
              </div>
              <div className="border-t border-border my-2" />
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Call
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Email
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="w-2 h-2 rounded-full bg-violet-500" /> Meeting
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="w-2 h-2 rounded-full bg-slate-400" /> Note
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
