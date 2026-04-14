"use client";

import { useState } from "react";
import {
  BellRing,
  Shield,
  Clock,
  DollarSign,
  PhoneOff,
  AlertTriangle,
} from "lucide-react";

export interface AlertSettings {
  staleDays: number;
  atRiskTouchpoints: number;
  highValueThreshold: number;
  overdueAlerts: boolean;
  todayAlerts: boolean;
  negotiationAlerts: boolean;
  staleContactAlerts: boolean;
  atRiskAlerts: boolean;
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function parseFormattedNumber(s: string): number {
  const cleaned = s.replace(/[^0-9]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

interface NotificationsSectionProps {
  alertSettings: AlertSettings;
  onUpdateAlertSettings: (settings: AlertSettings) => void;
}

export default function NotificationsSection({ alertSettings, onUpdateAlertSettings }: NotificationsSectionProps) {
  const [thresholdDisplay, setThresholdDisplay] = useState(formatNumber(alertSettings.highValueThreshold));

  function handleThresholdChange(value: string) {
    const raw = value.replace(/[^0-9]/g, "");
    if (!raw) { setThresholdDisplay(""); return; }
    const num = parseInt(raw, 10);
    setThresholdDisplay(formatNumber(num));
    onUpdateAlertSettings({ ...alertSettings, highValueThreshold: num });
  }

  function handleThresholdBlur() {
    if (!thresholdDisplay || parseFormattedNumber(thresholdDisplay) === 0) {
      setThresholdDisplay(formatNumber(1000));
      onUpdateAlertSettings({ ...alertSettings, highValueThreshold: 1000 });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Notifications</h2>
        <p className="text-sm text-muted mt-1">Configure alert thresholds and notification preferences</p>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
        <BellRing className="w-4 h-4 text-blue-600 shrink-0" />
        <span className="text-sm text-blue-800">
          Configure when contacts, deals, and tasks trigger alerts in <span className="font-medium">For You</span> and the notification bell.
        </span>
      </div>

      {/* Company-wide warning */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
        <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="text-sm font-medium text-amber-900">Company-wide setting</span>
          <p className="text-xs text-amber-700 mt-0.5">
            Changes here apply to <span className="font-medium">all team members</span> in your workspace. Alert thresholds and preferences will update across every user&apos;s dashboard, notifications, and daily briefing.
          </p>
        </div>
      </div>

      {/* Alert toggles */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Alert Types</h3>
          <p className="text-xs text-muted mt-0.5">Choose which alert categories to show.</p>
        </div>
        <div className="divide-y divide-border">
          {/* Overdue tasks */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><Clock className="w-4 h-4 text-amber-600" /></div>
              <div>
                <div className="text-sm font-medium text-foreground">Overdue tasks</div>
                <div className="text-xs text-muted">Alert when tasks pass their due date</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateAlertSettings({ ...alertSettings, overdueAlerts: !alertSettings.overdueAlerts })}
              className={`relative w-10 h-6 rounded-full transition-colors ${alertSettings.overdueAlerts ? "bg-accent" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${alertSettings.overdueAlerts ? "left-5" : "left-1"}`} />
            </button>
          </div>

          {/* Due today */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"><Clock className="w-4 h-4 text-blue-600" /></div>
              <div>
                <div className="text-sm font-medium text-foreground">Due today reminders</div>
                <div className="text-xs text-muted">Remind about tasks due today</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateAlertSettings({ ...alertSettings, todayAlerts: !alertSettings.todayAlerts })}
              className={`relative w-10 h-6 rounded-full transition-colors ${alertSettings.todayAlerts ? "bg-accent" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${alertSettings.todayAlerts ? "left-5" : "left-1"}`} />
            </button>
          </div>

          {/* Negotiation deals */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
              <div>
                <div className="text-sm font-medium text-foreground">Negotiation stage deals</div>
                <div className="text-xs text-muted">Alert for deals in Negotiation that need action</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateAlertSettings({ ...alertSettings, negotiationAlerts: !alertSettings.negotiationAlerts })}
              className={`relative w-10 h-6 rounded-full transition-colors ${alertSettings.negotiationAlerts ? "bg-accent" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${alertSettings.negotiationAlerts ? "left-5" : "left-1"}`} />
            </button>
          </div>

          {/* Stale contacts */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center"><PhoneOff className="w-4 h-4 text-orange-600" /></div>
              <div>
                <div className="text-sm font-medium text-foreground">Stale contacts</div>
                <div className="text-xs text-muted">Alert when contacts have no recent touchpoints</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateAlertSettings({ ...alertSettings, staleContactAlerts: !alertSettings.staleContactAlerts })}
              className={`relative w-10 h-6 rounded-full transition-colors ${alertSettings.staleContactAlerts ? "bg-accent" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${alertSettings.staleContactAlerts ? "left-5" : "left-1"}`} />
            </button>
          </div>

          {/* At risk proposals */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
              <div>
                <div className="text-sm font-medium text-foreground">At-risk proposals</div>
                <div className="text-xs text-muted">Alert for proposals with low engagement</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateAlertSettings({ ...alertSettings, atRiskAlerts: !alertSettings.atRiskAlerts })}
              className={`relative w-10 h-6 rounded-full transition-colors ${alertSettings.atRiskAlerts ? "bg-accent" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${alertSettings.atRiskAlerts ? "left-5" : "left-1"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Threshold settings */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Thresholds</h3>
          <p className="text-xs text-muted mt-0.5">Fine-tune when alerts are triggered.</p>
        </div>
        <div className="divide-y divide-border">
          {/* Stale days */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-foreground">Stale contact threshold</div>
                <div className="text-xs text-muted">Days without a touchpoint before flagging a contact</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-accent">{alertSettings.staleDays}</span>
                <span className="text-xs text-muted">days</span>
              </div>
            </div>
            <input
              type="range"
              min={3}
              max={90}
              value={alertSettings.staleDays}
              onChange={(e) => onUpdateAlertSettings({ ...alertSettings, staleDays: Number(e.target.value) })}
              className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>3 days</span>
              <span>30 days</span>
              <span>90 days</span>
            </div>
          </div>

          {/* At risk touchpoints */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-foreground">At-risk touchpoint minimum</div>
                <div className="text-xs text-muted">Proposals with this many or fewer touchpoints are flagged</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onUpdateAlertSettings({ ...alertSettings, atRiskTouchpoints: Math.max(0, alertSettings.atRiskTouchpoints - 1) })}
                  className="w-7 h-7 rounded-lg border border-border text-foreground hover:bg-surface flex items-center justify-center text-sm font-medium transition-colors"
                >-</button>
                <span className="w-8 text-center text-lg font-bold text-accent">{alertSettings.atRiskTouchpoints}</span>
                <button
                  onClick={() => onUpdateAlertSettings({ ...alertSettings, atRiskTouchpoints: alertSettings.atRiskTouchpoints + 1 })}
                  className="w-7 h-7 rounded-lg border border-border text-foreground hover:bg-surface flex items-center justify-center text-sm font-medium transition-colors"
                >+</button>
              </div>
            </div>
          </div>

          {/* High value threshold */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-foreground">High-value deal threshold</div>
                <div className="text-xs text-muted">Early-stage deals above this amount get flagged for follow-up</div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-muted">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={thresholdDisplay}
                  onChange={(e) => handleThresholdChange(e.target.value)}
                  onBlur={handleThresholdBlur}
                  className="w-28 text-sm font-medium text-right bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reset defaults */}
      <div className="flex justify-end">
        <button
          onClick={() => {
            onUpdateAlertSettings({
              staleDays: 14,
              atRiskTouchpoints: 1,
              highValueThreshold: 10000,
              overdueAlerts: true,
              todayAlerts: true,
              negotiationAlerts: true,
              staleContactAlerts: true,
              atRiskAlerts: true,
            });
            setThresholdDisplay(formatNumber(10000));
          }}
          className="px-4 py-2 text-xs font-medium text-muted border border-border hover:text-foreground hover:border-gray-400 rounded-lg transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
