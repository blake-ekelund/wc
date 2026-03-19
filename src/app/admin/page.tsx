"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  MessageSquare,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Inbox,
  BarChart3,
  RefreshCw,
  Search,
  X,
  Send,
  Lock,
  Eye,
  EyeOff,
  Archive,
  XCircle,
} from "lucide-react";

interface Conversation {
  id: string;
  user_email: string;
  user_name: string;
  subject: string;
  status: "new" | "active" | "resolved" | "closed";
  admin_notes: string;
  last_message_at: string;
  created_at: string;
}

interface ConvMessage {
  id: string;
  conversation_id: string;
  sender: "user" | "admin" | "bot";
  sender_name: string;
  message: string;
  created_at: string;
}

interface WorkspaceStat {
  id: string;
  name: string;
  industry: string | null;
  created_at: string;
  member_count: number;
  contact_count: number;
}

interface DemoSession {
  id: string;
  email: string;
  name: string;
  industry: string;
  started_at: string;
  last_active_at: string;
  duration_seconds: number;
  pages_visited: string[];
  features_used: string[];
  clicked_signup: boolean;
  clicked_signup_at: string | null;
  converted_to_user: boolean;
  converted_at: string | null;
}

type AdminTab = "messages" | "overview" | "demos";

const statusConfig = {
  new: { label: "New", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
  active: { label: "Active", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  resolved: { label: "Resolved", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
};

async function adminFetch(action: string, body: Record<string, unknown> = {}) {
  const token = localStorage.getItem("admin-token");
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-token": token || "" },
    body: JSON.stringify({ action, ...body }),
  });
  if (res.status === 401) {
    localStorage.removeItem("admin-token");
    window.location.reload();
    throw new Error("Unauthorized");
  }
  return res.json();
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<AdminTab>("messages");

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [convMessages, setConvMessages] = useState<ConvMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [convFilter, setConvFilter] = useState<"all" | "new" | "active" | "resolved" | "closed">("all");
  const [convSearch, setConvSearch] = useState("");
  const [userTyping, setUserTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  // Overview
  const [workspaces, setWorkspaces] = useState<WorkspaceStat[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalContacts, setTotalContacts] = useState(0);

  // Demo analytics
  const [demoSessions, setDemoSessions] = useState<DemoSession[]>([]);
  const [demoFilter, setDemoFilter] = useState<"all" | "converted" | "clicked" | "bounced">("all");

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages, userTyping]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await adminFetch("get-conversations");
      if (res.data) setConversations(res.data);
    } catch { /* handled */ }
  }, []);

  const loadOverview = useCallback(async () => {
    try {
      const res = await adminFetch("get-overview");
      if (res.workspaces) {
        setWorkspaces(res.workspaces);
        setTotalUsers(res.totalUsers);
        setTotalContacts(res.totalContacts);
      }
    } catch { /* handled */ }
  }, []);

  const loadDemoSessions = useCallback(async () => {
    try {
      const res = await adminFetch("get-demo-sessions");
      if (res.data) setDemoSessions(res.data);
    } catch { /* handled */ }
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await adminFetch("get-conversation-messages", { conversationId: convId });
      if (res.data) setConvMessages(res.data);
    } catch { /* handled */ }
  }, []);

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (token) {
      setAuthenticated(true);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  // Load data
  useEffect(() => {
    if (authenticated) {
      loadConversations();
      loadOverview();
      loadDemoSessions();
    }
  }, [authenticated, loadConversations, loadOverview, loadDemoSessions]);

  // Poll conversations every 10s (fallback)
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [authenticated, loadConversations]);

  // Subscribe to realtime channel for selected conversation
  useEffect(() => {
    if (!selectedConv) return;

    const channel = supabase.channel(`conversation:${selectedConv.id}`)
      .on("broadcast", { event: "new-message" }, (payload) => {
        const msg = payload.payload as ConvMessage;
        setConvMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Refresh conversation list to update last_message_at
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

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setUserTyping(false);
    };
  }, [selectedConv, supabase, loadConversations]);

  // Broadcast admin typing (debounced)
  function handleAdminTyping() {
    if (!channelRef.current) return;
    if (typingTimeoutRef.current) return;

    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { sender: "admin" },
    });

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("admin-token", data.token);
        setAuthenticated(true);
      } else {
        setLoginError("Invalid password.");
      }
    } catch {
      setLoginError("Connection error.");
    }
    setLoggingIn(false);
  }

  async function selectConversation(conv: Conversation) {
    setSelectedConv(conv);
    setReplyText("");
    await loadMessages(conv.id);
    // Mark as active if new
    if (conv.status === "new") {
      await adminFetch("update-conversation-status", { conversationId: conv.id, status: "active" });
      setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, status: "active" as const } : c));
      setSelectedConv((prev) => prev ? { ...prev, status: "active" as const } : null);
    }
  }

  async function handleReply() {
    if (!replyText.trim() || !selectedConv || sendingReply) return;
    setSendingReply(true);
    try {
      const res = await adminFetch("admin-reply", {
        conversationId: selectedConv.id,
        message: replyText.trim(),
        adminName: "Support Team",
      });
      if (res.messages) {
        // Find the new admin message and broadcast it
        const newAdminMsgs = (res.messages as ConvMessage[]).filter(
          (m) => !convMessages.some((existing) => existing.id === m.id)
        );
        for (const msg of newAdminMsgs) {
          channelRef.current?.send({
            type: "broadcast",
            event: "new-message",
            payload: msg,
          });
        }
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
    setConversations((prev) => prev.map((c) => c.id === selectedConv.id ? { ...c, status } : c));
    setSelectedConv((prev) => prev ? { ...prev, status } : null);

    // If closing, broadcast to user so their chat resets
    if (status === "closed" && channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "conversation-closed",
        payload: {},
      });
    }
  }

  const filteredConvs = conversations.filter((c) => {
    if (convFilter !== "all" && c.status !== convFilter) return false;
    if (convSearch) {
      const q = convSearch.toLowerCase();
      return c.user_name.toLowerCase().includes(q) || c.user_email.toLowerCase().includes(q);
    }
    return true;
  });

  const newCount = conversations.filter((c) => c.status === "new").length;
  const activeCount = conversations.filter((c) => c.status === "active").length;

  function formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return "now";
    if (diffMin < 60) return `${diffMin}m`;
    if (diffMin < 1440) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm overflow-hidden">
          <div className="bg-accent px-6 py-5 text-center">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">Admin Panel</h1>
            <p className="text-sm text-white/70 mt-1">WorkChores Internal</p>
          </div>
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                  placeholder="Enter admin password"
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-gray-800 placeholder:text-gray-400"
                  autoFocus
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {loginError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {loginError}
              </div>
            )}
            <button type="submit" disabled={!password.trim() || loggingIn} className="w-full px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loggingIn ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 h-14 flex items-center gap-3 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
          <BarChart3 className="w-3.5 h-3.5 text-white" />
        </div>
        <h1 className="text-sm font-bold text-gray-900">Admin</h1>
        {newCount > 0 && (
          <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{newCount}</span>
        )}
        <div className="flex-1" />

        {/* Tab switcher — inline */}
        <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setTab("messages")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "messages" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <span className="flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5" /> Inbox
              {newCount > 0 && <span className="min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">{newCount}</span>}
            </span>
          </button>
          <button onClick={() => setTab("overview")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "overview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <span className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Overview</span>
          </button>
          <button onClick={() => { setTab("demos"); loadDemoSessions(); }} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "demos" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Demos</span>
          </button>
        </div>

        <button onClick={() => { loadConversations(); loadOverview(); loadDemoSessions(); }} className="p-2 text-gray-400 hover:text-gray-700 transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button onClick={() => { localStorage.removeItem("admin-token"); setAuthenticated(false); }} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
          Sign Out
        </button>
      </header>

      {/* Mobile tab bar */}
      <div className="sm:hidden flex border-b border-gray-200 bg-white">
        <button onClick={() => setTab("messages")} className={`flex-1 py-2.5 text-xs font-medium text-center ${tab === "messages" ? "text-accent border-b-2 border-accent" : "text-gray-400"}`}>
          Inbox {newCount > 0 ? `(${newCount})` : ""}
        </button>
        <button onClick={() => setTab("overview")} className={`flex-1 py-2.5 text-xs font-medium text-center ${tab === "overview" ? "text-accent border-b-2 border-accent" : "text-gray-400"}`}>
          Overview
        </button>
        <button onClick={() => { setTab("demos"); loadDemoSessions(); }} className={`flex-1 py-2.5 text-xs font-medium text-center ${tab === "demos" ? "text-accent border-b-2 border-accent" : "text-gray-400"}`}>
          Demos
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {tab === "messages" && (
          <>
            {/* Conversation list */}
            <div className={`${selectedConv ? "hidden sm:flex" : "flex"} flex-col w-full sm:w-80 lg:w-96 border-r border-gray-200 bg-white`}>
              {/* Search + filters */}
              <div className="p-3 border-b border-gray-200 space-y-2 shrink-0">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  <input type="text" value={convSearch} onChange={(e) => setConvSearch(e.target.value)} placeholder="Search conversations..." className="text-sm bg-transparent outline-none flex-1 text-gray-800 placeholder:text-gray-400" />
                  {convSearch && <button onClick={() => setConvSearch("")} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>}
                </div>
                <div className="flex gap-1 overflow-x-auto">
                  {(["all", "new", "active", "resolved", "closed"] as const).map((s) => {
                    const count = s === "all" ? conversations.length : conversations.filter((c) => c.status === s).length;
                    return (
                      <button key={s} onClick={() => setConvFilter(s)} className={`px-2 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                        convFilter === s ? (s === "all" ? "bg-accent text-white" : statusConfig[s as keyof typeof statusConfig].color) : "text-gray-400 hover:text-gray-600"
                      }`}>
                        {s === "all" ? "All" : statusConfig[s as keyof typeof statusConfig].label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConvs.length === 0 && (
                  <div className="py-12 text-center text-sm text-gray-400">No conversations</div>
                )}
                {filteredConvs.map((c) => {
                  const cfg = statusConfig[c.status];
                  return (
                    <button
                      key={c.id}
                      onClick={() => selectConversation(c)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedConv?.id === c.id ? "bg-accent/5" : ""
                      } ${c.status === "new" ? "bg-red-50/40" : ""}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">{c.user_name}</span>
                            <span className="text-[10px] text-gray-400 shrink-0">{formatTime(c.last_message_at)}</span>
                          </div>
                          <div className="text-xs text-gray-500 truncate">{c.user_email}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat view */}
            <div className={`${selectedConv ? "flex" : "hidden sm:flex"} flex-col flex-1 bg-gray-50`}>
              {selectedConv ? (
                <>
                  {/* Chat header */}
                  <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center gap-3 shrink-0">
                    <button onClick={() => setSelectedConv(null)} className="sm:hidden p-1 text-gray-400 hover:text-gray-700">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">{selectedConv.user_name}</div>
                      <div className="text-[11px] text-gray-400">{selectedConv.user_email}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => updateConvStatus("resolved")} className={`p-1.5 rounded-lg transition-colors ${selectedConv.status === "resolved" ? "bg-emerald-100 text-emerald-600" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"}`} title="Resolve">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => updateConvStatus("closed")} className={`p-1.5 rounded-lg transition-colors ${selectedConv.status === "closed" ? "bg-gray-200 text-gray-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`} title="Close">
                        <Archive className="w-4 h-4" />
                      </button>
                      {(selectedConv.status === "resolved" || selectedConv.status === "closed") && (
                        <button onClick={() => updateConvStatus("active")} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Reopen">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {convMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[75%]`}>
                          <div className={`text-[10px] mb-0.5 ${msg.sender === "user" ? "text-gray-400 ml-1" : "text-gray-400 mr-1 text-right"}`}>
                            {msg.sender === "user" ? msg.sender_name : msg.sender === "admin" ? `${msg.sender_name} (you)` : "Bot"}
                          </div>
                          <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.sender === "user"
                              ? "bg-white border border-gray-200 text-gray-800 rounded-tl-md"
                              : msg.sender === "admin"
                              ? "bg-accent text-white rounded-tr-md"
                              : "bg-gray-100 text-gray-600 rounded-tr-md text-xs"
                          }`}>
                            {msg.message}
                          </div>
                          <div className={`text-[10px] text-gray-400 mt-0.5 ${msg.sender === "user" ? "ml-1" : "mr-1 text-right"}`}>
                            {formatTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* User typing indicator */}
                    {userTyping && (
                      <div className="flex justify-start">
                        <div className="max-w-[75%]">
                          <div className="text-[10px] text-gray-400 mb-0.5 ml-1">{selectedConv.user_name}</div>
                          <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Reply input */}
                  <div className="p-3 bg-white border-t border-gray-200 shrink-0">
                    <form onSubmit={(e) => { e.preventDefault(); handleReply(); }} className="flex items-end gap-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => { setReplyText(e.target.value); handleAdminTyping(); }}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                        placeholder="Type a reply... (Enter to send, Shift+Enter for newline)"
                        className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-gray-800 placeholder:text-gray-400 resize-none min-h-[42px] max-h-32"
                        rows={1}
                        disabled={sendingReply}
                      />
                      <button type="submit" disabled={!replyText.trim() || sendingReply} className="p-2.5 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                        {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">Select a conversation</p>
                    <p className="text-xs text-gray-400 mt-1">{conversations.length} total · {newCount} new · {activeCount} active</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "overview" && (
          <div className="flex-1 p-4 sm:p-6 max-w-5xl space-y-6 overflow-y-auto">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-2"><Building2 className="w-4 h-4 text-blue-600" /></div>
                <div className="text-2xl font-bold text-gray-900">{workspaces.length}</div>
                <div className="text-xs text-gray-500">Workspaces</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-2"><Users className="w-4 h-4 text-emerald-600" /></div>
                <div className="text-2xl font-bold text-gray-900">{totalUsers}</div>
                <div className="text-xs text-gray-500">Users</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center mb-2"><Users className="w-4 h-4 text-violet-600" /></div>
                <div className="text-2xl font-bold text-gray-900">{totalContacts.toLocaleString()}</div>
                <div className="text-xs text-gray-500">Contacts</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-2"><MessageSquare className="w-4 h-4 text-amber-600" /></div>
                <div className="text-2xl font-bold text-gray-900">{conversations.length}</div>
                <div className="text-xs text-gray-500">Conversations</div>
              </div>
            </div>

            {/* Conversation summary */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Support Summary</h3></div>
              <div className="grid grid-cols-4 divide-x divide-gray-200">
                {(["new", "active", "resolved", "closed"] as const).map((s) => {
                  const count = conversations.filter((c) => c.status === s).length;
                  const cfg = statusConfig[s];
                  return (
                    <div key={s} className="p-4 text-center cursor-pointer hover:bg-gray-50" onClick={() => { setTab("messages"); setConvFilter(s); }}>
                      <div className={`text-xl font-bold ${s === "new" ? "text-red-600" : s === "active" ? "text-blue-600" : s === "resolved" ? "text-emerald-600" : "text-gray-500"}`}>{count}</div>
                      <div className="text-xs text-gray-500">{cfg.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workspaces */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-900">Workspaces ({workspaces.length})</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Workspace</th>
                      <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Industry</th>
                      <th className="text-center px-5 py-2 text-xs font-medium text-gray-500">Members</th>
                      <th className="text-center px-5 py-2 text-xs font-medium text-gray-500">Contacts</th>
                      <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {workspaces.map((w) => (
                      <tr key={w.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{w.name}</td>
                        <td className="px-5 py-3 text-gray-500 capitalize">{w.industry?.replace(/-/g, " ") || "\u2014"}</td>
                        <td className="px-5 py-3 text-center">{w.member_count}</td>
                        <td className="px-5 py-3 text-center">{w.contact_count.toLocaleString()}</td>
                        <td className="px-5 py-3 text-gray-400">{new Date(w.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {workspaces.length === 0 && (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No workspaces yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "demos" && (
          <div className="flex-1 p-4 sm:p-6 max-w-5xl space-y-6 overflow-y-auto">
            {/* Demo KPIs */}
            {(() => {
              const total = demoSessions.length;
              const clickedSignup = demoSessions.filter((d) => d.clicked_signup).length;
              const converted = demoSessions.filter((d) => d.converted_to_user).length;
              const avgDuration = total > 0 ? Math.floor(demoSessions.reduce((sum, d) => sum + d.duration_seconds, 0) / total) : 0;
              const convRate = total > 0 ? ((converted / total) * 100).toFixed(1) : "0";
              return (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-gray-900">{total}</div>
                    <div className="text-xs text-gray-500">Total Demos</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-blue-600">{clickedSignup}</div>
                    <div className="text-xs text-gray-500">Clicked Signup</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-emerald-600">{converted}</div>
                    <div className="text-xs text-gray-500">Converted</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-violet-600">{convRate}%</div>
                    <div className="text-xs text-gray-500">Conversion Rate</div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-amber-600">{Math.floor(avgDuration / 60)}m {avgDuration % 60}s</div>
                    <div className="text-xs text-gray-500">Avg Duration</div>
                  </div>
                </div>
              );
            })()}

            {/* Filters */}
            <div className="flex items-center gap-2">
              {(["all", "converted", "clicked", "bounced"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setDemoFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    demoFilter === f ? "bg-accent text-white" : "text-gray-500 hover:text-gray-700 bg-gray-100"
                  }`}
                >
                  {f === "all" ? "All" : f === "converted" ? "Converted" : f === "clicked" ? "Clicked Signup" : "Bounced"}
                </button>
              ))}
            </div>

            {/* Sessions table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Demo Sessions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">User</th>
                      <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Industry</th>
                      <th className="text-center px-5 py-2 text-xs font-medium text-gray-500">Duration</th>
                      <th className="text-center px-5 py-2 text-xs font-medium text-gray-500">Pages</th>
                      <th className="text-center px-5 py-2 text-xs font-medium text-gray-500">Features</th>
                      <th className="text-center px-5 py-2 text-xs font-medium text-gray-500">Status</th>
                      <th className="text-left px-5 py-2 text-xs font-medium text-gray-500">Started</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {demoSessions
                      .filter((d) => {
                        if (demoFilter === "converted") return d.converted_to_user;
                        if (demoFilter === "clicked") return d.clicked_signup && !d.converted_to_user;
                        if (demoFilter === "bounced") return !d.clicked_signup;
                        return true;
                      })
                      .map((d) => {
                        const mins = Math.floor(d.duration_seconds / 60);
                        const secs = d.duration_seconds % 60;
                        return (
                          <tr key={d.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3">
                              <div className="font-medium text-gray-900">{d.name || "Anonymous"}</div>
                              <div className="text-xs text-gray-400">{d.email || "No email"}</div>
                            </td>
                            <td className="px-5 py-3 text-gray-500 capitalize">{d.industry?.replace(/-/g, " ") || "\u2014"}</td>
                            <td className="px-5 py-3 text-center text-gray-600">{mins}m {secs}s</td>
                            <td className="px-5 py-3 text-center">
                              <span className="text-xs text-gray-500">{d.pages_visited?.length || 0}</span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className="text-xs text-gray-500">{d.features_used?.length || 0}</span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              {d.converted_to_user ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">Converted</span>
                              ) : d.clicked_signup ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">Clicked Signup</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">Browsing</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-gray-400 text-xs">{new Date(d.started_at).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    {demoSessions.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No demo sessions recorded yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
