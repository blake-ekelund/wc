import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createRateLimiter } from "@/lib/rate-limit";

function getServiceDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// 100 requests per minute per IP (events are batched, so this is generous)
const limiter = createRateLimiter({ max: 100, id: "track-events" });

export async function POST(request: NextRequest) {
  try {
    const blocked = limiter(request);
    if (blocked) return blocked;

    const { events } = await request.json();
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ ok: true });
    }

    // Try to get authenticated user (optional — anonymous events are allowed)
    let userId: string | null = null;
    let workspaceId: string | null = null;
    try {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        // Look up workspace from workspace_members
        const db = getServiceDb();
        const { data: membership } = await db
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", user.id)
          .limit(1)
          .single();
        if (membership) {
          workspaceId = membership.workspace_id;
        }
      }
    } catch {
      // Anonymous event — continue without user context
    }

    const db = getServiceDb();

    // Validate and insert batch (cap at 20 events per request)
    const rows = events.slice(0, 20).map((e: { event?: string; properties?: Record<string, unknown>; timestamp?: string }) => ({
      user_id: userId,
      workspace_id: workspaceId,
      event_name: typeof e.event === "string" ? e.event.slice(0, 200) : "unknown",
      properties: e.properties && typeof e.properties === "object" ? e.properties : null,
      created_at: typeof e.timestamp === "string" ? e.timestamp : new Date().toISOString(),
    }));

    await db.from("feature_events").insert(rows);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // never error to client
  }
}
