"use client";

import { useState, useRef, useEffect } from "react";
import {
  Save,
  Trash2,
  CheckCircle2,
  Circle,
  Search,
  X,
  Upload,
  FileText,
} from "lucide-react";
import { type Task, type TaskSource, type Vendor, contacts, getTaskStatus, formatDueDate } from "../data";
import AttachmentsPanel, { type Attachment } from "../attachments";

interface TaskDetailProps {
  task: Task | null; // null = new task
  vendors?: Vendor[];
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  ownerLabels: string[];
  isLive?: boolean;
  workspaceId?: string;
}

export default function TaskDetail({ task, vendors = [], onSave, onDelete, onBack, ownerLabels, isLive = false, workspaceId }: TaskDetailProps) {
  const isNew = task === null;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [contactId, setContactId] = useState(task?.contactId ?? "");
  const [vendorId, setVendorId] = useState(task?.vendorId ?? "");
  const [source, setSource] = useState<TaskSource>(task?.source ?? "crm");
  const [due, setDue] = useState(task?.due ?? new Date().toISOString().slice(0, 10));
  const [owner, setOwner] = useState(task?.owner ?? "You");
  const [priority, setPriority] = useState<"high" | "medium" | "low">(task?.priority ?? "medium");
  const [completed, setCompleted] = useState(task?.completed ?? false);
  const [taskAttachments, setTaskAttachments] = useState<Attachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const pendingFileRef = useRef<HTMLInputElement>(null);

  // Fetch existing attachments on mount (live mode)
  useEffect(() => {
    if (!isLive || !task) return;
    async function loadAttachments() {
      try {
        const res = await fetch(`/api/attachments?taskId=${task!.id}`);
        const data = await res.json();
        if (data.attachments) setTaskAttachments(data.attachments);
      } catch { /* silent */ }
    }
    loadAttachments();
  }, [task, isLive]);

  const status = getTaskStatus(due, completed);

  async function handleSave() {
    if (!title.trim()) return;
    const taskId = task?.id ?? crypto.randomUUID();
    onSave({
      id: taskId,
      contactId: source === "crm" ? contactId : "",
      vendorId: source === "vendors" ? vendorId : undefined,
      source,
      title: title.trim(),
      description: description.trim() || undefined,
      due,
      owner,
      priority,
      completed,
    });

    // Upload pending files after save (for new tasks)
    if (pendingFiles.length > 0 && isLive && workspaceId) {
      for (const file of pendingFiles) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("workspaceId", workspaceId);
          formData.append("taskId", taskId);
          formData.append("uploaderName", "You");
          await fetch("/api/attachments", { method: "POST", body: formData });
        } catch { /* silent */ }
      }
      setPendingFiles([]);
    }
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
              aria-label={completed ? "Mark as incomplete" : "Mark as complete"}
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

          {/* Source selector */}
          <div className="flex items-center justify-between px-5 py-4">
            <label className="text-sm font-medium text-foreground">Module</label>
            <select
              value={source}
              onChange={(e) => {
                const s = e.target.value as TaskSource;
                setSource(s);
                if (s !== "crm") setContactId("");
                if (s !== "vendors") setVendorId("");
              }}
              className="text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer min-w-[220px]"
            >
              <option value="crm">CRM</option>
              <option value="vendors">Vendors</option>
            </select>
          </div>

          {/* Contact — searchable dropdown (CRM tasks) */}
          {source === "crm" && <div className="flex items-center justify-between px-5 py-4">
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
                      aria-label="Clear contact"
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
          </div>}

          {/* Vendor picker (Vendor tasks) */}
          {source === "vendors" && <div className="flex items-center justify-between px-5 py-4">
            <label className="text-sm font-medium text-foreground">Vendor</label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer min-w-[220px]"
            >
              <option value="">Select vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>}

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

        {/* Attachments */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              Attachments {(taskAttachments.length + pendingFiles.length) > 0 ? `(${taskAttachments.length + pendingFiles.length})` : ""}
            </h3>
          </div>
          <div className="p-4">
            {!isNew && task ? (
              <AttachmentsPanel
                attachments={taskAttachments}
                isLive={isLive}
                workspaceId={workspaceId}
                taskId={task.id}
                uploaderName="You"
                onAttachmentAdded={(att) => setTaskAttachments((prev) => [att, ...prev])}
                onAttachmentRemoved={(id) => setTaskAttachments((prev) => prev.filter((a) => a.id !== id))}
              />
            ) : (
              /* New task — show pending files picker */
              <div>
                <input
                  ref={pendingFileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files) setPendingFiles((prev) => [...prev, ...Array.from(e.target.files!)]); e.target.value = ""; }}
                />
                <button
                  onClick={() => pendingFileRef.current?.click()}
                  className="flex items-center justify-center gap-2 w-full py-3 text-sm text-muted hover:text-foreground border-2 border-dashed border-border hover:border-gray-400 rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Add files
                </button>
                <p className="text-[10px] text-muted mt-1 text-center">Files will be uploaded when you save the task</p>
                {pendingFiles.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-surface rounded-lg">
                        <FileText className="w-4 h-4 text-muted shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{f.name}</div>
                          <div className="text-[10px] text-muted">{(f.size / 1024).toFixed(0)} KB</div>
                        </div>
                        <button onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))} className="p-1 text-muted hover:text-red-500" aria-label="Remove file">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
