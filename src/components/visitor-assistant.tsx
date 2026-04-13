"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, ExternalLink, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { trackEvent } from "@/lib/track-event";

// ============================================================
// TYPES
// ============================================================

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; url: string }[];
  timestamp: number;
}

const SUGGESTED_QUESTIONS = [
  "What does WorkChores cost?",
  "How is it different from HubSpot?",
  "Can I try before signing up?",
  "What plugins are included?",
];

const QUICK_LINKS = [
  { label: "Try the Demo", href: "/demo" },
  { label: "See Pricing", href: "/pricing" },
  { label: "Sign Up Free", href: "/signup" },
];

// ============================================================
// COMPONENT
// ============================================================

export default function VisitorAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [thinking, setThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // Focus input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function sendMessage(text: string) {
    if (!text.trim() || thinking) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);
    trackEvent("visitor_assistant.message", { query: text.trim() });

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), sessionId }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (data.sessionId) setSessionId(data.sessionId);
      } else {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I couldn't process that right now. Try again or reach out to support@workchores.com.",
          timestamp: Date.now(),
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Something went wrong. Please try again.",
        timestamp: Date.now(),
      }]);
    }
    setThinking(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent hover:bg-accent-dark text-white shadow-lg shadow-accent/30 flex items-center justify-center transition-all hover:scale-105"
          aria-label="Open assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-full sm:w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden font-[family-name:var(--font-geist-sans)]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-accent">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">WorkChores</div>
                <div className="text-[10px] text-white/70">Ask me anything</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" role="log" aria-live="polite">
            {/* Welcome message (always shown at top) */}
            {messages.length === 0 && !thinking && (
              <div className="space-y-4">
                {/* Bot intro */}
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                      <p className="text-sm text-foreground leading-relaxed">
                        Hey! I&apos;m the WorkChores assistant. I can answer questions about our CRM, pricing, features, and more. What can I help with?
                      </p>
                    </div>

                    {/* Quick links */}
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_LINKS.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium text-accent bg-accent/5 border border-accent/20 rounded-full hover:bg-accent/10 transition-colors"
                        >
                          {link.label} <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      ))}
                    </div>

                    {/* Suggested questions */}
                    <div className="space-y-1.5">
                      {SUGGESTED_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="block w-full text-left px-3 py-2 text-xs text-foreground bg-white border border-gray-200 rounded-xl hover:border-accent/30 hover:bg-accent/5 transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] space-y-2 ${msg.role === "user" ? "items-end" : ""}`}>
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-accent text-white rounded-tr-md"
                      : "bg-gray-100 text-foreground rounded-tl-md"
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {/* Source links */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((s) => (
                        <Link key={s.url} href={s.url} className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-accent bg-accent/5 border border-accent/15 rounded-lg hover:bg-accent/10 transition-colors">
                          <ExternalLink className="w-2.5 h-2.5" /> {s.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {thinking && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="px-3 py-3 border-t border-gray-100 bg-white">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-full outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-muted bg-gray-50"
                disabled={thinking}
              />
              <button
                type="submit"
                disabled={thinking || !input.trim()}
                className="w-9 h-9 rounded-full bg-accent hover:bg-accent-dark text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:hover:bg-accent shrink-0"
                aria-label="Send message"
              >
                {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
