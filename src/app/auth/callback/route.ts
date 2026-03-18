import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if user already has a workspace
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: memberships } = await supabase
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1);

        if (memberships && memberships.length > 0) {
          // Has a workspace — go to app or requested page
          return NextResponse.redirect(`${origin}${next || "/app"}`);
        }
      }

      // No workspace — send to onboarding
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  // Return the user to signin with an error
  return NextResponse.redirect(`${origin}/signin?error=auth`);
}
