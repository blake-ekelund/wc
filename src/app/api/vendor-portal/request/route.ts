import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { sendVendorPortalEmail } from "@/lib/vendor-portal-email";
import { createRateLimiter } from "@/lib/rate-limit";

const limiter = createRateLimiter({ max: 10, id: "vendor-portal-request" });

export async function POST(request: NextRequest) {
  try {
    const blocked = limiter(request);
    if (blocked) return blocked;

    const body = await request.json();
    const { vendorId, workspaceId, requestedDocs } = body;

    if (!vendorId || !workspaceId || !requestedDocs?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify authenticated user is admin/owner in workspace
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
      return NextResponse.json({ error: "Only admins can request documents" }, { status: 403 });
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Get vendor info
    const { data: vendor } = await serviceClient
      .from("vendors")
      .select("name, email")
      .eq("id", vendorId)
      .eq("workspace_id", workspaceId)
      .single();

    if (!vendor || !vendor.email) {
      return NextResponse.json({ error: "Vendor not found or has no email" }, { status: 404 });
    }

    // Get workspace name
    const { data: workspace } = await serviceClient
      .from("workspaces")
      .select("name")
      .eq("id", workspaceId)
      .single();

    // Upsert token (one per vendor, replaces old)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: token, error: tokenError } = await serviceClient
      .from("vendor_portal_tokens")
      .upsert(
        {
          workspace_id: workspaceId,
          vendor_id: vendorId,
          requested_docs: requestedDocs,
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: "vendor_id" },
      )
      .select("id")
      .single();

    if (tokenError || !token) {
      console.error("Token creation error:", tokenError);
      return NextResponse.json({ error: "Failed to create portal link" }, { status: 500 });
    }

    // Build portal URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${request.headers.get("host")}`;
    const portalUrl = `${baseUrl}/vendor-portal/${token.id}`;

    // Send email
    const sent = await sendVendorPortalEmail({
      to: vendor.email,
      vendorName: vendor.name,
      workspaceName: workspace?.name || "Your client",
      requestedDocs,
      portalUrl,
    });

    return NextResponse.json({ success: true, sent, portalUrl });
  } catch (err) {
    console.error("Vendor portal request error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
