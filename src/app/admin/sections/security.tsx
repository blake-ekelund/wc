"use client";

import { useState, useEffect } from "react";
import { Loader2, Shield } from "lucide-react";
import { adminFetch, type ScanFinding, type ScanSummaryType, type AuditHistoryRun, AuditSummaryBar, AuditHistoryPanel, severityColors } from "./_shared";

export default function SecuritySection() {
  const [scanFindings, setScanFindings] = useState<ScanFinding[]>([]);
  const [scanSummary, setScanSummary] = useState<ScanSummaryType | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);
  const [securityChecklist, setSecurityChecklist] = useState<Record<string, boolean>>({});
  const [auditHistory, setAuditHistory] = useState<AuditHistoryRun[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("admin-security-checklist");
        if (saved) setSecurityChecklist(JSON.parse(saved));
        const savedFindings = localStorage.getItem("admin-scan-findings");
        const savedSummary = localStorage.getItem("admin-scan-summary");
        if (savedFindings) setScanFindings(JSON.parse(savedFindings));
        if (savedSummary) setScanSummary(JSON.parse(savedSummary));
        setLastScanTime(localStorage.getItem("admin-last-scan-time"));
      } catch { /* ignore */ }
    }
    adminFetch("get-latest-audit", { audit_type: "security_scan" }).then((data) => {
      if (data.run) {
        setScanFindings(data.run.findings || []);
        setScanSummary(data.run.summary || null);
        setLastScanTime(data.run.created_at);
      }
    }).catch(() => {});
  }, []);

  function toggleSecurityItem(id: string) {
    setSecurityChecklist((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("admin-security-checklist", JSON.stringify(next));
      return next;
    });
  }

  async function runSecurityScan() {
    setScanning(true);
    try {
      const data = await adminFetch("run-security-scan");
      if (data.findings) {
        setScanFindings(data.findings);
        setScanSummary(data.summary);
        const now = new Date().toISOString();
        setLastScanTime(now);
        localStorage.setItem("admin-last-scan-time", now);
        localStorage.setItem("admin-scan-findings", JSON.stringify(data.findings));
        localStorage.setItem("admin-scan-summary", JSON.stringify(data.summary));
      }
    } catch { /* silenced */ }
    setScanning(false);
  }

  async function loadHistory() {
    try {
      const data = await adminFetch("get-audit-history", { audit_type: "security_scan", limit: 10 });
      if (data.runs) setAuditHistory(data.runs);
    } catch { /* ignore */ }
  }

  const items = scanFindings;
  const totalCount = items.length;
  const completedCount = items.filter((i) => securityChecklist[i.id]).length;
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Security Audit</h2>
          <p className="text-xs text-gray-400 mt-0.5">{lastScanTime ? `Last scan: ${new Date(lastScanTime).toLocaleString()}` : "No scans run yet"}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setHistoryExpanded(!historyExpanded); if (!auditHistory.length) loadHistory(); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{historyExpanded ? "Hide History" : "History"}</button>
          <button onClick={runSecurityScan} disabled={scanning} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-60">
            {scanning ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...</>) : (<><Shield className="w-3.5 h-3.5" /> Run Scan</>)}
          </button>
        </div>
      </div>

      {scanSummary && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${scanSummary.critical > 0 ? "bg-red-500 animate-pulse" : scanSummary.high > 0 ? "bg-amber-500" : scanSummary.medium > 0 ? "bg-blue-500" : "bg-emerald-500"}`} />
              <span className="text-sm font-medium text-gray-900">
                {scanSummary.critical > 0 ? "Critical Issues Found" : scanSummary.high > 0 ? "High Priority Issues" : scanSummary.medium > 0 ? "Minor Issues Detected" : "All Checks Passed"}
              </span>
            </div>
            <span className="text-xs text-gray-400">{completedCount}/{totalCount} resolved</span>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Total", count: scanSummary.total, color: "text-gray-900" },
              { label: "Critical", count: scanSummary.critical, color: scanSummary.critical > 0 ? "text-red-600" : "text-gray-300" },
              { label: "High", count: scanSummary.high, color: scanSummary.high > 0 ? "text-amber-600" : "text-gray-300" },
              { label: "Medium", count: scanSummary.medium, color: scanSummary.medium > 0 ? "text-blue-600" : "text-gray-300" },
              { label: "Low", count: scanSummary.low, color: scanSummary.low > 0 ? "text-gray-500" : "text-gray-300" },
            ].map((c) => (
              <div key={c.label} className="text-center"><div className={`text-xl font-bold ${c.color}`}>{c.count}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{c.label}</div></div>
            ))}
          </div>
          {totalCount > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${completedCount === totalCount ? "bg-emerald-500" : "bg-gray-900"}`} style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {totalCount === 0 && !scanning && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Shield className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Run your first security scan</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">Tests your live environment for misconfigurations, auth bypasses, missing rate limits, and input validation issues.</p>
          <button onClick={runSecurityScan} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"><Shield className="w-3.5 h-3.5" /> Run Scan</button>
        </div>
      )}

      {scanning && totalCount === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Loader2 className="w-7 h-7 text-gray-400 animate-spin mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Scanning your system...</h3>
          <p className="text-xs text-gray-500">Checking environment, authentication, endpoints, headers, and database...</p>
        </div>
      )}

      {categories.map((category) => {
        const categoryItems = items.filter((i) => i.category === category);
        const categoryCompleted = categoryItems.filter((i) => securityChecklist[i.id]).length;
        return (
          <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{category}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{categoryItems.length}</span>
              </div>
              <span className="text-[10px] text-gray-400">{categoryCompleted}/{categoryItems.length} resolved</span>
            </div>
            <div className="divide-y divide-gray-50">
              {categoryItems.map((item) => {
                const checked = securityChecklist[item.id] || false;
                const colors = severityColors[item.severity] || severityColors.low;
                return (
                  <div key={item.id} onClick={() => toggleSecurityItem(item.id)} className={`px-5 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors ${checked ? "opacity-40" : ""}`}>
                    <div className={`mt-0.5 w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`} style={{ width: 18, height: 18 }}>
                      {checked && (<svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}><span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />{item.severity.toUpperCase()}</span>
                        <span className={`text-sm font-medium ${checked ? "line-through text-gray-400" : "text-gray-900"}`}>{item.title}</span>
                      </div>
                      <p className={`text-xs mt-0.5 leading-relaxed ${checked ? "text-gray-300" : "text-gray-500"}`}>{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {historyExpanded && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Scan History</h3></div>
          <AuditHistoryPanel history={auditHistory} type="findings" />
        </div>
      )}
    </div>
  );
}
