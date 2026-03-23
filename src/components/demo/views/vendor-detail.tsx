"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Building2, Phone, Mail, Globe, Star, Plus, X, Edit2, Trash2, Save, Calendar, DollarSign, FileText, RefreshCw, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import type { Vendor, VendorContact, VendorNote } from "../data";
import { formatCurrency } from "../data";
import AttachmentsPanel from "../attachments";
import type { Attachment } from "../attachments";

const statusConfig = {
  active: { label: "Active", color: "text-emerald-700", bg: "bg-emerald-100" },
  inactive: { label: "Inactive", color: "text-gray-500", bg: "bg-gray-100" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-100" },
};

const contractTerms = ["Annual", "Monthly", "Multi-Year", "None"];
const payFrequencies = ["Monthly", "Quarterly", "Annual", "One-Time"];
const taxClassifications = ["1099-NEC", "1099-MISC", "W-8BEN", "W-9", "None"];

type Tab = "overview" | "contacts" | "notes" | "files";

function getContractStatus(contractEnd?: string): { label: string; color: string; bg: string; icon: typeof CheckCircle } | null {
  if (!contractEnd) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(contractEnd + "T00:00:00");
  if (isNaN(end.getTime())) return null;
  const diffMs = end.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Expired", color: "text-red-700", bg: "bg-red-100", icon: AlertTriangle };
  if (diffDays <= 30) return { label: `Expires in ${diffDays}d`, color: "text-amber-700", bg: "bg-amber-100", icon: Clock };
  return { label: "Active", color: "text-emerald-700", bg: "bg-emerald-100", icon: CheckCircle };
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface VendorDetailProps {
  vendor: Vendor;
  contacts: VendorContact[];
  notes: VendorNote[];
  onBack: () => void;
  onUpdateVendor: (vendor: Vendor) => void;
  onAddContact: (contact: VendorContact) => void;
  onDeleteContact: (id: string) => void;
  onAddNote: (note: VendorNote) => void;
  onDeleteNote: (id: string) => void;
  ownerLabels: string[];
  isLive?: boolean;
  workspaceId?: string;
}

export default function VendorDetail({
  vendor,
  contacts,
  notes,
  onBack,
  onUpdateVendor,
  onAddContact,
  onDeleteContact,
  onAddNote,
  onDeleteNote,
  ownerLabels,
  isLive = false,
  workspaceId,
}: VendorDetailProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [editVendor, setEditVendor] = useState(vendor);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [vendorAttachments, setVendorAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    if (!isLive) return;
    async function loadAttachments() {
      try {
        const res = await fetch(`/api/attachments?vendorId=${vendor.id}`);
        const data = await res.json();
        if (data.attachments) setVendorAttachments(data.attachments);
      } catch { /* silent */ }
    }
    loadAttachments();
  }, [vendor.id, isLive]);

  const status = statusConfig[vendor.status];
  const contractStatus = getContractStatus(vendor.contractEnd);
  const sortedNotes = [...notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function handleSaveEdit() {
    onUpdateVendor(editVendor);
    setEditing(false);
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "contacts", label: "Contacts", count: contacts.length },
    { id: "notes", label: "Notes", count: notes.length },
    { id: "files", label: "Files", count: vendorAttachments.length },
  ];

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to vendors
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent-light text-accent flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{vendor.name}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
                {contractStatus && (
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${contractStatus.bg} ${contractStatus.color} inline-flex items-center gap-1`}>
                    <contractStatus.icon className="w-2.5 h-2.5" />
                    {contractStatus.label}
                  </span>
                )}
                <span className="text-xs text-muted">{vendor.category}</span>
              </div>
            </div>
          </div>
          {!editing && tab === "overview" && (
            <button
              onClick={() => { setEditing(true); setEditVendor(vendor); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground border border-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-gray-100 text-muted">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        editing ? (
          <EditOverview vendor={editVendor} onChange={setEditVendor} onSave={handleSaveEdit} onCancel={() => setEditing(false)} />
        ) : (
          <div className="space-y-8">
            {/* Info */}
            <Section title="Info">
              <InfoGrid>
                {vendor.email && <InfoItem icon={Mail} label="Email" value={vendor.email} />}
                {vendor.phone && <InfoItem icon={Phone} label="Phone" value={vendor.phone} />}
                {vendor.website && <InfoItem icon={Globe} label="Website" value={vendor.website} isLink />}
                <InfoItem label="Owner" value={vendor.owner} />
                <InfoItem label="Added" value={vendor.created} />
              </InfoGrid>
              {vendor.notes && (
                <div className="mt-4 p-4 rounded-xl bg-surface border border-border">
                  <p className="text-sm text-muted leading-relaxed">{vendor.notes}</p>
                </div>
              )}
            </Section>

            {/* Contract */}
            <Section title="Contract" icon={Calendar}>
              <InfoGrid>
                <InfoItem label="Term" value={vendor.contractTerm || "—"} />
                <InfoItem label="Start Date" value={formatDate(vendor.contractStart)} />
                <InfoItem label="End Date" value={formatDate(vendor.contractEnd)} />
                <InfoItem label="Auto-Renew" value={vendor.autoRenew ? "Yes" : "No"} />
              </InfoGrid>
            </Section>

            {/* Cost */}
            <Section title="Cost" icon={DollarSign}>
              <InfoGrid>
                <InfoItem label="Frequency" value={vendor.payFrequency || "—"} />
                <InfoItem label="Amount" value={vendor.payAmount ? formatCurrency(vendor.payAmount) : "—"} />
                <InfoItem label="Annual Total" value={vendor.annualAmount ? formatCurrency(vendor.annualAmount) : "—"} highlight />
              </InfoGrid>
            </Section>

            {/* Tax */}
            <Section title="Tax Classification" icon={FileText}>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border">
                <FileText className="w-4 h-4 text-muted" />
                <span className="text-sm font-medium text-foreground">{vendor.taxClassification || "Not set"}</span>
              </div>
            </Section>
          </div>
        )
      )}

      {/* Contacts Tab */}
      {tab === "contacts" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted">{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</p>
            <button onClick={() => setShowAddContact(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent hover:text-accent-dark transition-colors">
              <Plus className="w-3 h-3" />
              Add Contact
            </button>
          </div>
          <div className="space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-light text-accent flex items-center justify-center text-xs font-semibold">
                    {c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      {c.isPrimary && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span>{c.role}</span>
                      {c.email && <span>{c.email}</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => onDeleteContact(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {showAddContact && <AddContactModal vendorId={vendor.id} onClose={() => setShowAddContact(false)} onAdd={onAddContact} />}
        </div>
      )}

      {/* Notes Tab */}
      {tab === "notes" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted">{notes.length} note{notes.length !== 1 ? "s" : ""}</p>
            <button onClick={() => setShowAddNote(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent hover:text-accent-dark transition-colors">
              <Plus className="w-3 h-3" />
              Add Note
            </button>
          </div>
          <div className="space-y-3">
            {sortedNotes.map((n) => (
              <div key={n.id} className="p-4 rounded-xl border border-border bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{n.title}</h4>
                    <p className="text-sm text-muted mt-1 leading-relaxed">{n.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                      <span>{n.date}</span>
                      <span>{n.owner}</span>
                    </div>
                  </div>
                  <button onClick={() => onDeleteNote(n.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {showAddNote && <AddNoteModal vendorId={vendor.id} onClose={() => setShowAddNote(false)} onAdd={onAddNote} ownerLabels={ownerLabels} />}
        </div>
      )}

      {/* Files Tab */}
      {tab === "files" && (
        <AttachmentsPanel
          attachments={vendorAttachments}
          isLive={isLive}
          workspaceId={workspaceId}
          vendorId={vendor.id}
          uploaderName={ownerLabels[0] || "You"}
          onAttachmentAdded={(att) => setVendorAttachments((prev) => [att, ...prev])}
          onAttachmentRemoved={(id) => setVendorAttachments((prev) => prev.filter((a) => a.id !== id))}
        />
      )}
    </div>
  );
}

// ── Helper components ──

function Section({ title, icon: Icon, children }: { title: string; icon?: typeof Calendar; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-muted" />}
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{children}</div>;
}

function InfoItem({ icon: Icon, label, value, isLink, highlight }: { icon?: typeof Mail; label: string; value: string; isLink?: boolean; highlight?: boolean }) {
  return (
    <div className="text-sm">
      <div className="text-xs text-muted mb-0.5">{label}</div>
      <div className={`font-medium flex items-center gap-1.5 ${highlight ? "text-accent text-lg" : "text-foreground"}`}>
        {Icon && <Icon className="w-3.5 h-3.5 text-muted shrink-0" />}
        {isLink ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{value}</a> : value}
      </div>
    </div>
  );
}

function EditOverview({ vendor, onChange, onSave, onCancel }: { vendor: Vendor; onChange: (v: Vendor) => void; onSave: () => void; onCancel: () => void }) {
  const u = (field: string, value: string | number | boolean | undefined) => onChange({ ...vendor, [field]: value });

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Info */}
      <Section title="Info">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={vendor.name} onChange={(v) => u("name", v)} />
            <Field label="Category" value={vendor.category} onChange={(v) => u("category", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Status" value={vendor.status} options={["active", "inactive", "pending"]} onChange={(v) => u("status", v)} />
            <Field label="Email" value={vendor.email || ""} onChange={(v) => u("email", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone" value={vendor.phone || ""} onChange={(v) => u("phone", v)} />
            <Field label="Website" value={vendor.website || ""} onChange={(v) => u("website", v)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Notes</label>
            <textarea rows={2} value={vendor.notes || ""} onChange={(e) => u("notes", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none" />
          </div>
        </div>
      </Section>

      {/* Contract */}
      <Section title="Contract" icon={Calendar}>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Term" value={vendor.contractTerm || ""} options={contractTerms} onChange={(v) => u("contractTerm", v)} />
          <Field label="Start Date" value={vendor.contractStart || ""} onChange={(v) => u("contractStart", v)} type="date" />
          <Field label="End Date" value={vendor.contractEnd || ""} onChange={(v) => u("contractEnd", v)} type="date" />
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Auto-Renew</label>
            <label className="flex items-center gap-2 mt-2 text-sm text-foreground">
              <input type="checkbox" checked={vendor.autoRenew || false} onChange={(e) => u("autoRenew", e.target.checked)} className="rounded" />
              <RefreshCw className="w-3.5 h-3.5 text-muted" />
              Auto-renew
            </label>
          </div>
        </div>
      </Section>

      {/* Cost */}
      <Section title="Cost" icon={DollarSign}>
        <div className="grid grid-cols-3 gap-3">
          <SelectField label="Frequency" value={vendor.payFrequency || ""} options={payFrequencies} onChange={(v) => u("payFrequency", v)} />
          <Field label="Amount" value={vendor.payAmount?.toString() || ""} onChange={(v) => u("payAmount", v ? Number(v) : undefined)} type="number" />
          <Field label="Annual Total" value={vendor.annualAmount?.toString() || ""} onChange={(v) => u("annualAmount", v ? Number(v) : undefined)} type="number" />
        </div>
      </Section>

      {/* Tax */}
      <Section title="Tax Classification" icon={FileText}>
        <SelectField label="Classification" value={vendor.taxClassification || "None"} options={taxClassifications} onChange={(v) => u("taxClassification", v)} />
      </Section>

      <div className="flex gap-2 pt-2">
        <button onClick={onSave} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors">
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
        <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ── Modals ──

function AddContactModal({ vendorId, onClose, onAdd }: { vendorId: string; onClose: () => void; onAdd: (c: VendorContact) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ id: `vc_${Date.now()}`, vendorId, name: name.trim(), email: email || undefined, phone: phone || undefined, role: role || "Contact", isPrimary });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Add Contact</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <Field label="Name *" value={name} onChange={setName} />
          <Field label="Role" value={role} onChange={setRole} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" value={email} onChange={setEmail} />
            <Field label="Phone" value={phone} onChange={setPhone} />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="rounded" />
            Primary contact
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-foreground">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddNoteModal({ vendorId, onClose, onAdd, ownerLabels }: { vendorId: string; onClose: () => void; onAdd: (n: VendorNote) => void; ownerLabels: string[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ id: `vn_${Date.now()}`, vendorId, title: title.trim(), description: description.trim(), date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), owner: ownerLabels[0] || "You" });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Add Note</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <Field label="Title *" value={title} onChange={setTitle} />
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted hover:text-foreground">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg">Add Note</button>
          </div>
        </form>
      </div>
    </div>
  );
}
