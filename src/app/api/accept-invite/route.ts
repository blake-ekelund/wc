import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { syncSeatsForWorkspace } from "@/lib/sync-seats";

export async function POST(request: Request) {
  try {
    const { workspaceId } = await request.json();

    // Verify the user is authenticated — use their real identity, not client input
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = user.id;
    const email = user.email;

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    let matched = false;

    // 1. Check for pending invites by email
    const { data: pendingByEmail } = await serviceClient
      .from("workspace_members")
      .select("id, workspace_id")
      .eq("invited_email", email)
      .eq("status", "pending");

    if (pendingByEmail && pendingByEmail.length > 0) {
      // Activate all pending invites for this email
      await serviceClient
        .from("workspace_members")
        .update({ status: "active", user_id: userId })
        .eq("invited_email", email)
        .eq("status", "pending");
      matched = true;
    }

    // 2. Check for pending invites by user_id (if Supabase created the user during invite)
    const { data: pendingByUser } = await serviceClient
      .from("workspace_members")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "pending");

    if (pendingByUser && pendingByUser.length > 0) {
      await serviceClient
        .from("workspace_members")
        .update({ status: "active" })
        .eq("user_id", userId)
        .eq("status", "pending");
      matched = true;
    }

    // 3. If workspace ID was in the URL, check if there's a matching invite
    if (workspaceId && !matched) {
      const { data: specificInvite } = await serviceClient
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("invited_email", email)
        .single();

      if (specificInvite) {
        await serviceClient
          .from("workspace_members")
          .update({ status: "active", user_id: userId })
          .eq("id", specificInvite.id);
        matched = true;
      }
    }

    // Check if user now has any active workspace
    const { data: activeMemberships } = await serviceClient
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1);

    // Sync Stripe seat count if member was activated
    if (matched && activeMemberships && activeMemberships.length > 0) {
      syncSeatsForWorkspace(activeMemberships[0].workspace_id);
    }

    return NextResponse.json({
      matched,
      redirectToApp: activeMemberships && activeMemberships.length > 0,
    });
  } catch (err) {
    console.error("Accept invite error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
