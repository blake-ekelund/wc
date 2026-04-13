export interface ThemeDefinition {
  id: string;
  label: string;
  accent: string;
  accentDark: string;
  accentLight: string;
}

export const themes: ThemeDefinition[] = [
  { id: "blue", label: "Default Blue", accent: "#2563eb", accentDark: "#1d4ed8", accentLight: "#dbeafe" },
  { id: "indigo", label: "Indigo", accent: "#4f46e5", accentDark: "#4338ca", accentLight: "#e0e7ff" },
  { id: "purple", label: "Purple", accent: "#7c3aed", accentDark: "#6d28d9", accentLight: "#ede9fe" },
  { id: "rose", label: "Rose", accent: "#e11d48", accentDark: "#be123c", accentLight: "#ffe4e6" },
  { id: "orange", label: "Orange", accent: "#ea580c", accentDark: "#c2410c", accentLight: "#fff7ed" },
  { id: "green", label: "Forest Green", accent: "#16a34a", accentDark: "#15803d", accentLight: "#dcfce7" },
  { id: "teal", label: "Teal", accent: "#0d9488", accentDark: "#0f766e", accentLight: "#ccfbf1" },
  { id: "slate", label: "Slate", accent: "#475569", accentDark: "#334155", accentLight: "#f1f5f9" },
];

export const defaultTheme = themes[0];

export function getTheme(id: string): ThemeDefinition {
  return themes.find((t) => t.id === id) || defaultTheme;
}

export function getThemeCssVars(theme: ThemeDefinition): Record<string, string> {
  return {
    "--accent": theme.accent,
    "--accent-dark": theme.accentDark,
    "--accent-light": theme.accentLight,
    "--color-accent": theme.accent,
    "--color-accent-dark": theme.accentDark,
    "--color-accent-light": theme.accentLight,
  };
}
