"use client";

import { useState, useRef } from "react";
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  CalendarIcon,
  FileText,
  User,
  Tag,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  Check,
  GripVertical,
  Type,
  Hash,
  CalendarDays,
  List,
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
}

const fieldTypeConfig = {
  text: { icon: Type, label: "Text", color: "text-blue-600", bg: "bg-blue-100" },
  number: { icon: Hash, label: "Number", color: "text-emerald-600", bg: "bg-emerald-100" },
  date: { icon: CalendarDays, label: "Date", color: "text-violet-600", bg: "bg-violet-100" },
  select: { icon: List, label: "Dropdown", color: "text-amber-600", bg: "bg-amber-100" },
};

export default function ContactDetail({
  contact, tasks: allTasks, touchpoints: allTouchpoints, onBack, onSave,
  onAddTouchpoint, onUpdateTouchpoint, onDeleteTouchpoint,
  onAddTask, onUpdateTask, onDeleteTask, stages,
  customFields, onUpdateCustomFields, customFieldValues, onUpdateCustomFieldValues,
  isAdmin = false, ownerLabels,
}: ContactDetailProps) {
  const [editing, setEditing] = useState(contact.name === "New Contact");
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

  const stageInfo = stages.find((s) => s.label === stage);
  const contactTouchpoints = allTouchpoints.filter((t) => t.contactId === contact.id);
  const contactTasks = allTasks.filter((t) => t.contactId === contact.id);

  function handleSave() {
    // Save custom field values
    const updated = { ...customFieldValues, [contact.id]: localFieldValues };
    onUpdateCustomFieldValues(updated);

    onSave({
      ...contact,
      name: name.trim() || contact.name,
      email: email.trim() || contact.email,
      phone: phone.trim() || contact.phone,
      company: company.trim() || contact.company,
      role: role.trim() || contact.role,
      stage, value, owner, tags,
      avatar: (name.trim() || contact.name).split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
    });
    setEditing(false);
  }

  function handleCancel() {
    setName(contact.name); setEmail(contact.email); setPhone(contact.phone);
    setCompany(contact.company); setRole(contact.role); setStage(contact.stage);
    setValue(contact.value); setValueDisplay(contact.value.toLocaleString("en-US")); setOwner(contact.owner); setTags(contact.tags);
    setLocalFieldValues(customFieldValues[contact.id] || {});
    setEditing(false);
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  }

  function removeTag(tag: string) { setTags(tags.filter((t) => t !== tag)); }

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
          {editing ? (
            <>
              <button onClick={handleCancel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted border border-border hover:bg-surface rounded-lg transition-colors">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors">
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent border border-accent/30 hover:bg-accent-light rounded-lg transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className={`w-14 h-14 rounded-xl ${contact.avatarColor} flex items-center justify-center text-lg font-bold text-white shrink-0`}>
            {contact.avatar}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="text-xl font-bold bg-transparent border-b border-border text-foreground outline-none focus:border-accent w-full pb-1" placeholder="Contact name" />
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                    <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="text-sm bg-transparent border-b border-border text-foreground outline-none focus:border-accent w-full pb-0.5" placeholder="Email" />
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                    <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="text-sm bg-transparent border-b border-border text-foreground outline-none focus:border-accent w-full pb-0.5" placeholder="Phone" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-foreground">{name}</h2>
                  {stageInfo && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${stageInfo.bgColor} ${stageInfo.color}`}>{stage}</span>
                  )}
                </div>
                <p className="text-sm text-muted">{role} at {company}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted">
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{email}</span>
                  <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{phone}</span>
                </div>
              </>
            )}
            {editing ? (
              <div className="flex items-center gap-2 mt-3">
                <Tag className="w-3.5 h-3.5 text-muted shrink-0" />
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} placeholder="Add tag..." className="text-[10px] bg-transparent border-b border-border text-foreground outline-none focus:border-accent w-20 pb-0.5" />
              </div>
            ) : (
              tags.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <Tag className="w-3.5 h-3.5 text-muted" />
                  {tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">{tag}</span>
                  ))}
                </div>
              )
            )}
          </div>
          <div className="text-right shrink-0">
            {editing ? (
              <div>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-lg font-bold text-foreground">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={valueDisplay}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      if (!raw) { setValueDisplay(""); setValue(0); return; }
                      const num = parseInt(raw, 10);
                      setValueDisplay(num.toLocaleString("en-US"));
                      setValue(num);
                    }}
                    onBlur={() => {
                      if (!valueDisplay || value === 0) {
                        setValue(contact.value);
                        setValueDisplay(contact.value.toLocaleString("en-US"));
                      }
                    }}
                    className="text-2xl font-bold bg-transparent border-b border-border text-foreground outline-none focus:border-accent w-32 text-right pb-1"
                  />
                </div>
                <div className="text-xs text-muted mt-1">Deal value</div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground">{formatCurrency(value)}</div>
                <div className="text-xs text-muted mt-1">Deal value</div>
              </>
            )}
          </div>
        </div>

        {/* Info grid — built-in fields */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-border">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted" />
            <div>
              <div className="text-[10px] text-muted uppercase tracking-wider">Company</div>
              {editing ? (
                <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} className="text-sm font-medium bg-transparent border-b border-border text-foreground outline-none focus:border-accent w-full pb-0.5" />
              ) : (
                <div className="text-sm font-medium text-foreground">{company}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-muted" />
            <div>
              <div className="text-[10px] text-muted uppercase tracking-wider">Role</div>
              {editing ? (
                <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="text-sm font-medium bg-transparent border-b border-border text-foreground outline-none focus:border-accent w-full pb-0.5" />
              ) : (
                <div className="text-sm font-medium text-foreground">{role}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted" />
            <div>
              <div className="text-[10px] text-muted uppercase tracking-wider">Owner</div>
              {editing ? (
                <select value={owner} onChange={(e) => setOwner(e.target.value)} className="text-sm font-medium bg-transparent border-b border-border text-foreground outline-none focus:border-accent cursor-pointer">
                  {ownerLabels.map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
              ) : (
                <div className="text-sm font-medium text-foreground">{owner}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted" />
            <div>
              <div className="text-[10px] text-muted uppercase tracking-wider">{editing ? "Stage" : "Created"}</div>
              {editing ? (
                <select value={stage} onChange={(e) => setStage(e.target.value as Stage)} className="text-sm font-medium bg-transparent border-b border-border text-foreground outline-none focus:border-accent cursor-pointer">
                  {stages.map((s) => (<option key={s.label} value={s.label}>{s.label}</option>))}
                </select>
              ) : (
                <div className="text-sm font-medium text-foreground">{contact.created}</div>
              )}
            </div>
          </div>
        </div>

        {/* Custom fields */}
        {(customFields.length > 0 || editing) && (
          <div className={`mt-4 pt-4 border-t border-dashed border-border/60 ${isDragging ? "bg-accent/[0.02] rounded-lg" : ""}`}>
            {customFields.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {customFields.map((field, index) => {
                  const config = fieldTypeConfig[field.type];
                  const Icon = config.icon;
                  const fieldValue = editing ? (localFieldValues[field.id] || "") : (displayValues[field.id] || "");

                  return (
                    <div
                      key={field.id}
                      draggable={editing && isAdmin}
                      onDragStart={() => isAdmin && handleDragStart(index)}
                      onDragEnter={() => isAdmin && handleDragEnter(index)}
                      onDragEnd={isAdmin ? handleDragEnd : undefined}
                      onDragOver={(e) => e.preventDefault()}
                      className={`flex items-start gap-2 group relative rounded-lg transition-all ${
                        editing && isAdmin
                          ? "cursor-grab active:cursor-grabbing p-2 -m-2 hover:bg-surface/80 border border-transparent hover:border-border/50"
                          : editing
                          ? "p-2 -m-2"
                          : ""
                      } ${isDragging && dragOverItem.current === index ? "bg-accent/10 border-accent/30" : ""}`}
                    >
                      {editing && isAdmin && (
                        <GripVertical className="w-3.5 h-3.5 text-muted/40 shrink-0 mt-1 group-hover:text-muted transition-colors" />
                      )}
                      <Icon className={`w-4 h-4 ${config.color} shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-muted uppercase tracking-wider flex items-center gap-1">
                          {field.label}
                          {editing && isAdmin && (
                            <button
                              onClick={(e) => { e.stopPropagation(); removeCustomField(field.id); }}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {editing ? (
                          field.type === "select" ? (
                            <select
                              value={localFieldValues[field.id] || ""}
                              onChange={(e) => updateLocalFieldValue(field.id, e.target.value)}
                              className="text-sm font-medium bg-transparent border-b border-border text-foreground outline-none focus:border-accent cursor-pointer w-full pb-0.5"
                            >
                              <option value="">Select...</option>
                              {(field.options || []).map((o) => (<option key={o} value={o}>{o}</option>))}
                            </select>
                          ) : field.type === "date" ? (
                            <input
                              type="date"
                              value={localFieldValues[field.id] || ""}
                              onChange={(e) => updateLocalFieldValue(field.id, e.target.value)}
                              className="text-sm font-medium bg-transparent border-b border-border text-foreground outline-none focus:border-accent w-full pb-0.5"
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
                              placeholder={`Enter ${field.label.toLowerCase()}...`}
                              className="text-sm font-medium bg-transparent border-b border-border text-foreground outline-none focus:border-accent w-full pb-0.5 placeholder:text-muted/50 placeholder:font-normal"
                            />
                          )
                        ) : (
                          <div className="text-sm font-medium text-foreground">
                            {fieldValue || <span className="text-muted/50 font-normal">—</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add field button / form — admin only */}
            {editing && isAdmin && (
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

      <div className="grid lg:grid-cols-2 gap-6">
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
    </div>
  );
}
