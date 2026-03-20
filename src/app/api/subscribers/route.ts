import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// POST - subscribe an email
export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json();

    if (!email?.trim() || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const db = getDb();

    // Upsert - if they already subscribed, just update the source/timestamp
    const { error } = await db
      .from("subscribers")
      .upsert(
        {
          email: email.trim().toLowerCase(),
          source: source || "newsletter-popup",
          subscribed_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    if (error) {
      console.error("Subscriber insert error:", error);
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscriber API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
