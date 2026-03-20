import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { syncSeatsForWorkspace } from "@/lib/sync-seats";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if this user was invited (has pending memberships)
        const serviceClient = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );

        // Activate any pending memberships for this user
        await serviceClient
          .from("workspace_members")
          .update({ status: "active" })
          .eq("user_id", user.id)
          .eq("status", "pending");

        // Also check by email for any pending invitations
        if (user.email) {
          const { data: pendingByEmail } = await serviceClient
            .from("workspace_members")
            .select("id")
            .eq("invited_email", user.email)
            .eq("status", "pending");

          if (pendingByEmail && pendingByEmail.length > 0) {
            await serviceClient
              .from("workspace_members")
              .update({ status: "active", user_id: user.id })
              .eq("invited_email", user.email)
              .eq("status", "pending");
          }
        }

        // Check if user has any active workspace
        const { data: memberships } = await serviceClient
          .from("workspace_members")
          .select("workspace_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1);

        if (memberships && memberships.length > 0) {
          // Sync Stripe seat count (non-blocking)
          syncSeatsForWorkspace(memberships[0].workspace_id);
          return NextResponse.redirect(`${origin}${next || "/app"}`);
        }
      }

      // No workspace — send to onboarding
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth`);
}
