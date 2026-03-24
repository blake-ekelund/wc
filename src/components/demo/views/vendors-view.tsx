"use client";

import { useState } from "react";
import { Search, Plus, X, Building2, Phone, Mail, Globe, ChevronDown, Download, FileText, Upload, Send, Check, ArrowRight, ArrowLeft, Calendar, DollarSign, RefreshCw, Trash2 } from "lucide-react";
import type { Vendor, VendorContact, VendorContract, VendorTax } from "../data";
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
  onAddContract?: (contract: VendorContract) => void;
  onUpdateTax?: (tax: VendorTax) => void;
  onDeleteVendor: (id: string) => void;
  ownerLabels: string[];
  isLive?: boolean;
  workspaceId?: string;
}

export default function VendorsView({
  vendors,
  vendorContacts,
  onSelectVendor,
  onAddVendor,
  onAddContract,
  onUpdateTax,
  onDeleteVendor,
  ownerLabels,
  isLive,
  workspaceId,
}: VendorsViewProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteVendor, setDeleteVendor] = useState<Vendor | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

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
              <div
                key={vendor.id}
                className="group w-full text-left p-4 rounded-xl border border-border bg-white hover:border-accent/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <button onClick={() => onSelectVendor(vendor.id)} className="w-10 h-10 rounded-lg bg-accent-light text-accent flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => onSelectVendor(vendor.id)} className="flex-1 min-w-0 text-left">
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
                  </button>
                  <div className="flex items-center gap-3 shrink-0">
                    {vendor.annualAmount ? (
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(vendor.annualAmount)}<span className="text-[10px] font-normal text-muted">/yr</span></span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteVendor(vendor); setDeleteConfirmName(""); }}
                      className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete vendor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setDeleteVendor(null)}>
          <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-foreground text-center">Delete Vendor?</h2>
              <p className="text-xs text-muted text-center mt-1">
                This will permanently delete <span className="font-semibold text-foreground">{deleteVendor.name}</span> and all associated contacts, contracts, notes, and documents. This cannot be undone.
              </p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-muted mb-1">
                  Type <span className="font-bold text-foreground">{deleteVendor.name}</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                  placeholder={deleteVendor.name}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteVendor(null)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-muted hover:text-foreground border border-border rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { onDeleteVendor(deleteVendor.id); setDeleteVendor(null); }}
                  disabled={deleteConfirmName !== deleteVendor.name}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Delete Vendor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <AddVendorWizard
          onClose={() => setShowAddModal(false)}
          onAddVendor={onAddVendor}
          onAddContract={onAddContract}
          onUpdateTax={onUpdateTax}
          ownerLabels={ownerLabels}
          isLive={isLive}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
}

const stepLabels = ["Basics", "Contract", "Documents"];
const inputCls = "w-full px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent";
const labelCls = "block text-xs font-medium text-muted mb-1";

function AddVendorWizard({
  onClose,
  onAddVendor,
  onAddContract,
  onUpdateTax,
  ownerLabels,
  isLive,
  workspaceId,
}: {
  onClose: () => void;
  onAddVendor: (vendor: Vendor) => void;
  onAddContract?: (contract: VendorContract) => void;
  onUpdateTax?: (tax: VendorTax) => void;
  ownerLabels: string[];
  isLive?: boolean;
  workspaceId?: string;
}) {
  const [step, setStep] = useState(0);
  const vendorId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `v_${Date.now()}`;

  // Step 1: Basics
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Software");
  const [status, setStatus] = useState<"active" | "pending">("active");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [owner, setOwner] = useState(ownerLabels[0] || "You");

  // Step 2: Contract
  const [contractTitle, setContractTitle] = useState("");
  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [payAmount, setPayAmount] = useState(""); // raw number string
  const [payAmountDisplay, setPayAmountDisplay] = useState(""); // formatted display
  const [payFrequency, setPayFrequency] = useState("Monthly");
  const [autoRenew, setAutoRenew] = useState(false);
  const [contractFile, setContractFile] = useState<File | null>(null);

  const payAmountNum = parseFloat(payAmount) || 0;
  const annualAmount = payFrequency === "Monthly" ? payAmountNum * 12
    : payFrequency === "Quarterly" ? payAmountNum * 4
    : payFrequency === "Weekly" ? payAmountNum * 52
    : payAmountNum; // Annually or One-time

  function handlePayAmountChange(raw: string) {
    const digits = raw.replace(/[^0-9.]/g, "");
    setPayAmount(digits);
    if (digits) {
      const num = parseFloat(digits);
      if (!isNaN(num)) setPayAmountDisplay(num.toLocaleString("en-US", { maximumFractionDigits: 2 }));
      else setPayAmountDisplay(digits);
    } else {
      setPayAmountDisplay("");
    }
  }

  // Step 3: Documents
  const defaultDocs = ["W-9", "Certificate of Insurance (COI)", "Business License"];
  const [requiredDocs, setRequiredDocs] = useState<Record<string, boolean>>({});
  const [customDocs, setCustomDocs] = useState<string[]>([]);
  const [newCustomDoc, setNewCustomDoc] = useState("");
  const [docAction, setDocAction] = useState<"none" | "request">("none");

  const allDocs = [...defaultDocs, ...customDocs];
  const selectedDocs = allDocs.filter((d) => requiredDocs[d]);

  function handleFinish() {
    if (!name.trim()) return;

    // Create vendor
    const vendor: Vendor = {
      id: vendorId,
      name: name.trim(),
      category,
      status,
      email: email || undefined,
      phone: phone || undefined,
      website: website || undefined,
      owner,
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      contractStart: contractStart || undefined,
      contractEnd: contractEnd || undefined,
      contractTerm: contractStart && contractEnd ? "Custom" : undefined,
      autoRenew: autoRenew || undefined,
      payFrequency: payAmountNum ? payFrequency : undefined,
      payAmount: payAmountNum || undefined,
      annualAmount: payAmountNum ? annualAmount : undefined,
    };
    onAddVendor(vendor);

    // Create contract if filled
    if (contractTitle.trim() && onAddContract) {
      onAddContract({
        id: (crypto.randomUUID ? crypto.randomUUID() : `vc_${Date.now()}`),
        vendorId,
        title: contractTitle.trim(),
        type: "original",
        status: "active",
        startDate: contractStart || undefined,
        endDate: contractEnd || undefined,
        value: payAmountNum ? annualAmount : undefined,
        autoRenew,
        created: new Date().toISOString(),
      });
    }

    // Create tax record if W-9 is requested
    const w9Requested = requiredDocs["W-9"] || false;
    if (w9Requested && onUpdateTax) {
      onUpdateTax({
        id: (crypto.randomUUID ? crypto.randomUUID() : `vt_${Date.now()}`),
        vendorId,
        w9Status: "requested",
        needs1099: false,
        yearRecords: [],
      });
    }

    // Upload contract file if provided (in live mode)
    if (contractFile && isLive && workspaceId) {
      const formData = new FormData();
      formData.append("file", contractFile);
      formData.append("workspaceId", workspaceId);
      formData.append("vendorId", vendorId);
      formData.append("uploaderName", owner);
      fetch("/api/attachments", { method: "POST", body: formData })
        .catch((err) => console.error("Contract upload error:", err));
    }

    // Send doc request email if selected and in live mode
    if (docAction === "request" && email && isLive && workspaceId && selectedDocs.length > 0) {
      fetch("/api/vendor-portal/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, workspaceId, requestedDocs: selectedDocs }),
      }).catch((err) => console.error("Portal request error:", err));
    }

    onClose();
  }

  const canProceedStep0 = name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header with step indicator */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Add Vendor</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center gap-1.5 flex-1 ${i <= step ? "" : "opacity-40"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                    i < step ? "bg-emerald-500 text-white" : i === step ? "bg-accent text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    {i < step ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="text-[11px] font-medium text-foreground truncate">{label}</span>
                </div>
                {i < stepLabels.length - 1 && <div className={`w-6 h-px shrink-0 ${i < step ? "bg-emerald-300" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="p-5">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Vendor Name *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="e.g. Acme Corp" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                    {categories.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "pending")} className={inputCls}>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="accounts@vendor.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="(555) 555-0100" />
                </div>
                <div>
                  <label className={labelCls}>Owner</label>
                  <select value={owner} onChange={(e) => setOwner(e.target.value)} className={inputCls}>
                    {ownerLabels.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Website</label>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="https://vendor.com" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-muted">Add contract details now, or skip and add them later from the vendor page.</p>
              <div>
                <label className={labelCls}>Contract Title</label>
                <input type="text" value={contractTitle} onChange={(e) => setContractTitle(e.target.value)} className={inputCls} placeholder="e.g. Annual Service Agreement" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start Date</label>
                  <input type="date" value={contractStart} onChange={(e) => setContractStart(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>End Date</label>
                  <input type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Amount ($)</label>
                  <input type="text" value={payAmountDisplay} onChange={(e) => handlePayAmountChange(e.target.value)} className={inputCls} placeholder="5,000" inputMode="decimal" />
                </div>
                <div>
                  <label className={labelCls}>Frequency</label>
                  <select value={payFrequency} onChange={(e) => setPayFrequency(e.target.value)} className={inputCls}>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Annually">Annually</option>
                    <option value="One-time">One-time</option>
                  </select>
                </div>
              </div>
              {payAmountNum > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20">
                  <DollarSign className="w-3.5 h-3.5 text-accent" />
                  <span className="text-sm text-foreground">
                    <span className="font-bold text-accent">${annualAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                    <span className="text-xs text-muted ml-1">/ year</span>
                    {payFrequency !== "Annually" && payFrequency !== "One-time" && (
                      <span className="text-xs text-muted ml-1">({payFrequency.toLowerCase()} × ${payAmountNum.toLocaleString("en-US", { maximumFractionDigits: 2 })})</span>
                    )}
                  </span>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} className="rounded" />
                <RefreshCw className="w-3.5 h-3.5 text-muted" />
                <span className="text-foreground">Auto-renew</span>
              </label>

              {/* Contract file upload */}
              <div>
                <label className={labelCls}>Upload Contract</label>
                {contractFile ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface">
                    <FileText className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-sm text-foreground truncate flex-1">{contractFile.name}</span>
                    <span className="text-[10px] text-muted shrink-0">{(contractFile.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={() => setContractFile(null)} className="p-0.5 rounded hover:bg-red-50 text-muted hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 px-3 py-3 rounded-lg border border-dashed border-gray-300 hover:border-accent/50 hover:bg-accent/5 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-muted" />
                    <span className="text-xs text-muted">Click to upload contract PDF, DOCX, etc.</span>
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg" onChange={(e) => { if (e.target.files?.[0]) setContractFile(e.target.files[0]); }} />
                  </label>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-xs text-muted">Check which documents you need from this vendor, or skip and manage later.</p>

              {/* Required documents checklist */}
              <div>
                <label className={labelCls}>Required Documents</label>
                <div className="space-y-1.5">
                  {allDocs.map((doc) => (
                    <label key={doc} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border hover:bg-surface transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!requiredDocs[doc]}
                        onChange={(e) => setRequiredDocs((prev) => ({ ...prev, [doc]: e.target.checked }))}
                        className="rounded text-accent"
                      />
                      <FileText className="w-3.5 h-3.5 text-muted" />
                      <span className="text-sm text-foreground flex-1">{doc}</span>
                      {customDocs.includes(doc) && (
                        <button type="button" onClick={(e) => { e.preventDefault(); setCustomDocs((prev) => prev.filter((d) => d !== doc)); setRequiredDocs((prev) => { const n = { ...prev }; delete n[doc]; return n; }); }} className="p-0.5 rounded hover:bg-red-50 text-muted hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </label>
                  ))}
                </div>
                {/* Add custom doc */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={newCustomDoc}
                    onChange={(e) => setNewCustomDoc(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCustomDoc.trim()) {
                        e.preventDefault();
                        setCustomDocs((prev) => [...prev, newCustomDoc.trim()]);
                        setRequiredDocs((prev) => ({ ...prev, [newCustomDoc.trim()]: true }));
                        setNewCustomDoc("");
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-dashed border-gray-300 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    placeholder="Add custom document..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCustomDoc.trim()) {
                        setCustomDocs((prev) => [...prev, newCustomDoc.trim()]);
                        setRequiredDocs((prev) => ({ ...prev, [newCustomDoc.trim()]: true }));
                        setNewCustomDoc("");
                      }
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Send request to vendor */}
              {email && selectedDocs.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Send className="w-3.5 h-3.5 text-accent" />
                    <label className={labelCls + " mb-0"}>Send request to vendor?</label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDocAction("none")}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                        docAction === "none" ? "border-accent bg-accent/5 text-accent" : "border-border text-muted hover:border-gray-300"
                      }`}
                    >
                      I&apos;ll do it later
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocAction("request")}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors inline-flex items-center justify-center gap-1.5 ${
                        docAction === "request" ? "border-accent bg-accent/5 text-accent" : "border-border text-muted hover:border-gray-300"
                      }`}
                    >
                      <Send className="w-3 h-3" /> Send request link
                    </button>
                  </div>
                  {docAction === "request" && (
                    <p className="text-[11px] text-muted mt-2">
                      A link will be sent to <span className="font-medium text-foreground">{email}</span> to upload: {selectedDocs.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border">
          <div>
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step < 2 && step > 0 && (
              <button type="button" onClick={() => setStep(step + 1)} className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">
                Skip
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 0 && !canProceedStep0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Create Vendor
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
