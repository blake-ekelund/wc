"use client";

import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Users,
  CheckSquare,
  MessageSquare,
  Check,
  Filter,
  ChevronDown,
} from "lucide-react";
import { type Contact, type Task, type Touchpoint, type StageDefinition } from "../data";
import { trackEvent } from "@/lib/track-event";

interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
}

interface TeamMember {
  id: string;
  name: string;
  ownerLabel: string;
  role: string;
}

interface ExportViewProps {
  contacts: Contact[];
  tasks: Task[];
  touchpoints: Touchpoint[];
  stages: StageDefinition[];
  customFields: CustomField[];
  customFieldValues: Record<string, Record<string, string>>;
  teamMembers: TeamMember[];
  isAdmin?: boolean;
}

type DataType = "contacts" | "tasks" | "touchpoints";
type ExportFormat = "xlsx" | "csv";

export default function ExportView({
  contacts,
  tasks,
  touchpoints,
  stages,
  customFields,
  customFieldValues,
  teamMembers,
  isAdmin = false,
}: ExportViewProps) {
  const [selectedTypes, setSelectedTypes] = useState<Set<DataType>>(new Set(["contacts"]));
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Unique owners from contacts
  const owners = Array.from(new Set(contacts.map((c) => c.owner))).sort();

  // Filtered contacts
  const filteredContacts = contacts.filter((c) => {
    if (!includeArchived && (c.archived || c.trashedAt)) return false;
    if (ownerFilter !== "all" && c.owner !== ownerFilter) return false;
    if (stageFilter !== "all" && c.stage !== stageFilter) return false;
    return true;
  });

  // Tasks & touchpoints for filtered contacts
  const contactIds = new Set(filteredContacts.map((c) => c.id));
  const filteredTasks = ownerFilter === "all" && stageFilter === "all"
    ? tasks
    : tasks.filter((t) => !t.contactId || contactIds.has(t.contactId));
  const filteredTouchpoints = ownerFilter === "all" && stageFilter === "all"
    ? touchpoints
    : touchpoints.filter((tp) => contactIds.has(tp.contactId));

  function toggleType(t: DataType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) {
        if (next.size > 1) next.delete(t);
      } else {
        next.add(t);
      }
      return next;
    });
  }

  const counts = {
    contacts: filteredContacts.length,
    tasks: filteredTasks.length,
    touchpoints: filteredTouchpoints.length,
  };

  const totalRecords = Array.from(selectedTypes).reduce((sum, t) => sum + counts[t], 0);

  async function handleExport() {
    setExporting(true);
    setExported(false);

    try {
      if (format === "xlsx") {
        await exportXlsx();
      } else {
        exportCsv();
      }
      setExported(true);
      trackEvent("export.downloaded");
      setTimeout(() => setExported(false), 3000);
    } catch (err) {
      console.error("Export error:", err);
    }
    setExporting(false);
  }

  async function exportXlsx() {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();

    if (selectedTypes.has("contacts")) {
      const sheet = workbook.addWorksheet("Contacts");

      // Build headers: default + custom fields
      const headers = ["Name", "Email", "Company", "Role", "Phone", "Pipeline Stage", "Deal Value", "Owner", "Tags", "Last Contact", "Created"];
      customFields.forEach((f) => headers.push(f.label));
      if (includeArchived) headers.push("Status");

      const headerRow = sheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      });

      filteredContacts.forEach((c) => {
        const row: (string | number)[] = [
          c.name, c.email, c.company, c.role, c.phone, c.stage,
          c.value, c.owner, c.tags.join(", "), c.lastContact, c.created,
        ];
        customFields.forEach((f) => {
          row.push(customFieldValues[c.id]?.[f.id] || "");
        });
        if (includeArchived) {
          row.push(c.trashedAt ? "Deleted" : c.archived ? "Archived" : "Active");
        }
        sheet.addRow(row);
      });

      // Auto-width
      sheet.columns.forEach((col) => {
        let maxLen = 12;
        col.eachCell?.((cell) => {
          const len = (cell.value?.toString() || "").length;
          if (len > maxLen) maxLen = Math.min(len, 40);
        });
        col.width = maxLen + 2;
      });
    }

    if (selectedTypes.has("tasks")) {
      const sheet = workbook.addWorksheet("Tasks");
      const headers = ["Title", "Description", "Contact", "Due Date", "Priority", "Owner", "Status"];
      const headerRow = sheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      });

      filteredTasks.forEach((t) => {
        const contact = contacts.find((c) => c.id === t.contactId);
        sheet.addRow([
          t.title,
          t.description || "",
          contact?.name || "",
          t.due,
          t.priority,
          t.owner,
          t.completed ? "Completed" : "Open",
        ]);
      });

      sheet.columns.forEach((col) => {
        let maxLen = 12;
        col.eachCell?.((cell) => {
          const len = (cell.value?.toString() || "").length;
          if (len > maxLen) maxLen = Math.min(len, 40);
        });
        col.width = maxLen + 2;
      });
    }

    if (selectedTypes.has("touchpoints")) {
      const sheet = workbook.addWorksheet("Activity");
      const headers = ["Title", "Description", "Contact", "Type", "Date", "Owner"];
      const headerRow = sheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7C3AED" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      });

      filteredTouchpoints.forEach((tp) => {
        const contact = contacts.find((c) => c.id === tp.contactId);
        sheet.addRow([
          tp.title,
          tp.description || "",
          contact?.name || "",
          tp.type,
          tp.date,
          tp.owner,
        ]);
      });

      sheet.columns.forEach((col) => {
        let maxLen = 12;
        col.eachCell?.((cell) => {
          const len = (cell.value?.toString() || "").length;
          if (len > maxLen) maxLen = Math.min(len, 40);
        });
        col.width = maxLen + 2;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    downloadBlob(blob, "workchores-export.xlsx");
  }

  function exportCsv() {
    // For CSV, combine all selected types into one download per type
    if (selectedTypes.has("contacts")) {
      const headers = ["Name", "Email", "Company", "Role", "Phone", "Pipeline Stage", "Deal Value", "Owner", "Tags", "Last Contact", "Created"];
      customFields.forEach((f) => headers.push(f.label));
      if (includeArchived) headers.push("Status");

      const rows = filteredContacts.map((c) => {
        const row = [c.name, c.email, c.company, c.role, c.phone, c.stage, c.value.toString(), c.owner, c.tags.join("; "), c.lastContact, c.created];
        customFields.forEach((f) => {
          row.push(customFieldValues[c.id]?.[f.id] || "");
        });
        if (includeArchived) {
          row.push(c.trashedAt ? "Deleted" : c.archived ? "Archived" : "Active");
        }
        return row;
      });

      const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      downloadBlob(new Blob([csv], { type: "text/csv" }), "workchores-contacts.csv");
    }

    if (selectedTypes.has("tasks")) {
      const headers = ["Title", "Description", "Contact", "Due Date", "Priority", "Owner", "Status"];
      const rows = filteredTasks.map((t) => {
        const contact = contacts.find((c) => c.id === t.contactId);
        return [t.title, t.description || "", contact?.name || "", t.due, t.priority, t.owner, t.completed ? "Completed" : "Open"];
      });
      const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      downloadBlob(new Blob([csv], { type: "text/csv" }), "workchores-tasks.csv");
    }

    if (selectedTypes.has("touchpoints")) {
      const headers = ["Title", "Description", "Contact", "Type", "Date", "Owner"];
      const rows = filteredTouchpoints.map((tp) => {
        const contact = contacts.find((c) => c.id === tp.contactId);
        return [tp.title, tp.description || "", contact?.name || "", tp.type, tp.date, tp.owner];
      });
      const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      downloadBlob(new Blob([csv], { type: "text/csv" }), "workchores-activity.csv");
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const dataTypes: { id: DataType; label: string; icon: typeof Users; count: number; color: string; bgColor: string }[] = [
    { id: "contacts", label: "Contacts", icon: Users, count: counts.contacts, color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
    { id: "tasks", label: "Tasks", icon: CheckSquare, count: counts.tasks, color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200" },
    { id: "touchpoints", label: "Activity", icon: MessageSquare, count: counts.touchpoints, color: "text-violet-600", bgColor: "bg-violet-50 border-violet-200" },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Export Data</h2>
        <p className="text-sm text-muted mt-1">Download your workspace data as a spreadsheet. Filter by team member, stage, or data type.</p>
      </div>

      {/* Data type selection */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">What do you want to export?</h3>
          <p className="text-xs text-muted mt-0.5">Select one or more data types</p>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3">
          {dataTypes.map((dt) => {
            const isSelected = selectedTypes.has(dt.id);
            const Icon = dt.icon;
            return (
              <button
                key={dt.id}
                onClick={() => toggleType(dt.id)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? `${dt.bgColor} ring-2 ring-offset-1 ring-${dt.color.replace("text-", "")}/30`
                    : "border-border hover:border-gray-300 bg-white"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className={`w-10 h-10 rounded-xl ${isSelected ? dt.bgColor.split(" ")[0] : "bg-gray-100"} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${isSelected ? dt.color : "text-gray-400"}`} />
                </div>
                <div className="text-center">
                  <div className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted"}`}>{dt.label}</div>
                  <div className="text-xs text-muted">{dt.count} records</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-foreground">Filters</span>
            {(ownerFilter !== "all" || stageFilter !== "all" || includeArchived) && (
              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-medium">
                Active
              </span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-muted transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
        {showFilters && (
          <div className="px-5 py-4 border-t border-border space-y-4">
            {/* Owner filter — admins only */}
            {isAdmin && (
              <div>
                <label className="text-xs font-medium text-muted block mb-1.5">Team Member</label>
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                >
                  <option value="all">All team members</option>
                  {owners.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Stage filter */}
            <div>
              <label className="text-xs font-medium text-muted block mb-1.5">Pipeline Stage</label>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              >
                <option value="all">All stages</option>
                {stages.map((s) => (
                  <option key={s.label} value={s.label}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Include archived */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
              />
              <span className="text-sm text-foreground">Include archived &amp; deleted contacts</span>
            </label>
          </div>
        )}
      </div>

      {/* Format selection */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">File Format</h3>
        </div>
        <div className="p-4 flex gap-3">
          <button
            onClick={() => setFormat("xlsx")}
            className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
              format === "xlsx"
                ? "border-accent bg-accent/5 ring-2 ring-offset-1 ring-accent/30"
                : "border-border hover:border-gray-300"
            }`}
          >
            <FileSpreadsheet className={`w-5 h-5 ${format === "xlsx" ? "text-accent" : "text-muted"}`} />
            <div className="text-left">
              <div className={`text-sm font-medium ${format === "xlsx" ? "text-foreground" : "text-muted"}`}>Excel (.xlsx)</div>
              <div className="text-[11px] text-muted">Multiple sheets, formatting</div>
            </div>
          </button>
          <button
            onClick={() => setFormat("csv")}
            className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
              format === "csv"
                ? "border-accent bg-accent/5 ring-2 ring-offset-1 ring-accent/30"
                : "border-border hover:border-gray-300"
            }`}
          >
            <FileSpreadsheet className={`w-5 h-5 ${format === "csv" ? "text-accent" : "text-muted"}`} />
            <div className="text-left">
              <div className={`text-sm font-medium ${format === "csv" ? "text-foreground" : "text-muted"}`}>CSV (.csv)</div>
              <div className="text-[11px] text-muted">Universal, one file per type</div>
            </div>
          </button>
        </div>
      </div>

      {/* Export summary & button */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-foreground">Export Summary</div>
              <div className="text-xs text-muted mt-0.5">
                {totalRecords} total records across {selectedTypes.size} data type{selectedTypes.size !== 1 ? "s" : ""}
                {ownerFilter !== "all" && ` · Filtered to ${ownerFilter}`}
                {stageFilter !== "all" && ` · ${stageFilter} stage`}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted mb-4">
            {Array.from(selectedTypes).map((t) => {
              const dt = dataTypes.find((d) => d.id === t)!;
              return (
                <span key={t} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${dt.bgColor.split(" ")[0]} ${dt.color}`}>
                  <dt.icon className="w-3 h-3" />
                  {counts[t]} {dt.label.toLowerCase()}
                </span>
              );
            })}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || totalRecords === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
          >
            {exporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exporting...
              </>
            ) : exported ? (
              <>
                <Check className="w-4 h-4" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export {totalRecords} Records as {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
