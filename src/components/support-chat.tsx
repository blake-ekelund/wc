"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  MessageCircle, X, Send, Loader2, ChevronRight,
  Zap, Users, GitBranch, CheckSquare, Mail, Shield, CreditCard, HelpCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { trackEvent } from "@/lib/track-event";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ConvMessage {
  id: string;
  sender: "user" | "admin" | "bot";
  sender_name: string;
  message: string;
  created_at: string;
}

// Guided questionnaire categories
const categories = [
  { id: "getting-started", label: "Getting Started", icon: Zap },
  { id: "contacts", label: "Contacts & Data", icon: Users },
  { id: "pipeline", label: "Pipeline & Deals", icon: GitBranch },
  { id: "tasks", label: "Tasks & Calendar", icon: CheckSquare },
  { id: "email", label: "Email Integration", icon: Mail },
  { id: "roles", label: "Roles & Permissions", icon: Shield },
  { id: "billing", label: "Billing & Pricing", icon: CreditCard },
  { id: "other", label: "Something Else", icon: HelpCircle },
];

const faqByCategory: Record<string, { q: string; a: string }[]> = {
  "getting-started": [
    { q: "How do I create an account?", a: "Go to workchores.com/signup. Enter your name, email, and password. Confirm your email, pick your industry template, name your workspace, and you're in!" },
    { q: "Can I try without signing up?", a: "Yes! Visit workchores.com/demo for a full interactive demo with sample data. No signup needed." },
    { q: "How do I import existing contacts?", a: "Go to Import in the sidebar. Follow the 4-step wizard: configure fields \u2192 download template \u2192 fill in data \u2192 upload. We handle the rest!" },
    { q: "How do I invite my team?", a: "Go to Settings \u2192 Team Members. Enter their email, choose a role, and send the invite." },
  ],
  "contacts": [
    { q: "How do I add a contact?", a: "Click the + button in the header \u2192 'New Contact'. Fill in their info and click Save." },
    { q: "How do I edit a contact?", a: "Click any contact to open their detail page, then click the pencil icon to enter edit mode." },
    { q: "How do bulk actions work?", a: "Select contacts using checkboxes, then use the action bar: Change Stage, Reassign, Bulk Email, Archive, or Delete." },
    { q: "How does duplicate detection work?", a: "When you save a contact, we check for matches using name, email, phone, and company. You'll see a warning with confidence scores." },
  ],
  "pipeline": [
    { q: "How does the pipeline work?", a: "The Pipeline view shows deals organized by stage. Color-coded cards show deal count and value per stage. Customize stages in Settings \u2192 Pipeline." },
    { q: "How do I customize my pipeline?", a: "Go to Settings \u2192 Pipeline. Rename, recolor, drag to reorder, add new stages, or remove stages." },
  ],
  "tasks": [
    { q: "How do I create a task?", a: "Click + in the header \u2192 'New Task'. Enter title, notes, due date, priority, and owner. Link to a contact optionally." },
    { q: "How does the calendar work?", a: "The Calendar shows a monthly grid with tasks and touchpoints. Click any day for details. Color-coded by priority and type." },
  ],
  "email": [
    { q: "How do I send emails from WorkChores?", a: "Connect Gmail in Settings \u2192 Email Templates. Then open any contact and click the email icon to compose and send." },
    { q: "How do email templates work?", a: "Create templates in Settings \u2192 Email Templates. They support variables: {{firstName}}, {{company}}, {{senderName}} that auto-fill." },
    { q: "What are the email rate limits?", a: "Gmail: 250/day (personal) or 2,000/day (Workspace). The bulk email modal shows your remaining quota." },
  ],
  "roles": [
    { q: "How do roles work?", a: "Admin sees all data + settings. Manager sees own + direct reports' data. Member sees only their own." },
    { q: "How does the reporting structure work?", a: "Set 'reports to' in Settings \u2192 Team Members. Managers see data from their direct reports." },
  ],
  "billing": [
    { q: "What does WorkChores cost?", a: "Starter is free (100 contacts, 3 users). Business is $5/seat/month with 50K contacts, unlimited users, and all features unlocked. No contracts — cancel anytime." },
    { q: "Can I cancel anytime?", a: "Yes! No contracts. Cancel anytime from Settings \u2192 Billing & Plan." },
  ],
};

type ChatPhase = "greeting" | "category" | "faq" | "conversation";

/** Get or create a signed session token for anonymous chat */
async function getSessionToken(): Promise<string> {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem("wc-support-token");
  if (token) return token;

  // Generate a raw ID and get it signed by the server
  let rawId = localStorage.getItem("wc-support-session");
  if (!rawId) {
    rawId = crypto.randomUUID();
    localStorage.setItem("wc-support-session", rawId);
  }
  try {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get-session-token", rawSessionId: rawId }),
    });
    const data = await res.json();
    if (data.sessionToken) {
      token = data.sessionToken;
      localStorage.setItem("wc-support-token", token!);
      return token!;
    }
  } catch {
    // Fall through
  }
  return "";
}

export default function SupportChat() {
  const pathname = usePathname();
  const isDemo = pathname?.startsWith("/demo");
  const isLive = pathname?.startsWith("/app");
  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [phase, setPhase] = useState<ChatPhase>("greeting");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Conversation state (only used in "conversation" phase)
  const [convMessages, setConvMessages] = useState<ConvMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  // Listen for "show-chat" custom event from ? menu
  useEffect(() => {
    function handleShowChat() {
      setShowBubble(true);
      setIsOpen(true);
      trackEvent("support.opened");
    }
    window.addEventListener("show-support-chat", handleShowChat);
    return () => window.removeEventListener("show-support-chat", handleShowChat);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [convMessages, adminTyping, phase, selectedCategory]);

  // Check if there's an existing open conversation on mount (live mode only)
  useEffect(() => {
    if (!isOpen || isDemo) return;
    async function checkExisting() {
      try {
        const sessionToken = await getSessionToken();
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get-or-create-check", sessionToken }),
        });
        const data = await res.json();
        if (data.conversation && data.messages?.length > 1) {
          // Has an existing conversation with messages — go straight to conversation mode
          setConversationId(data.conversation.id);
          setConvMessages(data.messages);
          setPhase("conversation");
        } else if (data.conversation && data.conversation.status === "closed") {
          // Conversation was closed by admin — reset
          setPhase("greeting");
          setConversationId(null);
          setConvMessages([]);
          localStorage.removeItem("wc-support-session");
          localStorage.removeItem("wc-support-token");
        }
      } catch {
        // No existing conversation — show greeting
      }
    }
    checkExisting();
  }, [isOpen]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`conversation:${conversationId}`)
      .on("broadcast", { event: "new-message" }, (payload) => {
        const msg = payload.payload as ConvMessage;
        setConvMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (!isOpen) setHasUnread(true);
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.sender === "admin") {
          setAdminTyping(true);
          if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
          adminTypingTimeoutRef.current = setTimeout(() => setAdminTyping(false), 3000);
        }
      })
      .on("broadcast", { event: "conversation-closed" }, () => {
        // Admin closed the conversation — reset
        setPhase("greeting");
        setConversationId(null);
        setConvMessages([]);
        localStorage.removeItem("wc-support-session");
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, supabase, isOpen]);

  function handleTyping() {
    if (!channelRef.current || typingTimeoutRef.current) return;
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { sender: "user" } });
    typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
  }

  // Create conversation and send first message
  async function startConversation(firstMessage: string) {
    setLoadingConv(true);
    setPhase("conversation");
    try {
      const sessionToken = await getSessionToken();
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-or-create", sessionToken }),
      });
      const data = await res.json();
      if (data.conversation) {
        setConversationId(data.conversation.id);
        setConvMessages(data.messages || []);

        // Send the first message
        const sendRes = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send-message",
            conversationId: data.conversation.id,
            message: firstMessage,
            sessionToken,
          }),
        });
        const sendData = await sendRes.json();
        if (sendData.messages) setConvMessages(sendData.messages);
      }
    } catch (err) {
      console.error("Start conversation error:", err);
    }
    setLoadingConv(false);
  }

  async function handleSend() {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput("");
    trackEvent("support.message_sent");

    // Demo mode — only local KB matching, no Supabase
    if (isDemo) {
      setDemoMessages((prev) => [...prev, { id: `u-${Date.now()}`, sender: "user" as const, message: userMsg }]);
      // Try KB match
      const match = matchLocalKB(userMsg);
      if (match) {
        setDemoMessages((prev) => [...prev, { id: `b-${Date.now()}`, sender: "bot" as const, message: match }]);
      } else {
        setDemoMessages((prev) => [...prev, {
          id: `b-${Date.now()}`,
          sender: "bot" as const,
          message: "Great question! Live chat with our support team is available for registered users. Create a free account at workchores.com/signup to get personalized help.\n\nYou can also browse our docs at workchores.com/docs for guides on every feature.",
        }]);
      }
      return;
    }

    if (!conversationId) {
      // First message — create conversation
      await startConversation(userMsg);
      return;
    }

    setSending(true);
    const tempId = `temp-${Date.now()}`;
    setConvMessages((prev) => [...prev, {
      id: tempId, sender: "user", sender_name: "You", message: userMsg, created_at: new Date().toISOString(),
    }]);

    try {
      const sessionToken = await getSessionToken();
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-message", conversationId, message: userMsg, sessionToken }),
      });
      const data = await res.json();
      if (data.messages) {
        setConvMessages(data.messages);
        const newMsgs = data.messages.filter((m: ConvMessage) => m.id !== tempId && !convMessages.some((e) => e.id === m.id));
        for (const msg of newMsgs) {
          channelRef.current?.send({ type: "broadcast", event: "new-message", payload: msg });
        }
      }
    } catch (err) {
      console.error("Send error:", err);
    }
    setSending(false);
  }

  function handleCategorySelect(catId: string) {
    setSelectedCategory(catId);
    if (catId === "other") {
      if (isDemo) {
        // Demo mode — show sign-up prompt
        setDemoMessages((prev) => [
          ...prev,
          { id: `b-signup-${Date.now()}`, sender: "bot", message: "Live chat with our team is available for registered users. Create a free account to chat with us directly!\n\nIn the meantime, browse our FAQ topics above or check out our docs at workchores.com/docs." },
        ]);
        setPhase("conversation");
      } else {
        setPhase("conversation");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } else {
      setPhase("faq");
    }
  }

  // Demo-only local messages (no Supabase)
  const [demoMessages, setDemoMessages] = useState<{ id: string; sender: "user" | "bot"; message: string }[]>([]);

  function matchLocalKB(query: string): string | null {
    const q = query.toLowerCase();
    const allFaqs = Object.values(faqByCategory).flat();
    let best: typeof allFaqs[0] | null = null;
    let bestScore = 0;
    for (const faq of allFaqs) {
      const words = faq.q.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      let score = 0;
      for (const w of words) { if (q.includes(w)) score += w.length; }
      if (score > bestScore) { bestScore = score; best = faq; }
    }
    return bestScore >= 4 && best ? best.a : null;
  }

  function handleFaqAnswer(q: string, a: string) {
    if (isDemo) {
      // Demo mode — show answer locally, no Supabase
      setDemoMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, sender: "user", message: q },
        { id: `b-${Date.now()}`, sender: "bot", message: a },
      ]);
      setPhase("conversation");
      setSelectedCategory(null);
      return;
    }
    setSelectedCategory(null);
    startConversation(`Q: ${q}\n\n(Auto-answered: ${a})\n\nIf you need more help, just reply here!`);
  }

  function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/* Chat bubble — only visible when triggered from ? menu */}
      <AnimatePresence>
        {!isOpen && showBubble && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={() => { setIsOpen(true); setHasUnread(false); trackEvent("support.opened"); }}
              className="w-14 h-14 rounded-full bg-accent text-white shadow-xl shadow-accent/30 flex items-center justify-center hover:bg-accent/90 transition-colors relative"
            >
              <MessageCircle className="w-6 h-6" />
              {hasUnread && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 border-2 border-white" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-800 transition-colors shadow-sm"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-96 h-full sm:h-[32rem] sm:rounded-2xl bg-white border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-accent text-white px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">WorkChores Support</div>
                <div className="text-[11px] text-white/70">
                  {adminTyping ? (
                    <span className="flex items-center gap-1">
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                      typing...
                    </span>
                  ) : "We typically reply in under 5 min"}
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-live="polite" aria-label="Chat messages">

              {/* ===== GREETING PHASE ===== */}
              {phase === "greeting" && (
                <>
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[85%] text-sm leading-relaxed">
                      Hi there! 👋 How can we help you today?
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => {
                      const CatIcon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-accent hover:text-accent transition-colors"
                        >
                          <CatIcon className="w-3.5 h-3.5" />
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ===== FAQ PHASE ===== */}
              {phase === "faq" && selectedCategory && (
                <>
                  <div className="flex justify-end">
                    <div className="bg-accent text-white rounded-2xl rounded-tr-md px-4 py-2.5 text-sm flex items-center gap-1.5">
                      {(() => { const cat = categories.find((c) => c.id === selectedCategory); if (!cat) return null; const CatIcon = cat.icon; return <><CatIcon className="w-3.5 h-3.5" /> {cat.label}</>; })()}
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[85%] text-sm leading-relaxed">
                      Here are common questions. Tap one for an instant answer, or type your own question below.
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {(faqByCategory[selectedCategory] || []).map((faq) => (
                      <button
                        key={faq.q}
                        onClick={() => handleFaqAnswer(faq.q, faq.a)}
                        className="w-full text-left flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-accent hover:text-accent transition-colors group"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-accent shrink-0" />
                        <span>{faq.q}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => { handleCategorySelect("other"); }}
                      className="w-full text-left flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-500 hover:border-accent hover:text-accent transition-colors group"
                    >
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-accent shrink-0" />
                      <span>{isDemo ? "Ask a different question" : "I have a different question"}</span>
                    </button>
                    <button
                      onClick={() => { setPhase("greeting"); setSelectedCategory(null); }}
                      className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-2"
                    >
                      ← Back to topics
                    </button>
                  </div>
                </>
              )}

              {/* ===== CONVERSATION PHASE ===== */}
              {phase === "conversation" && (
                <>
                  {isDemo ? (
                    /* Demo mode — local messages only */
                    <>
                      {demoMessages.length === 0 && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[85%] text-sm leading-relaxed">
                            Type your question and I&apos;ll try to help! For live support from our team, <a href="/signup" className="text-accent underline">create a free account</a>.
                          </div>
                        </div>
                      )}
                      {demoMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[85%]">
                            {msg.sender === "bot" && (
                              <div className="text-[10px] text-gray-400 mb-1 ml-1">WorkChores</div>
                            )}
                            <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                              msg.sender === "user"
                                ? "bg-accent text-white rounded-tr-md"
                                : "bg-gray-100 text-gray-800 rounded-tl-md"
                            }`}>
                              {msg.message}
                            </div>
                          </div>
                        </div>
                      ))}
                      {/* Back to topics button */}
                      {demoMessages.length > 0 && (
                        <button
                          onClick={() => { setPhase("greeting"); setDemoMessages([]); setSelectedCategory(null); }}
                          className="text-xs text-gray-400 hover:text-accent transition-colors text-center py-2"
                        >
                          ← Back to topics
                        </button>
                      )}
                    </>
                  ) : (
                    /* Live mode — real Supabase conversation */
                    <>
                      {loadingConv ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                        </div>
                      ) : convMessages.length === 0 ? (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-tl-md px-4 py-2.5 max-w-[85%] text-sm leading-relaxed">
                            Type your question below and our team will get back to you!
                          </div>
                        </div>
                      ) : (
                        convMessages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-[85%]">
                              {msg.sender !== "user" && (
                                <div className="text-[10px] text-gray-400 mb-1 ml-1">
                                  {msg.sender === "admin" ? msg.sender_name || "Support Team" : "WorkChores"}
                                </div>
                              )}
                              <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                                msg.sender === "user"
                                  ? "bg-accent text-white rounded-tr-md"
                                  : msg.sender === "admin"
                                  ? "bg-blue-50 text-blue-900 rounded-tl-md border border-blue-100"
                                  : "bg-gray-100 text-gray-800 rounded-tl-md"
                              }`}>
                                {msg.message}
                              </div>
                              <div className={`text-[10px] text-gray-400 mt-1 ${msg.sender === "user" ? "text-right mr-1" : "ml-1"}`}>
                                {formatTime(msg.created_at)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </>
                  )}

                  {/* Admin typing indicator */}
                  {adminTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {sending && !adminTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-400 rounded-2xl rounded-tl-md px-4 py-2.5 text-sm flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="text-xs">Thinking...</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input — shown in FAQ and conversation phases */}
            {(phase === "faq" || phase === "conversation") && (
              <div className="p-3 border-t border-gray-200 shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => { setInput(e.target.value); if (conversationId) handleTyping(); }}
                    placeholder="Type a message..."
                    className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-gray-800 placeholder:text-gray-400"
                    disabled={sending || loadingConv}
                  />
                  <button type="submit" disabled={!input.trim() || sending || loadingConv} className="p-2.5 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="text-[10px] text-gray-400 text-center mt-2">
                  Mon–Fri, 9am–6pm ET · <a href="/docs" className="text-accent hover:underline">View Docs</a>
                </div>
              </div>
            )}

            {/* Footer for greeting phase */}
            {phase === "greeting" && (
              <div className="p-3 border-t border-gray-200 shrink-0">
                <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) { setPhase("conversation"); startConversation(input.trim()); setInput(""); } }} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Or type your question..."
                    className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-gray-800 placeholder:text-gray-400"
                  />
                  <button type="submit" disabled={!input.trim()} className="p-2.5 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="text-[10px] text-gray-400 text-center mt-2">
                  Mon–Fri, 9am–6pm ET · <a href="/docs" className="text-accent hover:underline">View Docs</a>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
