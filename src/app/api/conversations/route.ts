import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { createRateLimiter } from "@/lib/rate-limit";

function getAdminDb() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/** Create an HMAC-signed session token for anonymous chat users */
function signSessionId(rawId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback";
  const sig = crypto.createHmac("sha256", secret).update(`chat:${rawId}`).digest("hex").slice(0, 16);
  return Buffer.from(JSON.stringify({ id: rawId, sig })).toString("base64url");
}

/** Verify and extract the raw sessionId from a signed token */
function verifySessionToken(token: string): string | null {
  try {
    const { id, sig } = JSON.parse(Buffer.from(token, "base64url").toString());
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback";
    const expected = crypto.createHmac("sha256", secret).update(`chat:${id}`).digest("hex").slice(0, 16);
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return id as string;
  } catch {
    return null;
  }
}

/** Verify that the caller owns a conversation */
async function verifyConversationOwnership(
  db: ReturnType<typeof getAdminDb>,
  conversationId: string,
  userId: string | null,
  anonSessionId: string | null,
): Promise<boolean> {
  const { data: conv } = await db
    .from("conversations")
    .select("user_id, user_email")
    .eq("id", conversationId)
    .single();
  if (!conv) return false;
  if (userId && conv.user_id === userId) return true;
  if (anonSessionId && conv.user_email === `anon-${anonSessionId}`) return true;
  return false;
}

// Separate limits: creating conversations is more restricted than messaging
const createLimiter = createRateLimiter({ max: 5, id: "conv-create" });
const messageLimiter = createRateLimiter({ max: 30, id: "conv-message" });
const pollLimiter = createRateLimiter({ max: 60, id: "conv-poll" });
const tokenLimiter = createRateLimiter({ max: 10, id: "conv-token" });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Apply rate limiting based on action type
    if (action === "get-or-create") {
      const blocked = createLimiter(request);
      if (blocked) return blocked;
    } else if (action === "send-message") {
      const blocked = messageLimiter(request);
      if (blocked) return blocked;
    } else if (action === "poll" || action === "get-or-create-check") {
      const blocked = pollLimiter(request);
      if (blocked) return blocked;
    } else if (action === "get-session-token") {
      const blocked = tokenLimiter(request);
      if (blocked) return blocked;
    }

    // Try to get authenticated user
    let userId: string | null = null;
    let userEmail = "anonymous";
    let userName = "Anonymous";
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email || "anonymous";
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        userName = profile?.full_name || "User";
      }
    } catch {
      // Not authenticated
    }

    // For anonymous users, verify the signed session token
    let anonSessionId: string | null = null;
    if (!userId && body.sessionToken) {
      anonSessionId = verifySessionToken(body.sessionToken);
      if (!anonSessionId) {
        return NextResponse.json({ error: "Invalid session token" }, { status: 403 });
      }
    }

    const db = getAdminDb();

    switch (action) {
      // Issue a signed session token for anonymous users
      case "get-session-token": {
        const { rawSessionId } = body;
        if (!rawSessionId) {
          return NextResponse.json({ error: "Missing rawSessionId" }, { status: 400 });
        }
        const token = signSessionId(rawSessionId);
        return NextResponse.json({ sessionToken: token });
      }
      // Check for existing conversation without creating
      case "get-or-create-check": {
        let query = db
          .from("conversations")
          .select("*")
          .order("last_message_at", { ascending: false })
          .limit(1);

        if (userId) {
          query = query.eq("user_id", userId);
        } else if (anonSessionId) {
          query = query.eq("user_email", `anon-${anonSessionId}`);
        } else {
          return NextResponse.json({ conversation: null, messages: [] });
        }

        const { data: existing } = await query;

        if (existing && existing.length > 0) {
          const conv = existing[0];
          if (conv.status === "closed") {
            return NextResponse.json({ conversation: conv, messages: [] });
          }
          const { data: messages } = await db
            .from("conversation_messages")
            .select("*")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: true });
          return NextResponse.json({ conversation: conv, messages: messages || [] });
        }

        return NextResponse.json({ conversation: null, messages: [] });
      }

      // Get or create the user's active conversation
      case "get-or-create": {
        // Look for existing open conversation
        let query = db
          .from("conversations")
          .select("*")
          .in("status", ["new", "active"])
          .order("last_message_at", { ascending: false })
          .limit(1);

        if (userId) {
          query = query.eq("user_id", userId);
        } else if (anonSessionId) {
          query = query.eq("user_email", `anon-${anonSessionId}`);
        } else {
          return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { data: existing } = await query;

        if (existing && existing.length > 0) {
          // Get messages
          const { data: messages } = await db
            .from("conversation_messages")
            .select("*")
            .eq("conversation_id", existing[0].id)
            .order("created_at", { ascending: true });

          return NextResponse.json({
            conversation: existing[0],
            messages: messages || [],
          });
        }

        // Create new conversation
        const { data: conv, error } = await db.from("conversations").insert({
          user_id: userId,
          user_email: userId ? userEmail : `anon-${anonSessionId}`,
          user_name: userName,
          subject: "Support Request",
          status: "new",
        }).select().single();

        if (error) {
          console.error("Create conversation error:", error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Add bot greeting
        await db.from("conversation_messages").insert({
          conversation_id: conv.id,
          sender: "bot",
          sender_name: "WorkChores",
          message: "Hi there! 👋 How can we help you today? You can ask about any feature, or describe your issue and our team will get back to you.",
        });

        const { data: messages } = await db
          .from("conversation_messages")
          .select("*")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true });

        return NextResponse.json({
          conversation: conv,
          messages: messages || [],
        });
      }

      // Send a message from the user
      case "send-message": {
        const { conversationId, message } = body;
        if (!conversationId || !message?.trim()) {
          return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Verify the caller owns this conversation
        if (!userId && !anonSessionId) {
          return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        const owns = await verifyConversationOwnership(db, conversationId, userId, anonSessionId);
        if (!owns) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Insert user message
        const { data: msg, error } = await db.from("conversation_messages").insert({
          conversation_id: conversationId,
          sender: "user",
          sender_name: userName,
          message: message.trim(),
        }).select().single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Update conversation timestamp and status
        await db.from("conversations").update({
          last_message_at: new Date().toISOString(),
          status: "active",
          user_name: userName,
          ...(userId ? { user_id: userId, user_email: userEmail } : {}),
        }).eq("id", conversationId);

        // Try to auto-answer from knowledge base
        const autoReply = matchKnowledgeBase(message.trim());
        if (autoReply) {
          await db.from("conversation_messages").insert({
            conversation_id: conversationId,
            sender: "bot",
            sender_name: "WorkChores",
            message: autoReply,
          });
        }

        // Get updated messages
        const { data: messages } = await db
          .from("conversation_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        return NextResponse.json({ messages: messages || [] });
      }

      // Poll for new messages (user side)
      case "poll": {
        const { conversationId } = body;
        if (!conversationId) {
          return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
        }

        // Verify the caller owns this conversation
        if (!userId && !anonSessionId) {
          return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }
        const ownsPoll = await verifyConversationOwnership(db, conversationId, userId, anonSessionId);
        if (!ownsPoll) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data: messages } = await db
          .from("conversation_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        return NextResponse.json({ messages: messages || [] });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Conversations API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Simple knowledge base matching
function matchKnowledgeBase(query: string): string | null {
  const q = query.toLowerCase();
  const kb: { keywords: string[]; answer: string }[] = [
    { keywords: ["sign up", "signup", "create account", "register"], answer: "To create an account, go to workchores.com/signup. Enter your name, email, and password. You'll get a confirmation email — click the link to activate your account, then pick your industry template!" },
    { keywords: ["pricing", "cost", "free", "how much", "price", "plan"], answer: "Starter is free (up to 100 contacts, 3 users). Business is $5/seat/month with 50K contacts, unlimited users, custom fields, and email integration. No contracts — cancel anytime!" },
    { keywords: ["import", "upload", "csv", "excel", "spreadsheet"], answer: "Go to Import in the sidebar. Follow the 4-step wizard: configure fields → download our Excel template → fill in your data → upload and confirm. We handle column mapping automatically!" },
    { keywords: ["email", "gmail", "connect gmail", "send email"], answer: "Go to Settings → Email Templates → Connect Gmail. Authorize WorkChores, and you can send emails directly from any contact's page. Emails are sent from YOUR Gmail account." },
    { keywords: ["invite", "team", "add member", "teammate"], answer: "Go to Settings → Team Members. Enter their email and choose a role (Admin, Manager, or Member). They'll get an invite email with a link to join your workspace." },
    { keywords: ["pipeline", "stages", "customize pipeline"], answer: "Go to Settings → Pipeline to customize your stages. You can rename, recolor, reorder (drag & drop), add new stages, or remove stages. Changes reflect everywhere instantly." },
    { keywords: ["role", "permission", "admin", "manager", "member", "access"], answer: "Admin sees all data and manages settings. Manager sees their own data + direct reports. Member sees only their own data. Set roles in Settings → Team Members." },
    { keywords: ["export", "download", "backup"], answer: "Go to Export in the sidebar. Select data types (Contacts, Tasks, Activity), apply filters, choose Excel or CSV format, and click Export." },
    { keywords: ["delete", "remove", "trash"], answer: "To delete a contact, open their detail page → click the ··· menu → Delete. They move to trash (recoverable). To permanently delete, go to the trash view and click 'Empty Trash'." },
    { keywords: ["archive", "hide"], answer: "To archive a contact, open their detail page → click the ··· menu → Archive. They're hidden from the active list but preserved. View archived contacts using the archive icon on the Contacts page." },
    { keywords: ["task", "create task", "follow up", "todo"], answer: "Click the + button in the header → 'New Task'. Enter a title, due date, priority, and optionally link it to a contact. Tasks appear in your task list, calendar, and on the linked contact's page." },
    { keywords: ["calendar"], answer: "The Calendar shows a monthly grid with all your tasks and touchpoints. Click any day to see details. Tasks are color-coded by priority, touchpoints by type." },
    { keywords: ["search", "find"], answer: "Use the search bar in the top-right header. You can search contacts by name, email, phone (any format), company, role, tags, or stage. Tasks can be searched by title or description." },
    { keywords: ["custom field", "add field"], answer: "Open any contact in edit mode, scroll to custom fields, and click 'Add Custom Field'. Choose a type (text, number, date, dropdown). Only Admin users can create fields." },
    { keywords: ["demo", "try", "test"], answer: "Visit workchores.com/demo for a full interactive demo — no signup needed! You get sample data and can switch between Admin, Manager, and Member roles." },
  ];

  let bestMatch: typeof kb[0] | null = null;
  let bestScore = 0;

  for (const entry of kb) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw)) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestScore >= 4 && bestMatch) {
    return bestMatch.answer + "\n\nIf you need more help, just ask and our team will follow up! 😊";
  }

  return null;
}
