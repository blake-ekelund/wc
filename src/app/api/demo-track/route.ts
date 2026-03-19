import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client — bypasses RLS (demo users aren't authenticated)
function getClient() {
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const supabase = getClient();

    if (action === "start") {
      // Create a new demo session
      const { email, name, industry, referrer, userAgent } = body;
      const { data, error } = await supabase
        .from("demo_sessions")
        .insert({
          email: email || "",
          name: name || "",
          industry: industry || "",
          referrer: referrer || "",
          user_agent: userAgent || "",
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
      const { sessionId, durationSeconds, pagesVisited, featuresUsed } = body;
      if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

      const updateData: Record<string, unknown> = {
        last_active_at: new Date().toISOString(),
        duration_seconds: durationSeconds || 0,
      };
      if (pagesVisited?.length) updateData.pages_visited = pagesVisited;
      if (featuresUsed?.length) updateData.features_used = featuresUsed;

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
      if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

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
      if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

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
