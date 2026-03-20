import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRateLimiter } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validate-email";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client — bypasses RLS (demo users aren't authenticated)
function getClient() {
  return createClient(supabaseUrl, serviceRoleKey);
}

// Rate limiters: session starts are more restricted than heartbeats
const startLimiter = createRateLimiter({ max: 5, id: "demo-start" });
const otherLimiter = createRateLimiter({ max: 60, id: "demo-other" });

// --- Input validation ---
const MAX_STRING_LENGTH = 500;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizeString(val: unknown): string {
  if (typeof val !== "string") return "";
  return val.slice(0, MAX_STRING_LENGTH).trim();
}

function isValidUUID(val: unknown): val is string {
  return typeof val === "string" && UUID_REGEX.test(val);
}

function isValidStringArray(val: unknown, maxItems = 50): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .filter((item): item is string => typeof item === "string")
    .slice(0, maxItems)
    .map((s) => s.slice(0, 100));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (typeof action !== "string") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Rate limit check using shared limiter
    const limiter = action === "start" ? startLimiter : otherLimiter;
    const blocked = limiter(request);
    if (blocked) return blocked;

    const supabase = getClient();

    if (action === "start") {
      // Create a new demo session with sanitized inputs
      const { data, error } = await supabase
        .from("demo_sessions")
        .insert({
          email: isValidEmail(body.email) ? sanitizeString(body.email) : "",
          name: sanitizeString(body.name),
          industry: sanitizeString(body.industry),
          referrer: sanitizeString(body.referrer),
          user_agent: sanitizeString(body.userAgent),
          pages_visited: ["dashboard"],
          features_used: [],
        })
        .select("id")
        .single();

      if (error) {
        console.error("Demo track start error:", error);
        return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
      }

      return NextResponse.json({ sessionId: data.id });
    }

    if (action === "heartbeat") {
      // Update session duration and last active time
      const { sessionId, durationSeconds } = body;
      if (!isValidUUID(sessionId)) {
        return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
      }

      const duration = typeof durationSeconds === "number" ? Math.max(0, Math.min(durationSeconds, 86400)) : 0;
      const updateData: Record<string, unknown> = {
        last_active_at: new Date().toISOString(),
        duration_seconds: duration,
      };
      const pagesVisited = isValidStringArray(body.pagesVisited);
      const featuresUsed = isValidStringArray(body.featuresUsed);
      if (pagesVisited.length) updateData.pages_visited = pagesVisited;
      if (featuresUsed.length) updateData.features_used = featuresUsed;

      const { error } = await supabase
        .from("demo_sessions")
        .update(updateData)
        .eq("id", sessionId);

      if (error) console.error("Demo track heartbeat error:", error);

      return NextResponse.json({ ok: true });
    }

    if (action === "signup_click") {
      // Track when user clicks signup
      const { sessionId } = body;
      if (!isValidUUID(sessionId)) {
        return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
      }

      const { error } = await supabase
        .from("demo_sessions")
        .update({
          clicked_signup: true,
          clicked_signup_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) console.error("Demo track signup click error:", error);

      return NextResponse.json({ ok: true });
    }

    if (action === "converted") {
      // Track when user completes signup
      const { sessionId } = body;
      if (!isValidUUID(sessionId)) {
        return NextResponse.json({ error: "Invalid sessionId" }, { status: 400 });
      }

      const { error } = await supabase
        .from("demo_sessions")
        .update({
          converted_to_user: true,
          converted_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) console.error("Demo track conversion error:", error);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Demo track error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
