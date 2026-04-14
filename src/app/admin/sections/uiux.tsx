"use client";

import { useState, useEffect } from "react";
import { Loader2, Palette } from "lucide-react";
import { adminFetch, AuditFindingsList, AuditSummaryBar, AuditHistoryPanel, type ScanFinding, type ScanSummaryType, type AuditHistoryRun } from "./_shared";

interface UiuxSectionProps {
  dismissedFindings: Record<string, boolean>;
  showDismissed: boolean;
  toggleDismissed: (id: string) => void;
  setShowDismissed: (v: boolean) => void;
}

export default function UiuxSection({ dismissedFindings, showDismissed, toggleDismissed, setShowDismissed }: UiuxSectionProps) {
  const [uxFindings, setUxFindings] = useState<ScanFinding[]>([]);
  const [uxSummary, setUxSummary] = useState<ScanSummaryType | null>(null);
  const [uxScanning, setUxScanning] = useState(false);
  const [lastUxScanTime, setLastUxScanTime] = useState<string | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditHistoryRun[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    adminFetch("get-latest-audit", { audit_type: "uiux" }).then((data) => {
      if (data.run) { setUxFindings(data.run.findings || []); setUxSummary(data.run.summary || null); setLastUxScanTime(data.run.created_at); }
    }).catch(() => {});
  }, []);

  async function runUxScan() {
    setUxScanning(true);
    try {
      const data = await adminFetch("run-ux-scan");
      if (data.findings) { setUxFindings(data.findings); setUxSummary(data.summary); setLastUxScanTime(new Date().toISOString()); }
    } catch { /* ignore */ }
    setUxScanning(false);
  }

  async function loadHistory() {
    try { const data = await adminFetch("get-audit-history", { audit_type: "uiux", limit: 10 }); if (data.runs) setAuditHistory(data.runs); } catch { /* ignore */ }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">UX & Accessibility Scan</h2>
          <p className="text-xs text-gray-400 mt-0.5">{lastUxScanTime ? `Last scan: ${new Date(lastUxScanTime).toLocaleString()}` : "No scans run yet"}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setShowHistory(!showHistory); if (!auditHistory.length) loadHistory(); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{showHistory ? "Hide History" : "History"}</button>
          <button onClick={runUxScan} disabled={uxScanning} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-60">
            {uxScanning ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...</>) : (<><Palette className="w-3.5 h-3.5" /> Run Scan</>)}
          </button>
        </div>
      </div>

      {uxSummary && <AuditSummaryBar summary={uxSummary} label={uxSummary.critical > 0 ? "Critical Issues" : uxSummary.high > 0 ? "Issues Found" : uxSummary.medium > 0 ? "Minor Issues" : "All Checks Passed"} />}

      {uxFindings.length === 0 && !uxScanning && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Palette className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Run your first UX scan</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">Checks skip navigation, ARIA live regions, and form hints on your live site.</p>
          <button onClick={runUxScan} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"><Palette className="w-3.5 h-3.5" /> Run Scan</button>
        </div>
      )}

      {uxScanning && uxFindings.length === 0 && (<div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><Loader2 className="w-7 h-7 text-gray-400 animate-spin mx-auto mb-3" /><h3 className="text-sm font-semibold text-gray-900 mb-1">Scanning...</h3></div>)}

      <AuditFindingsList findings={uxFindings} dismissed={dismissedFindings} showDismissed={showDismissed} onToggleDismiss={toggleDismissed} onToggleShowDismissed={() => setShowDismissed(!showDismissed)} />

      {showHistory && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Scan History</h3></div>
          <AuditHistoryPanel history={auditHistory} type="findings" />
        </div>
      )}
    </div>
  );
}
