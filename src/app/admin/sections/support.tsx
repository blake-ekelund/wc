"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Headphones, Sparkles, Search, X, ChevronLeft, CheckCircle2, Archive, XCircle, Inbox, Loader2, Send, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { adminFetch, formatTime, statusConfig, type Conversation, type ConvMessage } from "./_shared";

interface SupportSectionProps {
  conversations: Conversation[];
  loadConversations: () => void;
}

export default function SupportSection({ conversations, loadConversations }: SupportSectionProps) {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [convMessages, setConvMessages] = useState<ConvMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [convFilter, setConvFilter] = useState<"all" | "new" | "active" | "resolved" | "closed">("all");
  const [convSearch, setConvSearch] = useState("");
  const [userTyping, setUserTyping] = useState(false);
  const [supportTab, setSupportTab] = useState<"conversations" | "assistant">("conversations");
  const [assistantSessions, setAssistantSessions] = useState<{ session_id: string; messages: number; first_user_message: string; last_message_at: string }[]>([]);
  const [selectedAssistantSession, setSelectedAssistantSession] = useState<string | null>(null);
  const [assistantMessages, setAssistantMessages] = useState<{ id: string; role: string; message: string; sources: unknown[]; created_at: string; metadata?: Record<string, unknown> }[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  const newCount = conversations.filter((c) => c.status === "new").length;
  const activeCount = conversations.filter((c) => c.status === "active").length;

  const filteredConvs = conversations.filter((c) => {
    if (convFilter !== "all" && c.status !== convFilter) return false;
    if (convSearch) { const q = convSearch.toLowerCase(); return c.user_name.toLowerCase().includes(q) || c.user_email.toLowerCase().includes(q); }
    return true;
  });

  async function loadAssistantSessions() {
    try { const data = await adminFetch("get-assistant-conversations"); if (data.sessions) setAssistantSessions(data.sessions); } catch { /* ignore */ }
  }

  async function loadAssistantMessages(sessionId: string) {
    setSelectedAssistantSession(sessionId);
    try { const data = await adminFetch("get-assistant-messages", { sessionId }); if (data.messages) setAssistantMessages(data.messages); } catch { /* ignore */ }
  }

  const loadMessages = useCallback(async (convId: string) => {
    try { const res = await adminFetch("get-conversation-messages", { conversationId: convId }); if (res.data) setConvMessages(res.data); } catch { /* handled */ }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [convMessages, userTyping]);

  // Realtime
  useEffect(() => {
    if (!selectedConv) return;
    const channel = supabase.channel(`conversation:${selectedConv.id}`)
      .on("broadcast", { event: "new-message" }, (payload) => {
        const msg = payload.payload as ConvMessage;
        setConvMessages((prev) => { if (prev.some((m) => m.id === msg.id)) return prev; return [...prev, msg]; });
        loadConversations();
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.sender === "user") {
          setUserTyping(true);
          if (userTypingTimeoutRef.current) clearTimeout(userTypingTimeoutRef.current);
          userTypingTimeoutRef.current = setTimeout(() => setUserTyping(false), 3000);
        }
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); channelRef.current = null; setUserTyping(false); };
  }, [selectedConv, supabase, loadConversations]);

  function handleAdminTyping() {
    if (!channelRef.current) return;
    if (typingTimeoutRef.current) return;
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { sender: "admin" } });
    typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
  }

  async function selectConversation(conv: Conversation) {
    setSelectedConv(conv);
    setReplyText("");
    await loadMessages(conv.id);
    if (conv.status === "new") {
      await adminFetch("update-conversation-status", { conversationId: conv.id, status: "active" });
      loadConversations();
    }
  }

  async function handleReply() {
    if (!replyText.trim() || !selectedConv || sendingReply) return;
    setSendingReply(true);
    try {
      const res = await adminFetch("admin-reply", { conversationId: selectedConv.id, message: replyText.trim(), adminName: "Support Team" });
      if (res.messages) {
        const newAdminMsgs = (res.messages as ConvMessage[]).filter((m) => !convMessages.some((existing) => existing.id === m.id));
        for (const msg of newAdminMsgs) { channelRef.current?.send({ type: "broadcast", event: "new-message", payload: msg }); }
        setConvMessages(res.messages);
      }
      setReplyText("");
      loadConversations();
    } catch { /* handled */ }
    setSendingReply(false);
  }

  async function updateConvStatus(status: Conversation["status"]) {
    if (!selectedConv) return;
    await adminFetch("update-conversation-status", { conversationId: selectedConv.id, status });
    loadConversations();
    setSelectedConv((prev) => prev ? { ...prev, status } : null);
    if (status === "closed" && channelRef.current) { channelRef.current.send({ type: "broadcast", event: "conversation-closed", payload: {} }); }
  }

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-3.5rem)]">
      <div className="flex border-b border-gray-200 bg-white shrink-0">
        <button onClick={() => setSupportTab("conversations")} className={`flex-1 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${supportTab === "conversations" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"}`}><Headphones className="w-3.5 h-3.5 inline mr-1.5" />Support Conversations</button>
        <button onClick={() => { setSupportTab("assistant"); if (!assistantSessions.length) loadAssistantSessions(); }} className={`flex-1 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${supportTab === "assistant" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"}`}><Sparkles className="w-3.5 h-3.5 inline mr-1.5" />AI Assistant Chats</button>
      </div>

      {supportTab === "assistant" && (
        <div className="flex flex-1">
          <div className={`${selectedAssistantSession ? "hidden sm:flex" : "flex"} flex-col w-full sm:w-80 lg:w-96 border-r border-gray-200 bg-white`}>
            <div className="p-3 border-b border-gray-200 flex items-center justify-between"><span className="text-xs font-medium text-gray-500">{assistantSessions.length} conversation(s)</span><button onClick={loadAssistantSessions} className="text-xs text-gray-400 hover:text-gray-600" aria-label="Refresh"><RefreshCw className="w-3 h-3" /></button></div>
            <div className="flex-1 overflow-y-auto">
              {assistantSessions.length === 0 && <div className="py-12 text-center text-sm text-gray-400">No AI assistant conversations yet</div>}
              {assistantSessions.map((s) => (<button key={s.session_id} onClick={() => loadAssistantMessages(s.session_id)} className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedAssistantSession === s.session_id ? "bg-blue-50" : ""}`}><div className="text-sm font-medium text-gray-900 truncate">{s.first_user_message || "New conversation"}</div><div className="flex items-center gap-2 mt-1"><span className="text-[10px] text-gray-400">{s.messages} messages</span><span className="text-[10px] text-gray-400">&middot;</span><span className="text-[10px] text-gray-400">{formatTime(s.last_message_at)}</span></div></button>))}
            </div>
          </div>
          <div className="flex-1 flex flex-col bg-gray-50">
            {!selectedAssistantSession ? (<div className="flex-1 flex items-center justify-center text-sm text-gray-400">Select a conversation</div>) : (
              <>
                <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between"><button onClick={() => setSelectedAssistantSession(null)} className="sm:hidden text-xs text-gray-500">&larr; Back</button><span className="text-xs text-gray-500 font-mono truncate">{selectedAssistantSession.slice(0, 16)}...</span></div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {assistantMessages.map((msg) => {
                    const meta = msg.metadata;
                    const sentiment = meta?.sentiment as string | undefined;
                    const cta = meta?.cta as string | undefined;
                    const sentimentColor = sentiment === "positive" ? "bg-emerald-100 text-emerald-700" : sentiment === "negative" ? "bg-red-100 text-red-700" : "";
                    const SentimentIcon = sentiment === "positive" ? TrendingUp : sentiment === "negative" ? TrendingDown : null;
                    return (
                      <div key={msg.id}>
                        <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-gray-900 text-white rounded-tr-md" : "bg-white border border-gray-200 text-gray-900 rounded-tl-md"}`}>
                            {msg.message}
                            <div className={`text-[10px] mt-1 ${msg.role === "user" ? "text-white/50" : "text-gray-400"}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
                          </div>
                        </div>
                        {msg.role === "assistant" && (sentiment || cta) && (
                          <div className="flex items-center gap-1.5 mt-1 ml-1">
                            {sentiment && sentiment !== "neutral" && SentimentIcon && (<span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${sentimentColor}`}><SentimentIcon className="w-2.5 h-2.5" /> {sentiment}</span>)}
                            {cta && (<span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-accent/10 text-accent">CTA: {cta.replace(/-/g, " ")}</span>)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {supportTab === "conversations" && (
        <div className="flex flex-1">
          <div className={`${selectedConv ? "hidden sm:flex" : "flex"} flex-col w-full sm:w-80 lg:w-96 border-r border-gray-200 bg-white`}>
            <div className="p-3 border-b border-gray-200 space-y-2 shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <Search className="w-3.5 h-3.5 text-gray-400" />
                <input type="text" value={convSearch} onChange={(e) => setConvSearch(e.target.value)} placeholder="Search conversations..." className="text-sm bg-transparent outline-none flex-1 text-gray-800 placeholder:text-gray-400" />
                {convSearch && <button onClick={() => setConvSearch("")} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>}
              </div>
              <div className="flex gap-1 overflow-x-auto">
                {(["all", "new", "active", "resolved", "closed"] as const).map((s) => {
                  const count = s === "all" ? conversations.length : conversations.filter((c) => c.status === s).length;
                  return (<button key={s} onClick={() => setConvFilter(s)} className={`px-2 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${convFilter === s ? (s === "all" ? "bg-gray-900 text-white" : statusConfig[s as keyof typeof statusConfig].color) : "text-gray-400 hover:text-gray-600"}`}>{s === "all" ? "All" : statusConfig[s as keyof typeof statusConfig].label} ({count})</button>);
                })}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConvs.length === 0 && (<div className="py-12 text-center text-sm text-gray-400">No conversations</div>)}
              {filteredConvs.map((c) => { const cfg = statusConfig[c.status]; return (
                <button key={c.id} onClick={() => selectConversation(c)} className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedConv?.id === c.id ? "bg-blue-50/50" : ""} ${c.status === "new" ? "bg-red-50/40" : ""}`}>
                  <div className="flex items-center gap-2.5"><div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} /><div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium text-gray-900 truncate">{c.user_name}</span><span className="text-[10px] text-gray-400 shrink-0">{formatTime(c.last_message_at)}</span></div><div className="text-xs text-gray-500 truncate">{c.user_email}</div></div></div>
                </button>
              ); })}
            </div>
          </div>
          <div className={`${selectedConv ? "flex" : "hidden sm:flex"} flex-col flex-1 bg-gray-50`}>
            {selectedConv ? (
              <>
                <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center gap-3 shrink-0">
                  <button onClick={() => setSelectedConv(null)} className="sm:hidden p-1 text-gray-400 hover:text-gray-700"><ChevronLeft className="w-4 h-4" /></button>
                  <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-gray-900">{selectedConv.user_name}</div><div className="text-[11px] text-gray-400">{selectedConv.user_email}</div></div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updateConvStatus("resolved")} className={`p-1.5 rounded-lg transition-colors ${selectedConv.status === "resolved" ? "bg-emerald-100 text-emerald-600" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"}`} title="Resolve"><CheckCircle2 className="w-4 h-4" /></button>
                    <button onClick={() => updateConvStatus("closed")} className={`p-1.5 rounded-lg transition-colors ${selectedConv.status === "closed" ? "bg-gray-200 text-gray-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`} title="Close"><Archive className="w-4 h-4" /></button>
                    {(selectedConv.status === "resolved" || selectedConv.status === "closed") && (<button onClick={() => updateConvStatus("active")} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Reopen"><XCircle className="w-4 h-4" /></button>)}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {convMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}>
                      <div className="max-w-[75%]">
                        <div className={`text-[10px] mb-0.5 ${msg.sender === "user" ? "text-gray-400 ml-1" : "text-gray-400 mr-1 text-right"}`}>{msg.sender === "user" ? msg.sender_name : msg.sender === "admin" ? `${msg.sender_name} (you)` : "Bot"}</div>
                        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${msg.sender === "user" ? "bg-white border border-gray-200 text-gray-800 rounded-tl-md" : msg.sender === "admin" ? "bg-gray-900 text-white rounded-tr-md" : "bg-gray-100 text-gray-600 rounded-tr-md text-xs"}`}>{msg.message}</div>
                        <div className={`text-[10px] text-gray-400 mt-0.5 ${msg.sender === "user" ? "ml-1" : "mr-1 text-right"}`}>{formatTime(msg.created_at)}</div>
                      </div>
                    </div>
                  ))}
                  {userTyping && (
                    <div className="flex justify-start"><div className="max-w-[75%]"><div className="text-[10px] text-gray-400 mb-0.5 ml-1">{selectedConv.user_name}</div><div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3"><div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} /></div></div></div></div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 bg-white border-t border-gray-200 shrink-0">
                  <form onSubmit={(e) => { e.preventDefault(); handleReply(); }} className="flex items-end gap-2">
                    <textarea value={replyText} onChange={(e) => { setReplyText(e.target.value); handleAdminTyping(); }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }} placeholder="Type a reply..." className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 text-gray-800 placeholder:text-gray-400 resize-none min-h-[42px] max-h-32" rows={1} disabled={sendingReply} />
                    <button type="submit" disabled={!replyText.trim() || sendingReply} className="p-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-40 shrink-0">{sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400"><div className="text-center"><Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm">Select a conversation</p><p className="text-xs text-gray-400 mt-1">{conversations.length} total &middot; {newCount} new &middot; {activeCount} active</p></div></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
