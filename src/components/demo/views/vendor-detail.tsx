"use client";

import { useState } from "react";
import { ArrowLeft, Building2, Phone, Mail, Globe, Star, Plus, X, Edit2, Trash2, Save } from "lucide-react";
import type { Vendor, VendorContact, VendorNote } from "../data";

const statusConfig = {
  active: { label: "Active", color: "text-emerald-700", bg: "bg-emerald-100" },
  inactive: { label: "Inactive", color: "text-gray-500", bg: "bg-gray-100" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-100" },
};

type Tab = "info" | "contacts" | "notes";

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
}: VendorDetailProps) {
  const [tab, setTab] = useState<Tab>("info");
  const [editing, setEditing] = useState(false);
  const [editVendor, setEditVendor] = useState(vendor);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);

  const status = statusConfig[vendor.status];
  const sortedNotes = [...notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function handleSaveEdit() {
    onUpdateVendor(editVendor);
    setEditing(false);
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "info", label: "Info" },
    { id: "contacts", label: "Contacts", count: contacts.length },
    { id: "notes", label: "Notes", count: notes.length },
  ];

  return (
    <div>
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
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
                <span className="text-xs text-muted">{vendor.category}</span>
                <span className="text-xs text-muted">Owner: {vendor.owner}</span>
              </div>
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => { setEditing(true); setEditVendor(vendor); setTab("info"); }}
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
              tab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-gray-100 text-muted">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab === "info" && (
        editing ? (
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Name</label>
              <input value={editVendor.name} onChange={(e) => setEditVendor({ ...editVendor, name: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Category</label>
                <input value={editVendor.category} onChange={(e) => setEditVendor({ ...editVendor, category: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Status</label>
                <select value={editVendor.status} onChange={(e) => setEditVendor({ ...editVendor, status: e.target.value as Vendor["status"] })} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Email</label>
              <input value={editVendor.email || ""} onChange={(e) => setEditVendor({ ...editVendor, email: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Phone</label>
                <input value={editVendor.phone || ""} onChange={(e) => setEditVendor({ ...editVendor, phone: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Website</label>
                <input value={editVendor.website || ""} onChange={(e) => setEditVendor({ ...editVendor, website: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Notes</label>
              <textarea rows={3} value={editVendor.notes || ""} onChange={(e) => setEditVendor({ ...editVendor, notes: e.target.value })} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveEdit} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors">
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-lg">
            {vendor.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted shrink-0" />
                <span className="text-foreground">{vendor.email}</span>
              </div>
            )}
            {vendor.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted shrink-0" />
                <span className="text-foreground">{vendor.phone}</span>
              </div>
            )}
            {vendor.website && (
              <div className="flex items-center gap-3 text-sm">
                <Globe className="w-4 h-4 text-muted shrink-0" />
                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{vendor.website}</a>
              </div>
            )}
            {vendor.notes && (
              <div className="mt-4 p-4 rounded-xl bg-surface border border-border">
                <p className="text-sm text-muted leading-relaxed">{vendor.notes}</p>
              </div>
            )}
            <p className="text-xs text-muted mt-4">Added {vendor.created}</p>
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
          {showAddContact && (
            <AddContactModal
              vendorId={vendor.id}
              onClose={() => setShowAddContact(false)}
              onAdd={onAddContact}
            />
          )}
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
          {showAddNote && (
            <AddNoteModal
              vendorId={vendor.id}
              onClose={() => setShowAddNote(false)}
              onAdd={onAddNote}
              ownerLabels={ownerLabels}
            />
          )}
        </div>
      )}
    </div>
  );
}

function AddContactModal({ vendorId, onClose, onAdd }: { vendorId: string; onClose: () => void; onAdd: (c: VendorContact) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      id: `vc_${Date.now()}`,
      vendorId,
      name: name.trim(),
      email: email || undefined,
      phone: phone || undefined,
      role: role || "Contact",
      isPrimary,
    });
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
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Name *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="Jane Smith" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Role</label>
            <input value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="Account Manager" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" />
            </div>
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
    onAdd({
      id: `vn_${Date.now()}`,
      vendorId,
      title: title.trim(),
      description: description.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      owner: ownerLabels[0] || "You",
    });
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
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Title *</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="Meeting summary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Description</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none" placeholder="What happened?" />
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
