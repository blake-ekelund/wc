"use client";

import { Truck, AlertTriangle } from "lucide-react";
import { type Vendor, type VendorContract, formatCurrency } from "../../data";

interface VendorSummaryProps {
  vendors: Vendor[];
  vendorContracts: VendorContract[];
}

export default function VendorSummary({ vendors, vendorContracts }: VendorSummaryProps) {
  const activeContracts = vendorContracts.filter((c) => c.status === "active");
  const totalValue = activeContracts.reduce((a, c) => a + (c.value || 0), 0);

  // Contracts expiring within 30 days
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiring = activeContracts.filter((c) => {
    if (!c.endDate) return false;
    const end = new Date(c.endDate);
    return end >= now && end <= thirtyDaysFromNow;
  });

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Vendors</h3>
      </div>
      <div className="p-5">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{vendors.length}</div>
            <div className="text-[10px] text-muted">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{activeContracts.length}</div>
            <div className="text-[10px] text-muted">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{formatCurrency(totalValue)}</div>
            <div className="text-[10px] text-muted">Value</div>
          </div>
        </div>

        {/* Expiring contracts */}
        {expiring.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-700">Expiring soon</span>
            </div>
            <div className="space-y-2">
              {expiring.map((c) => {
                const vendor = vendors.find((v) => v.id === c.vendorId);
                const daysLeft = Math.ceil((new Date(c.endDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <div className="text-foreground font-medium truncate">{c.title}</div>
                      <div className="text-muted">{vendor?.name}</div>
                    </div>
                    <span className="text-amber-600 font-medium shrink-0 ml-2">{daysLeft}d</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {vendors.length === 0 && (
          <div className="py-4 text-center">
            <Truck className="w-8 h-8 text-muted/30 mx-auto mb-2" />
            <p className="text-sm text-muted">No vendors</p>
          </div>
        )}
      </div>
    </div>
  );
}
