import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, role, workspaceId, ownerLabel } = body;

    if (!email || !workspaceId) {
      return NextResponse.json({ error: "Email and workspace ID required" }, { status: 400 });
    }

    // Verify the requesting user is an admin/owner of this workspace
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Only admins can invite members" }, { status: 403 });
    }

    // Get workspace name for the invite email
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .single();

    // Check if email is already a member
    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("id, status")
      .eq("workspace_id", workspaceId)
      .eq("invited_email", email)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: "This email has already been invited" }, { status: 409 });
    }

    // Use service role client to invite the user
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Check if user already exists in auth
    const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    if (existingUser) {
      // User exists — just add them to the workspace as pending
      // and check if they already have a membership
      const { data: existingUserMembership } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("user_id", existingUser.id)
        .single();

      if (existingUserMembership) {
        return NextResponse.json({ error: "This user is already a member" }, { status: 409 });
      }

      // Add as active member since they already have an account
      const { error: memberError } = await serviceClient
        .from("workspace_members")
        .insert({
          workspace_id: workspaceId,
          user_id: existingUser.id,
          role: role || "member",
          owner_label: ownerLabel || email.split("@")[0],
          invited_email: email,
          status: "active",
        });

      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, status: "active", message: "User added to workspace" });
    }

    // User doesn't exist — invite them via Supabase auth
    const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
      data: {
        invited_to_workspace: workspaceId,
        invited_role: role || "member",
        invited_owner_label: ownerLabel || email.split("@")[0],
      },
      redirectTo: `${new URL(request.url).origin}/auth/callback?next=/app`,
    });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }

    // Insert pending workspace member with the invited user's ID
    const { error: memberError } = await serviceClient
      .from("workspace_members")
      .insert({
        workspace_id: workspaceId,
        user_id: inviteData.user.id,
        role: role || "member",
        owner_label: ownerLabel || email.split("@")[0],
        invited_email: email,
        status: "pending",
      });

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: "pending",
      message: `Invite sent to ${email}`,
      workspaceName: workspace?.name,
    });
  } catch (err) {
    console.error("Invite error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
