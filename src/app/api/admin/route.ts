import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendPlatformEmail } from "@/lib/platform-email";

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

            const { count: conversions } = await db
              .from("demo_sessions")
              .select("*", { count: "exact", head: true })
              .eq("converted_to_user", true)
              .gte("started_at", start.toISOString())
              .lt("started_at", end.toISOString());

            points.push({
              label,
              visitors: uniqueCount,
              demos: demos.count || 0,
              signups: signups.count || 0,
              conversions: conversions || 0,
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

            const { count: conversions } = await db
              .from("demo_sessions")
              .select("*", { count: "exact", head: true })
              .eq("converted_to_user", true)
              .gte("started_at", start.toISOString())
              .lt("started_at", end.toISOString());

            points.push({
              label,
              visitors: uniqueCount,
              demos: demos.count || 0,
              signups: signups.count || 0,
              conversions: conversions || 0,
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

        const { error: insertError } = await db.from("admin_access_requests").insert({
          workspace_id: workspaceId,
          token,
          status: "pending",
          expires_at: expiresAt,
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
                  A WorkChores admin is requesting temporary <strong>read-only</strong> access to your workspace <strong>"${ws.name}"</strong>.
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
        const { workspaceId } = body;
        if (!workspaceId) return NextResponse.json({ error: "workspaceId required" }, { status: 400 });

        // Find the most recent pending/approved request for this workspace
        const { data: accessReq } = await db
          .from("admin_access_requests")
          .select("id, status, expires_at, approved_at, token")
          .eq("workspace_id", workspaceId)
          .in("status", ["pending", "approved"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!accessReq) {
          return NextResponse.json({ status: "none" });
        }

        // Check expiry
        if (new Date(accessReq.expires_at) < new Date()) {
          await db.from("admin_access_requests").update({ status: "expired" }).eq("id", accessReq.id);
          return NextResponse.json({ status: "expired" });
        }

        if (accessReq.status === "approved") {
          // Mark as used so it can't be reused
          await db.from("admin_access_requests").update({ status: "used" }).eq("id", accessReq.id);
          return NextResponse.json({ status: "approved", expiresAt: accessReq.expires_at });
        }

        return NextResponse.json({ status: "pending" });
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
