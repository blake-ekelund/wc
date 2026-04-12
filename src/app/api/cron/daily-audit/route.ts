import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runSecurityScan, getFeatureUsage, getStaticAuditReport, saveAuditRun } from "@/lib/audit/run-audit";
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
    // 1. Security scan
    const security = await runSecurityScan(baseUrl, db);
    await saveAuditRun(db, {
      audit_type: "security_scan",
      trigger: "cron",
      summary: security.summary as unknown as Record<string, unknown>,
      findings: security.findings,
      email_sent: false,
      duration_ms: security.durationMs,
    });

    // 2. Feature usage (last 1 day)
    const featureUsage = await getFeatureUsage(db, 1);
    await saveAuditRun(db, {
      audit_type: "feature_usage",
      trigger: "cron",
      summary: { totalEvents: featureUsage.totalEvents, uniqueUsers: featureUsage.uniqueUsers, period: featureUsage.period },
      findings: featureUsage.topEvents,
      email_sent: false,
      duration_ms: 0,
    });

    // 3. Static audits
    const techDebt = getStaticAuditReport("tech_debt");
    await saveAuditRun(db, {
      audit_type: "tech_debt",
      trigger: "cron",
      summary: techDebt.summary as unknown as Record<string, unknown>,
      findings: techDebt.findings,
      email_sent: false,
      duration_ms: 0,
    });

    const uiux = getStaticAuditReport("uiux");
    await saveAuditRun(db, {
      audit_type: "uiux",
      trigger: "cron",
      summary: uiux.summary as unknown as Record<string, unknown>,
      findings: uiux.findings,
      email_sent: false,
      duration_ms: 0,
    });

    const seo = getStaticAuditReport("seo");
    await saveAuditRun(db, {
      audit_type: "seo",
      trigger: "cron",
      summary: seo.summary as unknown as Record<string, unknown>,
      findings: seo.findings,
      email_sent: false,
      duration_ms: 0,
    });

    // 4. Build and send daily digest email
    const { subject, html } = buildDailyDigestEmail({
      security,
      featureUsage,
      techDebt,
      uiux,
      seo,
    });

    const emailSent = await sendPlatformEmail({ to: ADMIN_EMAIL, subject, html });

    return NextResponse.json({
      ok: true,
      emailSent,
      security: security.summary,
      featureUsage: { totalEvents: featureUsage.totalEvents, uniqueUsers: featureUsage.uniqueUsers },
      techDebt: techDebt.summary,
      uiux: uiux.summary,
      seo: seo.summary,
    });
  } catch (error) {
    console.error("Daily audit cron error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
