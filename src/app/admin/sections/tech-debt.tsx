"use client";

import { useState, useEffect } from "react";
import { Code2 } from "lucide-react";
import { adminFetch, AuditFindingsList, AuditSummaryBar, AuditHistoryPanel, type ScanFinding, type ScanSummaryType, type AuditHistoryRun } from "./_shared";

interface TechDebtSectionProps {
  dismissedFindings: Record<string, boolean>;
  showDismissed: boolean;
  toggleDismissed: (id: string) => void;
  setShowDismissed: (v: boolean) => void;
}

export default function TechDebtSection({ dismissedFindings, showDismissed, toggleDismissed, setShowDismissed }: TechDebtSectionProps) {
  const [tdFindings, setTdFindings] = useState<ScanFinding[]>([]);
  const [tdSummary, setTdSummary] = useState<ScanSummaryType | null>(null);
  const [lastTdScanTime, setLastTdScanTime] = useState<string | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditHistoryRun[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    adminFetch("get-latest-audit", { audit_type: "tech_debt" }).then((data) => {
      if (data.run) { setTdFindings(data.run.findings || []); setTdSummary(data.run.summary || null); setLastTdScanTime(data.run.created_at); }
    }).catch(() => {});
  }, []);

  async function loadHistory() {
    try {
      const data = await adminFetch("get-audit-history", { audit_type: "tech_debt", limit: 10 });
      if (data.runs) setAuditHistory(data.runs);
    } catch { /* ignore */ }
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Tech Debt Scan</h2>
          <p className="text-xs text-gray-400 mt-0.5">{lastTdScanTime ? `Last scan: ${new Date(lastTdScanTime).toLocaleString()}` : "No scans run yet"}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setShowHistory(!showHistory); if (!auditHistory.length) loadHistory(); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{showHistory ? "Hide History" : "History"}</button>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg"><Code2 className="w-3.5 h-3.5" /> Scanned via GitHub Action</span>
        </div>
      </div>

      {tdSummary && <AuditSummaryBar summary={tdSummary} label={tdSummary.critical > 0 ? "Critical Debt Found" : tdSummary.high > 0 ? "Issues Found" : tdSummary.medium > 0 ? "Minor Items" : "All Clear"} />}

      {tdFindings.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Code2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{lastTdScanTime ? "No tech debt found" : "Waiting for first scan"}</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">{lastTdScanTime ? "Your codebase is clean. The GitHub Action will scan again tomorrow at 5AM EST." : "The GitHub Action runs daily at 5AM EST. You can also trigger it manually from your GitHub repo."}</p>
        </div>
      )}

      <AuditFindingsList findings={tdFindings} dismissed={dismissedFindings} showDismissed={showDismissed} onToggleDismiss={toggleDismissed} onToggleShowDismissed={() => setShowDismissed(!showDismissed)} />

      {showHistory && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Scan History</h3></div>
          <AuditHistoryPanel history={auditHistory} type="findings" />
        </div>
      )}
    </div>
  );
}
