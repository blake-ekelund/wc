import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "workchores-admin-2026";

function isAuthorized(request: NextRequest): boolean {
  const auth = request.headers.get("x-admin-token");
  return auth === ADMIN_PASSWORD;
}

function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Login action — doesn't require token
    if (action === "login") {
      const { password } = body;
      if (password === ADMIN_PASSWORD) {
        return NextResponse.json({ success: true, token: ADMIN_PASSWORD });
      }
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // All other actions require the admin token
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getAdminDb();

    switch (action) {
      case "get-messages": {
        const { data, error } = await db
          .from("support_messages")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      case "update-message-status": {
        const { id, status } = body;
        const { error } = await db
          .from("support_messages")
          .update({ status })
          .eq("id", id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      case "update-message-notes": {
        const { id, notes } = body;
        const { error } = await db
          .from("support_messages")
          .update({ notes })
          .eq("id", id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      case "get-overview": {
        // Get all workspaces
        const { data: workspaces } = await db
          .from("workspaces")
          .select("id, name, industry, created_at")
          .order("created_at", { ascending: false });

        const enriched = [];
        let totalUsers = 0;
        let totalContacts = 0;

        for (const w of workspaces || []) {
          const { count: memberCount } = await db
            .from("workspace_members")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", w.id);
          const { count: contactCount } = await db
            .from("contacts")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", w.id);
          const mc = memberCount || 0;
          const cc = contactCount || 0;
          totalUsers += mc;
          totalContacts += cc;
          enriched.push({ ...w, member_count: mc, contact_count: cc });
        }

        return NextResponse.json({
          workspaces: enriched,
          totalUsers,
          totalContacts,
        });
      }

      case "get-demo-sessions": {
        const { data } = await db
          .from("demo_sessions")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(200);

        return NextResponse.json({ data: data || [] });
      }

      case "reply-email": {
        const { to, subject, replyBody, originalMessage } = body;

        // Look up admin's Gmail connection
        const { data: connection } = await db
          .from("email_connections")
          .select("*")
          .eq("email", "blake.ekelund@workchores.com")
          .eq("provider", "google")
          .single();

        if (!connection) {
          return NextResponse.json({ error: "No Gmail connection found for admin" }, { status: 400 });
        }

        let accessToken = connection.access_token;

        // Refresh if needed
        const expiresAt = new Date(connection.token_expires_at);
        if (expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              refresh_token: connection.refresh_token,
              grant_type: "refresh_token",
            }),
          });
          if (tokenRes.ok) {
            const refreshed = await tokenRes.json();
            accessToken = refreshed.access_token;
            await db.from("email_connections").update({
              access_token: accessToken,
              token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
            }).eq("id", connection.id);
          } else {
            return NextResponse.json({ error: "Could not refresh Gmail token" }, { status: 500 });
          }
        }

        // Build email
        const htmlBody = `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px;">
            <p style="font-size: 14px; color: #333; line-height: 1.6;">${replyBody.replace(/\n/g, "<br/>")}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888;">Original message: "${originalMessage?.slice(0, 100) || ""}${(originalMessage?.length || 0) > 100 ? "..." : ""}"</p>
            <p style="font-size: 12px; color: #888;">&mdash; WorkChores Support Team</p>
          </div>
        `;

        const rawHeaders = [
          `From: WorkChores Support <blake.ekelund@workchores.com>`,
          `To: ${to}`,
          `Subject: ${subject}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset="UTF-8"`,
        ].join("\r\n");

        const rawMessage = `${rawHeaders}\r\n\r\n${htmlBody}`;
        const encodedMessage = Buffer.from(rawMessage)
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");

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
          console.error("Gmail reply error:", err);
          return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      // CONVERSATIONS
      case "get-conversations": {
        const { data, error } = await db
          .from("conversations")
          .select("*")
          .order("last_message_at", { ascending: false });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      case "get-conversation-messages": {
        const { conversationId } = body;
        const { data, error } = await db
          .from("conversation_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ data });
      }

      case "admin-reply": {
        const { conversationId, message: replyMsg, adminName } = body;
        if (!conversationId || !replyMsg?.trim()) {
          return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const { error } = await db.from("conversation_messages").insert({
          conversation_id: conversationId,
          sender: "admin",
          sender_name: adminName || "Support Team",
          message: replyMsg.trim(),
        });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        // Update conversation
        await db.from("conversations").update({
          last_message_at: new Date().toISOString(),
          status: "active",
        }).eq("id", conversationId);

        // Get updated messages
        const { data: msgs } = await db
          .from("conversation_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        return NextResponse.json({ messages: msgs || [] });
      }

      case "update-conversation-status": {
        const { conversationId, status } = body;
        const { error } = await db
          .from("conversations")
          .update({ status })
          .eq("id", conversationId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
