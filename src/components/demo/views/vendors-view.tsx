"use client";

import { useState } from "react";
import { Search, Plus, X, Building2, Phone, Mail, Globe, ChevronDown, Download } from "lucide-react";
import type { Vendor, VendorContact } from "../data";
import { formatCurrency } from "../data";

const categories = ["All", "Software", "Office Supplies", "Professional Services", "Contractor", "Insurance"];

const statusConfig = {
  active: { label: "Active", color: "text-emerald-700", bg: "bg-emerald-100" },
  inactive: { label: "Inactive", color: "text-gray-500", bg: "bg-gray-100" },
  pending: { label: "Pending", color: "text-amber-700", bg: "bg-amber-100" },
};

interface VendorsViewProps {
  vendors: Vendor[];
  vendorContacts: VendorContact[];
  onSelectVendor: (id: string) => void;
  onAddVendor: (vendor: Vendor) => void;
  onDeleteVendor: (id: string) => void;
  ownerLabels: string[];
}

export default function VendorsView({
  vendors,
  vendorContacts,
  onSelectVendor,
  onAddVendor,
  onDeleteVendor,
  ownerLabels,
}: VendorsViewProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = vendors.filter((v) => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.category.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== "All" && v.category !== categoryFilter) return false;
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    return true;
  });

  const getPrimaryContact = (vendorId: string) =>
    vendorContacts.find((c) => c.vendorId === vendorId && c.isPrimary);

  async function handleExport(allVendors: Vendor[], allContacts: VendorContact[]) {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();

    // Vendors sheet
    const vs = wb.addWorksheet("Vendors");
    vs.columns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Category", key: "category", width: 18 },
      { header: "Status", key: "status", width: 12 },
      { header: "Email", key: "email", width: 25 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Website", key: "website", width: 25 },
      { header: "Owner", key: "owner", width: 12 },
      { header: "Contract Term", key: "contractTerm", width: 14 },
      { header: "Contract Start", key: "contractStart", width: 14 },
      { header: "Contract End", key: "contractEnd", width: 14 },
      { header: "Auto-Renew", key: "autoRenew", width: 12 },
      { header: "Pay Frequency", key: "payFrequency", width: 14 },
      { header: "Pay Amount", key: "payAmount", width: 14 },
      { header: "Annual Amount", key: "annualAmount", width: 14 },
      { header: "Tax Classification", key: "taxClassification", width: 16 },
    ];
    vs.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    vs.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    allVendors.forEach((v) => vs.addRow({
      ...v,
      autoRenew: v.autoRenew ? "Yes" : "No",
      payAmount: v.payAmount || "",
      annualAmount: v.annualAmount || "",
    }));

    // Vendor Contacts sheet
    const vc = wb.addWorksheet("Vendor Contacts");
    vc.columns = [
      { header: "Vendor", key: "vendor", width: 25 },
      { header: "Name", key: "name", width: 20 },
      { header: "Role", key: "role", width: 18 },
      { header: "Email", key: "email", width: 25 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Primary", key: "primary", width: 10 },
    ];
    vc.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    vc.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    allContacts.forEach((c) => {
      const vendorName = allVendors.find((v) => v.id === c.vendorId)?.name || "";
      vc.addRow({ vendor: vendorName, name: c.name, role: c.role, email: c.email || "", phone: c.phone || "", primary: c.isPrimary ? "Yes" : "" });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workchores-vendors.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Vendors</h1>
          <p className="text-sm text-muted mt-0.5">{vendors.length} vendor{vendors.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport(vendors, vendorContacts)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-surface hover:bg-gray-100 border border-border rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Vendor
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Vendor List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted text-sm">
            {vendors.length === 0 ? "No vendors yet. Add your first vendor to get started." : "No vendors match your filters."}
          </div>
        ) : (
          filtered.map((vendor) => {
            const primary = getPrimaryContact(vendor.id);
            const status = statusConfig[vendor.status];
            return (
              <button
                key={vendor.id}
                onClick={() => onSelectVendor(vendor.id)}
                className="w-full text-left p-4 rounded-xl border border-border bg-white hover:border-accent/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent-light text-accent flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{vendor.name}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-gray-100 text-gray-600">
                        {vendor.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted flex-wrap">
                      {primary && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {primary.name}
                        </span>
                      )}
                      {vendor.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {vendor.email}
                        </span>
                      )}
                      {vendor.website && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {vendor.website.replace(/^https?:\/\//, "")}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted shrink-0">{vendor.owner}</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <AddVendorModal
          onClose={() => setShowAddModal(false)}
          onAdd={onAddVendor}
          ownerLabels={ownerLabels}
        />
      )}
    </div>
  );
}

function AddVendorModal({
  onClose,
  onAdd,
  ownerLabels,
}: {
  onClose: () => void;
  onAdd: (vendor: Vendor) => void;
  ownerLabels: string[];
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Software");
  const [status, setStatus] = useState<"active" | "pending">("active");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [owner, setOwner] = useState(ownerLabels[0] || "You");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const vendor: Vendor = {
      id: `v_${Date.now()}`,
      name: name.trim(),
      category,
      status,
      email: email || undefined,
      phone: phone || undefined,
      website: website || undefined,
      owner,
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    onAdd(vendor);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Add Vendor</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Vendor Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {categories.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "pending")}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="accounts@vendor.com" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="(555) 555-0100" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Owner</label>
              <select value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20">
                {ownerLabels.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Website</label>
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="https://vendor.com" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors">
              Add Vendor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
