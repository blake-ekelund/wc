import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRateLimiter } from "@/lib/rate-limit";

// 30 announcement fetches per minute per IP
const limiter = createRateLimiter({ max: 30, id: "announcements" });

export async function GET(request: NextRequest) {
  try {
    const blocked = limiter(request);
    if (blocked) return blocked;
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error } = await db
      .from("announcements")
      .select("id, title, message, type, created_at")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: data || [] });
  } catch {
    return NextResponse.json({ data: [] });
  }
}
