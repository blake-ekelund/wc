import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendTeamInviteEmail } from "@/lib/platform-email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, role, workspaceId, ownerLabel } = body;

    if (!email || !workspaceId) {
      return NextResponse.json({ error: "Email and workspace ID required" }, { status: 400 });
    }

    // Verify the requesting user is an admin/owner
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

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Check if already invited
    const { data: existingInvite } = await serviceClient
      .from("workspace_members")
      .select("id, status, user_id")
      .eq("workspace_id", workspaceId)
      .eq("invited_email", email)
      .single();

    if (existingInvite) {
      if (existingInvite.status === "active") {
        return NextResponse.json({ error: "This user is already a member" }, { status: 409 });
      }
      return NextResponse.json({ success: true, status: "pending", message: "Invite already pending" });
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const label = ownerLabel || email.split("@")[0];

    // Get workspace name and inviter name
    const { data: workspace } = await serviceClient
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .single();
    const workspaceName = workspace?.name || "WorkChores";

    const { data: inviterProfile } = await serviceClient
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const inviterName = inviterProfile?.full_name || user.email || "Your teammate";

    // Check if user already exists in auth
    const { data: usersData } = await serviceClient.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = usersData?.users?.find((u) => u.email === email);

    if (existingUser) {
      // Check if already a member by user_id
      const { data: existingMembership } = await serviceClient
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("user_id", existingUser.id)
        .single();

      if (existingMembership) {
        return NextResponse.json({ error: "This user is already a member" }, { status: 409 });
      }

      // Add as active member
      const { error: memberError } = await serviceClient
        .from("workspace_members")
        .insert({
          workspace_id: workspaceId,
          user_id: existingUser.id,
          role: role || "member",
          owner_label: label,
          invited_email: email,
          status: "active",
        });

      if (memberError) {
        console.error("Add existing user error:", memberError);
        return NextResponse.json({ error: memberError.message }, { status: 500 });
      }

      // Send notification via platform email
      await sendTeamInviteEmail({
        to: email,
        inviterName,
        workspaceName,
        actionUrl: `${origin}/app`,
        role: role || "member",
      });

      return NextResponse.json({ success: true, status: "active", message: "User added to workspace" });
    }

    // New user — create pending invite
    const signupUrl = `${origin}/signup?email=${encodeURIComponent(email)}&workspace=${workspaceId}`;

    const { error: memberError } = await serviceClient
      .from("workspace_members")
      .insert({
        workspace_id: workspaceId,
        user_id: null,
        role: role || "member",
        owner_label: label,
        invited_email: email,
        status: "pending",
      });

    if (memberError) {
      console.error("Create pending invite error:", memberError);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    // Send invite via platform email (SMTP)
    const emailSent = await sendTeamInviteEmail({
      to: email,
      inviterName,
      workspaceName,
      actionUrl: signupUrl,
      role: role || "member",
    });

    return NextResponse.json({
      success: true,
      status: "pending",
      message: emailSent ? `Invite sent to ${email}` : "Invite created. Share the signup link.",
      signupUrl: emailSent ? undefined : signupUrl,
    });
  } catch (err) {
    console.error("Invite error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
