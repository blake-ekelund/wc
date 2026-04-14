"use client";

import { Check, Palette } from "lucide-react";
import { themes } from "@/lib/themes";

interface AppearanceSectionProps {
  theme: string;
  onChangeTheme: (theme: string) => void;
}

export default function AppearanceSection({ theme, onChangeTheme }: AppearanceSectionProps) {
  const activeTheme = themes.find((t) => t.id === theme) || themes[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Appearance</h2>
        <p className="text-sm text-muted mt-1">Customize the look and feel of your workspace</p>
      </div>

      {/* Section header */}
      <div className="bg-white rounded-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: activeTheme.accentLight }}>
            <Palette className="w-4.5 h-4.5" style={{ color: activeTheme.accent }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Workspace Theme</h3>
            <p className="text-xs text-muted">Applies to all team members in this workspace</p>
          </div>
        </div>
      </div>

      {/* Theme picker */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Choose a theme</h4>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
            {themes.map((t) => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onChangeTheme(t.id)}
                  className={`group relative rounded-xl border-2 transition-all overflow-hidden ${isActive ? "border-foreground shadow-md ring-1 ring-foreground/10" : "border-border hover:border-gray-300 hover:shadow-sm"}`}
                  aria-label={`Select ${t.label} theme`}
                  aria-pressed={isActive}
                >
                  {/* Color bar */}
                  <div className="h-12 w-full" style={{ background: `linear-gradient(135deg, ${t.accent} 0%, ${t.accentDark} 100%)` }} />
                  {/* Label area */}
                  <div className="px-3 py-2.5 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: t.accent }} />
                      <span className="text-xs font-medium text-foreground">{t.label}</span>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Preview</h4>
        </div>
        <div className="p-5 space-y-5">
          {/* Mini UI mockup */}
          <div className="rounded-lg border border-border overflow-hidden">
            {/* Fake nav bar */}
            <div className="h-10 flex items-center gap-2 px-4 border-b border-border bg-surface/50">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: activeTheme.accent }} />
              <div className="h-2.5 w-20 rounded bg-gray-200" />
              <div className="ml-auto flex gap-2">
                <div className="h-2 w-12 rounded bg-gray-200" />
                <div className="h-2 w-12 rounded bg-gray-200" />
              </div>
            </div>
            {/* Fake content */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-24 rounded bg-gray-200" />
                <div className="h-5 px-2 rounded-full text-[9px] font-semibold text-white flex items-center" style={{ backgroundColor: activeTheme.accent }}>Active</div>
              </div>
              <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: activeTheme.accentLight }}>
                <div className="h-full rounded-full w-3/5 transition-colors" style={{ backgroundColor: activeTheme.accent }} />
              </div>
              <div className="flex gap-2 pt-1">
                <button className="px-3 py-1.5 text-[10px] font-semibold text-white rounded-md transition-colors" style={{ backgroundColor: activeTheme.accent }}>Save Changes</button>
                <button className="px-3 py-1.5 text-[10px] font-semibold rounded-md border transition-colors" style={{ color: activeTheme.accent, borderColor: activeTheme.accent }}>Cancel</button>
                <span className="px-3 py-1.5 text-[10px] font-medium transition-colors" style={{ color: activeTheme.accent }}>Learn more</span>
              </div>
            </div>
          </div>

          {/* Color swatches */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md shadow-sm border border-black/10" style={{ backgroundColor: activeTheme.accent }} />
              <div className="text-[10px] text-muted">
                <div className="font-semibold text-foreground">Primary</div>
                <div className="font-mono">{activeTheme.accent}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md shadow-sm border border-black/10" style={{ backgroundColor: activeTheme.accentDark }} />
              <div className="text-[10px] text-muted">
                <div className="font-semibold text-foreground">Hover</div>
                <div className="font-mono">{activeTheme.accentDark}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md shadow-sm border border-black/10" style={{ backgroundColor: activeTheme.accentLight }} />
              <div className="text-[10px] text-muted">
                <div className="font-semibold text-foreground">Light</div>
                <div className="font-mono">{activeTheme.accentLight}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
