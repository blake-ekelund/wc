import Anthropic from "@anthropic-ai/sdk";
import type { SearchResult } from "./search";

const SYSTEM_PROMPT = `You are WorkChores Assistant, a helpful chatbot on the WorkChores website.

WorkChores is an operations platform for small teams (1-25 people) that includes CRM, Vendor Management, and Task Tracker plugins — all included with every seat at $9/seat/month. There is a free Starter plan with all features (100 contacts, 1,000 actions/month) and a Business plan at $9/seat/month (50,000 contacts, 500,000 actions/month).

Rules:
- Only answer based on the provided context. If the context doesn't contain the answer, say "I don't have specific information about that. You can reach us at support@workchores.com or check our docs at workchores.com/docs."
- Be concise — 2-3 sentences max unless the user asks for detail.
- When relevant, mention a specific page they can visit (e.g. "Check out our pricing at /pricing" or "See our docs at /docs").
- Never make up features, pricing, or capabilities not in the context.
- Be friendly and professional. No markdown formatting — plain text only.
- If someone asks about a competitor, be honest and focus on what WorkChores does well rather than attacking the competitor.`;

export interface AssistantResponse {
  answer: string;
  sources: { title: string; url: string }[];
}

export async function generateAnswer(
  question: string,
  context: SearchResult[],
  conversationHistory: { role: "user" | "assistant"; content: string }[] = [],
): Promise<AssistantResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      answer: "I'm not available right now. Please reach out to support@workchores.com or check our docs at workchores.com/docs.",
      sources: [],
    };
  }

  const anthropic = new Anthropic({ apiKey });

  // Build context string from search results
  const contextStr = context.length > 0
    ? context.map((c) => `[Source: ${c.title}${c.source_url ? ` (${c.source_url})` : ""}]\n${c.content}`).join("\n\n---\n\n")
    : "No specific context found for this question.";

  // Build messages array with conversation history
  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...conversationHistory.slice(-8), // Last 4 exchanges
    {
      role: "user",
      content: `Context from our website:\n\n${contextStr}\n\n---\n\nUser question: ${question}`,
    },
  ];

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages,
    });

    const answer = response.content[0].type === "text" ? response.content[0].text : "";

    // Extract unique sources
    const sources = context
      .filter((c) => c.source_url)
      .reduce<{ title: string; url: string }[]>((acc, c) => {
        if (!acc.find((s) => s.url === c.source_url)) {
          acc.push({ title: c.title, url: c.source_url! });
        }
        return acc;
      }, [])
      .slice(0, 3);

    return { answer, sources };
  } catch (err) {
    return {
      answer: "I'm having trouble right now. Please try again or reach out to support@workchores.com.",
      sources: [],
    };
  }
}
