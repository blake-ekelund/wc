"use client";

import { FileText } from "lucide-react";
import { type Contact, type CustomerContract, formatCurrency } from "../../data";

interface ContractSummaryProps {
  customerContracts: CustomerContract[];
  contacts: Contact[];
}

export default function ContractSummary({ customerContracts, contacts }: ContractSummaryProps) {
  const active = customerContracts.filter((c) => c.status === "active");
  const draft = customerContracts.filter((c) => c.status === "draft");

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiring = active.filter((c) => {
    if (!c.endDate) return false;
    const end = new Date(c.endDate);
    return end >= now && end <= thirtyDaysFromNow;
  });

  // Show most recent or expiring contracts
  const display = [...expiring, ...active.filter((c) => !expiring.includes(c)), ...draft].slice(0, 5);

  const statusBadge = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-100 text-emerald-700";
      case "draft": return "bg-gray-100 text-gray-600";
      case "expired": return "bg-red-100 text-red-700";
      case "pending": return "bg-amber-100 text-amber-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Customer Contracts</h3>
      </div>
      <div className="p-5">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{active.length}</div>
            <div className="text-[10px] text-muted">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{draft.length}</div>
            <div className="text-[10px] text-muted">Draft</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{expiring.length}</div>
            <div className="text-[10px] text-muted">Expiring</div>
          </div>
        </div>

        {/* Contract list */}
        <div className="space-y-2">
          {display.map((c) => {
            const contact = contacts.find((ct) => ct.id === c.contactId);
            return (
              <div key={c.id} className="flex items-center justify-between text-xs">
                <div className="min-w-0 flex-1">
                  <div className="text-foreground font-medium truncate">{c.title}</div>
                  <div className="text-muted">{contact?.name}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {c.value != null && c.value > 0 && (
                    <span className="text-foreground font-medium">{formatCurrency(c.value)}</span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBadge(c.status)}`}>
                    {c.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {customerContracts.length === 0 && (
          <div className="py-4 text-center">
            <FileText className="w-8 h-8 text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-muted">No contracts</p>
          </div>
        )}
      </div>
    </div>
  );
}
