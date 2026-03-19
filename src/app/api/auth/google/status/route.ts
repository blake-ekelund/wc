import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ connected: false });
  }

  const { data } = await supabase
    .from("email_connections")
    .select("email, provider, connected_at")
    .eq("user_id", user.id)
    .eq("provider", "google")
    .single();

  if (!data) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    email: data.email,
    provider: data.provider,
    connectedAt: data.connected_at,
  });
}
