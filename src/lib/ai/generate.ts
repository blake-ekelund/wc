import Anthropic from "@anthropic-ai/sdk";
import type { SearchResult } from "./search";

const SYSTEM_PROMPT = `You are WorkChores Assistant, a helpful chatbot on the WorkChores website.

WorkChores is an operations platform for small teams (1-25 people) that includes CRM, Vendor Management, and Task Tracker plugins — all included with every seat at $9/seat/month. There is a free Starter plan with all features (100 contacts, 1,000 actions/month) and a Business plan at $9/seat/month (50,000 contacts, 500,000 actions/month).

Rules:
- Only answer based on the provided context. If the context doesn't contain the answer, say "I don't have specific information about that. You can reach us at support@workchores.com or check our docs at workchores.com/docs."
- Be concise — 2-3 sentences max unless the user asks for detail.
- Never make up features, pricing, or capabilities not in the context.
- Be friendly and professional. No markdown formatting — plain text only.
- If someone asks about a competitor, be honest and focus on what WorkChores does well.

IMPORTANT: You must respond with a JSON object (no other text). The JSON must have exactly these fields:
{
  "answer": "Your response text here",
  "sentiment": "positive" | "neutral" | "negative",
  "cta": "try-demo" | "see-pricing" | "sign-up" | "contact-us" | "read-docs" | null
}

Sentiment guidelines:
- "positive": User is interested, asking about features, comparing favorably, expressing intent to try/buy
- "neutral": General questions, information seeking, no strong emotion either way
- "negative": Expressing frustration, complaints, missing features, comparing unfavorably, skepticism about value

CTA guidelines — pick the MOST relevant one based on the conversation:
- "try-demo": User is curious about how it works, wants to see it, exploring features
- "see-pricing": User asked about cost, plans, pricing, or is comparing value
- "sign-up": User seems ready to start, asked about getting started, or is convinced
- "contact-us": User has a complex question you can't fully answer, needs human help
- "read-docs": User asked a detailed how-to question that the docs cover better
- null: No CTA is appropriate (e.g., just a greeting or very short exchange)`;

export type Sentiment = "positive" | "neutral" | "negative";
export type CtaType = "try-demo" | "see-pricing" | "sign-up" | "contact-us" | "read-docs" | null;

export interface AssistantResponse {
  answer: string;
  sources: { title: string; url: string }[];
  sentiment: Sentiment;
  cta: CtaType;
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
      sentiment: "neutral",
      cta: "contact-us",
    };
  }

  const anthropic = new Anthropic({ apiKey });

  const contextStr = context.length > 0
    ? context.map((c) => `[Source: ${c.title}${c.source_url ? ` (${c.source_url})` : ""}]\n${c.content}`).join("\n\n---\n\n")
    : "No specific context found for this question.";

  const messages: { role: "user" | "assistant"; content: string }[] = [
    ...conversationHistory.slice(-8),
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

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON response
    let answer = rawText;
    let sentiment: Sentiment = "neutral";
    let cta: CtaType = null;

    try {
      // Try to extract JSON from the response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        answer = parsed.answer || rawText;
        sentiment = (["positive", "neutral", "negative"].includes(parsed.sentiment) ? parsed.sentiment : "neutral") as Sentiment;
        cta = parsed.cta || null;
      }
    } catch {
      // If JSON parsing fails, use the raw text as the answer
      // Infer basic sentiment from keywords
      const lower = rawText.toLowerCase();
      if (lower.includes("sign up") || lower.includes("get started") || lower.includes("try")) {
        cta = "sign-up";
      } else if (lower.includes("pricing") || lower.includes("cost")) {
        cta = "see-pricing";
      } else if (lower.includes("demo")) {
        cta = "try-demo";
      }
    }

    const sources = context
      .filter((c) => c.source_url)
      .reduce<{ title: string; url: string }[]>((acc, c) => {
        if (!acc.find((s) => s.url === c.source_url)) {
          acc.push({ title: c.title, url: c.source_url! });
        }
        return acc;
      }, [])
      .slice(0, 3);

    return { answer, sources, sentiment, cta };
  } catch {
    return {
      answer: "I'm having trouble right now. Please try again or reach out to support@workchores.com.",
      sources: [],
      sentiment: "neutral",
      cta: "contact-us",
    };
  }
}
