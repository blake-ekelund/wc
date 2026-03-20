"use client";

import { useState } from "react";
import { Filter, ChevronRight, AlertCircle, Archive, Trash2, RotateCcw, CheckSquare, Square, X, GitBranch, UserCheck, ChevronDown, Mail, Loader2, AlertTriangle, Plus, Users } from "lucide-react";
import { formatCurrency, type Stage, type Contact, type StageDefinition, type Touchpoint } from "../data";
import { AnimatePresence, motion } from "framer-motion";
import { trackEvent } from "@/lib/track-event";

interface ContactsViewProps {
  contacts: Contact[];
  archivedContacts?: Contact[];
  trashedContacts?: Contact[];
  stages: StageDefinition[];
  onSelectContact: (id: string) => void;
  onUnarchiveContact?: (id: string) => void;
  onTrashArchivedContact?: (id: string) => void;
  onRestoreContact?: (id: string) => void;
  onPermanentlyDeleteContact?: (id: string) => void;
  onEmptyTrash?: () => void;
  onBulkArchive?: (ids: string[]) => void;
  onBulkTrash?: (ids: string[]) => void;
  onBulkChangeStage?: (ids: string[], stage: string) => void;
  onBulkReassign?: (ids: string[], owner: string) => void;
  ownerLabels?: string[];
  isLive?: boolean;
  emailTemplates?: { id: string; name: string; subject: string; body: string; category: string }[];
  onAddTouchpoint?: (touchpoint: Touchpoint) => void;
  onAddContact?: () => void;
}

export default function ContactsView({
  contacts, archivedContacts = [], trashedContacts = [], stages, onSelectContact,
  onUnarchiveContact, onTrashArchivedContact, onRestoreContact, onPermanentlyDeleteContact, onEmptyTrash,
  onBulkArchive, onBulkTrash, onBulkChangeStage, onBulkReassign, ownerLabels = [],
  isLive = false, emailTemplates = [], onAddTouchpoint, onAddContact,
}: ContactsViewProps) {
  const [stageFilter, setStageFilter] = useState<Stage | "All" | "Unassigned">("All");
  const [showArchived, setShowArchived] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStageOpen, setBulkStageOpen] = useState(false);
  const [bulkReassignOpen, setBulkReassignOpen] = useState(false);
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [bulkEmailSubject, setBulkEmailSubject] = useState("");
  const [bulkEmailBody, setBulkEmailBody] = useState("");
  const [bulkEmailSending, setBulkEmailSending] = useState(false);
  const [bulkEmailResult, setBulkEmailResult] = useState<{ sent: number; failed: number } | null>(null);
  const [bulkEmailError, setBulkEmailError] = useState("");

  const unassignedCount = contacts.filter((c) => c.owner === "Unassigned").length;

  const filtered = contacts
    .filter((c) => {
      if (stageFilter === "Unassigned") {
        if (c.owner !== "Unassigned") return false;
      } else if (stageFilter !== "All" && c.stage !== stageFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const allSelected = filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setBulkStageOpen(false);
    setBulkReassignOpen(false);
  }

  function handleBulkArchive() {
    if (onBulkArchive) onBulkArchive(Array.from(selectedIds));
    if (isLive) trackEvent("contact.bulk_action", { action: "archive" });
    clearSelection();
  }

  function handleBulkTrash() {
    if (onBulkTrash) onBulkTrash(Array.from(selectedIds));
    if (isLive) trackEvent("contact.bulk_action", { action: "delete" });
    clearSelection();
  }

  function handleBulkStage(stage: string) {
    if (onBulkChangeStage) onBulkChangeStage(Array.from(selectedIds), stage);
    if (isLive) trackEvent("contact.bulk_action", { action: "stage_change" });
    clearSelection();
  }

  function handleBulkReassign(owner: string) {
    if (onBulkReassign) onBulkReassign(Array.from(selectedIds), owner);
    clearSelection();
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Contacts</h2>
          <p className="text-sm text-muted mt-0.5">{contacts.length} total contacts</p>
        </div>
        <div className="flex items-center gap-2">
          {onAddContact && (
            <button
              onClick={onAddContact}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Contact
            </button>
          )}
          {archivedContacts.length > 0 && (
            <button
              onClick={() => { setShowArchived((v) => !v); setShowTrash(false); clearSelection(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                showArchived
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "bg-white border-border text-muted hover:text-foreground hover:border-gray-300"
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Archived</span>
              <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">{archivedContacts.length}</span>
            </button>
          )}
          {trashedContacts.length > 0 && (
            <button
              onClick={() => { setShowTrash((v) => !v); setShowArchived(false); clearSelection(); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                showTrash
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "bg-white border-border text-muted hover:text-foreground hover:border-gray-300"
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trash</span>
              <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-100 text-red-700 text-[10px] font-bold">{trashedContacts.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stage filter pills */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-muted shrink-0" />
        <button
          onClick={() => { setStageFilter("All"); clearSelection(); }}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
            stageFilter === "All"
              ? "bg-accent text-white"
              : "bg-white border border-border text-muted hover:text-foreground"
          }`}
        >
          All
        </button>
        {stages.map((s, i) => (
          <button
            key={`${s.label}-${i}`}
            onClick={() => { setStageFilter(s.label); clearSelection(); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
              stageFilter === s.label
                ? `${s.bgColor} ${s.color}`
                : "bg-white border border-border text-muted hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
        {unassignedCount > 0 && (
          <button
            onClick={() => { setStageFilter("Unassigned"); clearSelection(); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 inline-flex items-center gap-1 ${
              stageFilter === "Unassigned"
                ? "bg-amber-100 text-amber-700"
                : "bg-white border border-amber-300 text-amber-600 hover:bg-amber-50"
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            Unassigned ({unassignedCount})
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {someSelected && !showArchived && !showTrash && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="mb-3 px-4 py-2.5 bg-accent/5 border border-accent/20 rounded-xl flex items-center gap-2 flex-wrap"
          >
            <span className="text-sm font-medium text-accent mr-1">{selectedIds.size} selected</span>
            <div className="w-px h-5 bg-accent/20" />

            {/* Change Stage */}
            <div className="relative">
              <button
                onClick={() => { setBulkStageOpen((v) => !v); setBulkReassignOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-white border border-border hover:border-gray-400 rounded-lg transition-colors"
              >
                <GitBranch className="w-3 h-3" />
                Change Stage
                <ChevronDown className={`w-3 h-3 transition-transform ${bulkStageOpen ? "rotate-180" : ""}`} />
              </button>
              {bulkStageOpen && (
                <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-border rounded-lg shadow-xl z-50 py-1">
                  {stages.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => handleBulkStage(s.label)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface transition-colors"
                    >
                      <span className={`w-2 h-2 rounded-full ${s.bgColor}`} />
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reassign */}
            {ownerLabels.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => { setBulkReassignOpen((v) => !v); setBulkStageOpen(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-white border border-border hover:border-gray-400 rounded-lg transition-colors"
                >
                  <UserCheck className="w-3 h-3" />
                  Reassign
                  <ChevronDown className={`w-3 h-3 transition-transform ${bulkReassignOpen ? "rotate-180" : ""}`} />
                </button>
                {bulkReassignOpen && (
                  <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-border rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                    {ownerLabels.map((o) => (
                      <button
                        key={o}
                        onClick={() => handleBulkReassign(o)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-surface transition-colors"
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bulk Email */}
            <button
              onClick={() => {
                const withEmail = contacts.filter((c) => selectedIds.has(c.id) && c.email);
                if (withEmail.length === 0) return;
                setShowBulkEmail(true);
                setBulkEmailResult(null);
                setBulkEmailError("");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Mail className="w-3 h-3" />
              Email ({contacts.filter((c) => selectedIds.has(c.id) && c.email).length})
            </button>

            {/* Archive */}
            <button
              onClick={handleBulkArchive}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <Archive className="w-3 h-3" />
              Archive
            </button>

            {/* Delete */}
            <button
              onClick={handleBulkTrash}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>

            <div className="flex-1" />
            <button
              onClick={clearSelection}
              className="p-1.5 text-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Archived view */}
      {showArchived ? (
        <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-100 bg-amber-50/50">
            <h3 className="text-sm font-semibold text-amber-800">{archivedContacts.length} Archived Contact{archivedContacts.length !== 1 ? "s" : ""}</h3>
          </div>
          <div className="divide-y divide-border">
            {archivedContacts.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-50/30 transition-colors">
                <div className={`w-8 h-8 rounded-full ${c.avatarColor} opacity-60 flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground/70 truncate">{c.name}</div>
                  <div className="text-xs text-muted truncate">{c.company} · {formatCurrency(c.value)}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 shrink-0 hidden sm:inline">Archived</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {onUnarchiveContact && (
                    <button
                      onClick={() => onUnarchiveContact(c.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-accent border border-accent/30 hover:bg-accent-light rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </button>
                  )}
                  {onTrashArchivedContact && (
                    <button
                      onClick={() => onTrashArchivedContact(c.id)}
                      className="p-1.5 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Move to trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {archivedContacts.length === 0 && (
            <div className="text-center py-12 text-sm text-muted">No archived contacts.</div>
          )}
        </div>

      ) : showTrash ? (
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-red-100 bg-red-50/50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-red-800">{trashedContacts.length} Contact{trashedContacts.length !== 1 ? "s" : ""} in Trash</h3>
            {onEmptyTrash && trashedContacts.length > 0 && (
              confirmEmptyTrash ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-700 font-medium">Delete all permanently?</span>
                  <button
                    onClick={() => { onEmptyTrash(); setConfirmEmptyTrash(false); setShowTrash(false); }}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Yes, empty
                  </button>
                  <button
                    onClick={() => setConfirmEmptyTrash(false)}
                    className="px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmEmptyTrash(true)}
                  className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  Empty Trash
                </button>
              )
            )}
          </div>
          <div className="divide-y divide-border">
            {trashedContacts.map((c) => {
              const daysAgo = c.trashedAt ? Math.floor((Date.now() - new Date(c.trashedAt).getTime()) / 86400000) : 0;
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-red-50/30 transition-colors">
                  <div className={`w-8 h-8 rounded-full ${c.avatarColor} opacity-40 flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                    {c.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground/50 truncate line-through">{c.name}</div>
                    <div className="text-xs text-muted truncate">{c.company} · Deleted {daysAgo === 0 ? "today" : `${daysAgo}d ago`}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {onRestoreContact && (
                      <button
                        onClick={() => onRestoreContact(c.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-accent border border-accent/30 hover:bg-accent-light rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </button>
                    )}
                    {onPermanentlyDeleteContact && (
                      <button
                        onClick={() => onPermanentlyDeleteContact(c.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {trashedContacts.length === 0 && (
            <div className="text-center py-12 text-sm text-muted">Trash is empty.</div>
          )}
        </div>

      ) : (
        /* Active contacts table */
        <>
          {contacts.length === 0 ? (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="text-center py-16 px-6">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Add your first contact</h3>
                <p className="text-sm text-muted max-w-md mx-auto leading-relaxed mb-6">
                  Contacts are the heart of your CRM. Add them one at a time, or import a spreadsheet to get started quickly.
                </p>
                <div className="flex items-center justify-center gap-3">
                  {onAddContact && (
                    <button
                      onClick={onAddContact}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Contact
                    </button>
                  )}
                </div>
              </div>
          </div>
          ) : (
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface border-b border-border">
                    <th className="w-10 px-2 py-3">
                      <button
                        onClick={toggleSelectAll}
                        className="p-1 text-muted hover:text-foreground transition-colors"
                      >
                        {allSelected ? (
                          <CheckSquare className="w-4 h-4 text-accent" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3">Name</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden md:table-cell">Company</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden sm:table-cell">Stage</th>
                    <th className="text-right text-xs font-medium text-muted px-4 py-3">Value</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden lg:table-cell">Owner</th>
                    <th className="text-left text-xs font-medium text-muted px-4 py-3 hidden lg:table-cell">Last Contact</th>
                    <th className="w-10 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((c) => {
                    const stageInfo = stages.find((s) => s.label === c.stage);
                    const isSelected = selectedIds.has(c.id);
                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-surface/50 transition-colors cursor-pointer ${isSelected ? "bg-accent/5" : ""}`}
                      >
                        <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => toggleSelect(c.id)}
                            className="p-1 text-muted hover:text-foreground transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-accent" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3" onClick={() => onSelectContact(c.id)}>
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full ${c.avatarColor} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}
                            >
                              {c.avatar}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                              <div className="text-xs text-muted truncate md:hidden">{c.company}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell" onClick={() => onSelectContact(c.id)}>
                          <span className="text-sm text-foreground">{c.company}</span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell" onClick={() => onSelectContact(c.id)}>
                          {stageInfo && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${stageInfo.bgColor} ${stageInfo.color}`}>
                              {c.stage}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right" onClick={() => onSelectContact(c.id)}>
                          <span className="text-sm font-semibold text-foreground tabular-nums">
                            {formatCurrency(c.value)}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell" onClick={() => onSelectContact(c.id)}>
                          {c.owner === "Unassigned" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              Unassigned
                            </span>
                          ) : (
                            <span className="text-sm text-muted">{c.owner}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell" onClick={() => onSelectContact(c.id)}>
                          <span className="text-xs text-muted">{c.lastContact}</span>
                        </td>
                        <td className="px-2" onClick={() => onSelectContact(c.id)}>
                          <ChevronRight className="w-4 h-4 text-muted" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-sm text-muted">
                No contacts match your search.
              </div>
            )}
          </div>
          )}
        </>
      )}
      {/* Bulk Email Modal */}
      {showBulkEmail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => { if (!bulkEmailSending) { setShowBulkEmail(false); setBulkEmailSubject(""); setBulkEmailBody(""); } }}
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
            {bulkEmailResult ? (
              <div className="p-8 text-center">
                <div className={`w-12 h-12 rounded-full ${bulkEmailResult.failed === 0 ? "bg-emerald-100" : "bg-amber-100"} flex items-center justify-center mx-auto mb-3`}>
                  <Mail className={`w-6 h-6 ${bulkEmailResult.failed === 0 ? "text-emerald-600" : "text-amber-600"}`} />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  {bulkEmailResult.failed === 0 ? "All Emails Sent!" : "Partially Sent"}
                </h4>
                <p className="text-xs text-muted">
                  {bulkEmailResult.sent} sent{bulkEmailResult.failed > 0 ? `, ${bulkEmailResult.failed} failed` : ""}
                </p>
                <button
                  onClick={() => { setShowBulkEmail(false); setBulkEmailSubject(""); setBulkEmailBody(""); setBulkEmailResult(null); clearSelection(); }}
                  className="mt-4 px-4 py-2 text-xs font-medium text-accent hover:text-accent-dark"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Bulk Email</h3>
                  <p className="text-xs text-muted mt-0.5">
                    Send to {contacts.filter((c) => selectedIds.has(c.id) && c.email).length} contact{contacts.filter((c) => selectedIds.has(c.id) && c.email).length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Google limits sending to <strong>250 emails/day</strong> (Gmail) or <strong>2,000/day</strong> (Google Workspace). Microsoft Outlook allows <strong>300/day</strong>. Emails are sent individually, not as a mass blast.
                    </p>
                  </div>
                  {/* Template selector */}
                  {emailTemplates.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-muted block mb-1">Template</label>
                      <select
                        onChange={(e) => {
                          const tmpl = emailTemplates.find((t) => t.id === e.target.value);
                          if (tmpl) {
                            setBulkEmailSubject(tmpl.subject);
                            setBulkEmailBody(tmpl.body);
                          }
                          e.target.value = "";
                        }}
                        className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent text-foreground cursor-pointer"
                        defaultValue=""
                      >
                        <option value="" disabled>Choose a template to pre-fill...</option>
                        {emailTemplates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} — {t.category}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-muted mt-1">Variables like {"{{firstName}}"} and {"{{company}}"} will be filled per contact.</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-muted block mb-1">Subject</label>
                    <input
                      type="text"
                      value={bulkEmailSubject}
                      onChange={(e) => setBulkEmailSubject(e.target.value)}
                      placeholder="Enter email subject..."
                      className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent placeholder:text-muted"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted block mb-1">Body</label>
                    <textarea
                      value={bulkEmailBody}
                      onChange={(e) => setBulkEmailBody(e.target.value)}
                      rows={6}
                      placeholder="Enter email body..."
                      className="w-full text-sm bg-white border border-border rounded-lg px-3 py-3 outline-none focus:ring-1 focus:ring-accent resize-none placeholder:text-muted"
                    />
                    <p className="text-[10px] text-muted mt-1">Each email is sent individually — recipients cannot see other recipients.</p>
                  </div>
                  {bulkEmailError && (
                    <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">{bulkEmailError}</div>
                  )}
                </div>
                <div className="px-6 py-4 border-t border-border flex gap-3">
                  <button
                    onClick={() => { setShowBulkEmail(false); setBulkEmailSubject(""); setBulkEmailBody(""); }}
                    disabled={bulkEmailSending}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-white border border-border hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  {isLive ? (
                    <button
                      onClick={async () => {
                        if (!bulkEmailSubject.trim() || !bulkEmailBody.trim()) {
                          setBulkEmailError("Subject and body are required.");
                          return;
                        }
                        setBulkEmailSending(true);
                        setBulkEmailError("");
                        const recipients = contacts.filter((c) => selectedIds.has(c.id) && c.email);
                        let sent = 0;
                        let failed = 0;

                        for (const c of recipients) {
                          const firstName = c.name.split(" ")[0] || c.name;
                          const filledSubject = bulkEmailSubject
                            .replace(/\{\{firstName\}\}/g, firstName)
                            .replace(/\{\{company\}\}/g, c.company || "")
                            .replace(/\{\{senderName\}\}/g, "");
                          const filledBody = bulkEmailBody
                            .replace(/\{\{firstName\}\}/g, firstName)
                            .replace(/\{\{company\}\}/g, c.company || "")
                            .replace(/\{\{senderName\}\}/g, "")
                            .replace(/\n/g, "<br>");
                          try {
                            const res = await fetch("/api/email/send", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ to: c.email, subject: filledSubject, body: filledBody }),
                            });
                            if (res.ok) {
                              sent++;
                              onAddTouchpoint?.({
                                id: crypto.randomUUID(),
                                contactId: c.id,
                                type: "email",
                                title: `Email: ${filledSubject}`,
                                description: bulkEmailBody.slice(0, 200),
                                date: new Date().toISOString().slice(0, 10),
                                owner: "You",
                              });
                            } else {
                              failed++;
                            }
                          } catch {
                            failed++;
                          }
                        }
                        setBulkEmailResult({ sent, failed });
                        setBulkEmailSending(false);
                        if (isLive) trackEvent("contact.bulk_action", { action: "email" });
                      }}
                      disabled={bulkEmailSending || !bulkEmailSubject.trim() || !bulkEmailBody.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50"
                    >
                      {bulkEmailSending ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                      ) : (
                        <><Mail className="w-3.5 h-3.5" /> Send Emails</>
                      )}
                    </button>
                  ) : (
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <span className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-gray-300 rounded-lg cursor-not-allowed">
                        <Mail className="w-3.5 h-3.5" /> Send Emails
                      </span>
                      <a href="/signup" className="text-[10px] text-muted hover:text-accent">
                        Sign up to send emails directly from WorkChores
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
