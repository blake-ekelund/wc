"use client";

import { useState, useRef, useEffect } from "react";
import {
  Save,
  Trash2,
  CheckCircle2,
  Circle,
  Search,
  X,
} from "lucide-react";
import { type Task, contacts, getTaskStatus, formatDueDate } from "../data";

interface TaskDetailProps {
  task: Task | null; // null = new task
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  ownerLabels: string[];
}

export default function TaskDetail({ task, onSave, onDelete, onBack, ownerLabels }: TaskDetailProps) {
  const isNew = task === null;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [contactId, setContactId] = useState(task?.contactId ?? "");
  const [due, setDue] = useState(task?.due ?? new Date().toISOString().slice(0, 10));
  const [owner, setOwner] = useState(task?.owner ?? "You");
  const [priority, setPriority] = useState<"high" | "medium" | "low">(task?.priority ?? "medium");
  const [completed, setCompleted] = useState(task?.completed ?? false);

  const status = getTaskStatus(due, completed);

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      id: task?.id ?? `k${Date.now()}`,
      contactId,
      title: title.trim(),
      description: description.trim() || undefined,
      due,
      owner,
      priority,
      completed,
    });
  }

  function handleDelete() {
    if (task) onDelete(task.id);
  }

  const selectedContact = contacts.find((c) => c.id === contactId);

  // Priority dropdown state
  const [priorityOpen, setPriorityOpen] = useState(false);
  const priorityRef = useRef<HTMLDivElement>(null);

  // Searchable contact dropdown state
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const contactRef = useRef<HTMLDivElement>(null);

  const filteredContacts = contacts.filter((c) => {
    const q = contactSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) {
        setContactOpen(false);
        setContactSearch("");
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setPriorityOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="p-4 lg:p-6 max-w-2xl">
      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mb-6">
        <div className="flex items-center gap-2">
          {!isNew && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            {isNew ? "Create Task" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-6">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setCompleted(!completed)}
              className="mt-1 shrink-0 text-muted hover:text-accent transition-colors"
            >
              {completed ? (
                <CheckCircle2 className="w-6 h-6 text-accent" />
              ) : (
                <Circle className={`w-6 h-6 ${status === "overdue" ? "text-red-400" : ""}`} />
              )}
            </button>
            <div className="flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className={`w-full text-lg font-semibold bg-transparent outline-none placeholder:text-muted ${
                  completed ? "line-through text-muted" : "text-foreground"
                }`}
                autoFocus={isNew}
              />
              {due && (
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      status === "overdue"
                        ? "bg-red-100 text-red-700"
                        : status === "today"
                        ? "bg-amber-100 text-amber-700"
                        : status === "upcoming"
                        ? "bg-blue-100 text-blue-700"
                        : status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {status === "completed" ? "Done" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                  <span className={`text-xs ${status === "overdue" ? "text-red-500 font-medium" : "text-muted"}`}>
                    {formatDueDate(due)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes / Description */}
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-border">
          <label className="text-sm font-semibold text-foreground">Notes</label>
        </div>
        <div className="p-5">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes or details about this task..."
            rows={4}
            className="w-full text-sm text-foreground bg-transparent outline-none resize-none placeholder:text-muted leading-relaxed"
          />
        </div>
      </div>

      {/* Fields */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {/* Due date */}
          <div className="flex items-center justify-between px-5 py-4">
            <label className="text-sm font-medium text-foreground">Due Date</label>
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            />
          </div>

          {/* Priority */}
          <div className="flex items-center justify-between px-5 py-4">
            <label className="text-sm font-medium text-foreground">Priority</label>
            <div className="relative" ref={priorityRef}>
              <button
                type="button"
                onClick={() => setPriorityOpen(!priorityOpen)}
                className="flex items-center gap-2 text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none hover:border-accent transition-colors cursor-pointer min-w-[130px]"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  priority === "high" ? "bg-red-500" : priority === "medium" ? "bg-amber-500" : "bg-gray-400"
                }`} />
                <span className="font-medium">{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
              </button>
              {priorityOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                  {(["high", "medium", "low"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setPriority(p); setPriorityOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-surface transition-colors ${
                        p === priority ? "bg-accent-light" : ""
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        p === "high" ? "bg-red-500" : p === "medium" ? "bg-amber-500" : "bg-gray-400"
                      }`} />
                      <span className="font-medium text-foreground">{p.charAt(0).toUpperCase() + p.slice(1)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Owner */}
          <div className="flex items-center justify-between px-5 py-4">
            <label className="text-sm font-medium text-foreground">Owner</label>
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer"
            >
              {ownerLabels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Contact — searchable dropdown */}
          <div className="flex items-center justify-between px-5 py-4">
            <label className="text-sm font-medium text-foreground">Contact</label>
            <div className="relative" ref={contactRef}>
              <div
                onClick={() => { setContactOpen(!contactOpen); setContactSearch(""); }}
                className="flex items-center gap-2 text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none hover:border-accent transition-colors min-w-[220px] cursor-pointer"
              >
                {selectedContact ? (
                  <>
                    <div
                      className={`w-5 h-5 rounded-full ${selectedContact.avatarColor} flex items-center justify-center text-[7px] font-bold text-white shrink-0`}
                    >
                      {selectedContact.avatar}
                    </div>
                    <span className="truncate">{selectedContact.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setContactId(""); }}
                      className="ml-auto p-0.5 text-muted hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <span className="text-muted">Select contact...</span>
                )}
              </div>
              {contactOpen && (
                <div className="absolute right-0 bottom-full mb-1 w-72 bg-white border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-muted text-center">No contacts found</div>
                    ) : (
                      filteredContacts.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setContactId(c.id);
                            setContactOpen(false);
                            setContactSearch("");
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-surface transition-colors ${
                            c.id === contactId ? "bg-accent-light" : ""
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-full ${c.avatarColor} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}
                          >
                            {c.avatar}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                            <div className="text-[11px] text-muted truncate">{c.company}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 border-t border-border">
                    <Search className="w-3.5 h-3.5 text-muted shrink-0" />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      placeholder="Search contacts..."
                      className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-muted"
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between px-5 py-4">
            <label className="text-sm font-medium text-foreground">Status</label>
            <button
              onClick={() => setCompleted(!completed)}
              className={`text-sm font-medium rounded-lg px-3 py-1.5 border transition-colors ${
                completed
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-border bg-white text-foreground hover:bg-surface"
              }`}
            >
              {completed ? "Completed" : "Open"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
