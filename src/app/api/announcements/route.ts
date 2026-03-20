import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
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
