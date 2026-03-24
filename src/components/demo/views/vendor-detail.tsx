"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Building2, Phone, Mail, Globe, Star, Plus, X, Edit2, Trash2, Save, DollarSign, FileText, RefreshCw, AlertTriangle, Clock, CheckCircle, FileCheck, Send, Calendar, Notebook, MessageSquare, ChevronDown, PhoneCall, Bell, FileInput } from "lucide-react";
import type { Vendor, VendorContact, VendorNote, VendorContract, VendorTax } from "../data";
import { formatCurrency } from "../data";
import AttachmentsPanel from "../attachments";
import type { Attachment } from "../attachments";

const statusConfig = {
  active: { label: "Active", color: "text-emerald-700", bg: "bg-emerald-100" },
  inactive: { label: "Inactive", color: "text-gray-500", bg: "bg-gray-100" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-100" },
};
const contractTypeLabels = { original: "Original", amendment: "Amendment", renewal: "Renewal", cancellation: "Cancellation" };
const contractTypeColors = { original: "bg-blue-100 text-blue-700", amendment: "bg-violet-100 text-violet-700", renewal: "bg-emerald-100 text-emerald-700", cancellation: "bg-red-100 text-red-700" };
const w9StatusLabels = { "on-file": "On File", requested: "Requested", na: "N/A" };
const w9StatusColors = { "on-file": "bg-emerald-100 text-emerald-700", requested: "bg-amber-100 text-amber-700", na: "bg-gray-100 text-gray-500" };
const contractTypes = ["original", "amendment", "renewal", "cancellation"] as const;
const payFrequencies = ["Monthly", "Quarterly", "Annual", "One-Time"];
const docTypes = ["W-9", "Certificate of Insurance (COI)", "Business License", "Contract", "Other"];

function getContractStatus(endDate?: string): { label: string; color: string; bg: string; icon: typeof CheckCircle } | null {
  if (!endDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(endDate + "T00:00:00");
  if (isNaN(end.getTime())) return null;
  const diff = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: "Expired", color: "text-red-700", bg: "bg-red-100", icon: AlertTriangle };
  if (diff <= 30) return { label: `Expires in ${diff}d`, color: "text-amber-700", bg: "bg-amber-100", icon: Clock };
  return { label: "Active", color: "text-emerald-700", bg: "bg-emerald-100", icon: CheckCircle };
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface VendorAlert { id: string; message: string; severity: "red" | "amber" | "blue" }

function generateAlerts(vendor: Vendor, contracts: VendorContract[], taxRecord?: VendorTax): VendorAlert[] {
  const alerts: VendorAlert[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  contracts.forEach((c) => {
    if (!c.endDate || c.status === "expired") return;
    const diff = Math.round((new Date(c.endDate + "T00:00:00").getTime() - today.getTime()) / 86400000);
    if (diff < 0) alerts.push({ id: `exp-${c.id}`, message: `Contract "${c.title}" expired ${formatDate(c.endDate)}`, severity: "red" });
    else if (diff <= 90) alerts.push({ id: `expiring-${c.id}`, message: `Contract "${c.title}" expires ${formatDate(c.endDate)}`, severity: "amber" });
  });
  if (taxRecord?.w9Status === "requested") alerts.push({ id: "w9", message: "W-9 requested — not yet received", severity: "amber" });
  if (taxRecord?.needs1099) {
    const py = new Date().getFullYear() - 1;
    const yr = taxRecord.yearRecords.find((r) => r.year === py);
    if (!yr || yr.status === "not-sent") alerts.push({ id: "1099", message: `1099 not sent for ${py}`, severity: "red" });
  }
  if (vendor.status === "pending") alerts.push({ id: "pending", message: "Vendor onboarding incomplete", severity: "blue" });
  return alerts;
}

interface VendorDetailProps {
  vendor: Vendor; contacts: VendorContact[]; notes: VendorNote[]; contracts: VendorContract[]; taxRecord?: VendorTax;
  onBack: () => void; onUpdateVendor: (v: Vendor) => void;
  onAddContact: (c: VendorContact) => void; onDeleteContact: (id: string) => void;
  onAddNote: (n: VendorNote) => void; onDeleteNote: (id: string) => void;
  onAddContract: (c: VendorContract) => void; onDeleteContract: (id: string) => void;
  onUpdateTax: (t: VendorTax) => void; ownerLabels: string[]; isLive?: boolean; workspaceId?: string;
}

export default function VendorDetail({
  vendor, contacts, notes, contracts, taxRecord, onBack, onUpdateVendor,
  onAddContact, onDeleteContact, onAddNote, onDeleteNote,
  onAddContract, onDeleteContract, onUpdateTax,
  ownerLabels, isLive = false, workspaceId,
}: VendorDetailProps) {
  const [editing, setEditing] = useState(false);
  const [editVendor, setEditVendor] = useState(vendor);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddContract, setShowAddContract] = useState(false);
  const [showRequestDocs, setShowRequestDocs] = useState(false);
  const [vendorAttachments, setVendorAttachments] = useState<Attachment[]>([]);
  const [openMenu, setOpenMenu] = useState<"schedule" | "track" | "send" | null>(null);

  const isRealId = isLive && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(vendor.id);
  useEffect(() => {
    if (!isRealId) return;
    fetch(`/api/attachments?vendorId=${vendor.id}`).then((r) => r.json()).then((d) => { if (d.attachments) setVendorAttachments(d.attachments); }).catch(() => {});
  }, [vendor.id, isRealId]);

  const status = statusConfig[vendor.status];
  const primaryContract = contracts.find((c) => c.type === "original" && c.status === "active");
  const contractExpiry = getContractStatus(primaryContract?.endDate || vendor.contractEnd);
  const alerts = generateAlerts(vendor, contracts, taxRecord);
  const sortedContracts = [...contracts].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  const sortedNotes = [...notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const taxRec: VendorTax = taxRecord || { id: `vt_${vendor.id}`, vendorId: vendor.id, w9Status: "na", needs1099: false, yearRecords: [] };

  return (
    <div className="p-4 lg:p-6 max-w-7xl">
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to vendors
      </button>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent-light text-accent flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{vendor.name}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${status.bg} ${status.color}`}>{status.label}</span>
              {contractExpiry && (
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${contractExpiry.bg} ${contractExpiry.color} inline-flex items-center gap-1`}>
                  <contractExpiry.icon className="w-2.5 h-2.5" /> {contractExpiry.label}
                </span>
              )}
              <span className="text-xs text-muted">{vendor.category} · Owner: {vendor.owner}</span>
            </div>
          </div>
        </div>
        {!editing && (
          <button onClick={() => { setEditing(true); setEditVendor(vendor); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground border border-border rounded-lg hover:bg-gray-50 transition-colors shrink-0">
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 mb-6">
        {([
          { key: "schedule" as const, icon: Calendar, label: "Schedule", items: [
            { icon: Calendar, label: "Meeting", onClick: () => { setOpenMenu(null); setShowAddNote(true); } },
            { icon: PhoneCall, label: "Call", onClick: () => { setOpenMenu(null); setShowAddNote(true); } },
            { icon: Bell, label: "Reminder", onClick: () => { setOpenMenu(null); setShowAddNote(true); } },
          ]},
          { key: "track" as const, icon: Notebook, label: "Track", items: [
            { icon: PhoneCall, label: "Log Call", onClick: () => { setOpenMenu(null); setShowAddNote(true); } },
            { icon: Notebook, label: "Add Note", onClick: () => { setOpenMenu(null); setShowAddNote(true); } },
          ]},
          { key: "send" as const, icon: Send, label: "Send", items: [
            { icon: Mail, label: "Email", onClick: () => { setOpenMenu(null); if (vendor.email) window.open(`mailto:${vendor.email}`); } },
            { icon: FileInput, label: "Request Docs", onClick: () => { setOpenMenu(null); setShowRequestDocs(true); } },
            { icon: DollarSign, label: "Pricing", onClick: () => { setOpenMenu(null); if (vendor.email) window.open(`mailto:${vendor.email}?subject=Pricing%20Request`); } },
          ]},
        ]).map((menu) => (
          <div key={menu.key} className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === menu.key ? null : menu.key)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground border border-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <menu.icon className="w-3.5 h-3.5 text-accent" /> {menu.label} <ChevronDown className="w-3 h-3 text-muted" />
            </button>
            {openMenu === menu.key && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
                <div className="absolute left-0 top-full mt-1 z-40 w-44 bg-white rounded-lg border border-border shadow-lg py-1">
                  {menu.items.map((item) => (
                    <button key={item.label} onClick={item.onClick} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-gray-50 transition-colors">
                      <item.icon className="w-3.5 h-3.5 text-muted" /> {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-8 space-y-2">
          {alerts.map((a) => (
            <div key={a.id} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border-l-4 text-sm ${
              a.severity === "red" ? "bg-red-50 border-red-400 text-red-800" :
              a.severity === "amber" ? "bg-amber-50 border-amber-400 text-amber-800" :
              "bg-blue-50 border-blue-400 text-blue-800"
            }`}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {a.message}
            </div>
          ))}
        </div>
      )}

      {editing ? (
        <EditForm vendor={editVendor} onChange={setEditVendor} onSave={() => { onUpdateVendor(editVendor); setEditing(false); }} onCancel={() => setEditing(false)} />
      ) : (
        <div className="space-y-5">
          {/* Top row: Details + Contacts side by side */}
          <div className="grid md:grid-cols-2 gap-4 lg:gap-5">
            {/* ── DETAILS ── */}
            <div className="rounded-xl border border-border bg-white p-4 lg:p-5">
              <SectionHeader title="Details" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vendor.email && <InfoItem icon={Mail} label="Email" value={vendor.email} />}
                {vendor.phone && <InfoItem icon={Phone} label="Phone" value={vendor.phone} />}
                {vendor.website && <InfoItem icon={Globe} label="Website" value={vendor.website} isLink />}
                <InfoItem label="Added" value={vendor.created} />
              </div>
              {vendor.notes && <p className="mt-4 text-sm text-muted leading-relaxed p-3 rounded-lg bg-surface">{vendor.notes}</p>}
            </div>

            {/* ── CONTACTS ── */}
            <div className="rounded-xl border border-border bg-white p-4 lg:p-5">
              <SectionHeader title="Contacts" action={<button onClick={() => setShowAddContact(true)} className="text-xs font-medium text-accent hover:text-accent-dark"><Plus className="w-3 h-3 inline mr-1" />Add</button>} />
              {contacts.length === 0 ? (
                <p className="text-sm text-muted">No contacts yet.</p>
              ) : (
                <div className="space-y-1">
                  {contacts.map((c) => (
                    <div key={c.id} className="group flex items-center justify-between py-2 px-2 rounded-lg hover:bg-surface transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-accent-light text-accent flex items-center justify-center text-[10px] font-semibold">{c.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</div>
                        <div>
                          <span className="text-sm font-medium text-foreground">{c.name}</span>
                          {c.isPrimary && <Star className="w-3 h-3 text-amber-500 fill-amber-500 inline ml-1" />}
                          <span className="text-xs text-muted ml-2">{c.role}</span>
                        </div>
                      </div>
                      <button onClick={() => onDeleteContact(c.id)} className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Middle row: Contract & Cost + Compliance side by side */}
          <div className="grid md:grid-cols-2 gap-4 lg:gap-5">
            {/* ── CONTRACT & COST ── */}
            <div className="rounded-xl border border-border bg-white p-4 lg:p-5">
              <SectionHeader title="Contract & Cost" action={<button onClick={() => setShowAddContract(true)} className="text-xs font-medium text-accent hover:text-accent-dark"><Plus className="w-3 h-3 inline mr-1" />Add Contract</button>} />
              <div className="flex items-center gap-6 mb-4 text-sm flex-wrap">
                {vendor.payFrequency && <span className="text-muted">{vendor.payFrequency}</span>}
                {vendor.payAmount && <span className="font-medium text-foreground">{formatCurrency(vendor.payAmount)}/period</span>}
                {vendor.annualAmount && <span className="font-bold text-accent text-lg">{formatCurrency(vendor.annualAmount)}<span className="text-xs font-normal text-muted">/yr</span></span>}
                {vendor.autoRenew && <span className="inline-flex items-center gap-1 text-xs text-muted"><RefreshCw className="w-3 h-3" /> Auto-renew</span>}
              </div>
              {sortedContracts.length > 0 && (
                <div className="space-y-2">
                  {sortedContracts.map((c) => {
                    const cs = getContractStatus(c.endDate);
                    return (
                      <div key={c.id} className="flex items-start justify-between p-3 rounded-lg bg-surface">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">{c.title}</span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${contractTypeColors[c.type]}`}>{contractTypeLabels[c.type]}</span>
                            {c.status === "expired" && <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700">Expired</span>}
                            {c.status === "pending" && <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700">Pending</span>}
                            {c.status === "active" && cs && <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${cs.bg} ${cs.color}`}>{cs.label}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                            {c.startDate && <span>{formatDate(c.startDate)}</span>}
                            {c.startDate && c.endDate && <span>–</span>}
                            {c.endDate && <span>{formatDate(c.endDate)}</span>}
                            {c.value !== undefined && <span>{formatCurrency(c.value)}</span>}
                          </div>
                        </div>
                        <button onClick={() => onDeleteContract(c.id)} className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── COMPLIANCE (1 col) ── */}
            <div className="rounded-xl border border-border bg-white p-4 lg:p-5">
              <SectionHeader title="Compliance" />
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] text-muted mb-1">W-9 Status</div>
                  <div className="flex items-center gap-2">
                    <select value={taxRec.w9Status} onChange={(e) => onUpdateTax({ ...taxRec, w9Status: e.target.value as VendorTax["w9Status"] })} className="px-2 py-1.5 text-xs rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20">
                      <option value="on-file">On File</option>
                      <option value="requested">Requested</option>
                      <option value="na">N/A</option>
                    </select>
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${w9StatusColors[taxRec.w9Status]}`}>{w9StatusLabels[taxRec.w9Status]}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted mb-1">1099</div>
                  <label className="flex items-center gap-2 text-xs mb-2">
                    <input type="checkbox" checked={taxRec.needs1099} onChange={(e) => onUpdateTax({ ...taxRec, needs1099: e.target.checked })} className="rounded" />
                    <span className="text-foreground font-medium">Required</span>
                  </label>
                  {taxRec.needs1099 && (
                    <select value={taxRec.type1099 || "1099-NEC"} onChange={(e) => onUpdateTax({ ...taxRec, type1099: e.target.value as VendorTax["type1099"] })} className="px-2 py-1.5 text-xs rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20 w-full">
                      <option value="1099-NEC">1099-NEC</option>
                      <option value="1099-MISC">1099-MISC</option>
                      <option value="1099-INT">1099-INT</option>
                      <option value="1099-DIV">1099-DIV</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row: Files + Notes side by side */}
          <div className="grid md:grid-cols-2 gap-4 lg:gap-5">
            {/* ── FILES ── */}
            <div className="rounded-xl border border-border bg-white p-4 lg:p-5">
              <SectionHeader title="Files" action={
                vendor.email ? (
                  <button onClick={() => setShowRequestDocs(true)} className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-dark">
                    <Send className="w-3 h-3" /> Request from Vendor
                  </button>
                ) : null
              } />
              <AttachmentsPanel
                attachments={vendorAttachments}
                isLive={isLive}
                workspaceId={workspaceId}
                vendorId={vendor.id}
                uploaderName={ownerLabels[0] || "You"}
                onAttachmentAdded={(att) => setVendorAttachments((prev) => [att, ...prev])}
                onAttachmentRemoved={(id) => setVendorAttachments((prev) => prev.filter((a) => a.id !== id))}
              />
            </div>

            {/* ── NOTES ── */}
            <div className="rounded-xl border border-border bg-white p-4 lg:p-5">
              <SectionHeader title="Notes" action={<button onClick={() => setShowAddNote(true)} className="text-xs font-medium text-accent hover:text-accent-dark"><Plus className="w-3 h-3 inline mr-1" />Add</button>} />
              {sortedNotes.length === 0 ? (
                <p className="text-sm text-muted">No notes yet.</p>
              ) : (
                <div className="space-y-2">
                  {sortedNotes.map((n) => (
                    <div key={n.id} className="flex items-start justify-between p-3 rounded-lg bg-surface">
                      <div>
                        <span className="text-sm font-medium text-foreground">{n.title}</span>
                        <p className="text-xs text-muted mt-0.5 leading-relaxed">{n.description}</p>
                        <span className="text-[10px] text-muted mt-1 inline-block">{n.date} · {n.owner}</span>
                      </div>
                      <button onClick={() => onDeleteNote(n.id)} className="p-1 rounded hover:bg-red-50 text-muted hover:text-red-500 shrink-0"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddContact && <AddContactModal vendorId={vendor.id} onClose={() => setShowAddContact(false)} onAdd={onAddContact} />}
      {showAddContract && <AddContractModal vendorId={vendor.id} onClose={() => setShowAddContract(false)} onAdd={onAddContract} />}
      {showAddNote && <AddNoteModal vendorId={vendor.id} onClose={() => setShowAddNote(false)} onAdd={onAddNote} ownerLabels={ownerLabels} />}
      {showRequestDocs && <RequestDocsModal vendor={vendor} workspaceId={workspaceId} isLive={isLive} onClose={() => setShowRequestDocs(false)} />}
    </div>
  );
}

// ── Helpers ──

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">{title}</h2>
      {action}
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, isLink }: { icon?: typeof Mail; label: string; value: string; isLink?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-muted">{label}</div>
      <div className="text-sm font-medium text-foreground flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3 text-muted" />}
        {isLink ? <a href={value} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate">{value.replace(/^https?:\/\//, "")}</a> : value}
      </div>
    </div>
  );
}

function EditForm({ vendor, onChange, onSave, onCancel }: { vendor: Vendor; onChange: (v: Vendor) => void; onSave: () => void; onCancel: () => void }) {
  const u = (f: string, v: string | number | boolean | undefined) => onChange({ ...vendor, [f]: v });
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-3">
        <Inp label="Name" value={vendor.name} onChange={(v) => u("name", v)} />
        <Inp label="Category" value={vendor.category} onChange={(v) => u("category", v)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Sel label="Status" value={vendor.status} options={["active", "inactive", "pending"]} onChange={(v) => u("status", v)} />
        <Inp label="Email" value={vendor.email || ""} onChange={(v) => u("email", v)} />
        <Inp label="Phone" value={vendor.phone || ""} onChange={(v) => u("phone", v)} />
      </div>
      <Inp label="Website" value={vendor.website || ""} onChange={(v) => u("website", v)} />
      <div><label className="block text-xs font-medium text-muted mb-1">Notes</label><textarea rows={2} value={vendor.notes || ""} onChange={(e) => u("notes", e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none" /></div>
      <div className="grid grid-cols-3 gap-3">
        <Sel label="Pay Frequency" value={vendor.payFrequency || ""} options={payFrequencies} onChange={(v) => u("payFrequency", v)} />
        <Inp label="Amount" value={vendor.payAmount?.toString() || ""} onChange={(v) => u("payAmount", v ? Number(v) : undefined)} type="number" />
        <Inp label="Annual Total" value={vendor.annualAmount?.toString() || ""} onChange={(v) => u("annualAmount", v ? Number(v) : undefined)} type="number" />
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onSave} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg"><Save className="w-3.5 h-3.5" /> Save</button>
        <button onClick={onCancel} className="px-4 py-2 text-sm text-muted hover:text-foreground">Cancel</button>
      </div>
    </div>
  );
}

function Inp({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return <div><label className="block text-xs font-medium text-muted mb-1">{label}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" /></div>;
}

function Sel({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return <div><label className="block text-xs font-medium text-muted mb-1">{label}</label><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20">{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>;
}

// ── Modals ──

function AddContractModal({ vendorId, onClose, onAdd }: { vendorId: string; onClose: () => void; onAdd: (c: VendorContract) => void }) {
  const [title, setTitle] = useState(""); const [type, setType] = useState<VendorContract["type"]>("original"); const [cStatus, setCStatus] = useState<VendorContract["status"]>("active");
  const [startDate, setStartDate] = useState(""); const [endDate, setEndDate] = useState(""); const [value, setValue] = useState(""); const [autoRenew, setAutoRenew] = useState(false); const [cNotes, setCNotes] = useState("");
  return (
    <Modal title="Add Contract" onClose={onClose} onSubmit={() => { if (!title.trim()) return; onAdd({ id: (crypto.randomUUID ? crypto.randomUUID() : `vct_${Date.now()}`), vendorId, title: title.trim(), type, status: cStatus, startDate: startDate || undefined, endDate: endDate || undefined, value: value ? Number(value) : undefined, autoRenew, notes: cNotes || undefined, created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }); onClose(); }}>
      <Inp label="Title *" value={title} onChange={setTitle} />
      <div className="grid grid-cols-2 gap-3"><Sel label="Type" value={type} options={[...contractTypes]} onChange={(v) => setType(v as VendorContract["type"])} /><Sel label="Status" value={cStatus} options={["active", "expired", "pending"]} onChange={(v) => setCStatus(v as VendorContract["status"])} /></div>
      <div className="grid grid-cols-2 gap-3"><Inp label="Start Date" value={startDate} onChange={setStartDate} type="date" /><Inp label="End Date" value={endDate} onChange={setEndDate} type="date" /></div>
      <div className="grid grid-cols-2 gap-3"><Inp label="Value ($)" value={value} onChange={setValue} type="number" /><div><label className="block text-xs font-medium text-muted mb-1">Auto-Renew</label><label className="flex items-center gap-2 mt-2 text-sm"><input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} className="rounded" /> Yes</label></div></div>
      <div><label className="block text-xs font-medium text-muted mb-1">Notes</label><textarea rows={2} value={cNotes} onChange={(e) => setCNotes(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none" /></div>
    </Modal>
  );
}

function AddContactModal({ vendorId, onClose, onAdd }: { vendorId: string; onClose: () => void; onAdd: (c: VendorContact) => void }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [role, setRole] = useState(""); const [isPrimary, setIsPrimary] = useState(false);
  return (
    <Modal title="Add Contact" onClose={onClose} onSubmit={() => { if (!name.trim()) return; onAdd({ id: (crypto.randomUUID ? crypto.randomUUID() : `vc_${Date.now()}`), vendorId, name: name.trim(), email: email || undefined, phone: phone || undefined, role: role || "Contact", isPrimary }); onClose(); }}>
      <Inp label="Name *" value={name} onChange={setName} /><Inp label="Role" value={role} onChange={setRole} />
      <div className="grid grid-cols-2 gap-3"><Inp label="Email" value={email} onChange={setEmail} /><Inp label="Phone" value={phone} onChange={setPhone} /></div>
      <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="rounded" /> Primary contact</label>
    </Modal>
  );
}

function AddNoteModal({ vendorId, onClose, onAdd, ownerLabels }: { vendorId: string; onClose: () => void; onAdd: (n: VendorNote) => void; ownerLabels: string[] }) {
  const [title, setTitle] = useState(""); const [description, setDescription] = useState("");
  return (
    <Modal title="Add Note" onClose={onClose} onSubmit={() => { if (!title.trim()) return; onAdd({ id: (crypto.randomUUID ? crypto.randomUUID() : `vn_${Date.now()}`), vendorId, title: title.trim(), description: description.trim(), date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), owner: ownerLabels[0] || "You" }); onClose(); }}>
      <Inp label="Title *" value={title} onChange={setTitle} />
      <div><label className="block text-xs font-medium text-muted mb-1">Description</label><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none" /></div>
    </Modal>
  );
}

function RequestDocsModal({ vendor, workspaceId, isLive, onClose }: { vendor: Vendor; workspaceId?: string; isLive: boolean; onClose: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  async function handleSend() {
    if (!selected.length || !workspaceId) return;
    setSending(true);
    try {
      const res = await fetch("/api/vendor-portal/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vendorId: vendor.id, workspaceId, requestedDocs: selected }) });
      const data = await res.json();
      if (res.ok) { setSent(true); setPortalUrl(data.portalUrl || null); }
    } catch { /* */ }
    setSending(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Request Documents</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">Request Sent!</h3>
              <p className="text-xs text-muted mb-3">{isLive ? `Email sent to ${vendor.email}` : "In live mode, the vendor would receive an email."}</p>
              {portalUrl && <div className="mt-3 p-3 rounded-lg bg-surface border border-border"><p className="text-[10px] text-muted mb-1">Portal link:</p><a href={portalUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline break-all">{portalUrl}</a></div>}
              <button onClick={onClose} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg">Done</button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted mb-4">Select documents to request from <strong>{vendor.name}</strong>.</p>
              <div className="space-y-2 mb-4">
                {docTypes.map((doc) => (
                  <label key={doc} className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-surface cursor-pointer">
                    <input type="checkbox" checked={selected.includes(doc)} onChange={(e) => setSelected(e.target.checked ? [...selected, doc] : selected.filter((d) => d !== doc))} className="rounded" />
                    <span className="text-sm text-foreground">{doc}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted mb-4">Sending to: {vendor.email}</p>
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm text-muted">Cancel</button>
                <button onClick={handleSend} disabled={!selected.length || sending} className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg disabled:opacity-50">{sending ? "Sending..." : `Send (${selected.length})`}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, onSubmit, children }: { title: string; onClose: () => void; onSubmit: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border"><h2 className="text-base font-bold text-foreground">{title}</h2><button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted"><X className="w-4 h-4" /></button></div>
        <div className="p-5 space-y-3">
          {children}
          <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted">Cancel</button><button onClick={onSubmit} className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg">{title.replace("Add ", "Add ")}</button></div>
        </div>
      </div>
    </div>
  );
}
