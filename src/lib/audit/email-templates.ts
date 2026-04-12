import type { SecurityFinding, SecuritySummary, HealthFinding, HealthSummary, FeatureUsageResult, AuditItem } from "./findings";

const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: "#fef2f2", text: "#dc2626" },
  high: { bg: "#fffbeb", text: "#d97706" },
  medium: { bg: "#eff6ff", text: "#2563eb" },
  low: { bg: "#f9fafb", text: "#6b7280" },
};

const HEALTH_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  down: { bg: "#fef2f2", text: "#dc2626", label: "DOWN" },
  degraded: { bg: "#fff7ed", text: "#ea580c", label: "DEGRADED" },
  warning: { bg: "#fffbeb", text: "#d97706", label: "WARNING" },
  healthy: { bg: "#f0fdf4", text: "#16a34a", label: "HEALTHY" },
};

function renderSeverityBadge(severity: string): string {
  const c = SEVERITY_COLORS[severity] || SEVERITY_COLORS.low;
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${c.bg};color:${c.text};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${severity}</span>`;
}

function renderHealthBadge(status: string): string {
  const c = HEALTH_COLORS[status] || HEALTH_COLORS.healthy;
  return `<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:${c.bg};color:${c.text};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${c.label}</span>`;
}

function renderStaticSection(title: string, items: AuditItem[]): string {
  const crit = items.filter((i) => i.severity === "critical").length;
  const high = items.filter((i) => i.severity === "high").length;
  const med = items.filter((i) => i.severity === "medium").length;
  const low = items.filter((i) => i.severity === "low").length;

  const topItems = items
    .filter((i) => i.severity === "critical" || i.severity === "high")
    .slice(0, 5);

  return `
    <div style="margin-bottom:24px;">
      <h3 style="font-size:15px;font-weight:700;color:#1a1a2e;margin:0 0 8px;">${title}</h3>
      <div style="display:flex;gap:12px;margin-bottom:12px;">
        <span style="font-size:12px;color:#666;">${items.length} total</span>
        ${crit > 0 ? `<span style="font-size:12px;color:#dc2626;font-weight:600;">${crit} critical</span>` : ""}
        ${high > 0 ? `<span style="font-size:12px;color:#d97706;font-weight:600;">${high} high</span>` : ""}
        ${med > 0 ? `<span style="font-size:12px;color:#2563eb;">${med} medium</span>` : ""}
        ${low > 0 ? `<span style="font-size:12px;color:#6b7280;">${low} low</span>` : ""}
      </div>
      ${
        topItems.length > 0
          ? `<table style="width:100%;border-collapse:collapse;">
              ${topItems
                .map(
                  (item) => `
                <tr>
                  <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;vertical-align:top;width:70px;">${renderSeverityBadge(item.severity)}</td>
                  <td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;">
                    <div style="font-size:13px;font-weight:600;color:#1a1a2e;">${item.title}</div>
                    <div style="font-size:11px;color:#888;margin-top:2px;">${item.description}</div>
                  </td>
                </tr>`,
                )
                .join("")}
            </table>`
          : `<div style="font-size:12px;color:#16a34a;font-weight:500;">No critical or high-priority items.</div>`
      }
    </div>
  `;
}

// ============================================================
// DAILY DIGEST EMAIL
// ============================================================

export function buildDailyDigestEmail(results: {
  security: { findings: SecurityFinding[]; summary: SecuritySummary; durationMs: number };
  featureUsage: FeatureUsageResult;
  techDebt: { findings: AuditItem[]; summary: { total: number; critical: number; high: number; medium: number; low: number } };
  uiux: { findings: AuditItem[]; summary: { total: number; critical: number; high: number; medium: number; low: number } };
  seo: { findings: AuditItem[]; summary: { total: number; critical: number; high: number; medium: number; low: number } };
}): { subject: string; html: string } {
  const { security, featureUsage, techDebt, uiux, seo } = results;

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "full",
    timeStyle: "short",
  });

  const totalSecurityIssues = security.summary.critical + security.summary.high;
  const subjectStatus =
    security.summary.critical > 0
      ? `[CRITICAL] ${security.summary.critical} critical security issue(s)`
      : totalSecurityIssues > 0
        ? `${totalSecurityIssues} security issue(s) found`
        : "All systems nominal";

  // Top security findings
  const topSecFindings = security.findings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 5);

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:640px;margin:0 auto;background:#ffffff;">
      <!-- Header -->
      <div style="padding:32px 24px 20px;background:#0f172a;border-radius:8px 8px 0 0;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <div style="width:40px;height:40px;background:#3b82f6;border-radius:10px;line-height:40px;text-align:center;">
            <span style="color:white;font-size:18px;font-weight:bold;">W</span>
          </div>
          <div>
            <h1 style="font-size:18px;font-weight:700;color:#ffffff;margin:0;">Daily System Audit</h1>
            <p style="font-size:12px;color:#94a3b8;margin:0;">${timestamp}</p>
          </div>
        </div>
      </div>

      <div style="padding:24px;">
        <!-- Security Scan -->
        <div style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
          <h2 style="font-size:15px;font-weight:700;color:#1a1a2e;margin:0 0 12px;">Security Scan</h2>
          <div style="display:flex;gap:16px;margin-bottom:12px;">
            <div style="text-align:center;">
              <div style="font-size:22px;font-weight:800;color:${security.summary.critical > 0 ? "#dc2626" : "#16a34a"};">${security.summary.total}</div>
              <div style="font-size:10px;color:#888;text-transform:uppercase;">Total</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:22px;font-weight:800;color:${security.summary.critical > 0 ? "#dc2626" : "#d1d5db"};">${security.summary.critical}</div>
              <div style="font-size:10px;color:#888;text-transform:uppercase;">Critical</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:22px;font-weight:800;color:${security.summary.high > 0 ? "#d97706" : "#d1d5db"};">${security.summary.high}</div>
              <div style="font-size:10px;color:#888;text-transform:uppercase;">High</div>
            </div>
            <div style="text-align:center;">
              <div style="font-size:22px;font-weight:800;color:#d1d5db;">${security.summary.medium}</div>
              <div style="font-size:10px;color:#888;text-transform:uppercase;">Medium</div>
            </div>
          </div>
          ${
            topSecFindings.length > 0
              ? `<table style="width:100%;border-collapse:collapse;">
                  ${topSecFindings
                    .map(
                      (f) => `
                    <tr>
                      <td style="padding:4px 8px 4px 0;vertical-align:top;width:70px;">${renderSeverityBadge(f.severity)}</td>
                      <td style="padding:4px 0;">
                        <span style="font-size:12px;font-weight:600;color:#1a1a2e;">${f.title}</span>
                      </td>
                    </tr>`,
                    )
                    .join("")}
                </table>`
              : `<div style="font-size:12px;color:#16a34a;font-weight:500;">All security checks passed.</div>`
          }
          <div style="font-size:10px;color:#aaa;margin-top:8px;">Scan took ${security.durationMs}ms</div>
        </div>

        <!-- Feature Usage -->
        <div style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
          <h2 style="font-size:15px;font-weight:700;color:#1a1a2e;margin:0 0 8px;">Feature Usage (24h)</h2>
          <div style="display:flex;gap:24px;margin-bottom:8px;">
            <div><span style="font-size:18px;font-weight:800;color:#1a1a2e;">${featureUsage.totalEvents.toLocaleString()}</span> <span style="font-size:11px;color:#888;">events</span></div>
            <div><span style="font-size:18px;font-weight:800;color:#1a1a2e;">${featureUsage.uniqueUsers}</span> <span style="font-size:11px;color:#888;">users</span></div>
            <div><span style="font-size:18px;font-weight:800;color:#1a1a2e;">${featureUsage.uniqueEvents}</span> <span style="font-size:11px;color:#888;">features</span></div>
          </div>
          ${
            featureUsage.topEvents.length > 0
              ? `<div style="font-size:11px;color:#666;">Top: ${featureUsage.topEvents
                  .slice(0, 5)
                  .map((e) => `${e.name} (${e.count})`)
                  .join(", ")}</div>`
              : `<div style="font-size:11px;color:#888;">No events tracked.</div>`
          }
        </div>

        <!-- Static Audits -->
        <div style="padding:16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
          ${renderStaticSection("Tech Debt", techDebt.findings)}
          ${renderStaticSection("UI / UX", uiux.findings)}
          ${renderStaticSection("Search & SEO", seo.findings)}
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;padding:16px 24px;border-top:1px solid #f0f0f0;border-radius:0 0 8px 8px;text-align:center;">
        <p style="font-size:11px;color:#999;margin:0;">WorkChores Automated Audit System</p>
      </div>
    </div>
  `;

  return {
    subject: `[WorkChores Audit] ${subjectStatus} — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    html,
  };
}

// ============================================================
// HEALTH ALERT EMAIL
// ============================================================

export function buildHealthAlertEmail(
  findings: HealthFinding[],
  summary: HealthSummary,
  durationMs: number,
): { subject: string; html: string } {
  const nonHealthy = findings.filter((f) => f.status !== "healthy");
  const worstStatus = nonHealthy.find((f) => f.status === "down")
    ? "DOWN"
    : nonHealthy.find((f) => f.status === "degraded")
      ? "DEGRADED"
      : "WARNING";

  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;">
      <div style="padding:24px;background:${worstStatus === "DOWN" ? "#dc2626" : worstStatus === "DEGRADED" ? "#ea580c" : "#d97706"};border-radius:8px 8px 0 0;">
        <h1 style="font-size:16px;font-weight:700;color:#ffffff;margin:0;">System Health Alert: ${worstStatus}</h1>
        <p style="font-size:12px;color:rgba(255,255,255,0.8);margin:4px 0 0;">${timestamp} — ${nonHealthy.length} issue(s) detected</p>
      </div>

      <div style="padding:20px;">
        <table style="width:100%;border-collapse:collapse;">
          ${nonHealthy
            .map(
              (f) => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #f0f0f0;vertical-align:top;width:80px;">${renderHealthBadge(f.status)}</td>
              <td style="padding:8px;border-bottom:1px solid #f0f0f0;">
                <div style="font-size:13px;font-weight:600;color:#1a1a2e;">${f.title}</div>
                <div style="font-size:11px;color:#888;margin-top:2px;">${f.description}</div>
                ${f.metric ? `<div style="font-size:10px;color:#aaa;margin-top:2px;">Metric: ${f.metric}</div>` : ""}
              </td>
            </tr>`,
            )
            .join("")}
        </table>

        <div style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:6px;font-size:11px;color:#666;">
          <strong>Summary:</strong> ${summary.healthy} healthy, ${summary.warning} warning, ${summary.degraded} degraded, ${summary.down} down — checked in ${durationMs}ms
        </div>
      </div>

      <div style="background:#f9fafb;padding:12px 20px;border-top:1px solid #f0f0f0;border-radius:0 0 8px 8px;text-align:center;">
        <p style="font-size:11px;color:#999;margin:0;">WorkChores Health Monitor — checks every 60 minutes</p>
      </div>
    </div>
  `;

  return {
    subject: `[WorkChores ${worstStatus}] ${nonHealthy.length} health issue(s) — ${new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })}`,
    html,
  };
}
