"use client";

import { Users, Puzzle, Truck, CheckSquare, ToggleLeft, ToggleRight, Shield } from "lucide-react";

interface PluginsSectionProps {
  enabledPlugins: string[];
  onChangePlugins: (plugins: string[]) => void;
}

export default function PluginsSection({ enabledPlugins, onChangePlugins }: PluginsSectionProps) {
  const crmEnabled = enabledPlugins.includes("crm");
  const vendorsEnabled = enabledPlugins.includes("vendors");

  function toggle(plugin: string) {
    const next = enabledPlugins.includes(plugin)
      ? enabledPlugins.filter((p) => p !== plugin)
      : [...enabledPlugins, plugin];
    onChangePlugins(next);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Plugins</h2>
        <p className="text-sm text-muted mt-1">Enable or disable modules for your workspace</p>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
            <Puzzle className="w-4.5 h-4.5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Workspace Plugins</h3>
            <p className="text-xs text-muted">Your workspace comes with Task Tracker built in. Add CRM, Vendor Management, and more as plugins.</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Task Tracker — always on (core) */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Task Tracker</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-700 bg-green-100 rounded">Core</span>
              </div>
              <p className="text-xs text-muted mt-0.5">Cross-team task assignment with priorities, due dates, and status tracking. Built into every workspace.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Always On</span>
              <ToggleRight className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* CRM — toggleable */}
        <div className={`bg-white rounded-xl border overflow-hidden transition-all ${crmEnabled ? "border-border" : "border-border opacity-75"}`}>
          <div className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${crmEnabled ? "bg-blue-100" : "bg-gray-100"}`}>
              <Users className={`w-5 h-5 ${crmEnabled ? "text-blue-600" : "text-gray-400"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">CRM</span>
                {crmEnabled && <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded">Enabled</span>}
                {!crmEnabled && <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 rounded">Disabled</span>}
              </div>
              <p className="text-xs text-muted mt-0.5">Contacts, pipeline, deals, activity tracking, calendar, and reports</p>
            </div>
            <button onClick={() => toggle("crm")} className="shrink-0" aria-label={crmEnabled ? "Disable CRM" : "Enable CRM"}>
              {crmEnabled ? <ToggleRight className="w-8 h-8 text-emerald-500 hover:text-emerald-600 transition-colors" /> : <ToggleLeft className="w-8 h-8 text-gray-300 hover:text-gray-400 transition-colors" />}
            </button>
          </div>
        </div>

        {/* Vendor Management — toggleable */}
        <div className={`bg-white rounded-xl border overflow-hidden transition-all ${vendorsEnabled ? "border-border" : "border-border opacity-75"}`}>
          <div className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${vendorsEnabled ? "bg-amber-100" : "bg-gray-100"}`}>
              <Truck className={`w-5 h-5 ${vendorsEnabled ? "text-amber-600" : "text-gray-400"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Vendor Management</span>
                {vendorsEnabled && <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded">Enabled</span>}
                {!vendorsEnabled && <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 rounded">Disabled</span>}
              </div>
              <p className="text-xs text-muted mt-0.5">Vendor directory, contracts, compliance, tax records, and vendor portal</p>
            </div>
            <button onClick={() => toggle("vendors")} className="shrink-0" aria-label={vendorsEnabled ? "Disable Vendor Management" : "Enable Vendor Management"}>
              {vendorsEnabled ? <ToggleRight className="w-8 h-8 text-emerald-500 hover:text-emerald-600 transition-colors" /> : <ToggleLeft className="w-8 h-8 text-gray-300 hover:text-gray-400 transition-colors" />}
            </button>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-surface border border-border">
        <Shield className="w-4 h-4 text-muted mt-0.5 shrink-0" />
        <p className="text-xs text-muted leading-relaxed">Disabling a plugin hides it from the sidebar for all team members. Your data is never deleted — re-enable anytime to restore access.</p>
      </div>
    </div>
  );
}
