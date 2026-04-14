"use client";

import { useState } from "react";
import { Pencil, Check, X } from "lucide-react";

interface GeneralSectionProps {
  companyName: string;
  onChangeCompanyName: (name: string) => void;
  isLive: boolean;
}

export default function GeneralSection({ companyName, onChangeCompanyName, isLive }: GeneralSectionProps) {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(companyName);
  const [timezone, setTimezone] = useState("America/New_York");

  function saveName() {
    if (tempName.trim()) onChangeCompanyName(tempName.trim());
    setEditingName(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">General</h2>
        <p className="text-sm text-muted mt-1">Company information and workspace settings</p>
      </div>

      {/* Company info card */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Company Information</h3>
        </div>
        <div className="divide-y divide-border">
          {/* Company name */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <label className="text-xs font-medium text-muted block mb-1">Company Name</label>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                  />
                  <button onClick={saveName} className="p-1.5 text-accent hover:bg-accent-light rounded-lg transition-colors" aria-label="Save company name">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setEditingName(false); setTempName(companyName); }} className="p-1.5 text-muted hover:bg-gray-100 rounded-lg transition-colors" aria-label="Cancel editing">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{companyName}</span>
                  <button onClick={() => { setTempName(companyName); setEditingName(true); }} className="p-1 text-muted hover:text-accent transition-colors" aria-label="Edit company name">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <label className="text-xs font-medium text-muted block mb-1">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Berlin">Berlin (CET)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-red-200">
          <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            {isLive ? (
              <>
                <div>
                  <div className="text-sm font-medium text-foreground">Cancel workspace</div>
                  <p className="text-xs text-muted mt-0.5">Cancel your workspace subscription and remove all data. This cannot be undone.</p>
                </div>
                <button className="shrink-0 ml-4 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors">
                  Cancel Workspace
                </button>
              </>
            ) : (
              <>
                <div>
                  <div className="text-sm font-medium text-muted">Delete workspace</div>
                  <p className="text-xs text-muted mt-0.5">This action is disabled in the demo.</p>
                </div>
                <button disabled className="shrink-0 ml-4 px-3 py-1.5 text-xs font-medium text-gray-400 border border-gray-200 rounded-lg cursor-not-allowed opacity-50">
                  Delete Workspace
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
