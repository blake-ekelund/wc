"use client";

import { useState, useEffect } from "react";
import { Check, Palette, Pipette } from "lucide-react";
import { themes, type ThemeDefinition } from "@/lib/themes";

interface AppearanceSectionProps {
  theme: string;
  onChangeTheme: (theme: string) => void;
}

function hexToLight(hex: string): string {
  // Generate a light version of any hex color (for backgrounds)
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `#${Math.min(255, r + Math.round((255 - r) * 0.85)).toString(16).padStart(2, "0")}${Math.min(255, g + Math.round((255 - g) * 0.85)).toString(16).padStart(2, "0")}${Math.min(255, b + Math.round((255 - b) * 0.85)).toString(16).padStart(2, "0")}`;
}

function hexToDark(hex: string): string {
  // Generate a darker version of any hex color (for hover)
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `#${Math.round(r * 0.82).toString(16).padStart(2, "0")}${Math.round(g * 0.82).toString(16).padStart(2, "0")}${Math.round(b * 0.82).toString(16).padStart(2, "0")}`;
}

function parseCustomTheme(themeId: string): { accent: string; accentDark: string; accentLight: string } | null {
  // Custom themes stored as "custom:#hexcolor"
  if (!themeId.startsWith("custom:")) return null;
  const accent = themeId.slice(7);
  if (!/^#[0-9a-fA-F]{6}$/.test(accent)) return null;
  return { accent, accentDark: hexToDark(accent), accentLight: hexToLight(accent) };
}

export default function AppearanceSection({ theme, onChangeTheme }: AppearanceSectionProps) {
  const customParsed = parseCustomTheme(theme);
  const isCustom = !!customParsed;
  const activeTheme: ThemeDefinition = customParsed
    ? { id: theme, label: "Custom", ...customParsed }
    : themes.find((t) => t.id === theme) || themes[0];

  const [customColor, setCustomColor] = useState(customParsed?.accent || "#2563eb");
  const [showCustom, setShowCustom] = useState(isCustom);

  // Sync custom color picker when theme changes externally
  useEffect(() => {
    const parsed = parseCustomTheme(theme);
    if (parsed) {
      setCustomColor(parsed.accent);
      setShowCustom(true);
    }
  }, [theme]);

  function applyCustomColor(hex: string) {
    setCustomColor(hex);
    onChangeTheme(`custom:${hex}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Appearance</h2>
        <p className="text-sm text-muted mt-1">Customize the look and feel of your workspace</p>
      </div>

      {/* Theme picker — presets */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Preset Themes</h4>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
            {themes.map((t) => {
              const isActive = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => { onChangeTheme(t.id); setShowCustom(false); }}
                  className={`group relative rounded-xl border-2 transition-all overflow-hidden ${isActive ? "border-foreground shadow-md ring-1 ring-foreground/10" : "border-border hover:border-gray-300 hover:shadow-sm"}`}
                  aria-label={`Select ${t.label} theme`}
                  aria-pressed={isActive}
                >
                  <div className="h-10 w-full" style={{ background: `linear-gradient(135deg, ${t.accent} 0%, ${t.accentDark} 100%)` }} />
                  <div className="px-2 py-2 bg-white flex items-center justify-between">
                    <span className="text-[10px] font-medium text-foreground truncate">{t.label}</span>
                    {isActive && <Check className="w-3 h-3 text-foreground shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Custom color picker */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Pipette className="w-4.5 h-4.5 text-gray-600" />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-semibold text-foreground">Custom Color</h4>
              <p className="text-xs text-muted">Pick your own brand color</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isCustom && (
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 rounded">Active</span>
            )}
            <div className="w-6 h-6 rounded-full border border-black/10" style={{ backgroundColor: customColor }} />
          </div>
        </button>

        {showCustom && (
          <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
            <div className="flex items-center gap-4">
              {/* Native color picker */}
              <div className="relative">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => applyCustomColor(e.target.value)}
                  className="w-16 h-16 rounded-xl border-2 border-border cursor-pointer"
                  style={{ padding: 0 }}
                />
              </div>

              {/* Hex input */}
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium text-muted block">Hex Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomColor(val);
                      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                        applyCustomColor(val);
                      }
                    }}
                    placeholder="#2563eb"
                    className="w-32 px-3 py-2 text-sm font-mono border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                    maxLength={7}
                  />
                  <button
                    onClick={() => applyCustomColor(customColor)}
                    disabled={!/^#[0-9a-fA-F]{6}$/.test(customColor)}
                    className="px-4 py-2 text-xs font-medium text-white bg-foreground hover:bg-foreground/90 rounded-lg transition-colors disabled:opacity-40"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Quick swatches */}
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">Quick picks</p>
              <div className="flex gap-2 flex-wrap">
                {["#dc2626", "#ea580c", "#d97706", "#16a34a", "#0891b2", "#2563eb", "#7c3aed", "#c026d3", "#e11d48", "#0f172a", "#475569", "#78716c"].map((color) => (
                  <button
                    key={color}
                    onClick={() => applyCustomColor(color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${customColor === color ? "border-foreground shadow-md" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live preview */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Preview</h4>
        </div>
        <div className="p-5 space-y-5">
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="h-10 flex items-center gap-2 px-4 border-b border-border bg-surface/50">
              <div className="w-5 h-5 rounded" style={{ backgroundColor: activeTheme.accent }} />
              <div className="h-2.5 w-20 rounded bg-gray-200" />
              <div className="ml-auto flex gap-2">
                <div className="h-2 w-12 rounded bg-gray-200" />
                <div className="h-2 w-12 rounded bg-gray-200" />
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-24 rounded bg-gray-200" />
                <div className="h-5 px-2 rounded-full text-[9px] font-semibold text-white flex items-center" style={{ backgroundColor: activeTheme.accent }}>Active</div>
              </div>
              <div className="h-1.5 rounded-full w-full" style={{ backgroundColor: activeTheme.accentLight }}>
                <div className="h-full rounded-full w-3/5 transition-colors" style={{ backgroundColor: activeTheme.accent }} />
              </div>
              <div className="flex gap-2 pt-1">
                <button className="px-3 py-1.5 text-[10px] font-semibold text-white rounded-md" style={{ backgroundColor: activeTheme.accent }}>Save Changes</button>
                <button className="px-3 py-1.5 text-[10px] font-semibold rounded-md border" style={{ color: activeTheme.accent, borderColor: activeTheme.accent }}>Cancel</button>
                <span className="px-3 py-1.5 text-[10px] font-medium" style={{ color: activeTheme.accent }}>Learn more</span>
              </div>
            </div>
          </div>

          {/* Color swatches */}
          <div className="flex items-center gap-6">
            {[
              { label: "Primary", color: activeTheme.accent },
              { label: "Hover", color: activeTheme.accentDark },
              { label: "Light", color: activeTheme.accentLight },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md shadow-sm border border-black/10" style={{ backgroundColor: s.color }} />
                <div className="text-[10px] text-muted">
                  <div className="font-semibold text-foreground">{s.label}</div>
                  <div className="font-mono">{s.color}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
