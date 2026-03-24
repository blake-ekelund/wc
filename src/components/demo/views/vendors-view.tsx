"use client";

import { useState } from "react";
import { Search, Plus, X, Building2, Phone, Mail, Globe, ChevronDown, Download, FileText, Upload, Send, Check, ArrowRight, ArrowLeft, Calendar, DollarSign, RefreshCw } from "lucide-react";
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
        <AddVendorWizard
          onClose={() => setShowAddModal(false)}
          onAddVendor={onAddVendor}
          onAddContract={onAddContract}
          onUpdateTax={onUpdateTax}
          ownerLabels={ownerLabels}
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
}: {
  onClose: () => void;
  onAddVendor: (vendor: Vendor) => void;
  onAddContract?: (contract: VendorContract) => void;
  onUpdateTax?: (tax: VendorTax) => void;
  ownerLabels: string[];
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
  const [contractValue, setContractValue] = useState("");
  const [payFrequency, setPayFrequency] = useState("Monthly");
  const [autoRenew, setAutoRenew] = useState(false);

  // Step 3: Documents
  const [w9Status, setW9Status] = useState<"na" | "requested">("na");
  const [needs1099, setNeeds1099] = useState(false);
  const [type1099, setType1099] = useState<"1099-NEC" | "1099-MISC" | "1099-INT" | "1099-DIV">("1099-NEC");
  const [docAction, setDocAction] = useState<"none" | "request">("none");

  function handleFinish() {
    if (!name.trim()) return;

    // Create vendor
    const annualAmt = contractValue ? parseFloat(contractValue) : undefined;
    const payAmt = annualAmt && payFrequency === "Monthly" ? annualAmt / 12 : annualAmt && payFrequency === "Quarterly" ? annualAmt / 4 : annualAmt;
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
      payFrequency: contractValue ? payFrequency : undefined,
      payAmount: payAmt,
      annualAmount: annualAmt,
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
        value: annualAmt,
        autoRenew,
        created: new Date().toISOString(),
      });
    }

    // Create tax record if applicable
    if ((w9Status !== "na" || needs1099) && onUpdateTax) {
      onUpdateTax({
        id: (crypto.randomUUID ? crypto.randomUUID() : `vt_${Date.now()}`),
        vendorId,
        w9Status,
        needs1099,
        type1099: needs1099 ? type1099 : undefined,
        yearRecords: [],
      });
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
                  <label className={labelCls}>Annual Value ($)</label>
                  <input type="number" value={contractValue} onChange={(e) => setContractValue(e.target.value)} className={inputCls} placeholder="5,400" />
                </div>
                <div>
                  <label className={labelCls}>Pay Frequency</label>
                  <select value={payFrequency} onChange={(e) => setPayFrequency(e.target.value)} className={inputCls}>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annually">Annually</option>
                    <option value="One-time">One-time</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} className="rounded" />
                <RefreshCw className="w-3.5 h-3.5 text-muted" />
                <span className="text-foreground">Auto-renew</span>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-xs text-muted">Set up compliance requirements, or skip and manage them later.</p>

              {/* W-9 */}
              <div>
                <label className={labelCls}>W-9 Status</label>
                <div className="flex gap-2">
                  {([["na", "Not Needed"], ["requested", "Request from Vendor"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setW9Status(val)}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                        w9Status === val ? "border-accent bg-accent/5 text-accent" : "border-border text-muted hover:border-gray-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1099 */}
              <div>
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input type="checkbox" checked={needs1099} onChange={(e) => setNeeds1099(e.target.checked)} className="rounded" />
                  <span className="text-foreground font-medium text-xs">1099 Required</span>
                </label>
                {needs1099 && (
                  <select value={type1099} onChange={(e) => setType1099(e.target.value as typeof type1099)} className={inputCls}>
                    <option value="1099-NEC">1099-NEC</option>
                    <option value="1099-MISC">1099-MISC</option>
                    <option value="1099-INT">1099-INT</option>
                    <option value="1099-DIV">1099-DIV</option>
                  </select>
                )}
              </div>

              {/* Document request */}
              {email && (
                <div className="pt-2 border-t border-border">
                  <label className={labelCls}>Request documents from vendor?</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDocAction("none")}
                      className={`flex-1 px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors ${
                        docAction === "none" ? "border-accent bg-accent/5 text-accent" : "border-border text-muted hover:border-gray-300"
                      }`}
                    >
                      I&apos;ll do it later
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocAction("request")}
                      className={`flex-1 px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors inline-flex items-center justify-center gap-1.5 ${
                        docAction === "request" ? "border-accent bg-accent/5 text-accent" : "border-border text-muted hover:border-gray-300"
                      }`}
                    >
                      <Send className="w-3 h-3" /> Send request link
                    </button>
                  </div>
                  {docAction === "request" && (
                    <p className="text-[11px] text-muted mt-2">
                      A link will be sent to <span className="font-medium text-foreground">{email}</span> where they can upload their W-9, COI, and other documents.
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
