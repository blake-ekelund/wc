import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const SUPPORT_EMAIL = "blake.ekelund@workchores.com";
// Your admin user ID in Supabase — the account that has Gmail connected
const ADMIN_USER_ID = process.env.SUPPORT_ADMIN_USER_ID || "";

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Try to get user info if authenticated
    let userInfo = "Anonymous visitor";
    let userEmail = "unknown";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userEmail = user.email || "no-email";
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        userInfo = `${profile?.full_name || "User"} (${userEmail})`;
      }
    } catch {
      // Not authenticated — that's fine
    }

    const referer = request.headers.get("referer") || "unknown page";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!serviceRoleKey || !supabaseUrl) {
      console.error("Missing Supabase credentials");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const adminDb = createAdminClient(supabaseUrl, serviceRoleKey);

    // Save to support_messages table
    const { error: insertError } = await adminDb.from("support_messages").insert({
      message: message.trim(),
      user_email: userEmail,
      user_info: userInfo,
      page_url: referer,
      status: "new",
    });

    if (insertError) {
      console.warn("Could not save support message:", insertError.message);
    }

    // Send email notification via YOUR admin Gmail account
    // Look up the admin's email_connections using service role (bypasses RLS)
    const { data: connection } = await adminDb
      .from("email_connections")
      .select("*")
      .eq("email", SUPPORT_EMAIL)
      .eq("provider", "google")
      .single();

    if (!connection) {
      console.log("No Gmail connection found for", SUPPORT_EMAIL, "— message saved to DB only.");
      return NextResponse.json({ success: true, emailSent: false });
    }

    // Refresh token if needed
    let accessToken = connection.access_token;
    const expiresAt = new Date(connection.token_expires_at);
    if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
      const refreshed = await refreshAccessToken(connection.refresh_token);
      if (!refreshed) {
        console.error("Could not refresh Gmail token for support notifications");
        return NextResponse.json({ success: true, emailSent: false });
      }
      accessToken = refreshed.access_token;

      // Update token in DB
      await adminDb
        .from("email_connections")
        .update({
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        })
        .eq("id", connection.id);
    }

    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });

    // Build the email
    const subject = `[Support] ${message.trim().slice(0, 60)}${message.trim().length > 60 ? "..." : ""}`;
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px;">
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
          <h2 style="margin: 0 0 12px; font-size: 16px; color: #1a1a2e;">New Support Message</h2>
          <table style="font-size: 14px; color: #555;">
            <tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">From:</td><td>${userInfo}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">Email:</td><td><a href="mailto:${userEmail}">${userEmail}</a></td></tr>
            <tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">Page:</td><td>${referer}</td></tr>
            <tr><td style="padding: 4px 12px 4px 0; font-weight: 600;">Time:</td><td>${timestamp}</td></tr>
          </table>
        </div>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
          <h3 style="margin: 0 0 8px; font-size: 14px; color: #1a1a2e;">Message:</h3>
          <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.6; white-space: pre-wrap;">${message.trim()}</p>
        </div>
        ${userEmail !== "unknown" ? `<p style="margin-top: 16px; font-size: 13px; color: #888;">Reply to this user: <a href="mailto:${userEmail}">${userEmail}</a></p>` : ""}
      </div>
    `;

    // Build RFC 2822 message
    const replyTo = userEmail !== "unknown" ? `\r\nReply-To: ${userEmail}` : "";
    const rawHeaders = [
      `From: WorkChores Support <${SUPPORT_EMAIL}>`,
      `To: ${SUPPORT_EMAIL}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset="UTF-8"`,
    ].join("\r\n") + replyTo;

    const rawMessage = `${rawHeaders}\r\n\r\n${htmlBody}`;
    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send via Gmail API
    const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!gmailRes.ok) {
      const err = await gmailRes.text();
      console.error("Gmail send error for support notification:", err);
      return NextResponse.json({ success: true, emailSent: false });
    }

    console.log("Support notification email sent to", SUPPORT_EMAIL);
    return NextResponse.json({ success: true, emailSent: true });
  } catch (error) {
    console.error("Support message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
