"use client";

import React, { useState, useRef, useEffect, type RefObject } from "react";
import AttachmentsPanel from "../attachments";
import {
  Mail,
  Paperclip,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  CalendarIcon,
  FileText,
  User,
  Tag,
  Pencil,
  X,
  Plus,
  Trash2,
  Check,
  GripVertical,
  Type,
  Hash,
  CalendarDays,
  List,
  Archive,
  Trash2 as TrashIcon,
  AlertTriangle,
  CheckSquare,
  Send,
  Loader2,
  Sparkles,
  Clock,
  MessageSquare,
  Users,
  ChevronRight,
  ChevronDown,
  MapPin,
  Globe,
  Megaphone,
  StickyNote,
  Copy,
  DollarSign,
} from "lucide-react";
import {
  type Contact,
  type Stage,
  type Touchpoint,
  type StageDefinition,
  formatCurrency,
  formatDueDate,
  type Task,
} from "../data";
import { defaultTemplates, fillTemplate, type EmailTemplate } from "../email-templates";
import { trackEvent } from "@/lib/track-event";

const typeIcons = {
  call: Phone,
  email: Mail,
  meeting: CalendarIcon,
  note: FileText,
};

const typeLabels = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  note: "Note",
};

interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
}

interface ContactDetailProps {
  contact: Contact;
  tasks: Task[];
  touchpoints: Touchpoint[];
  onBack: () => void;
  onSave: (contact: Contact) => void;
  onAddTouchpoint: (touchpoint: Touchpoint) => void;
  onUpdateTouchpoint: (touchpoint: Touchpoint) => void;
  onDeleteTouchpoint: (id: string) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  stages: StageDefinition[];
  customFields: CustomField[];
  onUpdateCustomFields: (fields: CustomField[]) => void;
  customFieldValues: Record<string, Record<string, string>>;
  onUpdateCustomFieldValues: (values: Record<string, Record<string, string>>) => void;
  isAdmin?: boolean;
  ownerLabels: string[];
  onArchiveContact?: (id: string) => void;
  onDeleteContact?: (id: string) => void;
  allContacts?: Contact[];
  emailTemplates?: EmailTemplate[];
  isLive?: boolean;
  workspaceId?: string;
  onAddTouchpointFromEmail?: (touchpoint: Touchpoint) => void;
  onSelectContact?: (id: string) => void;
}

const fieldTypeConfig = {
  text: { icon: Type, label: "Text", color: "text-blue-600", bg: "bg-blue-100" },
  number: { icon: Hash, label: "Number", color: "text-emerald-600", bg: "bg-emerald-100" },
  date: { icon: CalendarDays, label: "Date", color: "text-violet-600", bg: "bg-violet-100" },
  select: { icon: List, label: "Dropdown", color: "text-amber-600", bg: "bg-amber-100" },
};

function InlineField({ value, onChange, onBlur: onBlurProp, placeholder, type = "text", className = "", inputClassName = "", renderDisplay, selectOptions }: {
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url" | "number" | "textarea" | "select";
  className?: string;
  inputClassName?: string;
  renderDisplay?: (val: string) => React.ReactNode;
  selectOptions?: string[];
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  function handleBlur() {
    setFocused(false);
    onBlurProp?.();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && type !== "textarea") {
      (e.target as HTMLElement).blur();
    }
    if (e.key === "Escape") {
      (e.target as HTMLElement).blur();
    }
  }

  if (type === "select" && selectOptions) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        className={`bg-transparent outline-none cursor-pointer hover:text-accent transition-colors ${inputClassName || "text-sm text-foreground"}`}
      >
        <option value="">{placeholder || "Select..."}</option>
        {selectOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (type === "textarea") {
    return (
      <textarea
        ref={inputRef as RefObject<HTMLTextAreaElement>}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === "Escape") (e.target as HTMLElement).blur(); }}
        rows={3}
        placeholder={placeholder}
        className={`w-full text-sm text-foreground bg-transparent outline-none resize-none transition-all rounded-lg p-2 ${
          focused ? "ring-1 ring-accent/30 border-accent bg-white" : "hover:bg-surface/80 border-transparent"
        } border ${inputClassName}`}
      />
    );
  }

  if (focused) {
    return (
      <input
        ref={inputRef as RefObject<HTMLInputElement>}
        type={type === "number" ? "text" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus
        className={`bg-transparent outline-none border-b border-accent text-foreground w-full pb-0.5 ${inputClassName || "text-sm"}`}
      />
    );
  }

  return (
    <div
      onClick={() => setFocused(true)}
      className={`cursor-text group ${className}`}
    >
      {renderDisplay ? renderDisplay(value) : (
        <span className={`border-b border-transparent group-hover:border-border transition-colors ${
          value ? (inputClassName || "text-sm text-foreground") : "text-sm text-muted/50"
        }`}>
          {value || placeholder || "\u2014"}
        </span>
      )}
    </div>
  );
}

export default function ContactDetail({
  contact, tasks: allTasks, touchpoints: allTouchpoints, onBack, onSave,
  onAddTouchpoint, onUpdateTouchpoint, onDeleteTouchpoint,
  onAddTask, onUpdateTask, onDeleteTask, stages,
  customFields, onUpdateCustomFields, customFieldValues, onUpdateCustomFieldValues,
  isAdmin = false, ownerLabels,
  onArchiveContact, onDeleteContact, allContacts = [], emailTemplates,
  isLive = false, workspaceId, onAddTouchpointFromEmail, onSelectContact,
}: ContactDetailProps) {
  const [adminFieldMode, setAdminFieldMode] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isNewContact = contact.name === "New Contact";
  const [name, setName] = useState(contact.name);
  const [email, setEmail] = useState(contact.email);
  const [phone, setPhone] = useState(contact.phone);
  const [company, setCompany] = useState(contact.company);
  const [role, setRole] = useState(contact.role);
  const [stage, setStage] = useState<Stage>(contact.stage);
  const [value, setValue] = useState(contact.value);
  const [valueDisplay, setValueDisplay] = useState(contact.value.toLocaleString("en-US"));
  const [owner, setOwner] = useState(contact.owner);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(contact.tags);
  // Address state
  const [billingAddress, setBillingAddress] = useState(contact.billingAddress || { street1: "", city: "", state: "", zip: "" });
  const [shippingAddress, setShippingAddress] = useState(contact.shippingAddress || { street1: "", city: "", state: "", zip: "" });
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(contact.shippingSameAsBilling || false);
  // Additional fields
  const [website, setWebsite] = useState(contact.website || "");
  const [source, setSource] = useState(contact.source || "");
  const [notes, setNotes] = useState(contact.notes || "");

  // Custom field local values (for editing)
  const [localFieldValues, setLocalFieldValues] = useState<Record<string, string>>(
    customFieldValues[contact.id] || {}
  );

  // Add custom field form
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "number" | "date" | "select">("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");

  // Drag and drop state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Archive/Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<"archive" | "delete" | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Header dropdown menus
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showManageMenu, setShowManageMenu] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const manageMenuRef = useRef<HTMLDivElement>(null);

  // Action modals
  const [actionModal, setActionModal] = useState<"call" | "email" | "meeting" | "note" | "task" | null>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setShowMoreMenu(false);
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) setShowActionsMenu(false);
      if (manageMenuRef.current && !manageMenuRef.current.contains(e.target as Node)) setShowManageMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { if (isLive) trackEvent("contact.detail_viewed"); }, []);

  // Auto-focus name field for new contacts
  useEffect(() => {
    if (isNewContact && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isNewContact]);

  // Add touchpoint form state
  const [showAddTouchpoint, setShowAddTouchpoint] = useState(false);
  const [tpType, setTpType] = useState<"call" | "email" | "meeting" | "note">("call");
  const [tpTitle, setTpTitle] = useState("");
  const [tpDescription, setTpDescription] = useState("");

  // Edit touchpoint state
  const [editingTpId, setEditingTpId] = useState<string | null>(null);
  const [editTpType, setEditTpType] = useState<"call" | "email" | "meeting" | "note">("call");
  const [editTpTitle, setEditTpTitle] = useState("");
  const [editTpDescription, setEditTpDescription] = useState("");

  // Add task form state
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDue, setNewTaskDue] = useState(new Date().toISOString().slice(0, 10));
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [newTaskOwner, setNewTaskOwner] = useState("You");

  // Edit task state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskDue, setEditTaskDue] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [editTaskOwner, setEditTaskOwner] = useState("You");
  const [editTaskCompleted, setEditTaskCompleted] = useState(false);

  const [detailTab, setDetailTab] = useState<"timeline" | "touchpoints" | "tasks" | "files">("timeline");
  const [contactAttachments, setContactAttachments] = useState<import("../attachments").Attachment[]>([]);

  // Fetch existing attachments on mount (live mode)
  useEffect(() => {
    if (!isLive) return;
    async function loadAttachments() {
      try {
        const res = await fetch(`/api/attachments?contactId=${contact.id}`);
        const data = await res.json();
        if (data.attachments) setContactAttachments(data.attachments);
      } catch {
        // Silent fail
      }
    }
    loadAttachments();
  }, [contact.id, isLive]);

  const stageInfo = stages.find((s) => s.label === stage);
  const contactTouchpoints = allTouchpoints.filter((t) => t.contactId === contact.id);
  const contactTasks = allTasks.filter((t) => t.contactId === contact.id);

  // Merged timeline: touchpoints + tasks sorted by date (newest first)
  const timelineItems = [
    ...contactTouchpoints.map((t) => ({ type: "touchpoint" as const, date: t.date, data: t })),
    ...contactTasks.map((t) => ({ type: "task" as const, date: t.due, data: t })),
  ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  // Last contacted calculation
  const lastContactedInfo = (() => {
    if (contactTouchpoints.length === 0) return { label: "No activity yet", days: -1, color: "text-gray-400" };

    // Try to parse dates — handle ISO "2026-03-18", display strings "Today", "Mar 12", "Mar 14, 3:00 PM"
    function parseDate(d: string): Date | null {
      if (!d) return null;
      const lower = d.toLowerCase().trim();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (lower === "today" || lower.startsWith("today")) return today;
      if (lower === "yesterday" || lower.startsWith("yesterday")) { const y = new Date(today); y.setDate(y.getDate() - 1); return y; }
      if (lower === "tomorrow") { const t = new Date(today); t.setDate(t.getDate() + 1); return t; }
      // Try ISO parse "2026-03-18"
      if (/^\d{4}-\d{2}-\d{2}/.test(d)) { const iso = new Date(d); if (!isNaN(iso.getTime())) return iso; }
      // Strip time component: "Mar 14, 3:00 PM" → "Mar 14"
      const dateOnly = d.replace(/,?\s*\d{1,2}:\d{2}\s*(AM|PM|am|pm)?\s*$/, "").trim();
      // Try "Mar 14, 2026" first (has year)
      const withYear = new Date(dateOnly);
      if (!isNaN(withYear.getTime()) && withYear.getFullYear() > 2000) return withYear;
      // Try appending current year: "Mar 14" → "Mar 14, 2026"
      const withAddedYear = new Date(`${dateOnly}, ${today.getFullYear()}`);
      if (!isNaN(withAddedYear.getTime())) return withAddedYear;
      return null;
    }

    // Find the most recent parseable touchpoint date
    let mostRecent: Date | null = null;
    for (const tp of contactTouchpoints) {
      const parsed = parseDate(tp.date);
      if (parsed && (!mostRecent || parsed > mostRecent)) mostRecent = parsed;
    }

    if (!mostRecent) return { label: "No activity yet", days: -1, color: "text-gray-400" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    mostRecent.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - mostRecent.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const formatted = mostRecent.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    if (days <= 0) return { label: "Today", days: 0, color: "text-emerald-600" };
    if (days === 1) return { label: "Yesterday", days: 1, color: "text-emerald-600" };
    if (days <= 7) return { label: formatted, days, color: "text-emerald-600" };
    if (days <= 14) return { label: formatted, days, color: "text-amber-600" };
    return { label: formatted, days, color: "text-red-600" };
  })();

  // Related contacts (same company, exclude current)
  const relatedContacts = allContacts.filter(
    (c) => c.id !== contact.id && c.company && c.company.toLowerCase() === contact.company?.toLowerCase()
  );

  const [showEmailTemplates, setShowEmailTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailAttachments, setEmailAttachments] = useState<File[]>([]);
  const emailFileRef = useRef<HTMLInputElement>(null);

  // Auto-save: call whenever a field changes
  function autoSave(updates: Partial<Contact>) {
    const updatedFieldValues = { ...customFieldValues, [contact.id]: localFieldValues };
    onUpdateCustomFieldValues(updatedFieldValues);

    if (isLive && updates.stage && updates.stage !== contact.stage) trackEvent("contact.stage_changed");

    const updated = {
      ...contact,
      name: name.trim() || contact.name,
      email, phone, company, role, stage, value, owner, tags,
      billingAddress: billingAddress.street1 ? billingAddress : undefined,
      shippingAddress: shippingSameAsBilling ? undefined : (shippingAddress.street1 ? shippingAddress : undefined),
      shippingSameAsBilling,
      website: website.trim() || undefined,
      source: source.trim() || undefined,
      notes: notes.trim() || undefined,
      avatar: (name.trim() || contact.name).split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
      ...updates,
    };
    onSave(updated);
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      const newTags = [...tags, t];
      setTags(newTags);
      setTagInput("");
      autoSave({ tags: newTags });
    } else {
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    autoSave({ tags: newTags });
  }

  // Custom field handlers
  function handleAddCustomField() {
    if (!newFieldLabel.trim()) return;
    const field: CustomField = {
      id: crypto.randomUUID(),
      label: newFieldLabel.trim(),
      type: newFieldType,
      ...(newFieldType === "select" && newFieldOptions.trim()
        ? { options: newFieldOptions.split(",").map((o) => o.trim()).filter(Boolean) }
        : {}),
    };
    onUpdateCustomFields([...customFields, field]);
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldOptions("");
    setShowAddField(false);
  }

  function removeCustomField(id: string) {
    onUpdateCustomFields(customFields.filter((f) => f.id !== id));
  }

  function updateLocalFieldValue(fieldId: string, val: string) {
    setLocalFieldValues((prev) => ({ ...prev, [fieldId]: val }));
  }

  // Drag and drop handlers
  function handleDragStart(index: number) {
    dragItem.current = index;
    setIsDragging(true);
  }

  function handleDragEnter(index: number) {
    dragOverItem.current = index;
  }

  function handleDragEnd() {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const reordered = [...customFields];
      const [removed] = reordered.splice(dragItem.current, 1);
      reordered.splice(dragOverItem.current, 0, removed);
      onUpdateCustomFields(reordered);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setIsDragging(false);
  }

  // Touchpoint handlers
  function handleAddTouchpoint() {
    if (!tpTitle.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    onAddTouchpoint({
      id: crypto.randomUUID(), contactId: contact.id, type: tpType,
      title: tpTitle.trim(), description: tpDescription.trim(),
      date: `Today, ${timeStr}`, owner: "You",
    });
    setTpTitle(""); setTpDescription(""); setTpType("call"); setShowAddTouchpoint(false);
    if (isLive) trackEvent("contact.touchpoint_added");
  }

  function startEditTouchpoint(tp: Touchpoint) {
    setEditingTpId(tp.id);
    setEditTpType(tp.type);
    setEditTpTitle(tp.title);
    setEditTpDescription(tp.description);
  }

  function saveEditTouchpoint(tp: Touchpoint) {
    if (!editTpTitle.trim()) return;
    onUpdateTouchpoint({ ...tp, type: editTpType, title: editTpTitle.trim(), description: editTpDescription.trim() });
    setEditingTpId(null);
  }

  function cancelEditTouchpoint() { setEditingTpId(null); }

  // Task handlers
  function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    onAddTask({
      id: crypto.randomUUID(), contactId: contact.id, title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      due: newTaskDue, owner: newTaskOwner, priority: newTaskPriority, completed: false,
    });
    setNewTaskTitle(""); setNewTaskDescription(""); setNewTaskDue(new Date().toISOString().slice(0, 10));
    setNewTaskPriority("medium"); setNewTaskOwner("You"); setShowAddTask(false);
  }

  function startEditTask(t: Task) {
    setEditingTaskId(t.id);
    setEditTaskTitle(t.title);
    setEditTaskDescription(t.description ?? "");
    setEditTaskDue(t.due);
    setEditTaskPriority(t.priority);
    setEditTaskOwner(t.owner);
    setEditTaskCompleted(t.completed);
  }

  function saveEditTask(t: Task) {
    if (!editTaskTitle.trim()) return;
    onUpdateTask({
      ...t, title: editTaskTitle.trim(), description: editTaskDescription.trim() || undefined,
      due: editTaskDue, priority: editTaskPriority, owner: editTaskOwner, completed: editTaskCompleted,
    });
    setEditingTaskId(null);
  }

  function cancelEditTask() { setEditingTaskId(null); }

  const displayValues = customFieldValues[contact.id] || {};

  return (
    <div className="p-4 lg:p-6 max-w-5xl">
      {/* Header card */}
      <div className="bg-white rounded-xl border border-border p-5 mb-6">
        <div className="flex items-center justify-end gap-2 mb-4">
          {/* Actions dropdown */}
          <div ref={actionsMenuRef} className="relative">
            <button
              onClick={() => { setShowActionsMenu((v) => !v); setShowManageMenu(false); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm ${showActionsMenu ? "bg-accent text-white shadow-accent/25" : "text-white bg-accent hover:bg-accent-dark shadow-accent/20"}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Actions <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${showActionsMenu ? "rotate-180" : ""}`} />
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-border rounded-lg shadow-xl z-50 overflow-hidden py-1">
                <div className="px-3 py-1.5 text-[10px] font-medium text-muted uppercase tracking-wider">Communicate</div>
                {contact.email && (
                  <button
                    onClick={() => { setShowEmailTemplates(true); setShowActionsMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-surface transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-emerald-500" /> Send Email
                  </button>
                )}
                <button
                  onClick={() => { setActionModal("call"); setTpType("call"); setTpTitle(""); setTpDescription(""); setShowActionsMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-surface transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-500" /> Log Call
                </button>
                <button
                  onClick={() => { setActionModal("meeting"); setTpType("meeting"); setTpTitle(""); setTpDescription(""); setShowActionsMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-surface transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-cyan-500" /> Log Meeting
                </button>
                <div className="border-t border-border my-1" />
                <div className="px-3 py-1.5 text-[10px] font-medium text-muted uppercase tracking-wider">Create</div>
                <button
                  onClick={() => { setActionModal("note"); setTpType("note"); setTpTitle(""); setTpDescription(""); setShowActionsMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-surface transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-violet-500" /> Add Note
                </button>
                <button
                  onClick={() => { setActionModal("task"); setNewTaskTitle(""); setNewTaskDescription(""); setNewTaskDue(new Date().toISOString().slice(0, 10)); setNewTaskPriority("medium"); setShowActionsMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-surface transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-amber-500" /> Add Task
                </button>
              </div>
            )}
          </div>

          {/* Manage dropdown */}
          <div ref={manageMenuRef} className="relative">
            <button
              onClick={() => { setShowManageMenu((v) => !v); setShowActionsMenu(false); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shadow-sm ${showManageMenu ? "bg-gray-700 text-white shadow-gray-700/25" : "text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200"}`}
            >
              <Archive className="w-3.5 h-3.5" /> Manage <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${showManageMenu ? "rotate-180" : ""}`} />
            </button>
            {showManageMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-lg shadow-xl z-50 overflow-hidden py-1">
                {onArchiveContact && (
                  <button
                    onClick={() => { setShowDeleteConfirm("archive"); setShowManageMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-foreground hover:bg-surface transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5 text-amber-500" /> Archive Contact
                  </button>
                )}
                {onDeleteContact && (
                  <button
                    onClick={() => { setShowDeleteConfirm("delete"); setShowManageMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <TrashIcon className="w-3.5 h-3.5" /> Delete Contact
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Customize Fields button — admin only */}
          {isAdmin && (
            <button
              onClick={() => setAdminFieldMode((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                adminFieldMode
                  ? "text-accent bg-accent-light border border-accent/30"
                  : "text-muted border border-border hover:bg-surface hover:text-foreground"
              }`}
            >
              <Pencil className="w-3 h-3" /> Customize Fields
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className={`w-14 h-14 rounded-xl ${contact.avatarColor} flex items-center justify-center text-lg font-bold text-white shrink-0`}>
            {contact.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => autoSave({ name: name.trim() || contact.name, avatar: (name.trim() || contact.name).split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) })}
                className="text-xl font-bold text-foreground bg-transparent outline-none border-b border-transparent hover:border-border focus:border-accent w-full transition-colors"
                placeholder="Contact name"
              />
              {stageInfo && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${stageInfo.bgColor} ${stageInfo.color}`}>{stage}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => autoSave({ email: email.trim() })}
                  className="text-sm text-muted bg-transparent outline-none border-b border-transparent hover:border-border focus:border-accent transition-colors"
                  placeholder="Email"
                />
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => autoSave({ phone: phone.trim() })}
                  className="text-sm text-muted bg-transparent outline-none border-b border-transparent hover:border-border focus:border-accent transition-colors"
                  placeholder="Phone"
                />
              </span>
              <span className={`flex items-center gap-1.5 ${lastContactedInfo.color}`}>
                <Clock className="w-3.5 h-3.5" />
                {lastContactedInfo.days >= 0 ? `Last contact: ${lastContactedInfo.label}` : lastContactedInfo.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-muted shrink-0" />
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} onBlur={() => { if (tagInput.trim()) addTag(); }} placeholder="+ tag" className="text-[10px] bg-transparent text-muted outline-none border-b border-transparent hover:border-border focus:border-accent w-16 pb-0.5 placeholder:text-muted/40 transition-colors" />
            </div>
          </div>
        </div>

        {/* Info grid — built-in fields */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-5 pt-5 border-t border-border">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-muted uppercase tracking-wider">Company</div>
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onBlur={() => autoSave({ company: company.trim() })} className="text-sm font-medium bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors" placeholder="Company" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-muted" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-muted uppercase tracking-wider">Role</div>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} onBlur={() => autoSave({ role: role.trim() })} className="text-sm font-medium bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors" placeholder="Role" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-muted uppercase tracking-wider">Owner</div>
              <select value={owner} onChange={(e) => { setOwner(e.target.value); autoSave({ owner: e.target.value }); }} className="text-sm font-medium bg-transparent text-foreground outline-none cursor-pointer hover:text-accent transition-colors">
                {ownerLabels.map((m) => (<option key={m} value={m}>{m}</option>))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-muted uppercase tracking-wider">Stage</div>
              <select value={stage} onChange={(e) => { setStage(e.target.value as Stage); autoSave({ stage: e.target.value }); }} className="text-sm font-medium bg-transparent text-foreground outline-none cursor-pointer hover:text-accent transition-colors">
                {stages.map((s) => (<option key={s.label} value={s.label}>{s.label}</option>))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted" />
            <div>
              <div className="text-[10px] text-muted uppercase tracking-wider">Created</div>
              <div className="text-sm font-medium text-foreground">{contact.created}</div>
            </div>
          </div>
        </div>

        {/* Custom fields */}
        {(customFields.length > 0 || adminFieldMode) && (
          <div className={`mt-4 pt-4 border-t border-dashed border-border/60 ${isDragging ? "bg-accent/[0.02] rounded-lg" : ""}`}>
            {customFields.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {customFields.map((field, index) => {
                  const config = fieldTypeConfig[field.type];
                  const FieldIcon = config.icon;
                  const fieldValue = localFieldValues[field.id] || displayValues[field.id] || "";

                  return (
                    <div
                      key={field.id}
                      draggable={adminFieldMode && isAdmin}
                      onDragStart={() => isAdmin && handleDragStart(index)}
                      onDragEnter={() => isAdmin && handleDragEnter(index)}
                      onDragEnd={isAdmin ? handleDragEnd : undefined}
                      onDragOver={(e) => e.preventDefault()}
                      className={`flex items-start gap-2 group relative rounded-lg transition-all ${
                        adminFieldMode && isAdmin
                          ? "cursor-grab active:cursor-grabbing p-2 -m-2 hover:bg-surface/80 border border-transparent hover:border-border/50"
                          : ""
                      } ${isDragging && dragOverItem.current === index ? "bg-accent/10 border-accent/30" : ""}`}
                    >
                      {adminFieldMode && isAdmin && (
                        <GripVertical className="w-3.5 h-3.5 text-muted/40 shrink-0 mt-1 group-hover:text-muted transition-colors" />
                      )}
                      <FieldIcon className={`w-4 h-4 ${config.color} shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-muted uppercase tracking-wider flex items-center gap-1">
                          {field.label}
                          {adminFieldMode && isAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); removeCustomField(field.id); }}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {field.type === "select" ? (
                          <select
                            value={localFieldValues[field.id] || ""}
                            onChange={(e) => updateLocalFieldValue(field.id, e.target.value)}
                            onBlur={() => autoSave({})}
                            className="text-sm font-medium bg-transparent text-foreground outline-none cursor-pointer hover:text-accent transition-colors w-full pb-0.5"
                          >
                            <option value="">Select...</option>
                            {(field.options || []).map((o) => (<option key={o} value={o}>{o}</option>))}
                          </select>
                        ) : field.type === "date" ? (
                          <input
                            type="date"
                            value={localFieldValues[field.id] || ""}
                            onChange={(e) => { updateLocalFieldValue(field.id, e.target.value); }}
                            onBlur={() => autoSave({})}
                            className="text-sm font-medium bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors"
                          />
                        ) : (
                          <input
                            type="text"
                            inputMode={field.type === "number" ? "numeric" : undefined}
                            value={localFieldValues[field.id] || ""}
                            onChange={(e) => {
                              if (field.type === "number") {
                                const raw = e.target.value.replace(/[^0-9]/g, "");
                                updateLocalFieldValue(field.id, raw ? parseInt(raw, 10).toLocaleString("en-US") : "");
                              } else {
                                updateLocalFieldValue(field.id, e.target.value);
                              }
                            }}
                            onBlur={() => autoSave({})}
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                            className="text-sm font-medium bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 placeholder:text-muted/50 placeholder:font-normal transition-colors"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add field button / form — admin only */}
            {adminFieldMode && isAdmin && (
              <div className="mt-3">
                {showAddField ? (
                  <div className="bg-surface rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Plus className="w-4 h-4 text-accent" />
                      <span className="text-sm font-semibold text-foreground">New Custom Field</span>
                    </div>

                    {/* Field type selector */}
                    <div className="flex gap-2">
                      {(["text", "number", "date", "select"] as const).map((t) => {
                        const cfg = fieldTypeConfig[t];
                        const FIcon = cfg.icon;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setNewFieldType(t)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                              newFieldType === t
                                ? `border-accent bg-accent-light text-accent`
                                : "border-border bg-white text-muted hover:text-foreground hover:border-gray-300"
                            }`}
                          >
                            <FIcon className="w-3.5 h-3.5" /> {cfg.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Field label */}
                    <input
                      type="text"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="Field name (e.g., Industry, LinkedIn, Budget)"
                      className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleAddCustomField()}
                    />

                    {/* Options for select type */}
                    {newFieldType === "select" && (
                      <input
                        type="text"
                        value={newFieldOptions}
                        onChange={(e) => setNewFieldOptions(e.target.value)}
                        placeholder="Options (comma-separated, e.g., Small, Medium, Enterprise)"
                        className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted"
                      />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddCustomField}
                        disabled={!newFieldLabel.trim() || (newFieldType === "select" && !newFieldOptions.trim())}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Field
                      </button>
                      <button
                        onClick={() => { setShowAddField(false); setNewFieldLabel(""); setNewFieldOptions(""); }}
                        className="px-4 py-1.5 text-xs font-medium text-muted hover:text-foreground border border-border rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddField(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-accent hover:text-accent-dark border border-dashed border-accent/30 hover:border-accent/50 rounded-lg transition-all w-full justify-center hover:bg-accent/[0.03]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Custom Field
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details & Addresses */}
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted" />
            Details & Addresses
          </h3>
        </div>
        <div className="p-5 space-y-5">
          {/* Quick fields row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Website */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Globe className="w-3.5 h-3.5 text-muted" />
                <span className="text-[10px] text-muted uppercase tracking-wider font-medium">Website</span>
              </div>
              <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} onBlur={() => autoSave({ website: website.trim() || undefined })} className="text-sm bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors" placeholder="https://example.com" />
            </div>
            {/* Source */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Megaphone className="w-3.5 h-3.5 text-muted" />
                <span className="text-[10px] text-muted uppercase tracking-wider font-medium">Source</span>
              </div>
              <select value={source} onChange={(e) => { setSource(e.target.value); autoSave({ source: e.target.value || undefined }); }} className="text-sm bg-transparent text-foreground outline-none cursor-pointer hover:text-accent transition-colors w-full pb-0.5">
                <option value="">Select source...</option>
                {["Referral", "Website", "Cold Call", "LinkedIn", "Event", "Inbound Email", "Partner", "Other"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {/* Deal Value - moved here, de-emphasized */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-muted" />
                <span className="text-[10px] text-muted uppercase tracking-wider font-medium">Deal Value</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted">$</span>
                <input
                  type="text"
                  value={valueDisplay}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    const n = parseInt(raw, 10) || 0;
                    setValue(n);
                    setValueDisplay(n.toLocaleString("en-US"));
                  }}
                  onBlur={() => autoSave({ value })}
                  className="text-sm bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <StickyNote className="w-3.5 h-3.5 text-muted" />
              <span className="text-[10px] text-muted uppercase tracking-wider font-medium">Notes</span>
            </div>
            <InlineField
              type="textarea"
              value={notes}
              onChange={(v) => setNotes(v)}
              onBlur={() => autoSave({ notes: notes.trim() || undefined })}
              placeholder="Internal notes about this contact..."
            />
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-border">
            {/* Billing Address */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-muted" />
                <span className="text-xs font-semibold text-foreground">Billing Address</span>
              </div>
              <div className="space-y-2">
                <input type="text" value={billingAddress.street1} onChange={(e) => setBillingAddress({ ...billingAddress, street1: e.target.value })} onBlur={() => autoSave({ billingAddress: billingAddress.street1 ? billingAddress : undefined })} className="text-sm bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors" placeholder="Street Address 1" />
                <input type="text" value={billingAddress.street2 || ""} onChange={(e) => setBillingAddress({ ...billingAddress, street2: e.target.value })} onBlur={() => autoSave({ billingAddress: billingAddress.street1 ? billingAddress : undefined })} className="text-sm bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors" placeholder="Street Address 2 (optional)" />
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={billingAddress.city} onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })} onBlur={() => autoSave({ billingAddress: billingAddress.street1 ? billingAddress : undefined })} className="text-sm bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors" placeholder="City" />
                  <input type="text" value={billingAddress.state} onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })} onBlur={() => autoSave({ billingAddress: billingAddress.street1 ? billingAddress : undefined })} className="text-sm bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors" placeholder="State" />
                  <input type="text" value={billingAddress.zip} onChange={(e) => setBillingAddress({ ...billingAddress, zip: e.target.value })} onBlur={() => autoSave({ billingAddress: billingAddress.street1 ? billingAddress : undefined })} className="text-sm bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors" placeholder="ZIP" />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted" />
                  <span className="text-xs font-semibold text-foreground">Shipping Address</span>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shippingSameAsBilling}
                    onChange={(e) => { setShippingSameAsBilling(e.target.checked); autoSave({ shippingSameAsBilling: e.target.checked }); }}
                    className="w-3.5 h-3.5 rounded border-border text-accent focus:ring-accent/30"
                  />
                  <span className="text-[11px] text-muted">Same as billing</span>
                </label>
              </div>
              {shippingSameAsBilling ? (
                <div className="flex items-center gap-1.5 text-sm text-muted">
                  <Copy className="w-3.5 h-3.5" />
                  Same as billing address
                </div>
              ) : (
                <div className="space-y-2">
                  <input type="text" value={shippingAddress.street1} onChange={(e) => setShippingAddress({ ...shippingAddress, street1: e.target.value })} onBlur={() => autoSave({ shippingAddress: shippingAddress.street1 ? shippingAddress : undefined })} className="text-sm bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors" placeholder="Street Address 1" />
                  <input type="text" value={shippingAddress.street2 || ""} onChange={(e) => setShippingAddress({ ...shippingAddress, street2: e.target.value })} onBlur={() => autoSave({ shippingAddress: shippingAddress.street1 ? shippingAddress : undefined })} className="text-sm bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors" placeholder="Street Address 2 (optional)" />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} onBlur={() => autoSave({ shippingAddress: shippingAddress.street1 ? shippingAddress : undefined })} className="text-sm bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors" placeholder="City" />
                    <input type="text" value={shippingAddress.state} onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })} onBlur={() => autoSave({ shippingAddress: shippingAddress.street1 ? shippingAddress : undefined })} className="text-sm bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors" placeholder="State" />
                    <input type="text" value={shippingAddress.zip} onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })} onBlur={() => autoSave({ shippingAddress: shippingAddress.street1 ? shippingAddress : undefined })} className="text-sm bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-accent w-full pb-0.5 transition-colors" placeholder="ZIP" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related contacts at same company */}
      {relatedContacts.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-4 mb-4">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Others at {contact.company} ({relatedContacts.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {relatedContacts.slice(0, 5).map((rc) => {
              const rcStage = stages.find((s) => s.label === rc.stage);
              return (
                <button
                  key={rc.id}
                  onClick={() => onSelectContact ? onSelectContact(rc.id) : onBack()}
                  className="flex items-center gap-2 px-3 py-2 bg-surface rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-6 h-6 rounded-full ${rc.avatarColor} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}>
                    {rc.avatar}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-medium text-foreground">{rc.name}</div>
                    <div className="text-[10px] text-muted">{rc.role}{rcStage ? ` · ${rc.stage}` : ""}</div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted ml-1" />
                </button>
              );
            })}
            {relatedContacts.length > 5 && (
              <span className="text-[10px] text-muted self-center ml-1">+{relatedContacts.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {/* Activity tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        <button
          onClick={() => setDetailTab("timeline")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            detailTab === "timeline" ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Timeline ({timelineItems.length})
        </button>
        <button
          onClick={() => setDetailTab("touchpoints")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            detailTab === "touchpoints" ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Touchpoints ({contactTouchpoints.length})
        </button>
        <button
          onClick={() => setDetailTab("tasks")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
            detailTab === "tasks" ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          Tasks ({contactTasks.length})
        </button>
        <button
          onClick={() => setDetailTab("files")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
            detailTab === "files" ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
          }`}
        >
          <Paperclip className="w-3.5 h-3.5" />
          Files {contactAttachments.length > 0 ? `(${contactAttachments.length})` : ""}
        </button>
      </div>

      {/* Timeline view */}
      {detailTab === "timeline" && (
        <div className="bg-white rounded-xl border border-border overflow-hidden mb-6">
          {timelineItems.length > 0 ? (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[27px] top-0 bottom-0 w-px bg-border" />
              <div className="divide-y divide-border">
                {timelineItems.map((item) => {
                  if (item.type === "touchpoint") {
                    const t = item.data;
                    const TpIcon = typeIcons[t.type];
                    return (
                      <div key={`tp-${t.id}`} className="flex gap-3 px-5 py-3 hover:bg-surface/50 transition-colors relative">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          t.type === "call" ? "bg-blue-100" : t.type === "email" ? "bg-emerald-100" : t.type === "meeting" ? "bg-violet-100" : "bg-gray-100"
                        }`}>
                          <TpIcon className={`w-3.5 h-3.5 ${
                            t.type === "call" ? "text-blue-600" : t.type === "email" ? "text-emerald-600" : t.type === "meeting" ? "text-violet-600" : "text-gray-600"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">{t.title}</div>
                          {t.description && <div className="text-xs text-muted mt-0.5 line-clamp-2">{t.description}</div>}
                          <div className="text-[11px] text-muted mt-1">{typeLabels[t.type]} · {t.date} · {t.owner}</div>
                        </div>
                      </div>
                    );
                  } else {
                    const t = item.data;
                    return (
                      <div key={`task-${t.id}`} className="flex gap-3 px-5 py-3 hover:bg-surface/50 transition-colors relative">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                          t.completed ? "bg-emerald-100" : t.priority === "high" ? "bg-red-100" : t.priority === "medium" ? "bg-amber-100" : "bg-gray-100"
                        }`}>
                          <CheckSquare className={`w-3.5 h-3.5 ${
                            t.completed ? "text-emerald-600" : t.priority === "high" ? "text-red-600" : t.priority === "medium" ? "text-amber-600" : "text-gray-600"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${t.completed ? "text-muted line-through" : "text-foreground"}`}>{t.title}</div>
                          {t.description && <div className="text-xs text-muted mt-0.5 line-clamp-2">{t.description}</div>}
                          <div className="text-[11px] text-muted mt-1">
                            Task · {formatDueDate(t.due)} · {t.owner}
                            {t.completed && <span className="ml-1 text-emerald-600">✓ Done</span>}
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-sm text-muted">No activity yet for this contact.</div>
          )}
        </div>
      )}

      {detailTab === "touchpoints" && (
      <div className="grid lg:grid-cols-1 gap-6 mb-6">
        {/* Touchpoints */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Touchpoints ({contactTouchpoints.length})</h3>
            <button onClick={() => setShowAddTouchpoint(!showAddTouchpoint)} className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-dark transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {/* Add touchpoint form */}
          {showAddTouchpoint && (
            <div className="px-5 py-4 border-b border-border bg-surface">
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(["call", "email", "meeting", "note"] as const).map((t) => {
                    const TIcon = typeIcons[t];
                    return (
                      <button key={t} type="button" onClick={() => setTpType(t)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${tpType === t ? "border-accent bg-accent-light text-accent" : "border-border bg-white text-muted hover:text-foreground"}`}>
                        <TIcon className="w-3.5 h-3.5" /> {typeLabels[t]}
                      </button>
                    );
                  })}
                </div>
                <input type="text" value={tpTitle} onChange={(e) => setTpTitle(e.target.value)} placeholder="Title (e.g., Discovery call)" className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted" autoFocus />
                <textarea value={tpDescription} onChange={(e) => setTpDescription(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted resize-none" />
                <div className="flex items-center gap-2">
                  <button onClick={handleAddTouchpoint} disabled={!tpTitle.trim()} className="px-4 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Add Touchpoint</button>
                  <button onClick={() => { setShowAddTouchpoint(false); setTpTitle(""); setTpDescription(""); }} className="px-4 py-1.5 text-xs font-medium text-muted hover:text-foreground border border-border rounded-lg transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {contactTouchpoints.length > 0 ? (
            <div className="divide-y divide-border">
              {contactTouchpoints.map((t) => {
                const TpIcon = typeIcons[t.type];
                const isEditingTp = editingTpId === t.id;

                if (isEditingTp) {
                  return (
                    <div key={t.id} className="px-5 py-4 bg-surface">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          {(["call", "email", "meeting", "note"] as const).map((tp) => {
                            const TpTypeIcon = typeIcons[tp];
                            return (
                              <button key={tp} type="button" onClick={() => setEditTpType(tp)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${editTpType === tp ? "border-accent bg-accent-light text-accent" : "border-border bg-white text-muted hover:text-foreground"}`}>
                                <TpTypeIcon className="w-3 h-3" /> {typeLabels[tp]}
                              </button>
                            );
                          })}
                        </div>
                        <input type="text" value={editTpTitle} onChange={(e) => setEditTpTitle(e.target.value)} className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent" autoFocus />
                        <textarea value={editTpDescription} onChange={(e) => setEditTpDescription(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted resize-none" />
                        <div className="flex items-center gap-2">
                          <button onClick={() => saveEditTouchpoint(t)} disabled={!editTpTitle.trim()} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50">
                            <Check className="w-3.5 h-3.5" /> Save
                          </button>
                          <button onClick={cancelEditTouchpoint} className="px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground border border-border rounded-lg transition-colors">Cancel</button>
                          <button onClick={() => { onDeleteTouchpoint(t.id); setEditingTpId(null); }} className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={t.id} className="flex gap-3 px-5 py-3 hover:bg-surface/50 transition-colors cursor-pointer group" onClick={() => startEditTouchpoint(t)}>
                    <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center shrink-0">
                      <TpIcon className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{t.title}</div>
                      <div className="text-xs text-muted mt-0.5 leading-relaxed">{t.description}</div>
                      <div className="text-[10px] text-muted/70 mt-1">{t.date} · {t.owner}</div>
                    </div>
                    <Pencil className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>
          ) : !showAddTouchpoint ? (
            <div className="text-center py-10 text-sm text-muted">No touchpoints recorded yet.</div>
          ) : null}
        </div>

      </div>
      )}

      {detailTab === "tasks" && (
      <div className="grid lg:grid-cols-1 gap-6 mb-6">
        {/* Tasks */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Tasks ({contactTasks.length})</h3>
            <button onClick={() => setShowAddTask(!showAddTask)} className="flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-dark transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {/* Add task form */}
          {showAddTask && (
            <div className="px-5 py-4 border-b border-border bg-surface">
              <div className="space-y-3">
                <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Task title..." className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted" autoFocus />
                <textarea value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Add notes..." rows={2} className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted resize-none" />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-muted block mb-1">Due Date</label>
                    <input type="date" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} className="w-full text-sm bg-white border border-border rounded-lg px-2 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted block mb-1">Priority</label>
                    <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as "high" | "medium" | "low")} className="w-full text-sm bg-white border border-border rounded-lg px-2 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted block mb-1">Owner</label>
                    <select value={newTaskOwner} onChange={(e) => setNewTaskOwner(e.target.value)} className="w-full text-sm bg-white border border-border rounded-lg px-2 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer">
                      {ownerLabels.map((m) => (<option key={m} value={m}>{m}</option>))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleAddTask} disabled={!newTaskTitle.trim()} className="px-4 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Add Task</button>
                  <button onClick={() => { setShowAddTask(false); setNewTaskTitle(""); }} className="px-4 py-1.5 text-xs font-medium text-muted hover:text-foreground border border-border rounded-lg transition-colors">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {contactTasks.length > 0 ? (
            <div className="divide-y divide-border">
              {contactTasks.map((t) => {
                const isEditingTask = editingTaskId === t.id;

                if (isEditingTask) {
                  return (
                    <div key={t.id} className="px-5 py-4 bg-surface">
                      <div className="space-y-3">
                        <input type="text" value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)} className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent" autoFocus />
                        <textarea value={editTaskDescription} onChange={(e) => setEditTaskDescription(e.target.value)} placeholder="Add notes..." rows={2} className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted resize-none" />
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-medium text-muted block mb-1">Due Date</label>
                            <input type="date" value={editTaskDue} onChange={(e) => setEditTaskDue(e.target.value)} className="w-full text-sm bg-white border border-border rounded-lg px-2 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent" />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted block mb-1">Priority</label>
                            <select value={editTaskPriority} onChange={(e) => setEditTaskPriority(e.target.value as "high" | "medium" | "low")} className="w-full text-sm bg-white border border-border rounded-lg px-2 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer">
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted block mb-1">Owner</label>
                            <select value={editTaskOwner} onChange={(e) => setEditTaskOwner(e.target.value)} className="w-full text-sm bg-white border border-border rounded-lg px-2 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer">
                              {ownerLabels.map((m) => (<option key={m} value={m}>{m}</option>))}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                            <input type="checkbox" checked={editTaskCompleted} onChange={(e) => setEditTaskCompleted(e.target.checked)} className="rounded border-border accent-accent" />
                            Completed
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => saveEditTask(t)} disabled={!editTaskTitle.trim()} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50">
                            <Check className="w-3.5 h-3.5" /> Save
                          </button>
                          <button onClick={cancelEditTask} className="px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground border border-border rounded-lg transition-colors">Cancel</button>
                          <button onClick={() => { onDeleteTask(t.id); setEditingTaskId(null); }} className="ml-auto flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={t.id} className="flex items-start gap-3 px-5 py-3 hover:bg-surface/50 transition-colors cursor-pointer group" onClick={() => startEditTask(t)}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${t.completed ? "bg-emerald-400" : t.priority === "high" ? "bg-red-400" : t.priority === "medium" ? "bg-amber-400" : "bg-gray-300"}`} />
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm ${t.completed ? "line-through text-muted" : "font-medium text-foreground"}`}>{t.title}</div>
                      {t.description && (
                        <div className="text-xs text-muted mt-0.5 line-clamp-1">{t.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted">Due: {formatDueDate(t.due)}</span>
                        <span className="text-xs text-muted">· {t.owner}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${t.priority === "high" ? "bg-red-100 text-red-700" : t.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>{t.priority}</span>
                      </div>
                    </div>
                    <Pencil className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>
          ) : !showAddTask ? (
            <div className="text-center py-10 text-sm text-muted">No tasks for this contact.</div>
          ) : null}
        </div>
      </div>
      )}

      {/* Files tab */}
      {detailTab === "files" && (
        <div className="bg-white rounded-xl border border-border overflow-hidden mb-6 p-5">
          <AttachmentsPanel
            attachments={contactAttachments}
            isLive={!!isLive}
            workspaceId={workspaceId}
            contactId={contact.id}
            uploaderName="You"
            onAttachmentAdded={(att) => setContactAttachments((prev) => [att, ...prev])}
            onAttachmentRemoved={(id) => setContactAttachments((prev) => prev.filter((a) => a.id !== id))}
          />
        </div>
      )}

      {/* Archive/Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6 text-center">
              <div className={`w-12 h-12 rounded-full ${showDeleteConfirm === "delete" ? "bg-red-100" : "bg-amber-100"} flex items-center justify-center mx-auto mb-4`}>
                {showDeleteConfirm === "delete" ? (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                ) : (
                  <Archive className="w-6 h-6 text-amber-600" />
                )}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {showDeleteConfirm === "delete" ? "Delete" : "Archive"} {contact.name}?
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {showDeleteConfirm === "delete"
                  ? "This will permanently remove this contact and all their associated tasks, touchpoints, and data. This cannot be undone."
                  : "This will move the contact to your archive. They won't appear in your pipeline or contacts list, but you can restore them later."}
              </p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-white border border-border hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm === "delete" && onDeleteContact) {
                    onDeleteContact(contact.id);
                  } else if (showDeleteConfirm === "archive" && onArchiveContact) {
                    onArchiveContact(contact.id);
                  }
                  setShowDeleteConfirm(null);
                }}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors shadow-lg ${
                  showDeleteConfirm === "delete"
                    ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                    : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                }`}
              >
                {showDeleteConfirm === "delete" ? (
                  <><TrashIcon className="w-3.5 h-3.5" /> Delete</>
                ) : (
                  <><Archive className="w-3.5 h-3.5" /> Archive</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Email template picker */}
      {showEmailTemplates && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => { setShowEmailTemplates(false); setSelectedTemplate(null); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden max-h-[80vh] flex flex-col"
          >
            {selectedTemplate ? (() => {
              const firstName = contact.name.split(" ")[0];
              const filled = fillTemplate(selectedTemplate, {
                firstName,
                company: contact.company,
                senderName: "Your Name",
              });
              // Set compose fields when template is first selected
              if (!composeSubject && !composeBody) {
                setTimeout(() => {
                  setComposeSubject(filled.subject);
                  setComposeBody(filled.body);
                }, 0);
              }
              return (
                <>
                  <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{selectedTemplate.name}</h3>
                      <p className="text-xs text-muted mt-0.5">To: {contact.email}</p>
                    </div>
                    <button onClick={() => { setSelectedTemplate(null); setComposeSubject(""); setComposeBody(""); setEmailSent(false); setEmailError(""); }} className="text-xs text-accent hover:text-accent-dark">
                      ← Back
                    </button>
                  </div>
                  {emailSent ? (
                    <div className="px-6 py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">Email Sent!</h4>
                      <p className="text-xs text-muted">Your email to {contact.name} has been sent via Gmail.</p>
                      <button
                        onClick={() => { setShowEmailTemplates(false); setSelectedTemplate(null); setComposeSubject(""); setComposeBody(""); setEmailSent(false); }}
                        className="mt-4 px-4 py-2 text-xs font-medium text-accent hover:text-accent-dark transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="px-6 py-4 flex-1 overflow-y-auto space-y-3">
                        <div>
                          <label className="text-xs font-medium text-muted block mb-1">Subject</label>
                          <input
                            type="text"
                            value={composeSubject || filled.subject}
                            onChange={(e) => setComposeSubject(e.target.value)}
                            className="w-full text-sm text-foreground bg-white rounded-lg px-3 py-2 border border-border outline-none focus:ring-1 focus:ring-accent"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted block mb-1">Body</label>
                          <textarea
                            value={composeBody || filled.body}
                            onChange={(e) => setComposeBody(e.target.value)}
                            rows={8}
                            className="w-full text-sm text-foreground bg-white rounded-lg px-3 py-3 border border-border outline-none focus:ring-1 focus:ring-accent resize-none leading-relaxed"
                          />
                        </div>
                        {/* Attachments */}
                        <div>
                          <input
                            ref={emailFileRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => { if (e.target.files) setEmailAttachments((prev) => [...prev, ...Array.from(e.target.files!)]); e.target.value = ""; }}
                          />
                          <button
                            onClick={() => emailFileRef.current?.click()}
                            className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            Attach files
                          </button>
                          {emailAttachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {emailAttachments.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs bg-surface rounded-lg px-2.5 py-1.5">
                                  <Paperclip className="w-3 h-3 text-muted shrink-0" />
                                  <span className="truncate text-foreground flex-1">{f.name}</span>
                                  <span className="text-muted shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                                  <button onClick={() => setEmailAttachments((prev) => prev.filter((_, j) => j !== i))} className="text-muted hover:text-red-500">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {emailError && (
                          <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">{emailError}</div>
                        )}
                      </div>
                      <div className="px-6 py-4 border-t border-border flex gap-3">
                        <button
                          onClick={() => { setShowEmailTemplates(false); setSelectedTemplate(null); setComposeSubject(""); setComposeBody(""); setEmailAttachments([]); }}
                          className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-white border border-border hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        {isLive ? (
                          <button
                            onClick={async () => {
                              setSendingEmail(true);
                              setEmailError("");
                              try {
                                let res: Response;
                                if (emailAttachments.length > 0) {
                                  const formData = new FormData();
                                  formData.append("to", contact.email);
                                  formData.append("subject", composeSubject || filled.subject);
                                  formData.append("body", (composeBody || filled.body).replace(/\n/g, "<br>"));
                                  for (const f of emailAttachments) {
                                    formData.append("attachments", f);
                                  }
                                  res = await fetch("/api/email/send", { method: "POST", body: formData });
                                } else {
                                  res = await fetch("/api/email/send", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      to: contact.email,
                                      subject: composeSubject || filled.subject,
                                      body: (composeBody || filled.body).replace(/\n/g, "<br>"),
                                    }),
                                  });
                                }
                                const data = await res.json();
                                if (!res.ok) {
                                  setEmailError(data.error || "Failed to send email");
                                } else {
                                  setEmailSent(true);
                                  setEmailAttachments([]);
                                  trackEvent("contact.email_sent");
                                  // Auto-log as touchpoint
                                  if (onAddTouchpointFromEmail) {
                                    onAddTouchpointFromEmail({
                                      id: crypto.randomUUID(),
                                      contactId: contact.id,
                                      type: "email",
                                      title: `Email: ${composeSubject || filled.subject}`,
                                      description: (composeBody || filled.body).slice(0, 200),
                                      date: new Date().toISOString().slice(0, 10),
                                      owner: "You",
                                    });
                                  }
                                }
                              } catch {
                                setEmailError("Network error. Please try again.");
                              }
                              setSendingEmail(false);
                            }}
                            disabled={sendingEmail}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50"
                          >
                            {sendingEmail ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                            ) : (
                              <><Send className="w-3.5 h-3.5" /> Send via Gmail</>
                            )}
                          </button>
                        ) : (
                          <div className="flex-1 flex flex-col items-center gap-1">
                            <a
                              href={`mailto:${contact.email}?subject=${encodeURIComponent(composeSubject || filled.subject)}&body=${encodeURIComponent(composeBody || filled.body)}`}
                              onClick={() => { setShowEmailTemplates(false); setSelectedTemplate(null); setComposeSubject(""); setComposeBody(""); }}
                              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              Open in Email
                            </a>
                            <a href="/signup" className="text-[10px] text-muted hover:text-accent flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Sign up to send directly from WorkChores
                            </a>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              );
            })() : (
              <>
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Email Templates</h3>
                  <p className="text-xs text-muted mt-0.5">Choose a template to send to {contact.name}</p>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-border">
                  {(emailTemplates || defaultTemplates).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t)}
                      className="w-full flex items-start gap-3 px-6 py-3.5 text-left hover:bg-surface transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        t.category === "follow-up" ? "bg-blue-50" : t.category === "intro" ? "bg-emerald-50" : t.category === "proposal" ? "bg-violet-50" : t.category === "thank-you" ? "bg-amber-50" : "bg-gray-100"
                      }`}>
                        <Mail className={`w-4 h-4 ${
                          t.category === "follow-up" ? "text-blue-600" : t.category === "intro" ? "text-emerald-600" : t.category === "proposal" ? "text-violet-600" : t.category === "thank-you" ? "text-amber-600" : "text-gray-600"
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">{t.name}</div>
                        <div className="text-xs text-muted mt-0.5">{t.subject.replace(/\{\{firstName\}\}/g, contact.name.split(" ")[0])}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="px-6 py-3 border-t border-border bg-surface/30 flex items-center justify-between">
                  <span className="text-[11px] text-muted">Variables auto-filled: name, company</span>
                  <button
                    onClick={() => {
                      setComposeSubject("");
                      setComposeBody("");
                      setSelectedTemplate({ id: "blank", name: "New Email", subject: "", body: "", category: "follow-up" });
                    }}
                    className="text-xs font-medium text-accent hover:text-accent-dark"
                  >
                    Blank email →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Action modals — Log Call, Meeting, Note, Add Task */}
      {actionModal && actionModal !== "email" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setActionModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Touchpoint modals: call, meeting, note */}
            {(actionModal === "call" || actionModal === "meeting" || actionModal === "note") && (() => {
              const modalConfig = {
                call: { icon: Phone, title: "Log a Call", color: "text-blue-600", bg: "bg-blue-100", placeholder: "e.g., Discovery call with decision maker" },
                meeting: { icon: Calendar, title: "Log a Meeting", color: "text-cyan-600", bg: "bg-cyan-100", placeholder: "e.g., Product demo walkthrough" },
                note: { icon: MessageSquare, title: "Add a Note", color: "text-violet-600", bg: "bg-violet-100", placeholder: "e.g., Client prefers email communication" },
              };
              const cfg = modalConfig[actionModal];
              const ModalIcon = cfg.icon;
              return (
                <>
                  <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                      <ModalIcon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{cfg.title}</h3>
                      <p className="text-xs text-muted">for {contact.name}</p>
                    </div>
                    <button onClick={() => setActionModal(null)} className="ml-auto p-1 text-muted hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1.5">Title</label>
                      <input
                        type="text"
                        value={tpTitle}
                        onChange={(e) => setTpTitle(e.target.value)}
                        placeholder={cfg.placeholder}
                        className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-muted"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1.5">Notes <span className="text-muted font-normal">(optional)</span></label>
                      <textarea
                        value={tpDescription}
                        onChange={(e) => setTpDescription(e.target.value)}
                        placeholder="Add details..."
                        rows={3}
                        className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-muted resize-none"
                      />
                    </div>
                  </div>
                  <div className="px-6 pb-5 flex gap-3">
                    <button
                      onClick={() => setActionModal(null)}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-white border border-border hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => { handleAddTouchpoint(); setActionModal(null); }}
                      disabled={!tpTitle.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </>
              );
            })()}

            {/* Task modal */}
            {actionModal === "task" && (
              <>
                <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Add a Task</h3>
                    <p className="text-xs text-muted">for {contact.name}</p>
                  </div>
                  <button onClick={() => setActionModal(null)} className="ml-auto p-1 text-muted hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">Title</label>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g., Follow up on proposal"
                      className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-muted"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1.5">Notes <span className="text-muted font-normal">(optional)</span></label>
                    <textarea
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Add details..."
                      rows={2}
                      className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-muted resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1.5">Due Date</label>
                      <input type="date" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} className="w-full text-sm bg-white border border-border rounded-lg px-2.5 py-2 text-foreground outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1.5">Priority</label>
                      <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as "high" | "medium" | "low")} className="w-full text-sm bg-white border border-border rounded-lg px-2.5 py-2 text-foreground outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer">
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-1.5">Owner</label>
                      <select value={newTaskOwner} onChange={(e) => setNewTaskOwner(e.target.value)} className="w-full text-sm bg-white border border-border rounded-lg px-2.5 py-2 text-foreground outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer">
                        {ownerLabels.map((m) => (<option key={m} value={m}>{m}</option>))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="px-6 pb-5 flex gap-3">
                  <button
                    onClick={() => setActionModal(null)}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-white border border-border hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { handleAddTask(); setActionModal(null); }}
                    disabled={!newTaskTitle.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" /> Add Task
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
