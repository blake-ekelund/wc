import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRateLimiter } from "@/lib/rate-limit";
import { searchKnowledge } from "@/lib/ai/search";
import { generateAnswer } from "@/lib/ai/generate";
import crypto from "crypto";

const assistantLimiter = createRateLimiter({ max: 10, windowMs: 60_000, id: "assistant" });

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: NextRequest) {
  // Rate limit
  const blocked = assistantLimiter(request);
  if (blocked) return blocked;

  try {
    const { message, sessionId: providedSessionId } = await request.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const db = getDb();
    const sessionId = providedSessionId || crypto.randomBytes(16).toString("hex");

    // 1. Search knowledge base
    const searchResults = await searchKnowledge(message.trim(), 5);

    // 2. Get conversation history for this session
    const { data: historyData } = await db
      .from("assistant_messages")
      .select("role, message")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(10);

    const history = (historyData || []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.message,
    }));

    // 3. Generate answer with Claude
    const { answer, sources } = await generateAnswer(message.trim(), searchResults, history);

    // 4. Save conversation
    await db.from("assistant_messages").insert([
      { session_id: sessionId, role: "user", message: message.trim(), sources: [] },
      { session_id: sessionId, role: "assistant", message: answer, sources },
    ]);

    return NextResponse.json({
      answer,
      sources,
      sessionId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
