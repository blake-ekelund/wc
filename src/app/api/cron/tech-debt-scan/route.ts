import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { saveAuditRun } from "@/lib/audit/run-audit";

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  // Verify cron secret (same as other cron endpoints)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { findings, summary, durationMs } = body;

    if (!findings || !summary) {
      return NextResponse.json({ error: "Missing findings or summary" }, { status: 400 });
    }

    const db = getDb();
    await saveAuditRun(db, {
      audit_type: "tech_debt",
      trigger: "cron",
      summary: summary as Record<string, unknown>,
      findings,
      email_sent: false,
      duration_ms: durationMs || 0,
    });

    return NextResponse.json({ ok: true, findingsCount: findings.length });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
