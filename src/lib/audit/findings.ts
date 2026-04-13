// ============================================================
// Shared audit finding types and static finding arrays
// Used by both admin page (client) and cron routes (server)
// ============================================================

export type AuditSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface AuditItem {
  id: string;
  severity: AuditSeverity;
  title: string;
  description: string;
  category: string;
  file?: string;
}

export type SecurityFinding = {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  category: string;
};

export type HealthFinding = {
  id: string;
  status: "healthy" | "warning" | "degraded" | "down";
  title: string;
  description: string;
  category: string;
  metric?: string;
};

export type SecuritySummary = {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  scannedAt: string;
};

export type HealthSummary = {
  total: number;
  healthy: number;
  warning: number;
  degraded: number;
  down: number;
  checkedAt: string;
};

export type FeatureUsageResult = {
  topEvents: { name: string; count: number }[];
  dailyActivity: { date: string; count: number }[];
  totalEvents: number;
  uniqueEvents: number;
  uniqueUsers: number;
  period: number;
  priorPeriodEvents?: number;
  priorPeriodUsers?: number;
};

// ============================================================
// TECH DEBT findings
// ============================================================

export const techDebtFindings: AuditItem[] = [
  { id: "td-no-tests", severity: "critical", title: "No test coverage", description: "Zero test files found. No Jest, Vitest, or Playwright config. Critical paths (auth, CRUD, billing) have no automated tests.", category: "Testing", file: "package.json" },
  { id: "td-console-logs", severity: "high", title: "Console statements in production code", description: "console.error() calls found in admin/page.tsx, API routes (accept-invite, admin, app/page.tsx). Replace with structured logging.", category: "Code Quality", file: "src/app/api/admin/route.ts" },
  { id: "td-hardcoded-values", severity: "medium", title: "Hardcoded config values", description: "Gmail rate limits, session token keys, timeout values, support hours hardcoded as strings. Extract to constants file.", category: "Code Quality", file: "src/components/support-chat.tsx" },
  { id: "td-duplicate-form-logic", severity: "medium", title: "Duplicated form submission pattern", description: "Same setLoading > fetch > catch > setLoading pattern in signup, signin, contact, support. Extract to useFormSubmit() hook.", category: "Code Quality", file: "src/app/signup/page.tsx" },
  { id: "td-duplicate-click-outside", severity: "low", title: "Duplicated click-outside pattern", description: "Manual useEffect with mousedown listener repeated in navbar, dropdowns, and modals. Extract to useClickOutside() hook.", category: "Code Quality", file: "src/components/navbar-simple.tsx" },
  { id: "td-color-constants-scattered", severity: "low", title: "Color constants scattered across files", description: "touchpointColors, roleColors, priorityColors defined inline in multiple view files. Consolidate to a shared constants file.", category: "Code Quality", file: "src/components/demo/views/" },
  { id: "td-error-boundary-limited", severity: "medium", title: "Error boundaries not wrapping feature areas", description: "ErrorBoundary component exists but is not used around individual CRM views, support chat, or import/export operations.", category: "Reliability", file: "src/components/error-boundary.tsx" },
  { id: "td-error-boundary-raw-msg", severity: "medium", title: "Error boundary shows raw error.message", description: "ErrorBoundary displays unfiltered error messages to users. Should show user-friendly text and log details server-side.", category: "Reliability", file: "src/components/error-boundary.tsx" },
  { id: "td-framer-bundle", severity: "low", title: "Framer Motion adds ~40kb to bundle", description: "framer-motion is used for landing page animations. Consider CSS animations for simpler effects to reduce bundle size.", category: "Performance", file: "package.json" },
  { id: "td-middleware-deprecated", severity: "medium", title: "Middleware file convention deprecated", description: "Next.js 16 warns: The middleware file convention is deprecated. Please use proxy instead. Migration needed.", category: "Framework", file: "src/middleware.ts" },
  { id: "td-npm-audit", severity: "high", title: "Vulnerable dependencies detected", description: "npm audit shows vulnerabilities in next, nodemailer (SMTP injection), picomatch (ReDoS), flatted (prototype pollution). Run npm audit fix.", category: "Dependencies", file: "package.json" },
];

// ============================================================
// UI/UX findings
// ============================================================

export const uiuxFindings: AuditItem[] = [
  { id: "ux-no-skip-nav", severity: "medium", title: "No skip-to-content link", description: "Missing skip navigation link for keyboard and screen reader users. Add as first focusable element in layout.", category: "Accessibility", file: "src/app/layout.tsx" },
  { id: "ux-no-aria-live", severity: "medium", title: "No ARIA live regions for dynamic content", description: "Toast notifications, feature carousel updates, and chat messages don't announce to screen readers.", category: "Accessibility", file: "src/components/support-chat.tsx" },
  { id: "ux-icon-buttons-no-label", severity: "medium", title: "Icon-only buttons missing aria-labels", description: "Several icon-only buttons in CRM views lack aria-label attributes, making them invisible to assistive technology.", category: "Accessibility", file: "src/components/demo/views/" },
  { id: "ux-no-focus-management", severity: "medium", title: "No focus management for modals/overlays", description: "When modals or slide-over panels open, focus is not trapped inside. Users can tab behind overlays.", category: "Accessibility", file: "src/components/demo/demo-app.tsx" },
  { id: "ux-loading-gaps", severity: "low", title: "Missing loading states for async operations", description: "Contact/task detail operations, demo mode KB matching, and initial app load show text-only or no loading indicators.", category: "Loading States", file: "src/app/app/page.tsx" },
  { id: "ux-no-field-errors", severity: "medium", title: "No inline field-level validation errors", description: "Form validation only shows top-level error banner. Individual fields don't highlight with error messages.", category: "Forms", file: "src/app/signup/page.tsx" },
  { id: "ux-password-hint-in-placeholder", severity: "low", title: "Password requirements only in placeholder", description: "At least 8 characters is in placeholder text and disappears when typing. Show as persistent hint below field.", category: "Forms", file: "src/app/signup/page.tsx" },
  { id: "ux-color-contrast", severity: "medium", title: "Potential color contrast issues", description: "Multiple pale gray text colors (text-gray-400, text-gray-300) on white backgrounds may fail WCAG AA 4.5:1 ratio.", category: "Accessibility", file: "globals.css" },
  { id: "ux-no-empty-search", severity: "low", title: "No illustration on empty search results", description: "Filtered contact/task lists show text-only empty states. Add illustrations or clearer CTAs.", category: "Empty States", file: "src/components/demo/views/contacts-view.tsx" },
  { id: "ux-bulk-email-no-retry", severity: "low", title: "No retry UI for failed bulk operations", description: "Bulk email sends in contacts-view set error state but provide no retry mechanism for the user.", category: "Error Handling", file: "src/components/demo/views/contacts-view.tsx" },
];

// ============================================================
// SEO findings
// ============================================================

export const seoFindings: AuditItem[] = [
  { id: "seo-no-sitemap", severity: "critical", title: "No sitemap.xml", description: "No sitemap.xml in public/ and no dynamic sitemap route. Search engines can't systematically discover all pages.", category: "Crawlability", file: "public/" },
  { id: "seo-no-robots", severity: "critical", title: "No robots.txt", description: "No robots.txt file. Search engines have no crawl directives, rate limits, or sitemap pointer.", category: "Crawlability", file: "public/" },
  { id: "seo-missing-metadata-9", severity: "high", title: "9 pages missing metadata", description: "About, Contact, Blog index, Sign In, Sign Up, Privacy, Terms, Forgot/Reset Password pages have no title or description exports.", category: "Metadata", file: "src/app/about/page.tsx" },
  { id: "seo-no-og-tags", severity: "high", title: "OpenGraph tags missing on most pages", description: "Only 2 blog posts have OG tags. Homepage, CRM, and all product pages lack them causing broken social sharing previews.", category: "Social Sharing", file: "src/app/page.tsx" },
  { id: "seo-no-twitter-cards", severity: "medium", title: "No Twitter Card meta tags", description: "twitter:card, twitter:title, twitter:description not set on any page. X/Twitter shares show generic previews.", category: "Social Sharing", file: "src/app/layout.tsx" },
  { id: "seo-no-org-schema", severity: "high", title: "No Organization JSON-LD schema", description: "Homepage lacks Organization schema (name, logo, URL, contact). Needed for Google Knowledge Panel.", category: "Structured Data", file: "src/app/page.tsx" },
  { id: "seo-no-product-schema", severity: "medium", title: "No Product/SoftwareApplication schema", description: "CRM and product pages lack Product or SoftwareApplication schema for rich search results.", category: "Structured Data", file: "src/app/crm/page.tsx" },
  { id: "seo-missing-canonical", severity: "medium", title: "Canonical URLs missing on most pages", description: "Only 2 blog posts set canonical URLs. All other pages risk duplicate content issues.", category: "Metadata", file: "src/app/layout.tsx" },
  { id: "seo-no-llms-txt", severity: "medium", title: "No llms.txt for AI discoverability", description: "No llms.txt file for AI crawlers (ChatGPT, Perplexity, Claude). Missing opportunity for AI search visibility.", category: "AI Search", file: "public/" },
  { id: "seo-no-breadcrumb-schema", severity: "low", title: "No BreadcrumbList schema", description: "No breadcrumb structured data for navigation hierarchy. Reduces chances of breadcrumb display in search results.", category: "Structured Data", file: "src/app/layout.tsx" },
  { id: "seo-no-security-headers", severity: "medium", title: "No security headers in next.config", description: "Missing CSP, X-Frame-Options, X-Content-Type-Options. Affects both security posture and Google trust signals.", category: "Technical SEO", file: "next.config.ts" },
  { id: "seo-hardcoded-urls", severity: "low", title: "Hardcoded canonical URLs in blog posts", description: "Blog canonical URLs are hardcoded strings. If domain changes, they will break. Use env variable instead.", category: "Metadata", file: "src/app/blog/" },
];
