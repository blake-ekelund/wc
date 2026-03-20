import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { createRateLimiter } from "@/lib/rate-limit";

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Generate a daily anonymous visitor ID from IP + User-Agent
function getVisitorId(request: NextRequest): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  const day = new Date().toISOString().slice(0, 10); // daily rotation
  return crypto.createHash("sha256").update(`${ip}:${ua}:${day}`).digest("hex").slice(0, 16);
}

// 60 page track events per minute per IP
const limiter = createRateLimiter({ max: 60, id: "track" });

export async function POST(request: NextRequest) {
  try {
    const blocked = limiter(request);
    if (blocked) return blocked;

    const { page, referrer } = await request.json();
    if (!page) return NextResponse.json({ ok: true }); // silently ignore

    const db = getDb();
    const visitorId = getVisitorId(request);

    await db.from("page_views").insert({
      visitor_id: visitorId,
      page: page.slice(0, 200),
      referrer: referrer?.slice(0, 500) || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // never error to client
  }
}
