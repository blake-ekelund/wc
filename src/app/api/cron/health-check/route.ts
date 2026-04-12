import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runHealthCheck, saveAuditRun } from "@/lib/audit/run-audit";
import { buildHealthAlertEmail } from "@/lib/audit/email-templates";
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
    const result = await runHealthCheck(baseUrl, db);

    // Check if any findings are non-healthy
    const hasIssues = result.findings.some((f) => f.status !== "healthy");
    let emailSent = false;

    if (hasIssues) {
      const { subject, html } = buildHealthAlertEmail(result.findings, result.summary, result.durationMs);
      emailSent = await sendPlatformEmail({ to: ADMIN_EMAIL, subject, html });
    }

    // Save run to database
    await saveAuditRun(db, {
      audit_type: "health_check",
      trigger: "cron",
      summary: result.summary as unknown as Record<string, unknown>,
      findings: result.findings,
      email_sent: emailSent,
      duration_ms: result.durationMs,
    });

    return NextResponse.json({
      ok: true,
      hasIssues,
      emailSent,
      summary: result.summary,
    });
  } catch (error) {
    console.error("Health check cron error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
