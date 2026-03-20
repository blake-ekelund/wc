import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// GET: Owner clicks approval link from email
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return htmlResponse("Invalid Request", "No access token provided.", "error");
  }

  const db = getDb();

  // Look up the request
  const { data: accessReq, error } = await db
    .from("admin_access_requests")
    .select("id, workspace_id, status, expires_at")
    .eq("token", token)
    .single();

  if (error || !accessReq) {
    return htmlResponse("Not Found", "This access request does not exist or has already been used.", "error");
  }

  // Check if expired
  if (new Date(accessReq.expires_at) < new Date()) {
    await db.from("admin_access_requests").update({ status: "expired" }).eq("id", accessReq.id);
    return htmlResponse("Expired", "This access request has expired. The admin will need to send a new request.", "error");
  }

  // Check if already approved or used
  if (accessReq.status === "approved") {
    return htmlResponse("Already Approved", "You have already approved this access request.", "info");
  }
  if (accessReq.status === "used") {
    return htmlResponse("Already Used", "This access request has already been used.", "info");
  }
  if (accessReq.status === "expired") {
    return htmlResponse("Expired", "This access request has expired.", "error");
  }

  // Get workspace name for display
  const { data: workspace } = await db
    .from("workspaces")
    .select("name")
    .eq("id", accessReq.workspace_id)
    .single();

  // Show approval confirmation page
  const approveUrl = `${request.nextUrl.origin}/api/admin/approve-access?token=${token}&confirm=true`;

  return htmlResponse(
    "Admin Access Request",
    `<p>A WorkChores admin is requesting temporary access to view the workspace <strong>${escapeHtml(workspace?.name || "Unknown")}</strong>.</p>
     <p style="color:#6b7280;font-size:14px;margin-top:8px;">This grants read-only access for 30 minutes. You can deny this request by closing this page.</p>
     <form method="POST" action="${escapeHtml(approveUrl)}" style="margin-top:24px;">
       <input type="hidden" name="token" value="${escapeHtml(token)}" />
       <button type="submit" style="background:#10b981;color:white;border:none;padding:12px 32px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;">
         Approve Access
       </button>
     </form>`,
    "confirm"
  );
}

// POST: Owner confirms approval
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const token = formData.get("token") as string;

  if (!token) {
    return htmlResponse("Invalid Request", "No access token provided.", "error");
  }

  const db = getDb();

  const { data: accessReq, error } = await db
    .from("admin_access_requests")
    .select("id, workspace_id, status, expires_at")
    .eq("token", token)
    .single();

  if (error || !accessReq) {
    return htmlResponse("Not Found", "This access request does not exist.", "error");
  }

  if (new Date(accessReq.expires_at) < new Date()) {
    await db.from("admin_access_requests").update({ status: "expired" }).eq("id", accessReq.id);
    return htmlResponse("Expired", "This access request has expired.", "error");
  }

  if (accessReq.status !== "pending") {
    return htmlResponse("Already Processed", "This request has already been processed.", "info");
  }

  // Approve it
  await db
    .from("admin_access_requests")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", accessReq.id);

  return htmlResponse(
    "Access Approved",
    "The admin now has temporary read-only access to this workspace for 30 minutes. You can close this page.",
    "success"
  );
}

function htmlResponse(title: string, body: string, type: "error" | "success" | "info" | "confirm") {
  const colors = {
    error: { bg: "#fef2f2", accent: "#ef4444", icon: "\u2716" },
    success: { bg: "#f0fdf4", accent: "#10b981", icon: "\u2714" },
    info: { bg: "#eff6ff", accent: "#3b82f6", icon: "\u2139" },
    confirm: { bg: "#fffbeb", accent: "#f59e0b", icon: "\u26a0" },
  };
  const c = colors[type];
  const safeTitle = escapeHtml(title);

  return new NextResponse(
    `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeTitle} — WorkChores</title></head>
<body style="margin:0;padding:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:440px;width:100%;margin:24px;padding:32px;background:white;border-radius:16px;border:1px solid #e5e7eb;box-shadow:0 4px 24px rgba(0,0,0,0.06);text-align:center;">
    <div style="width:56px;height:56px;border-radius:50%;background:${c.bg};display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;color:${c.accent};">${c.icon}</div>
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">${safeTitle}</h1>
    <div style="color:#374151;font-size:15px;line-height:1.6;">${body}</div>
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #f3f4f6;font-size:12px;color:#9ca3af;">WorkChores Admin Security</div>
  </div>
</body></html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}
