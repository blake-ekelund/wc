import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runSecurityScan, getFeatureUsage, runSeoScan, runUxScan, saveAuditRun } from "@/lib/audit/run-audit";
import { buildDailyDigestEmail } from "@/lib/audit/email-templates";
import { sendPlatformEmail } from "@/lib/platform-email";

const ADMIN_EMAIL = "blake.ekelund@workchores.com";

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const baseUrl = process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;

  try {
    // 1. Security scan (live — probes endpoints, checks auth, validates env)
    const security = await runSecurityScan(baseUrl, db);
    await saveAuditRun(db, {
      audit_type: "security_scan",
      trigger: "cron",
      summary: security.summary as unknown as Record<string, unknown>,
      findings: security.findings,
      email_sent: false,
      duration_ms: security.durationMs,
    });

    // 2. Feature usage (live — queries feature_events table)
    const featureUsage = await getFeatureUsage(db, 1);
    await saveAuditRun(db, {
      audit_type: "feature_usage",
      trigger: "cron",
      summary: { totalEvents: featureUsage.totalEvents, uniqueUsers: featureUsage.uniqueUsers, period: featureUsage.period },
      findings: featureUsage.topEvents,
      email_sent: false,
      duration_ms: 0,
    });

    // 3. SEO scan (live — probes sitemap, robots.txt, metadata, OG tags, schemas, headers)
    const seo = await runSeoScan(baseUrl);
    await saveAuditRun(db, {
      audit_type: "seo",
      trigger: "cron",
      summary: seo.summary as unknown as Record<string, unknown>,
      findings: seo.findings,
      email_sent: false,
      duration_ms: seo.durationMs,
    });

    // 4. UX scan (live — checks skip-nav, ARIA live regions, form hints)
    const ux = await runUxScan(baseUrl);
    await saveAuditRun(db, {
      audit_type: "uiux",
      trigger: "cron",
      summary: ux.summary as unknown as Record<string, unknown>,
      findings: ux.findings,
      email_sent: false,
      duration_ms: ux.durationMs,
    });

    // 5. Build and send daily digest email
    const { subject, html } = buildDailyDigestEmail({
      security,
      featureUsage,
      seo,
      ux,
    });

    const emailSent = await sendPlatformEmail({ to: ADMIN_EMAIL, subject, html });

    return NextResponse.json({
      ok: true,
      emailSent,
      security: security.summary,
      featureUsage: { totalEvents: featureUsage.totalEvents, uniqueUsers: featureUsage.uniqueUsers },
      seo: seo.summary,
      ux: ux.summary,
    });
  } catch (error) {
    console.error("Daily audit cron error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
