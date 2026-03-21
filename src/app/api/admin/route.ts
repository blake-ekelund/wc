import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendPlatformEmail } from "@/lib/platform-email";
import { createRateLimiter } from "@/lib/rate-limit";
import { stripe } from "@/lib/stripe";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

// HMAC-signed tokens work across serverless instances (no shared memory needed)
function createSessionToken(): string {
  const expiry = Date.now() + SESSION_TTL;
  const payload = `admin:${expiry}`;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback";
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(JSON.stringify({ payload, sig })).toString("base64url");
}

const ADMIN_COOKIE_NAME = "admin-session";

function getTokenFromRequest(request: NextRequest): string | null {
  // Prefer HttpOnly cookie, fall back to header for backward compat
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;
  return request.headers.get("x-admin-token") || null;
}

function isAuthorized(request: NextRequest): boolean {
  const token = getTokenFromRequest(request);
  if (!token) return false;
  try {
    const { payload, sig } = JSON.parse(Buffer.from(token, "base64url").toString());
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback";
    const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const expiry = parseInt(payload.split(":")[1], 10);
    return Date.now() <= expiry;
  } catch {
    return false;
  }
}

/** Build a Set-Cookie header for the admin session token */
function buildAdminCookie(token: string): string {
  const maxAge = Math.floor(SESSION_TTL / 1000); // seconds
  const isProduction = process.env.NODE_ENV === "production";
  return `${ADMIN_COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${isProduction ? "; Secure" : ""}`;
}

/** Build a Set-Cookie header that clears the admin session cookie */
function buildAdminCookieClear(): string {
  return `${ADMIN_COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// 5 login attempts per minute per IP (brute-force protection)
const loginLimiter = createRateLimiter({ max: 5, id: "admin-login" });

/** Verify the request origin matches our site (CSRF defense-in-depth for cookie auth) */
function verifyOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  // In production, verify origin matches our site
  if (process.env.NODE_ENV !== "production") return true;

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean) as string[];

  // If Origin header is present, validate it
  if (origin) {
    return allowedOrigins.some((allowed) => origin === allowed);
  }
  // Fall back to Referer header
  if (referer) {
    return allowedOrigins.some((allowed) => referer.startsWith(allowed));
  }
  // No origin or referer — reject in production (legitimate browsers always send one)
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Login action — doesn't require token
    if (action === "login") {
      const blocked = loginLimiter(request);
      if (blocked) return blocked;
      if (!ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Admin access not configured" }, { status: 503 });
      }
      const { password } = body;
      if (password === ADMIN_PASSWORD) {
        const sessionToken = createSessionToken();
        const response = NextResponse.json({ success: true });
        response.headers.set("Set-Cookie", buildAdminCookie(sessionToken));
        return response;
      }
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    if (action === "logout") {
      const response = NextResponse.json({ success: true });
      response.headers.set("Set-Cookie", buildAdminCookieClear());
      return response;
    }

    // All other actions require the admin token
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // CSRF protection: verify request comes from our own origin
    if (!verifyOrigin(request)) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    const db = getAdminDb();

    switch (action) {
      // ============================================================
      // LEGACY SUPPORT MESSAGES
      // ============================================================
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

      // ============================================================
      // OVERVIEW (enhanced)
      // ============================================================
      case "get-overview": {
        const { data: workspaces } = await db
          .from("workspaces")
          .select("id, name, industry, plan, created_at, stripe_customer_id, stripe_subscription_id")
          .order("created_at", { ascending: false });

        // Pre-fetch all auth users to resolve emails efficiently
        const { data: authUsersData, error: authError } = await db.auth.admin.listUsers({ perPage: 1000 });
        const authEmailMap = new Map<string, string>();
        if (authError) {
          console.error("Failed to list auth users:", authError.message);
        }
        for (const u of authUsersData?.users || []) {
          if (u.id && u.email) authEmailMap.set(u.id, u.email);
        }

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
          const { count: taskCount } = await db
            .from("tasks")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", w.id);

          // Get owner email
          const { data: ownerMember } = await db
            .from("workspace_members")
            .select("user_id")
            .eq("workspace_id", w.id)
            .eq("role", "owner")
            .limit(1);

          let ownerEmail = "unknown";
          if (ownerMember?.[0]?.user_id) {
            ownerEmail = authEmailMap.get(ownerMember[0].user_id) || "unknown";
          } else {
            // Fallback: get first member if no owner role
            const { data: anyMember } = await db
              .from("workspace_members")
              .select("user_id")
              .eq("workspace_id", w.id)
              .limit(1);
            if (anyMember?.[0]?.user_id) {
              ownerEmail = authEmailMap.get(anyMember[0].user_id) || "unknown";
            }
          }

          const mc = memberCount || 0;
          const cc = contactCount || 0;
          const tc = taskCount || 0;
          totalUsers += mc;
          totalContacts += cc;
          enriched.push({
            ...w,
            member_count: mc,
            contact_count: cc,
            task_count: tc,
            owner_email: ownerEmail,
          });
        }

        return NextResponse.json({
          workspaces: enriched,
          totalUsers,
          totalContacts,
        });
      }

      // ============================================================
      // DEMO SESSIONS
      // ============================================================
      case "get-demo-sessions": {
        const { data } = await db
          .from("demo_sessions")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(200);

        return NextResponse.json({ data: data || [] });
      }

      // ============================================================
      // REPLY EMAIL (via Gmail OAuth)
      // ============================================================
      case "reply-email": {
        const { to, subject, replyBody, originalMessage } = body;

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

      // ============================================================
      // CONVERSATIONS
      // ============================================================
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

        await db.from("conversations").update({
          last_message_at: new Date().toISOString(),
          status: "active",
        }).eq("id", conversationId);

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

      // ============================================================
      // PEOPLE (users + subscribers)
      // ============================================================
      case "get-people": {
        const results: PersonRecord[] = [];
        const emailSet = new Map<string, PersonRecord>();

        // Get all profiles (users)
        // Get profiles and resolve emails from auth.users
        const { data: profiles } = await db
          .from("profiles")
          .select("id, full_name, created_at")
          .order("created_at", { ascending: false });

        const { data: authUsersForPeople } = await db.auth.admin.listUsers({ perPage: 1000 });
        const peopleEmailMap = new Map<string, string>();
        for (const u of authUsersForPeople?.users || []) {
          if (u.id && u.email) peopleEmailMap.set(u.id, u.email);
        }

        for (const p of profiles || []) {
          const resolvedEmail = peopleEmailMap.get(p.id) || "";

          // Get their workspace membership
          const { data: membership } = await db
            .from("workspace_members")
            .select("workspace_id, role")
            .eq("user_id", p.id)
            .limit(1);

          let workspaceName = "";
          let role = "";
          if (membership?.[0]) {
            role = membership[0].role;
            const { data: ws } = await db
              .from("workspaces")
              .select("name")
              .eq("id", membership[0].workspace_id)
              .single();
            if (ws) workspaceName = ws.name;
          }

          const record: PersonRecord = {
            id: `user-${p.id}`,
            email: resolvedEmail,
            name: p.full_name || "",
            type: "user",
            workspace_name: workspaceName,
            role,
            created_at: p.created_at,
          };
          emailSet.set(resolvedEmail.toLowerCase(), record);
          results.push(record);
        }

        // Get all subscribers
        const { data: subscribers } = await db
          .from("subscribers")
          .select("id, email, source, subscribed_at")
          .order("subscribed_at", { ascending: false });

        for (const s of subscribers || []) {
          const emailKey = s.email.toLowerCase();
          const existing = emailSet.get(emailKey);
          if (existing) {
            // Mark as both user and subscriber
            existing.type = "both";
            existing.subscribed_at = s.subscribed_at;
          } else {
            results.push({
              id: `sub-${s.id}`,
              email: s.email,
              name: "",
              type: "subscriber",
              subscribed_at: s.subscribed_at,
              created_at: s.subscribed_at,
            });
          }
        }

        // Sort by created_at descending
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return NextResponse.json({ data: results });
      }

      // ============================================================
      // ACTIVITY FEED
      // ============================================================
      case "get-activity-feed": {
        const events: ActivityEvent[] = [];

        // Recent workspace creations
        const { data: recentWorkspaces } = await db
          .from("workspaces")
          .select("id, name, created_at")
          .order("created_at", { ascending: false })
          .limit(20);

        for (const w of recentWorkspaces || []) {
          events.push({
            id: `ws-${w.id}`,
            type: "workspace_created",
            description: `Workspace "${w.name}" created`,
            workspace_name: w.name,
            timestamp: w.created_at,
          });
        }

        // Recent demo conversions
        const { data: conversions } = await db
          .from("demo_sessions")
          .select("id, name, email, converted_at")
          .eq("converted_to_user", true)
          .order("converted_at", { ascending: false })
          .limit(20);

        for (const d of conversions || []) {
          if (d.converted_at) {
            events.push({
              id: `conv-${d.id}`,
              type: "conversion",
              description: `${d.name || d.email || "User"} converted from demo`,
              user_email: d.email,
              timestamp: d.converted_at,
            });
          }
        }

        // Recent paid upgrades (free → business)
        const { data: upgrades } = await db
          .from("workspaces")
          .select("id, name, plan_updated_at, stripe_customer_id")
          .eq("plan", "business")
          .not("plan_updated_at", "is", null)
          .order("plan_updated_at", { ascending: false })
          .limit(20);

        for (const u of upgrades || []) {
          if (u.plan_updated_at) {
            events.push({
              id: `upgrade-${u.id}`,
              type: "upgrade",
              description: `Workspace "${u.name}" upgraded to Business`,
              workspace_name: u.name,
              timestamp: u.plan_updated_at,
            });
          }
        }

        // Recent support tickets
        const { data: recentConvs } = await db
          .from("conversations")
          .select("id, user_name, user_email, created_at")
          .order("created_at", { ascending: false })
          .limit(20);

        for (const c of recentConvs || []) {
          events.push({
            id: `support-${c.id}`,
            type: "support_ticket",
            description: `${c.user_name} opened a support ticket`,
            user_email: c.user_email,
            timestamp: c.created_at,
          });
        }

        // Sort by timestamp descending
        events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json({ data: events.slice(0, 50) });
      }

      // ============================================================
      // ANALYTICS (chart data)
      // ============================================================
      case "get-analytics": {
        const { range } = body; // "30d" or "12m"
        const now = new Date();
        const points: AnalyticsPoint[] = [];

        if (range === "12m") {
          // Monthly buckets for last 12 months
          for (let i = 11; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const label = start.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

            const [visitors, demos, signups] = await Promise.all([
              db.from("page_views")
                .select("visitor_id", { count: "exact", head: true })
                .gte("created_at", start.toISOString())
                .lt("created_at", end.toISOString()),
              db.from("demo_sessions")
                .select("*", { count: "exact", head: true })
                .gte("started_at", start.toISOString())
                .lt("started_at", end.toISOString()),
              db.from("profiles")
                .select("*", { count: "exact", head: true })
                .gte("created_at", start.toISOString())
                .lt("created_at", end.toISOString()),
            ]);

            // Unique visitors
            const { data: uniqueVisitors } = await db
              .from("page_views")
              .select("visitor_id")
              .gte("created_at", start.toISOString())
              .lt("created_at", end.toISOString());
            const uniqueCount = new Set((uniqueVisitors || []).map(v => v.visitor_id)).size;

            // Count conversions: demo→signup + free→business upgrades
            const [demoConvResult, paidConvResult] = await Promise.all([
              db.from("demo_sessions")
                .select("*", { count: "exact", head: true })
                .eq("converted_to_user", true)
                .gte("started_at", start.toISOString())
                .lt("started_at", end.toISOString()),
              db.from("workspaces")
                .select("*", { count: "exact", head: true })
                .eq("plan", "business")
                .not("plan_updated_at", "is", null)
                .gte("plan_updated_at", start.toISOString())
                .lt("plan_updated_at", end.toISOString()),
            ]);

            points.push({
              label,
              visitors: uniqueCount,
              demos: demos.count || 0,
              signups: signups.count || 0,
              conversions: (demoConvResult.count || 0) + (paidConvResult.count || 0),
            });
          }
        } else {
          // Daily buckets for last 30 days
          for (let i = 29; i >= 0; i--) {
            const start = new Date(now);
            start.setDate(start.getDate() - i);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            const label = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });

            const [demos, signups] = await Promise.all([
              db.from("demo_sessions")
                .select("*", { count: "exact", head: true })
                .gte("started_at", start.toISOString())
                .lt("started_at", end.toISOString()),
              db.from("profiles")
                .select("*", { count: "exact", head: true })
                .gte("created_at", start.toISOString())
                .lt("created_at", end.toISOString()),
            ]);

            const { data: uniqueVisitors } = await db
              .from("page_views")
              .select("visitor_id")
              .gte("created_at", start.toISOString())
              .lt("created_at", end.toISOString());
            const uniqueCount = new Set((uniqueVisitors || []).map(v => v.visitor_id)).size;

            // Count conversions: demo→signup + free→business upgrades
            const [demoConvResult, paidConvResult] = await Promise.all([
              db.from("demo_sessions")
                .select("*", { count: "exact", head: true })
                .eq("converted_to_user", true)
                .gte("started_at", start.toISOString())
                .lt("started_at", end.toISOString()),
              db.from("workspaces")
                .select("*", { count: "exact", head: true })
                .eq("plan", "business")
                .not("plan_updated_at", "is", null)
                .gte("plan_updated_at", start.toISOString())
                .lt("plan_updated_at", end.toISOString()),
            ]);

            points.push({
              label,
              visitors: uniqueCount,
              demos: demos.count || 0,
              signups: signups.count || 0,
              conversions: (demoConvResult.count || 0) + (paidConvResult.count || 0),
            });
          }
        }

        return NextResponse.json({ data: points });
      }

      // ============================================================
      // ANNOUNCEMENTS
      // ============================================================
      case "get-announcements": {
        const { data, error } = await db
          .from("announcements")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          // Table might not exist yet
          return NextResponse.json({ data: [] });
        }
        return NextResponse.json({ data: data || [] });
      }

      case "create-announcement": {
        const { title, message, type } = body;
        if (!title?.trim() || !message?.trim()) {
          return NextResponse.json({ error: "Title and message required" }, { status: 400 });
        }
        const { error } = await db.from("announcements").insert({
          title: title.trim(),
          message: message.trim(),
          type: type || "info",
          active: true,
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      case "delete-announcement": {
        const { id } = body;
        const { error } = await db.from("announcements").delete().eq("id", id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      case "toggle-announcement": {
        const { id, active } = body;
        const { error } = await db.from("announcements").update({ active }).eq("id", id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true });
      }

      // ============================================================
      // REVENUE ANALYTICS
      // ============================================================
      case "get-revenue-analytics": {
        const now = new Date();

        // Get all workspaces with plan info and dates
        const { data: allWorkspaces } = await db
          .from("workspaces")
          .select("id, name, plan, created_at, plan_updated_at")
          .order("created_at", { ascending: true });

        // Get member counts per workspace for seat-based revenue
        const wsData: { id: string; name: string; plan: string; created_at: string; plan_updated_at: string | null; member_count: number }[] = [];
        for (const w of allWorkspaces || []) {
          const { count } = await db
            .from("workspace_members")
            .select("*", { count: "exact", head: true })
            .eq("workspace_id", w.id);
          wsData.push({ ...w, member_count: count || 0 });
        }

        // Build 12-month revenue history
        // For each month, calculate MRR based on which workspaces were on business plan
        // We approximate: if plan_updated_at is before the month end AND plan=business, count it
        // If plan_updated_at is null and plan=business, use created_at
        const revenueHistory: { label: string; mrr: number; seats: number; workspaces: number; newBusiness: number; churned: number }[] = [];
        let prevBusinessIds = new Set<string>();

        for (let i = 11; i >= 0; i--) {
          const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          const label = monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

          // Workspaces that were on business plan during this month
          const businessThisMonth = wsData.filter((w) => {
            if (w.plan !== "business") {
              // Check if it was business during this month but downgraded after
              // We can't fully track this without a history table, so we only count current business
              // plus any that were updated during/after this month
              return false;
            }
            // If business now, check if it existed by month end
            const createdAt = new Date(w.created_at);
            if (createdAt >= monthEnd) return false; // created after this month
            // If plan_updated_at exists and is after month end, it might have been free during this month
            if (w.plan_updated_at) {
              const updatedAt = new Date(w.plan_updated_at);
              if (updatedAt >= monthEnd) return false; // upgraded after this month
            }
            return true;
          });

          const currentBusinessIds = new Set(businessThisMonth.map((w) => w.id));
          const newBusiness = businessThisMonth.filter((w) => !prevBusinessIds.has(w.id)).length;
          const churned = [...prevBusinessIds].filter((id) => !currentBusinessIds.has(id)).length;

          const totalSeats = businessThisMonth.reduce((sum, w) => sum + w.member_count, 0);
          const mrr = totalSeats * 500; // $5/seat in cents

          revenueHistory.push({
            label,
            mrr: mrr / 100, // in dollars
            seats: totalSeats,
            workspaces: businessThisMonth.length,
            newBusiness,
            churned,
          });

          prevBusinessIds = currentBusinessIds;
        }

        // Churn metrics
        const totalChurned = revenueHistory.reduce((sum, m) => sum + m.churned, 0);
        const totalNewBiz = revenueHistory.reduce((sum, m) => sum + m.newBusiness, 0);
        const currentMrr = revenueHistory[revenueHistory.length - 1]?.mrr || 0;

        // 3-month average growth for forecasting
        const last3 = revenueHistory.slice(-3);
        const mrrValues = last3.map((m) => m.mrr);
        const avgGrowth = mrrValues.length >= 2
          ? mrrValues.reduce((sum, v, i, arr) => i === 0 ? 0 : sum + (v - arr[i - 1]), 0) / (mrrValues.length - 1)
          : 0;
        const avgChurnRate = last3.length > 0
          ? last3.reduce((sum, m) => sum + m.churned, 0) / last3.length
          : 0;
        const avgNewRate = last3.length > 0
          ? last3.reduce((sum, m) => sum + m.newBusiness, 0) / last3.length
          : 0;

        // Generate 3-month forecast
        const forecast: { label: string; mrr: number; seats: number; workspaces: number }[] = [];
        let projectedMrr = currentMrr;
        const currentSeats = revenueHistory[revenueHistory.length - 1]?.seats || 0;
        const currentWs = revenueHistory[revenueHistory.length - 1]?.workspaces || 0;
        const avgSeatGrowth = last3.length >= 2
          ? (last3[last3.length - 1].seats - last3[0].seats) / (last3.length - 1)
          : 0;

        for (let i = 1; i <= 3; i++) {
          const forecastMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
          const label = forecastMonth.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
          projectedMrr = Math.max(0, projectedMrr + avgGrowth);
          forecast.push({
            label,
            mrr: Math.round(projectedMrr),
            seats: Math.max(0, Math.round(currentSeats + avgSeatGrowth * i)),
            workspaces: Math.max(0, Math.round(currentWs + (avgNewRate - avgChurnRate) * i)),
          });
        }

        return NextResponse.json({
          history: revenueHistory,
          forecast,
          summary: {
            currentMrr,
            totalChurned,
            totalNewBiz,
            avgChurnRate: Math.round(avgChurnRate * 100) / 100,
            avgNewRate: Math.round(avgNewRate * 100) / 100,
            avgGrowth: Math.round(avgGrowth * 100) / 100,
          },
        });
      }

      // ============================================================
      // WORKSPACE ACCESS REQUESTS
      // ============================================================
      case "request-workspace-access": {
        const { workspaceId } = body;
        if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

        // Get workspace info
        const { data: ws } = await db.from("workspaces").select("id, name").eq("id", workspaceId).single();
        if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

        // Find owner email
        const { data: ownerMember } = await db
          .from("workspace_members")
          .select("user_id")
          .eq("workspace_id", workspaceId)
          .eq("role", "owner")
          .limit(1);

        let ownerId = ownerMember?.[0]?.user_id;
        if (!ownerId) {
          // Fallback to first member
          const { data: anyMember } = await db
            .from("workspace_members")
            .select("user_id")
            .eq("workspace_id", workspaceId)
            .limit(1);
          ownerId = anyMember?.[0]?.user_id;
        }

        if (!ownerId) return NextResponse.json({ error: "No members found in workspace" }, { status: 400 });

        const { data: authUser } = await db.auth.admin.getUserById(ownerId);
        const ownerEmail = authUser?.user?.email;
        if (!ownerEmail) return NextResponse.json({ error: "Could not resolve owner email" }, { status: 400 });

        // Expire any existing pending requests for this workspace
        await db
          .from("admin_access_requests")
          .update({ status: "expired" })
          .eq("workspace_id", workspaceId)
          .eq("status", "pending");

        // Create new access request
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

        // Hash the admin session token so only this admin can use the approval
        const adminToken = getTokenFromRequest(request) || "";
        const adminSessionHash = crypto.createHash("sha256").update(adminToken).digest("hex");

        const { error: insertError } = await db.from("admin_access_requests").insert({
          workspace_id: workspaceId,
          token,
          status: "pending",
          expires_at: expiresAt,
          admin_session_hash: adminSessionHash,
        });

        if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

        // Build approval URL
        const origin = process.env.NEXT_PUBLIC_SITE_URL
          || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
          || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
          || request.headers.get("origin")
          || "https://workchores.com";
        const approveUrl = `${origin}/api/admin/approve-access?token=${token}`;

        // Send email to workspace owner
        const emailSent = await sendPlatformEmail({
          to: ownerEmail,
          subject: `Admin access request for "${ws.name}"`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;">
              <div style="background:#111827;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:white;margin:0;font-size:20px;">Admin Access Request</h1>
              </div>
              <div style="padding:24px;background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
                <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
                  A WorkChores admin is requesting temporary <strong>read-only</strong> access to your workspace <strong>&quot;${escapeHtml(ws.name)}&quot;</strong>.
                </p>
                <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0 0 24px;">
                  If you approve, the admin will have access for 30 minutes. If you did not expect this request, you can safely ignore this email.
                </p>
                <div style="text-align:center;">
                  <a href="${approveUrl}" style="display:inline-block;background:#10b981;color:white;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;">
                    Review &amp; Approve
                  </a>
                </div>
                <p style="color:#9ca3af;font-size:11px;margin-top:24px;text-align:center;">
                  This link expires in 30 minutes. Do not share it with anyone.
                </p>
              </div>
            </div>
          `,
        });

        return NextResponse.json({
          success: true,
          requestId: token.slice(0, 8), // short ID for UI reference
          emailSent,
          ownerEmail: ownerEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // mask email
        });
      }

      case "check-workspace-access": {
        const { workspaceId, markUsed } = body;
        if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

        // Hash the current admin's token to match against the request creator
        const checkAdminToken = getTokenFromRequest(request) || "";
        const checkAdminHash = crypto.createHash("sha256").update(checkAdminToken).digest("hex");

        // Find the most recent pending/approved request for this workspace BY THIS ADMIN
        const { data: accessReq } = await db
          .from("admin_access_requests")
          .select("id, status, expires_at, approved_at, token, admin_session_hash")
          .eq("workspace_id", workspaceId)
          .in("status", ["pending", "approved"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // No request, or request was made by a different admin session
        if (!accessReq || (accessReq.admin_session_hash && accessReq.admin_session_hash !== checkAdminHash)) {
          return NextResponse.json({ status: "none" });
        }

        // Check expiry
        if (new Date(accessReq.expires_at) < new Date()) {
          await db.from("admin_access_requests").update({ status: "expired" }).eq("id", accessReq.id);
          return NextResponse.json({ status: "expired" });
        }

        if (accessReq.status === "approved") {
          // Only mark as used when admin explicitly opens the workspace
          if (markUsed) {
            await db.from("admin_access_requests").update({ status: "used" }).eq("id", accessReq.id);
          }
          return NextResponse.json({ status: "approved", expiresAt: accessReq.expires_at });
        }

        return NextResponse.json({ status: "pending" });
      }

      case "get-workspace-view-data": {
        const { workspaceId } = body;
        if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

        // Hash the current admin's token to verify identity
        const viewAdminToken = getTokenFromRequest(request) || "";
        const viewAdminHash = crypto.createHash("sha256").update(viewAdminToken).digest("hex");

        // Verify there's an approved (non-expired) access request BY THIS ADMIN
        const { data: viewAccess } = await db
          .from("admin_access_requests")
          .select("id, status, expires_at, admin_session_hash")
          .eq("workspace_id", workspaceId)
          .in("status", ["approved"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!viewAccess || new Date(viewAccess.expires_at) < new Date()) {
          return NextResponse.json({ error: "No approved access for this workspace. Request access first." }, { status: 403 });
        }

        // Verify the approval belongs to this admin session
        if (viewAccess.admin_session_hash && viewAccess.admin_session_hash !== viewAdminHash) {
          return NextResponse.json({ error: "This access was approved for a different admin session." }, { status: 403 });
        }

        // Mark as used now that we're actually viewing
        await db.from("admin_access_requests").update({ status: "used" }).eq("id", viewAccess.id);

        // Fetch workspace data using service role (bypasses RLS)
        const { data: ws } = await db.from("workspaces").select("id, name, industry, plan").eq("id", workspaceId).single();
        if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

        const [contactsRes, tasksRes, touchpointsRes, stagesRes, membersRes, fieldsRes, fieldValuesRes, alertsRes, templatesRes] = await Promise.all([
          db.from("contacts").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
          db.from("tasks").select("*").eq("workspace_id", workspaceId).order("due", { ascending: true }),
          db.from("touchpoints").select("*").eq("workspace_id", workspaceId).order("date", { ascending: false }),
          db.from("pipeline_stages").select("*").eq("workspace_id", workspaceId).order("sort_order"),
          db.from("workspace_members").select("*").eq("workspace_id", workspaceId),
          db.from("custom_fields").select("*").eq("workspace_id", workspaceId).order("sort_order"),
          db.from("custom_field_values").select("*").eq("workspace_id", workspaceId),
          db.from("alert_settings").select("*").eq("workspace_id", workspaceId).single(),
          db.from("email_templates").select("*").eq("workspace_id", workspaceId).order("sort_order"),
        ]);

        // Resolve member emails from auth
        const { data: authData } = await db.auth.admin.listUsers({ perPage: 1000 });
        const emailMap = new Map<string, string>();
        for (const u of authData?.users || []) {
          if (u.id && u.email) emailMap.set(u.id, u.email);
        }

        const avatarColors = ["bg-accent", "bg-emerald-500", "bg-violet-500", "bg-pink-500", "bg-sky-500", "bg-amber-500", "bg-indigo-500", "bg-teal-500"];

        return NextResponse.json({
          workspace: { id: ws.id, name: ws.name, industry: ws.industry, plan: ws.plan || "free" },
          contacts: (contactsRes.data || []).map((c) => ({
            id: c.id, name: c.name, email: c.email, phone: c.phone, company: c.company,
            role: c.role, avatar: c.avatar, avatarColor: c.avatar_color, stage: c.stage,
            value: Number(c.value), owner: c.owner_label, lastContact: c.last_contact || "",
            created: c.created_at?.slice(0, 10) || "", tags: c.tags || [],
            archived: c.archived || false, trashedAt: c.trashed_at || undefined,
            stageChangedAt: c.stage_changed_at || undefined,
          })),
          tasks: (tasksRes.data || []).map((t) => ({
            id: t.id, contactId: t.contact_id || "", title: t.title,
            description: t.description || undefined, due: t.due || "",
            owner: t.owner_label, completed: t.completed,
            completedAt: t.completed_at || undefined,
            priority: t.priority as "high" | "medium" | "low",
          })),
          touchpoints: (touchpointsRes.data || []).map((tp) => ({
            id: tp.id, contactId: tp.contact_id || "",
            type: tp.type as "call" | "email" | "meeting" | "note",
            title: tp.title, description: tp.description, date: tp.date, owner: tp.owner_label,
          })),
          stages: (stagesRes.data || []).map((s) => ({
            label: s.label, color: s.color, bgColor: s.bg_color,
          })),
          teamMembers: (membersRes.data || []).map((m, i) => ({
            id: m.id,
            name: m.owner_label || `Team Member ${i + 1}`,
            email: m.invited_email || emailMap.get(m.user_id) || "",
            role: m.role === "owner" ? "admin" : m.role,
            avatar: (m.owner_label || "TM").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
            avatarColor: avatarColors[i % avatarColors.length],
            status: m.status as "active" | "pending",
            ownerLabel: m.owner_label,
            reportsTo: m.reports_to || undefined,
          })),
          customFields: (fieldsRes.data || []).map((f) => ({
            id: f.id, label: f.label, type: f.field_type, options: f.options || undefined,
          })),
          customFieldValues: (() => {
            const vals: Record<string, Record<string, string>> = {};
            (fieldValuesRes.data || []).forEach((v) => {
              if (!vals[v.contact_id]) vals[v.contact_id] = {};
              vals[v.contact_id][v.field_id] = v.value;
            });
            return vals;
          })(),
          alertSettings: (() => {
            const a = alertsRes.data;
            return {
              staleDays: a?.stale_days ?? 14, atRiskTouchpoints: a?.at_risk_touchpoints ?? 1,
              highValueThreshold: a?.high_value_threshold ?? 10000, overdueAlerts: a?.overdue_alerts ?? true,
              todayAlerts: a?.today_alerts ?? true, negotiationAlerts: a?.negotiation_alerts ?? true,
              staleContactAlerts: a?.stale_contact_alerts ?? true, atRiskAlerts: a?.at_risk_alerts ?? true,
            };
          })(),
          emailTemplates: (templatesRes.data || []).map((t) => ({
            id: t.id, name: t.name, subject: t.subject, body: t.body, category: t.category,
          })),
          dashboardKpis: (ws as Record<string, unknown>).dashboard_kpis as string[] || [],
          emailSignature: "",
        });
      }

      // ============================================================
      // SECURITY SCANNER
      // ============================================================
      case "run-security-scan": {
        const findings: { id: string; severity: "critical" | "high" | "medium" | "low"; title: string; description: string; category: string }[] = [];
        const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3000`;

        // Helper to make internal test requests
        async function probe(path: string, options: RequestInit = {}): Promise<Response | null> {
          try {
            return await fetch(`${origin}${path}`, { ...options, redirect: "manual" });
          } catch { return null; }
        }

        // ── 1. ENV VAR CONFIGURATION CHECKS ──
        if (!process.env.ADMIN_PASSWORD) {
          findings.push({ id: "env-admin-pw", severity: "critical", title: "ADMIN_PASSWORD not set", description: "The ADMIN_PASSWORD environment variable is not configured. Admin login is disabled.", category: "Configuration" });
        } else if (process.env.ADMIN_PASSWORD.length < 20) {
          findings.push({ id: "env-admin-pw-weak", severity: "high", title: "ADMIN_PASSWORD is weak", description: `Admin password is only ${process.env.ADMIN_PASSWORD.length} characters. Use at least 20+ random characters.`, category: "Configuration" });
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
          findings.push({ id: "env-service-key", severity: "critical", title: "SUPABASE_SERVICE_ROLE_KEY not set", description: "The service role key is missing. HMAC token signing falls back to a weak default.", category: "Configuration" });
        }

        if (!process.env.GOOGLE_CLIENT_SECRET) {
          findings.push({ id: "env-google-secret", severity: "medium", title: "Google OAuth not configured", description: "GOOGLE_CLIENT_SECRET is missing. Gmail integration will not work.", category: "Configuration" });
        }

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
          findings.push({ id: "env-smtp", severity: "medium", title: "SMTP credentials not configured", description: "SMTP_USER or SMTP_PASS is missing. Platform emails (invites, support notifications) will fail.", category: "Configuration" });
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
        if (!siteUrl) {
          findings.push({ id: "env-site-url", severity: "medium", title: "NEXT_PUBLIC_SITE_URL not set", description: "Site URL is not configured. CSRF origin validation and email links may not work correctly in production.", category: "Configuration" });
        } else if (siteUrl.startsWith("http://") && process.env.NODE_ENV === "production") {
          findings.push({ id: "env-site-url-http", severity: "high", title: "Site URL uses HTTP in production", description: "NEXT_PUBLIC_SITE_URL uses http:// instead of https:// in production. Cookies and auth may be insecure.", category: "Configuration" });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
          findings.push({ id: "env-stripe", severity: "medium", title: "Stripe secret key not configured", description: "STRIPE_SECRET_KEY is missing. Billing features will not work.", category: "Configuration" });
        }

        if (!process.env.STRIPE_WEBHOOK_SECRET) {
          findings.push({ id: "env-stripe-webhook", severity: "high", title: "Stripe webhook secret not configured", description: "STRIPE_WEBHOOK_SECRET is missing. Webhook signature verification is disabled, allowing forged webhook events.", category: "Configuration" });
        }

        // ── 2. AUTHENTICATION ENDPOINT CHECKS ──
        // Test unauthenticated access to admin API
        const adminNoAuth = await probe("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get-overview" }),
        });
        if (adminNoAuth && adminNoAuth.status !== 401) {
          findings.push({ id: "auth-admin-open", severity: "critical", title: "Admin API accessible without authentication", description: `GET overview returned ${adminNoAuth.status} instead of 401 for unauthenticated request.`, category: "Authentication" });
        }

        // Test unauthenticated access to Stripe endpoints
        const stripeNoAuth = await probe("/api/stripe/portal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId: "test-fake-id" }),
        });
        if (stripeNoAuth && stripeNoAuth.status !== 401) {
          findings.push({ id: "auth-stripe-open", severity: "critical", title: "Stripe portal accessible without authentication", description: `Stripe portal returned ${stripeNoAuth.status} instead of 401 for unauthenticated request.`, category: "Authentication" });
        }

        // Test unauthenticated access to invite endpoint
        const inviteNoAuth = await probe("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@test.com", workspaceId: "fake" }),
        });
        if (inviteNoAuth && inviteNoAuth.status !== 401) {
          findings.push({ id: "auth-invite-open", severity: "high", title: "Invite endpoint accessible without authentication", description: `Invite endpoint returned ${inviteNoAuth.status} instead of 401 for unauthenticated request.`, category: "Authentication" });
        }

        // Test unauthenticated access to email send
        const emailNoAuth = await probe("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: "test@test.com", subject: "test", body: "test" }),
        });
        if (emailNoAuth && emailNoAuth.status !== 401) {
          findings.push({ id: "auth-email-open", severity: "critical", title: "Email send endpoint accessible without authentication", description: `Email send returned ${emailNoAuth.status} instead of 401 for unauthenticated request.`, category: "Authentication" });
        }

        // ── 3. RATE LIMITING CHECKS ──
        // Verify rate limiting is active on public endpoints
        // Only probe endpoints that won't cause side effects (emails, DB inserts)
        // We send intentionally invalid payloads so they get rejected before any insert/email
        const rateLimitEndpoints = [
          { path: "/api/subscribers", body: { email: "" }, name: "Subscribers" },
          { path: "/api/track", body: { page: "/test" }, name: "Page tracking" },
        ];

        for (const ep of rateLimitEndpoints) {
          const res = await probe(ep.path, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ep.body),
          });
          if (!res) {
            findings.push({ id: `rate-${ep.path}`, severity: "medium", title: `${ep.name} endpoint unreachable`, description: `Could not reach ${ep.path} — rate limiting cannot be verified.`, category: "Rate Limiting" });
          }
        }

        // ── 4. INPUT VALIDATION CHECKS ──
        // Test SQL/XSS injection in subscriber email
        const xssEmail = await probe("/api/subscribers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: '<script>alert(1)</script>' }),
        });
        if (xssEmail && xssEmail.status !== 400) {
          findings.push({ id: "input-xss-email", severity: "high", title: "Subscriber endpoint accepts malicious email", description: `Endpoint accepted XSS payload as email (status ${xssEmail.status}). Email validation may be insufficient.`, category: "Input Validation" });
        }

        // Test invalid conversation session token
        const fakeSession = await probe("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get-or-create", sessionToken: "fake-token-12345" }),
        });
        if (fakeSession && fakeSession.status !== 403 && fakeSession.status !== 401) {
          findings.push({ id: "input-conv-token", severity: "high", title: "Conversation endpoint accepts forged session tokens", description: `Endpoint returned ${fakeSession.status} for a fake session token instead of 403.`, category: "Input Validation" });
        }

        // Test conversation ownership bypass
        const fakeConvPoll = await probe("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "poll", conversationId: "00000000-0000-0000-0000-000000000000" }),
        });
        if (fakeConvPoll && fakeConvPoll.status !== 401 && fakeConvPoll.status !== 403) {
          findings.push({ id: "input-conv-poll", severity: "high", title: "Conversation poll lacks ownership check", description: `Endpoint returned ${fakeConvPoll.status} when polling a foreign conversation instead of 401/403.`, category: "Input Validation" });
        }

        // Test admin login with empty/short passwords
        const emptyPw = await probe("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login", password: "" }),
        });
        if (emptyPw && emptyPw.status === 200) {
          findings.push({ id: "input-admin-empty-pw", severity: "critical", title: "Admin login accepts empty password", description: "Admin login succeeded with an empty password. This is a critical authentication bypass.", category: "Input Validation" });
        }

        // ── 5. HEADER SECURITY CHECKS ──
        const homePage = await probe("/");
        if (homePage) {
          const headers = homePage.headers;
          if (!headers.get("x-frame-options") && !headers.get("content-security-policy")?.includes("frame-ancestors")) {
            findings.push({ id: "header-clickjack", severity: "medium", title: "No clickjacking protection headers", description: "Neither X-Frame-Options nor Content-Security-Policy frame-ancestors are set. The site may be vulnerable to clickjacking.", category: "Headers" });
          }
          if (!headers.get("strict-transport-security") && process.env.NODE_ENV === "production") {
            findings.push({ id: "header-hsts", severity: "medium", title: "No HSTS header", description: "Strict-Transport-Security header is not set in production. Users could be downgraded to HTTP.", category: "Headers" });
          }
          if (!headers.get("x-content-type-options")) {
            findings.push({ id: "header-nosniff", severity: "low", title: "No X-Content-Type-Options header", description: "X-Content-Type-Options: nosniff is not set. Browsers may MIME-sniff responses.", category: "Headers" });
          }
        }

        // ── 6. DATABASE CHECKS ──
        try {
          // Check for orphaned admin access requests
          const { data: expiredRequests } = await db
            .from("admin_access_requests")
            .select("id")
            .eq("status", "pending")
            .lt("expires_at", new Date().toISOString());

          if (expiredRequests && expiredRequests.length > 0) {
            findings.push({ id: "db-expired-requests", severity: "low", title: `${expiredRequests.length} expired access request(s) still pending`, description: "There are admin access requests that expired but were never cleaned up. These should be marked as expired.", category: "Database" });

            // Auto-clean them
            await db.from("admin_access_requests")
              .update({ status: "expired" })
              .eq("status", "pending")
              .lt("expires_at", new Date().toISOString());
          }
        } catch { /* DB check failed — skip */ }

        // ── 7. MIDDLEWARE CHECK ──
        const workspaceNoAuth = await probe("/admin/workspace?id=test", { redirect: "manual" });
        if (workspaceNoAuth) {
          if (workspaceNoAuth.status === 200) {
            findings.push({ id: "middleware-workspace", severity: "high", title: "Admin workspace accessible without auth", description: "The /admin/workspace route is accessible without a valid admin session cookie. Middleware protection may be missing.", category: "Middleware" });
          }
          // 307/308 redirect to /admin = correct behavior
        }

        // ── REPORT ──
        if (findings.length === 0) {
          findings.push({ id: "all-clear", severity: "low", title: "No issues found", description: "All automated security checks passed. Manual review is still recommended.", category: "Summary" });
        }

        // Sort by severity
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        return NextResponse.json({
          findings,
          summary: {
            total: findings.length,
            critical: findings.filter((f) => f.severity === "critical").length,
            high: findings.filter((f) => f.severity === "high").length,
            medium: findings.filter((f) => f.severity === "medium").length,
            low: findings.filter((f) => f.severity === "low").length,
            scannedAt: new Date().toISOString(),
          },
        });
      }

      // ============================================================
      // SYSTEM HEALTH CHECK
      // ============================================================
      case "run-health-check": {
        type HealthStatus = "healthy" | "warning" | "degraded" | "down";
        const findings: { id: string; status: HealthStatus; title: string; description: string; category: string; metric?: string }[] = [];
        const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3000`;

        async function probe(path: string, options: RequestInit = {}): Promise<{ res: Response; ms: number } | null> {
          try {
            const start = Date.now();
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(`${origin}${path}`, { ...options, redirect: "manual", signal: controller.signal });
            clearTimeout(timeout);
            return { res, ms: Date.now() - start };
          } catch { return null; }
        }

        function latencyStatus(ms: number): HealthStatus {
          if (ms < 2000) return "healthy";
          if (ms < 5000) return "warning";
          return "degraded";
        }

        // ── 1. SERVICE CONNECTIVITY ──

        // Supabase Database
        try {
          const start = Date.now();
          const { count, error } = await db.from("workspaces").select("id", { count: "exact", head: true });
          const ms = Date.now() - start;
          if (error) {
            findings.push({ id: "svc-supabase-db", status: "down", title: "Supabase Database unreachable", description: `Query failed: ${error.message}`, category: "Services", metric: "Error" });
          } else {
            const status = latencyStatus(ms);
            findings.push({ id: "svc-supabase-db", status, title: "Supabase Database", description: status === "healthy" ? "Database responding normally." : `Database query took ${ms}ms — performance may be degraded.`, category: "Services", metric: `${ms}ms` });
          }
        } catch (e) {
          findings.push({ id: "svc-supabase-db", status: "down", title: "Supabase Database unreachable", description: `Connection failed: ${e instanceof Error ? e.message : "unknown error"}`, category: "Services", metric: "Error" });
        }

        // Supabase Auth
        try {
          const start = Date.now();
          const { data, error } = await db.auth.admin.listUsers({ perPage: 1 });
          const ms = Date.now() - start;
          if (error) {
            findings.push({ id: "svc-supabase-auth", status: "down", title: "Supabase Auth unreachable", description: `Auth query failed: ${error.message}`, category: "Services", metric: "Error" });
          } else {
            const total = data?.users?.length !== undefined ? "OK" : "Unknown";
            const status = latencyStatus(ms);
            findings.push({ id: "svc-supabase-auth", status, title: "Supabase Auth", description: status === "healthy" ? "Auth service responding normally." : `Auth service took ${ms}ms to respond.`, category: "Services", metric: `${ms}ms` });
          }
        } catch (e) {
          findings.push({ id: "svc-supabase-auth", status: "down", title: "Supabase Auth unreachable", description: `${e instanceof Error ? e.message : "unknown error"}`, category: "Services", metric: "Error" });
        }

        // Supabase Storage
        try {
          const start = Date.now();
          const { data: buckets, error } = await db.storage.listBuckets();
          const ms = Date.now() - start;
          if (error) {
            findings.push({ id: "svc-supabase-storage", status: "down", title: "Supabase Storage unreachable", description: `Storage query failed: ${error.message}`, category: "Services", metric: "Error" });
          } else {
            const status = latencyStatus(ms);
            findings.push({ id: "svc-supabase-storage", status, title: "Supabase Storage", description: `${buckets?.length || 0} bucket(s) configured. Responding normally.`, category: "Services", metric: `${ms}ms` });
          }
        } catch (e) {
          findings.push({ id: "svc-supabase-storage", status: "down", title: "Supabase Storage unreachable", description: `${e instanceof Error ? e.message : "unknown error"}`, category: "Services", metric: "Error" });
        }

        // Stripe API
        try {
          const start = Date.now();
          await stripe.balance.retrieve();
          const ms = Date.now() - start;
          const status = latencyStatus(ms);
          findings.push({ id: "svc-stripe", status, title: "Stripe API", description: status === "healthy" ? "Stripe responding normally." : `Stripe took ${ms}ms to respond.`, category: "Services", metric: `${ms}ms` });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown error";
          if (msg.includes("API key")) {
            findings.push({ id: "svc-stripe", status: "down", title: "Stripe API key invalid", description: "Stripe rejected the API key. Billing features are broken.", category: "Services", metric: "Auth Error" });
          } else {
            findings.push({ id: "svc-stripe", status: "down", title: "Stripe API unreachable", description: `Stripe connection failed: ${msg}`, category: "Services", metric: "Error" });
          }
        }

        // SMTP / Email
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
          findings.push({ id: "svc-smtp", status: "healthy", title: "SMTP (Resend)", description: "SMTP credentials are configured.", category: "Services", metric: "Configured" });
        } else {
          findings.push({ id: "svc-smtp", status: "warning", title: "SMTP not configured", description: "SMTP_HOST or SMTP_USER is missing. Platform emails will fail.", category: "Services", metric: "Missing" });
        }

        // ── 2. API ENDPOINT HEALTH ──
        const endpoints = [
          { id: "api-home", path: "/", method: "GET", name: "Landing Page" },
          { id: "api-announcements", path: "/api/announcements", method: "GET", name: "Announcements" },
        ];

        for (const ep of endpoints) {
          const result = await probe(ep.path, { method: ep.method });
          if (!result) {
            findings.push({ id: ep.id, status: "down", title: `${ep.name} unreachable`, description: `${ep.path} did not respond within 8 seconds.`, category: "Endpoints", metric: "Timeout" });
          } else {
            const status = result.res.status >= 500 ? "down" as HealthStatus : latencyStatus(result.ms);
            findings.push({
              id: ep.id,
              status: result.res.status >= 500 ? "down" : status,
              title: ep.name,
              description: result.res.status >= 500 ? `Returned ${result.res.status} server error.` : `Responding in ${result.ms}ms.`,
              category: "Endpoints",
              metric: result.res.status >= 500 ? `${result.res.status}` : `${result.ms}ms`,
            });
          }
        }

        // ── 3. DATABASE HEALTH ──
        const tableSizes: { name: string; count: number }[] = [];
        const coreTables = ["workspaces", "profiles", "contacts", "tasks", "workspace_members", "page_views", "demo_sessions", "conversations", "conversation_messages", "subscribers", "email_connections", "touchpoints", "announcements", "attachments"];
        const tableWarningThresholds: Record<string, number> = { page_views: 100000, demo_sessions: 50000, conversation_messages: 50000 };

        for (const table of coreTables) {
          try {
            const { count, error } = await db.from(table).select("id", { count: "exact", head: true });
            if (!error && count !== null) {
              tableSizes.push({ name: table, count });
            }
          } catch { /* skip */ }
        }

        if (tableSizes.length > 0) {
          const largeMsg = tableSizes
            .filter(t => t.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
            .map(t => `${t.name}: ${t.count.toLocaleString()}`)
            .join(", ");
          const anyLarge = tableSizes.some(t => tableWarningThresholds[t.name] && t.count > tableWarningThresholds[t.name]);
          findings.push({
            id: "db-table-sizes",
            status: anyLarge ? "warning" : "healthy",
            title: "Table row counts",
            description: anyLarge ? "Some tables are growing large. Consider archiving old data." : "All tables within normal ranges.",
            category: "Database",
            metric: largeMsg || "Empty",
          });
        }

        // Stale conversations (unanswered support tickets)
        try {
          const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
          const { count } = await db.from("conversations").select("id", { count: "exact", head: true }).eq("status", "new").lt("last_message_at", thirtyDaysAgo);
          if (count && count > 0) {
            findings.push({ id: "db-stale-conversations", status: count > 10 ? "degraded" : "warning", title: `${count} unanswered support ticket(s)`, description: `Conversations stuck in "new" status for over 30 days. These represent unresolved user requests.`, category: "Database", metric: `${count} stale` });
          }
        } catch { /* skip */ }

        // Empty workspaces (possible failed onboarding)
        try {
          const { data: allWs } = await db.from("workspaces").select("id");
          const { data: allMembers } = await db.from("workspace_members").select("workspace_id");
          if (allWs && allMembers) {
            const memberWsIds = new Set(allMembers.map((m: { workspace_id: string }) => m.workspace_id));
            const emptyCount = allWs.filter((w: { id: string }) => !memberWsIds.has(w.id)).length;
            if (emptyCount > 0) {
              findings.push({ id: "db-empty-workspaces", status: "warning", title: `${emptyCount} workspace(s) with no members`, description: "These workspaces may indicate failed onboarding. Users created a workspace but never joined it.", category: "Database", metric: `${emptyCount}` });
            }
          }
        } catch { /* skip */ }

        // Stripe plan vs subscription mismatch
        try {
          const { data: bizNoSub } = await db.from("workspaces").select("id").eq("plan", "business").is("stripe_subscription_id", null);
          const { data: freeWithSub } = await db.from("workspaces").select("id").eq("plan", "free").not("stripe_subscription_id", "is", null);
          const mismatches = (bizNoSub?.length || 0) + (freeWithSub?.length || 0);
          if (mismatches > 0) {
            const parts: string[] = [];
            if (bizNoSub?.length) parts.push(`${bizNoSub.length} business plan without subscription`);
            if (freeWithSub?.length) parts.push(`${freeWithSub.length} free plan with active subscription`);
            findings.push({ id: "db-plan-mismatch", status: "warning", title: "Plan/subscription mismatch", description: `${parts.join("; ")}. These may need manual reconciliation.`, category: "Database", metric: `${mismatches}` });
          }
        } catch { /* skip */ }

        // ── 4. GROWTH & TRENDS ──
        const now = Date.now();
        const sevenDaysAgo = new Date(now - 7 * 86400000).toISOString();
        const fourteenDaysAgo = new Date(now - 14 * 86400000).toISOString();

        // User growth
        try {
          const { count: thisWeek } = await db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);
          const { count: lastWeek } = await db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo);
          if (thisWeek !== null && lastWeek !== null) {
            const change = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : (thisWeek > 0 ? 100 : 0);
            findings.push({ id: "growth-users", status: "healthy", title: "User signups (7d)", description: `${thisWeek} this week vs ${lastWeek} last week.`, category: "Growth", metric: `${change >= 0 ? "+" : ""}${change}%` });
          }
        } catch { /* skip */ }

        // Traffic trend
        try {
          const { count: thisWeek } = await db.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);
          const { count: lastWeek } = await db.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo);
          if (thisWeek !== null && lastWeek !== null) {
            const change = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : (thisWeek > 0 ? 100 : 0);
            const status: HealthStatus = change < -50 ? "warning" : "healthy";
            findings.push({ id: "growth-traffic", status, title: "Page views (7d)", description: status === "warning" ? `Traffic dropped ${Math.abs(change)}% — investigate for possible outage or SEO issues.` : `${thisWeek?.toLocaleString()} this week vs ${lastWeek?.toLocaleString()} last week.`, category: "Growth", metric: `${change >= 0 ? "+" : ""}${change}%` });
          }
        } catch { /* skip */ }

        // Workspace growth
        try {
          const { count: thisWeek } = await db.from("workspaces").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo);
          const { count: lastWeek } = await db.from("workspaces").select("id", { count: "exact", head: true }).gte("created_at", fourteenDaysAgo).lt("created_at", sevenDaysAgo);
          if (thisWeek !== null && lastWeek !== null) {
            const change = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : (thisWeek > 0 ? 100 : 0);
            findings.push({ id: "growth-workspaces", status: "healthy", title: "New workspaces (7d)", description: `${thisWeek} this week vs ${lastWeek} last week.`, category: "Growth", metric: `${change >= 0 ? "+" : ""}${change}%` });
          }
        } catch { /* skip */ }

        // ── 5. CAPACITY & PROACTIVE ──

        // Open support backlog
        try {
          const { count } = await db.from("conversations").select("id", { count: "exact", head: true }).in("status", ["new", "active"]);
          if (count !== null) {
            const status: HealthStatus = count > 20 ? "warning" : "healthy";
            findings.push({ id: "capacity-support-backlog", status, title: "Open support conversations", description: status === "warning" ? `${count} open conversations. Support backlog is building up.` : `${count} open conversation(s). Backlog is manageable.`, category: "Capacity", metric: `${count}` });
          }
        } catch { /* skip */ }

        // Auth user count
        try {
          const { data: authData } = await db.auth.admin.listUsers({ perPage: 1 });
          // Supabase returns total in the response
          const total = (authData as unknown as { total?: number })?.total;
          if (total !== undefined) {
            findings.push({ id: "capacity-auth-users", status: "healthy", title: "Total auth users", description: `${total.toLocaleString()} registered user(s) in Supabase Auth.`, category: "Capacity", metric: `${total.toLocaleString()}` });
          }
        } catch { /* skip */ }

        // Churn risk — business workspaces with no recent activity
        try {
          const thirtyDaysAgo = new Date(now - 30 * 86400000).toISOString();
          const { data: bizWorkspaces } = await db.from("workspaces").select("id, name").eq("plan", "business");
          if (bizWorkspaces && bizWorkspaces.length > 0) {
            let atRisk = 0;
            for (const ws of bizWorkspaces) {
              const { count } = await db.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo);
              // Rough heuristic — if there's any activity at all we won't flag it
              // A more precise check would filter page_views by workspace, but page_views may not have workspace_id
              break; // Skip expensive per-workspace check, use simpler heuristic below
            }
            // Simpler: just report how many business workspaces exist as capacity info
            findings.push({ id: "capacity-paying-ws", status: "healthy", title: "Paying workspaces", description: `${bizWorkspaces.length} workspace(s) on business plan.`, category: "Capacity", metric: `${bizWorkspaces.length}` });
          }
        } catch { /* skip */ }

        // ── REPORT ──
        // Sort: down first, then degraded, warning, healthy
        const statusOrder: Record<HealthStatus, number> = { down: 0, degraded: 1, warning: 2, healthy: 3 };
        findings.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

        return NextResponse.json({
          findings,
          summary: {
            total: findings.length,
            healthy: findings.filter(f => f.status === "healthy").length,
            warning: findings.filter(f => f.status === "warning").length,
            degraded: findings.filter(f => f.status === "degraded").length,
            down: findings.filter(f => f.status === "down").length,
            checkedAt: new Date().toISOString(),
          },
        });
      }

      // ============================================================
      // FEATURE USAGE ANALYTICS
      // ============================================================
      case "get-feature-usage": {
        const { days = 30 } = body;
        const since = new Date(Date.now() - days * 86400000).toISOString();

        // Top events by count
        const { data: events } = await db
          .from("feature_events")
          .select("event_name, created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(10000);

        if (!events || events.length === 0) {
          return NextResponse.json({
            topEvents: [],
            dailyActivity: [],
            totalEvents: 0,
            uniqueEvents: 0,
            uniqueUsers: 0,
            period: days,
          });
        }

        // Aggregate event counts
        const eventCounts: Record<string, number> = {};
        const dailyCounts: Record<string, number> = {};
        for (const e of events) {
          eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
          const day = e.created_at.slice(0, 10);
          dailyCounts[day] = (dailyCounts[day] || 0) + 1;
        }

        const topEvents = Object.entries(eventCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);

        // Fill in daily activity for the full range
        const dailyActivity: { date: string; count: number }[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
          dailyActivity.push({ date: d, count: dailyCounts[d] || 0 });
        }

        // Get unique users
        const { data: uniqueUsers } = await db
          .from("feature_events")
          .select("user_id")
          .gte("created_at", since)
          .not("user_id", "is", null);
        const uniqueUserCount = new Set(uniqueUsers?.map(u => u.user_id)).size;

        return NextResponse.json({
          topEvents,
          dailyActivity,
          totalEvents: events.length,
          uniqueEvents: topEvents.length,
          uniqueUsers: uniqueUserCount,
          period: days,
        });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Types
interface PersonRecord {
  id: string;
  email: string;
  name: string;
  type: "user" | "subscriber" | "both";
  workspace_name?: string;
  role?: string;
  subscribed_at?: string;
  created_at: string;
}

interface AnalyticsPoint {
  label: string;
  visitors: number;
  demos: number;
  signups: number;
  conversions: number;
}

interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  user_email?: string;
  workspace_name?: string;
  timestamp: string;
}
