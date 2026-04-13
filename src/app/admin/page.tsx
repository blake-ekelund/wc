"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { techDebtFindings, uiuxFindings, seoFindings } from "@/lib/audit/findings";
import type { AuditItem } from "@/lib/audit/findings";
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
  LayoutDashboard,
  Headphones,
  DollarSign,
  Activity,
  Server,
  Bell,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  UserPlus,
  CreditCard,
  Zap,
  Globe,
  ArrowRight,
  Mail,
  Shield,
  Crown,
  Menu,
  ExternalLink,
  Megaphone,
  Trash2,
  Edit3,
  Plus,
  ChevronDown,
  Briefcase,
  ClipboardCopy,
  Code2,
  Palette,
  SearchCheck,
  FileWarning,
  Bug,
  Smartphone,
  Accessibility,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

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
  plan: string;
  created_at: string;
  member_count: number;
  contact_count: number;
  task_count: number;
  owner_email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
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

interface ActivityEvent {
  id: string;
  type: "signup" | "conversion" | "upgrade" | "downgrade" | "support_ticket" | "workspace_created" | "invite_sent";
  description: string;
  user_email?: string;
  workspace_name?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface AnalyticsPoint {
  label: string;
  visitors: number;
  demos: number;
  signups: number;
  conversions: number;
}

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

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "update";
  active: boolean;
  created_at: string;
  expires_at: string | null;
}

type AdminSection = "overview" | "support" | "revenue" | "workspaces" | "people" | "activity" | "health" | "announcements" | "security" | "usage" | "sales" | "tech-debt" | "ui-ux" | "seo" | "metrics" | "valuation";

const statusConfig = {
  new: { label: "New", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
  active: { label: "Active", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  resolved: { label: "Resolved", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
};

// ============================================================
// ADMIN FETCH HELPER
// ============================================================

async function adminFetch(action: string, body: Record<string, unknown> = {}) {
  // Cookie is sent automatically (HttpOnly, SameSite=Strict)
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...body }),
  });
  if (res.status === 401) {
    // Don't reload — just throw so callers can handle gracefully
    throw new Error("Unauthorized");
  }
  return res.json();
}

// ============================================================
// SIDEBAR NAV CONFIG
// ============================================================

const navGroups: { label: string; items: { key: AdminSection; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: "Dashboard",
    items: [
      { key: "overview", label: "Overview", icon: LayoutDashboard },
      { key: "activity", label: "Activity Feed", icon: Activity },
    ],
  },
  {
    label: "Business",
    items: [
      { key: "revenue", label: "Revenue & Billing", icon: DollarSign },
      { key: "metrics", label: "SaaS Metrics", icon: TrendingUp },
      { key: "valuation", label: "Valuation", icon: Crown },
      { key: "workspaces", label: "Workspaces", icon: Building2 },
      { key: "people", label: "People", icon: Users },
    ],
  },
  {
    label: "Support",
    items: [
      { key: "support", label: "Customer Service", icon: Headphones },
      { key: "announcements", label: "Announcements", icon: Megaphone },
      { key: "sales", label: "Sales Hub", icon: Briefcase },
    ],
  },
  {
    label: "System",
    items: [
      { key: "usage", label: "Feature Usage", icon: Zap },
      { key: "health", label: "System Health", icon: Server },
      { key: "security", label: "Security", icon: Shield },
      { key: "tech-debt", label: "Tech Debt", icon: Code2 },
      { key: "ui-ux", label: "UI / UX", icon: Palette },
      { key: "seo", label: "Search & SEO", icon: SearchCheck },
    ],
  },
];

// ============================================================
// HELPER: formatTime
// ============================================================

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffMin < 1440) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdminPage() {
  // Auth
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Navigation
  const [section, setSection] = useState<AdminSection>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({ "Dashboard": true, "Business": true, "Support": true, "System": true });
  const [salesIndustry, setSalesIndustry] = useState("general");

  // Overview data
  const [workspaces, setWorkspaces] = useState<WorkspaceStat[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalContacts, setTotalContacts] = useState(0);

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [convMessages, setConvMessages] = useState<ConvMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [convFilter, setConvFilter] = useState<"all" | "new" | "active" | "resolved" | "closed">("all");
  const [convSearch, setConvSearch] = useState("");
  const [userTyping, setUserTyping] = useState(false);

  // AI Assistant conversations (marketing pages)
  const [supportTab, setSupportTab] = useState<"conversations" | "assistant">("conversations");
  const [assistantSessions, setAssistantSessions] = useState<{ session_id: string; messages: number; first_user_message: string; last_message_at: string }[]>([]);
  const [selectedAssistantSession, setSelectedAssistantSession] = useState<string | null>(null);
  const [assistantMessages, setAssistantMessages] = useState<{ id: string; role: string; message: string; sources: unknown[]; created_at: string }[]>([]);

  const [assistantStats, setAssistantStats] = useState<{ sentiment: { positive: number; neutral: number; negative: number }; ctas: Record<string, number>; ctaClicks: number; totalConversations: number; totalMessages: number } | null>(null);

  async function loadAssistantSessions() {
    try {
      const data = await adminFetch("get-assistant-conversations");
      if (data.sessions) setAssistantSessions(data.sessions);
    } catch { /* ignore */ }
    try {
      const stats = await adminFetch("get-assistant-stats");
      setAssistantStats(stats);
    } catch { /* ignore */ }
  }

  async function loadAssistantMessages(sessionId: string) {
    setSelectedAssistantSession(sessionId);
    try {
      const data = await adminFetch("get-assistant-messages", { sessionId });
      if (data.messages) setAssistantMessages(data.messages);
    } catch { /* ignore */ }
  }
  const chatEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  // Demo analytics
  const [demoSessions, setDemoSessions] = useState<DemoSession[]>([]);
  const [demoFilter, setDemoFilter] = useState<"all" | "converted" | "clicked" | "bounced">("all");

  // Analytics chart
  const [analyticsData, setAnalyticsData] = useState<AnalyticsPoint[]>([]);
  const [analyticsRange, setAnalyticsRange] = useState<"30d" | "12m">("30d");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Revenue analytics
  const [revenueHistory, setRevenueHistory] = useState<{ label: string; mrr: number; seats: number; workspaces: number; newBusiness: number; churned: number }[]>([]);
  const [revenueForecast, setRevenueForecast] = useState<{ label: string; mrr: number; seats: number; workspaces: number }[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<{ currentMrr: number; totalChurned: number; totalNewBiz: number; avgChurnRate: number; avgNewRate: number; avgGrowth: number }>({ currentMrr: 0, totalChurned: 0, totalNewBiz: 0, avgChurnRate: 0, avgNewRate: 0, avgGrowth: 0 });
  const [revenueLoading, setRevenueLoading] = useState(false);

  // Activity feed
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

  // People
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [peopleFilter, setPeopleFilter] = useState<"all" | "user" | "subscriber" | "both">("all");
  const [peopleSearch, setPeopleSearch] = useState("");

  // Announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", message: "", type: "info" as Announcement["type"] });

  // Workspace detail
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceStat | null>(null);
  const [workspaceSearch, setWorkspaceSearch] = useState("");

  // Workspace access request
  const [accessRequestStatus, setAccessRequestStatus] = useState<"idle" | "sending" | "pending" | "approved" | "error">("idle");
  const [accessRequestMsg, setAccessRequestMsg] = useState("");
  const accessPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Security audit — live scanner
  const [securityChecklist, setSecurityChecklist] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("admin-security-checklist");
        if (saved) return JSON.parse(saved);
      } catch { /* ignore */ }
    }
    return {};
  });

  // Unified dismissed findings across all audit types
  const [dismissedFindings, setDismissedFindings] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("admin-dismissed-findings");
        if (saved) return JSON.parse(saved);
      } catch { /* ignore */ }
    }
    return {};
  });
  const [showDismissed, setShowDismissed] = useState(false);

  // SaaS Metrics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [saasMetrics, setSaasMetrics] = useState<any>(null);
  const [saasLoading, setSaasLoading] = useState(false);

  async function loadSaasMetrics() {
    setSaasLoading(true);
    try {
      const data = await adminFetch("get-saas-metrics");
      setSaasMetrics(data);
    } catch { /* ignore */ }
    setSaasLoading(false);
  }

  function toggleDismissed(id: string) {
    setDismissedFindings((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("admin-dismissed-findings", JSON.stringify(next));
      return next;
    });
  }
  // Feature usage analytics
  const [usageData, setUsageData] = useState<{ topEvents: { name: string; count: number }[]; dailyActivity: { date: string; count: number }[]; totalEvents: number; uniqueEvents: number; uniqueUsers: number; period: number; priorPeriodEvents?: number; priorPeriodUsers?: number } | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usagePeriod, setUsagePeriod] = useState<7 | 30 | 90>(30);

  async function loadFeatureUsage(days: number = usagePeriod) {
    setUsageLoading(true);
    try {
      const data = await adminFetch("get-feature-usage", { days });
      setUsageData(data);
    } catch (err) {
      /* silenced — server logs capture this */
    }
    setUsageLoading(false);
  }

  const [scanFindings, setScanFindings] = useState<{ id: string; severity: "critical" | "high" | "medium" | "low"; title: string; description: string; category: string }[]>([]);
  const [scanSummary, setScanSummary] = useState<{ total: number; critical: number; high: number; medium: number; low: number; scannedAt: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("admin-last-scan-time");
    return null;
  });

  function toggleSecurityItem(id: string) {
    setSecurityChecklist((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("admin-security-checklist", JSON.stringify(next));
      return next;
    });
  }

  async function runSecurityScan() {
    setScanning(true);
    try {
      const data = await adminFetch("run-security-scan");
      if (data.findings) {
        setScanFindings(data.findings);
        setScanSummary(data.summary);
        const now = new Date().toISOString();
        setLastScanTime(now);
        localStorage.setItem("admin-last-scan-time", now);
        // Persist findings so they survive page refresh
        localStorage.setItem("admin-scan-findings", JSON.stringify(data.findings));
        localStorage.setItem("admin-scan-summary", JSON.stringify(data.summary));
      }
    } catch (err) {
      /* silenced */
    }
    setScanning(false);
  }

  // System health — live checker
  const [healthFindings, setHealthFindings] = useState<{ id: string; status: "healthy" | "warning" | "degraded" | "down"; title: string; description: string; category: string; metric?: string }[]>([]);
  const [healthSummary, setHealthSummary] = useState<{ total: number; healthy: number; warning: number; degraded: number; down: number; checkedAt: string } | null>(null);
  const [healthChecking, setHealthChecking] = useState(false);
  const [lastHealthTime, setLastHealthTime] = useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("admin-last-health-time");
    return null;
  });

  async function runHealthCheck() {
    setHealthChecking(true);
    try {
      const data = await adminFetch("run-health-check");
      if (data.findings) {
        setHealthFindings(data.findings);
        setHealthSummary(data.summary);
        const now = new Date().toISOString();
        setLastHealthTime(now);
        localStorage.setItem("admin-last-health-time", now);
        localStorage.setItem("admin-health-findings", JSON.stringify(data.findings));
        localStorage.setItem("admin-health-summary", JSON.stringify(data.summary));
      }
    } catch (err) {
      /* silenced */
    }
    setHealthChecking(false);
  }

  // SEO scan — live
  type ScanFinding = { id: string; severity: "critical" | "high" | "medium" | "low"; title: string; description: string; category: string };
  type ScanSummaryType = { total: number; critical: number; high: number; medium: number; low: number; scannedAt: string };
  const [seoFindings, setSeoFindings] = useState<ScanFinding[]>([]);
  const [seoSummary, setSeoSummary] = useState<ScanSummaryType | null>(null);
  const [seoScanning, setSeoScanning] = useState(false);
  const [lastSeoScanTime, setLastSeoScanTime] = useState<string | null>(null);

  // Tech debt scan — from GitHub Action
  const [tdFindings, setTdFindings] = useState<ScanFinding[]>([]);
  const [tdSummary, setTdSummary] = useState<ScanSummaryType | null>(null);
  const [lastTdScanTime, setLastTdScanTime] = useState<string | null>(null);

  // UX scan — live
  const [uxFindings, setUxFindings] = useState<ScanFinding[]>([]);
  const [uxSummary, setUxSummary] = useState<ScanSummaryType | null>(null);
  const [uxScanning, setUxScanning] = useState(false);
  const [lastUxScanTime, setLastUxScanTime] = useState<string | null>(null);

  // Audit history
  type AuditHistoryRun = { id: string; audit_type: string; trigger: string; summary: Record<string, number>; created_at: string; duration_ms: number };
  const [auditHistory, setAuditHistory] = useState<Record<string, AuditHistoryRun[]>>({});
  const [historyExpanded, setHistoryExpanded] = useState<Record<string, boolean>>({});

  async function loadLatestAudit(auditType: string) {
    try {
      const data = await adminFetch("get-latest-audit", { audit_type: auditType });
      if (data.run) {
        const findings = data.run.findings || [];
        const summary = data.run.summary || {};
        if (auditType === "seo") { setSeoFindings(findings); setSeoSummary(summary); setLastSeoScanTime(data.run.created_at); }
        if (auditType === "uiux") { setUxFindings(findings); setUxSummary(summary); setLastUxScanTime(data.run.created_at); }
        if (auditType === "security_scan") { setScanFindings(findings); setScanSummary(summary); setLastScanTime(data.run.created_at); }
        if (auditType === "tech_debt") { setTdFindings(findings); setTdSummary(summary); setLastTdScanTime(data.run.created_at); }
      }
    } catch { /* ignore */ }
  }

  async function loadAuditHistory(auditType: string) {
    try {
      const data = await adminFetch("get-audit-history", { audit_type: auditType, limit: 10 });
      if (data.runs) setAuditHistory((prev) => ({ ...prev, [auditType]: data.runs }));
    } catch { /* ignore */ }
  }

  async function runSeoScan() {
    setSeoScanning(true);
    try {
      const data = await adminFetch("run-seo-scan");
      if (data.findings) { setSeoFindings(data.findings); setSeoSummary(data.summary); setLastSeoScanTime(new Date().toISOString()); }
    } catch { /* ignore */ }
    setSeoScanning(false);
  }

  async function runUxScan() {
    setUxScanning(true);
    try {
      const data = await adminFetch("run-ux-scan");
      if (data.findings) { setUxFindings(data.findings); setUxSummary(data.summary); setLastUxScanTime(new Date().toISOString()); }
    } catch { /* ignore */ }
    setUxScanning(false);
  }

  // Restore last scan/health results on mount + load latest from DB
  // Restore localStorage cache on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedFindings = localStorage.getItem("admin-scan-findings");
        const savedSummary = localStorage.getItem("admin-scan-summary");
        if (savedFindings) setScanFindings(JSON.parse(savedFindings));
        if (savedSummary) setScanSummary(JSON.parse(savedSummary));
        const savedHealth = localStorage.getItem("admin-health-findings");
        const savedHealthSummary = localStorage.getItem("admin-health-summary");
        if (savedHealth) setHealthFindings(JSON.parse(savedHealth));
        if (savedHealthSummary) setHealthSummary(JSON.parse(savedHealthSummary));
      } catch { /* ignore */ }
    }
  }, []);

  // Load latest audit data from DB after authentication
  useEffect(() => {
    if (authenticated) {
      loadLatestAudit("seo");
      loadLatestAudit("uiux");
      loadLatestAudit("security_scan");
      loadLatestAudit("tech_debt");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  // ============================================================
  // AUDIT DATA — Tech Debt, UI/UX, SEO
  // ============================================================

  type AuditSeverity = "critical" | "high" | "medium" | "low" | "info";

  const [techDebtChecklist, setTechDebtChecklist] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try { const s = localStorage.getItem("admin-techdebt-checklist"); if (s) return JSON.parse(s); } catch {}
    }
    return {};
  });
  const [uiuxChecklist, setUiuxChecklist] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try { const s = localStorage.getItem("admin-uiux-checklist"); if (s) return JSON.parse(s); } catch {}
    }
    return {};
  });
  const [seoChecklist, setSeoChecklist] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try { const s = localStorage.getItem("admin-seo-checklist"); if (s) return JSON.parse(s); } catch {}
    }
    return {};
  });

  function toggleAuditItem(section: "techdebt" | "uiux" | "seo", id: string) {
    const setter = section === "techdebt" ? setTechDebtChecklist : section === "uiux" ? setUiuxChecklist : setSeoChecklist;
    const key = `admin-${section}-checklist`;
    setter((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  }

  // Findings imported from shared module (used by both admin UI and cron jobs)

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages, userTyping]);

  // ============================================================
  // DATA LOADERS
  // ============================================================

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

  const loadAnalytics = useCallback(async (range: "30d" | "12m") => {
    setAnalyticsLoading(true);
    try {
      const res = await adminFetch("get-analytics", { range });
      if (res.data) setAnalyticsData(res.data);
    } catch { /* handled */ }
    setAnalyticsLoading(false);
  }, []);

  const loadActivity = useCallback(async () => {
    try {
      const res = await adminFetch("get-activity-feed");
      if (res.data) setActivityEvents(res.data);
    } catch { /* handled */ }
  }, []);

  const loadPeople = useCallback(async () => {
    try {
      const res = await adminFetch("get-people");
      if (res.data) setPeople(res.data);
    } catch { /* handled */ }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    try {
      const res = await adminFetch("get-announcements");
      if (res.data) setAnnouncements(res.data);
    } catch { /* handled */ }
  }, []);

  const loadRevenueAnalytics = useCallback(async () => {
    setRevenueLoading(true);
    try {
      const res = await adminFetch("get-revenue-analytics");
      if (res.history) setRevenueHistory(res.history);
      if (res.forecast) setRevenueForecast(res.forecast);
      if (res.summary) setRevenueSummary(res.summary);
    } catch { /* handled */ }
    setRevenueLoading(false);
  }, []);

  // Check auth — verify the HttpOnly cookie is valid via a lightweight API call
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get-overview" }),
        });
        if (res.ok) {
          setAuthenticated(true);
        }
      } catch {
        // Not authenticated
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  // Load data
  useEffect(() => {
    if (authenticated) {
      loadConversations();
      loadOverview();
      loadDemoSessions();
      loadActivity();
      loadPeople();
      loadAnnouncements();
      loadAnalytics("30d");
      loadRevenueAnalytics();
    }
  }, [authenticated, loadConversations, loadOverview, loadDemoSessions, loadActivity, loadAnnouncements, loadRevenueAnalytics]);

  // Poll conversations every 10s
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [authenticated, loadConversations]);

  // Realtime for selected conversation
  useEffect(() => {
    if (!selectedConv) return;
    const channel = supabase.channel(`conversation:${selectedConv.id}`)
      .on("broadcast", { event: "new-message" }, (payload) => {
        const msg = payload.payload as ConvMessage;
        setConvMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
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

  function handleAdminTyping() {
    if (!channelRef.current) return;
    if (typingTimeoutRef.current) return;
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { sender: "admin" } });
    typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
  }

  // ============================================================
  // HANDLERS
  // ============================================================

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
      if (res.ok && data.success) {
        // Cookie is set automatically by the server response
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
        const newAdminMsgs = (res.messages as ConvMessage[]).filter(
          (m) => !convMessages.some((existing) => existing.id === m.id)
        );
        for (const msg of newAdminMsgs) {
          channelRef.current?.send({ type: "broadcast", event: "new-message", payload: msg });
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
    if (status === "closed" && channelRef.current) {
      channelRef.current.send({ type: "broadcast", event: "conversation-closed", payload: {} });
    }
  }

  async function createAnnouncement() {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) return;
    try {
      await adminFetch("create-announcement", announcementForm);
      setAnnouncementForm({ title: "", message: "", type: "info" });
      setShowAnnouncementForm(false);
      loadAnnouncements();
    } catch { /* handled */ }
  }

  async function deleteAnnouncement(id: string) {
    try {
      await adminFetch("delete-announcement", { id });
      loadAnnouncements();
    } catch { /* handled */ }
  }

  async function toggleAnnouncement(id: string, active: boolean) {
    try {
      await adminFetch("toggle-announcement", { id, active });
      loadAnnouncements();
    } catch { /* handled */ }
  }

  async function requestWorkspaceAccess(workspaceId: string) {
    setAccessRequestStatus("sending");
    setAccessRequestMsg("");
    try {
      const res = await adminFetch("request-workspace-access", { workspaceId });
      if (res.success) {
        setAccessRequestStatus("pending");
        setAccessRequestMsg(`Approval email sent to ${res.ownerEmail}. Waiting for owner to approve...`);
        startAccessPolling(workspaceId);
      } else {
        setAccessRequestStatus("error");
        setAccessRequestMsg(res.error || "Failed to send access request.");
      }
    } catch {
      setAccessRequestStatus("error");
      setAccessRequestMsg("Failed to send access request.");
    }
  }

  function startAccessPolling(workspaceId: string) {
    if (accessPollRef.current) clearInterval(accessPollRef.current);
    accessPollRef.current = setInterval(async () => {
      try {
        const check = await adminFetch("check-workspace-access", { workspaceId });
        if (check.status === "approved") {
          setAccessRequestStatus("approved");
          setAccessRequestMsg("Owner approved your access. Click below to open the workspace.");
          if (accessPollRef.current) clearInterval(accessPollRef.current);
        } else if (check.status === "expired" || check.status === "none") {
          setAccessRequestStatus("error");
          setAccessRequestMsg("Access request expired. Please try again.");
          if (accessPollRef.current) clearInterval(accessPollRef.current);
        }
      } catch { /* keep polling */ }
    }, 5000);
  }

  async function openApprovedWorkspace(workspaceId: string) {
    window.open(`/admin/workspace?id=${workspaceId}`, "_blank");
    setAccessRequestStatus("idle");
    setAccessRequestMsg("");
  }

  // Check for existing approved access when selecting a workspace
  useEffect(() => {
    if (!selectedWorkspace) {
      setAccessRequestStatus("idle");
      setAccessRequestMsg("");
      if (accessPollRef.current) clearInterval(accessPollRef.current);
      return;
    }
    // Check if there's already a pending or approved request
    (async () => {
      try {
        const check = await adminFetch("check-workspace-access", { workspaceId: selectedWorkspace.id });
        if (check.status === "approved") {
          setAccessRequestStatus("approved");
          setAccessRequestMsg("Owner approved your access. Click below to open the workspace.");
        } else if (check.status === "pending") {
          setAccessRequestStatus("pending");
          setAccessRequestMsg("Waiting for owner to approve...");
          startAccessPolling(selectedWorkspace.id);
        } else {
          setAccessRequestStatus("idle");
          setAccessRequestMsg("");
        }
      } catch {
        setAccessRequestStatus("idle");
        setAccessRequestMsg("");
      }
    })();
    return () => {
      if (accessPollRef.current) clearInterval(accessPollRef.current);
    };
  }, [selectedWorkspace]);

  // ============================================================
  // COMPUTED
  // ============================================================

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

  const filteredWorkspaces = workspaces.filter((w) => {
    if (!workspaceSearch) return true;
    const q = workspaceSearch.toLowerCase();
    return w.name.toLowerCase().includes(q) || (w.industry || "").toLowerCase().includes(q) || w.owner_email.toLowerCase().includes(q);
  });

  const subscriberCount = people.filter((p) => p.type === "subscriber" || p.type === "both").length;
  const userCount = people.filter((p) => p.type === "user" || p.type === "both").length;

  const filteredPeople = people.filter((p) => {
    if (peopleFilter !== "all" && p.type !== peopleFilter) {
      if (peopleFilter === "both" && p.type !== "both") return false;
      if (peopleFilter === "user" && p.type !== "user" && p.type !== "both") return false;
      if (peopleFilter === "subscriber" && p.type !== "subscriber" && p.type !== "both") return false;
    }
    if (peopleSearch) {
      const q = peopleSearch.toLowerCase();
      return p.email.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.workspace_name || "").toLowerCase().includes(q);
    }
    return true;
  });

  const revenueStats = useMemo(() => {
    const businessCount = workspaces.filter((w) => w.plan === "business").length;
    const freeCount = workspaces.filter((w) => w.plan !== "business").length;
    const totalSeats = workspaces.filter((w) => w.plan === "business").reduce((sum, w) => sum + w.member_count, 0);
    const mrr = totalSeats * 900; // $9/seat in cents
    return { businessCount, freeCount, totalSeats, mrr };
  }, [workspaces]);

  // ============================================================
  // RENDER: Login
  // ============================================================

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
          <div className="bg-gray-900 px-6 py-5 text-center">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">Command Center</h1>
            <p className="text-sm text-white/50 mt-1">WorkChores Admin</p>
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
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 text-gray-800 placeholder:text-gray-400"
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
            <button type="submit" disabled={!password.trim() || loggingIn} className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loggingIn ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: Main Layout
  // ============================================================

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 fixed lg:sticky top-0 left-0 z-50 lg:z-auto
        h-screen bg-gray-900 text-white flex flex-col
        transition-all duration-200
        ${sidebarCollapsed ? "w-16" : "w-60"}
      `}>
        {/* Logo */}
        <div className={`h-14 flex items-center border-b border-white/10 shrink-0 ${sidebarCollapsed ? "justify-center px-2" : "px-4 gap-3"}`}>
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">WorkChores</div>
              <div className="text-[10px] text-white/40">Command Center</div>
            </div>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:block p-1 text-white/40 hover:text-white transition-colors">
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden p-1 text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navGroups.map((group, gi) => {
            const isGroupCollapsed = collapsedGroups[group.label] || false;
            const hasActiveItem = group.items.some((nav) => section === nav.key);
            return (
            <div key={group.label} className={gi > 0 ? "mt-0.5" : ""}>
              {!sidebarCollapsed && (
                <button
                  onClick={() => setCollapsedGroups((prev) => ({ ...prev, [group.label]: !prev[group.label] }))}
                  className="w-full flex items-center justify-between px-4 pt-3 pb-1.5 group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold uppercase tracking-widest transition-colors ${hasActiveItem ? "text-white/50" : "text-white/25 group-hover:text-white/40"}`}>{group.label}</span>
                    {isGroupCollapsed && hasActiveItem && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    )}
                  </div>
                  <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${isGroupCollapsed ? "text-white/20 group-hover:text-white/40" : "rotate-90 text-white/30 group-hover:text-white/40"}`} />
                </button>
              )}
              {sidebarCollapsed && gi > 0 && (
                <div className="mx-3 my-2 border-t border-white/10" />
              )}
              <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isGroupCollapsed && !sidebarCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"}`}>
              <div className="space-y-0.5">
                {group.items.map((nav) => {
                  const Icon = nav.icon;
                  const isActive = section === nav.key;
                  const badge = nav.key === "support" && newCount > 0 ? newCount : null;
                  return (
                    <button
                      key={nav.key}
                      onClick={() => { setSection(nav.key); setMobileSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 transition-all ${sidebarCollapsed ? "justify-center px-2 py-2.5 mx-auto" : "px-4 py-2"} ${
                        isActive
                          ? "bg-white/10 text-white"
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      }`}
                      title={sidebarCollapsed ? nav.label : undefined}
                    >
                      <div className="relative shrink-0">
                        <Icon className="w-4.5 h-4.5" />
                        {badge && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-1 flex items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                            {badge}
                          </span>
                        )}
                      </div>
                      {!sidebarCollapsed && (
                        <>
                          <span className="text-sm font-medium flex-1 text-left">{nav.label}</span>
                          {badge && (
                            <span className="min-w-[18px] h-4.5 px-1 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                              {badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
              </div>
            </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className={`border-t border-white/10 p-3 ${sidebarCollapsed ? "text-center" : ""}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-white/40">System Online</span>
            </div>
          )}
          <button
            onClick={async () => { await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); setAuthenticated(false); }}
            className={`text-xs text-white/30 hover:text-red-400 transition-colors ${sidebarCollapsed ? "" : "w-full text-left"}`}
          >
            {sidebarCollapsed ? "Exit" : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-14 flex items-center px-4 sm:px-6 gap-3 shrink-0">
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700">
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-bold text-gray-900 capitalize">
            {navGroups.flatMap((g) => g.items).find((n) => n.key === section)?.label || "Overview"}
          </h1>
          <div className="flex-1" />
          <button
            onClick={() => { loadConversations(); loadOverview(); loadDemoSessions(); loadActivity(); loadPeople(); loadAnnouncements(); loadRevenueAnalytics(); }}
            className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
            title="Refresh all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {/* ============================== OVERVIEW ============================== */}
          {section === "overview" && (() => {
            const demoTotal = demoSessions.length;
            const demoConverted = demoSessions.filter((d) => d.converted_to_user).length;
            const demoClickedSignup = demoSessions.filter((d) => d.clicked_signup).length;
            const demoAvgDuration = demoTotal > 0 ? Math.floor(demoSessions.reduce((sum, d) => sum + d.duration_seconds, 0) / demoTotal) : 0;
            const demoConvRate = demoTotal > 0 ? ((demoConverted / demoTotal) * 100).toFixed(1) : "0";
            const planData = [
              { name: "Business", value: revenueStats.businessCount, color: "#10b981" },
              { name: "Free", value: revenueStats.freeCount, color: "#e5e7eb" },
            ].filter((d) => d.value > 0);
            const demoFunnelData = [
              { stage: "Demos", value: demoTotal, color: "#6366f1" },
              { stage: "Clicked Signup", value: demoClickedSignup, color: "#3b82f6" },
              { stage: "Converted", value: demoConverted, color: "#10b981" },
            ];
            return (
            <div className="p-4 sm:p-6 max-w-7xl space-y-6">
              {/* Hero KPI strip */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "MRR", value: `$${(revenueStats.mrr / 100).toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Workspaces", value: workspaces.length, icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Users", value: totalUsers, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
                  { label: "Subscribers", value: subscriberCount, icon: Mail, color: "text-pink-600", bg: "bg-pink-50" },
                  { label: "CRM Contacts", value: totalContacts.toLocaleString(), icon: Users, color: "text-gray-600", bg: "bg-gray-100" },
                  { label: "Paid Seats", value: revenueStats.totalSeats, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
                ].map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${kpi.color}`} />
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{kpi.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Activity Chart + Plan Breakdown row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Activity trend chart — 2/3 width */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Activity Trend</h3>
                    <div className="flex items-center gap-1">
                      {(["30d", "12m"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => { setAnalyticsRange(r); loadAnalytics(r); }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                            analyticsRange === r ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          {r === "30d" ? "30 Days" : "12 Months"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 h-64">
                    {analyticsLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                      </div>
                    ) : analyticsData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-sm text-gray-400">No data yet</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="ovVisitors" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="ovSignups" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                          />
                          <Area type="monotone" dataKey="visitors" stroke="#6366f1" strokeWidth={2} fill="url(#ovVisitors)" name="Visitors" />
                          <Area type="monotone" dataKey="signups" stroke="#10b981" strokeWidth={2} fill="url(#ovSignups)" name="Signups" />
                          <Area type="monotone" dataKey="demos" stroke="#f59e0b" strokeWidth={1.5} fill="transparent" strokeDasharray="4 3" name="Demos" />
                          <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Plan distribution — 1/3 width */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Plan Distribution</h3>
                  </div>
                  <div className="p-4 flex flex-col items-center">
                    <div className="h-44 w-full">
                      {planData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sm text-gray-400">No workspaces</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={planData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={3}
                              dataKey="value"
                              stroke="none"
                            >
                              {planData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(val) => [`${val} workspace${val !== 1 ? "s" : ""}`, ""]} contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs text-gray-600">Business ({revenueStats.businessCount})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                        <span className="text-xs text-gray-600">Free ({revenueStats.freeCount})</span>
                      </div>
                    </div>
                    <div className="mt-3 w-full border-t border-gray-100 pt-3 grid grid-cols-2 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold text-emerald-600">${(revenueStats.mrr / 100).toFixed(0)}</div>
                        <div className="text-[10px] text-gray-500">MRR</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{revenueStats.totalSeats}</div>
                        <div className="text-[10px] text-gray-500">Paid Seats</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support + Demo Funnel row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Support queue */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Support Queue</h3>
                    <button onClick={() => setSection("support")} className="text-xs text-accent hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>
                  </div>
                  <div className="grid grid-cols-4 divide-x divide-gray-200">
                    {(["new", "active", "resolved", "closed"] as const).map((s) => {
                      const count = conversations.filter((c) => c.status === s).length;
                      const cfg = statusConfig[s];
                      const colors = { new: "text-red-600 bg-red-50", active: "text-blue-600 bg-blue-50", resolved: "text-emerald-600 bg-emerald-50", closed: "text-gray-500 bg-gray-50" };
                      return (
                        <div key={s} className="p-4 text-center cursor-pointer hover:bg-gray-50/80 transition-colors" onClick={() => { setSection("support"); setConvFilter(s); }}>
                          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${colors[s]} mb-2`}>
                            <span className="text-lg font-bold">{count}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium">{cfg.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Demo funnel */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Demo Funnel</h3>
                    <span className="text-xs text-gray-400">{demoConvRate}% conversion</span>
                  </div>
                  <div className="p-4">
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={demoFunnelData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barSize={32}>
                          <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {demoFunnelData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-between mt-2 px-1">
                      <div className="text-center">
                        <div className="text-[10px] text-gray-400">Avg Duration</div>
                        <div className="text-sm font-semibold text-gray-700">{Math.floor(demoAvgDuration / 60)}m {demoAvgDuration % 60}s</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-gray-400">Signup Rate</div>
                        <div className="text-sm font-semibold text-blue-600">{demoTotal > 0 ? ((demoClickedSignup / demoTotal) * 100).toFixed(1) : 0}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-gray-400">Conv Rate</div>
                        <div className="text-sm font-semibold text-emerald-600">{demoConvRate}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent workspaces */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Recent Workspaces</h3>
                  <button onClick={() => setSection("workspaces")} className="text-xs text-accent hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50">
                        <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Workspace</th>
                        <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="text-center px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Members</th>
                        <th className="text-center px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Contacts</th>
                        <th className="text-center px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                        <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {workspaces.slice(0, 5).map((w) => (
                        <tr key={w.id} className="hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => { setSection("workspaces"); setSelectedWorkspace(w); }}>
                          <td className="px-5 py-3">
                            <div className="font-medium text-gray-900">{w.name}</div>
                            <div className="text-[11px] text-gray-400">{w.owner_email}</div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              w.plan === "business" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                            }`}>
                              {w.plan === "business" && <Crown className="w-2.5 h-2.5" />}
                              {w.plan === "business" ? "Business" : "Free"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center text-gray-700">{w.member_count}</td>
                          <td className="px-5 py-3 text-center text-gray-700">{w.contact_count}</td>
                          <td className="px-5 py-3 text-center text-gray-700">{w.task_count}</td>
                          <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(w.created_at)}</td>
                        </tr>
                      ))}
                      {workspaces.length === 0 && (
                        <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No workspaces yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            );
          })()}

          {/* ============================== CUSTOMER SERVICE ============================== */}
          {section === "support" && (
            <div className="flex-1 flex flex-col min-h-[calc(100vh-3.5rem)]">
              {/* Tabs: Conversations vs AI Assistant */}
              <div className="flex border-b border-gray-200 bg-white shrink-0">
                <button onClick={() => setSupportTab("conversations")} className={`flex-1 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${supportTab === "conversations" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                  <Headphones className="w-3.5 h-3.5 inline mr-1.5" />Support Conversations
                </button>
                <button onClick={() => { setSupportTab("assistant"); if (!assistantSessions.length) loadAssistantSessions(); }} className={`flex-1 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${supportTab === "assistant" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"}`}>
                  <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />AI Assistant Chats
                </button>
              </div>

              {/* AI Assistant tab */}
              {supportTab === "assistant" && (
                <div className="flex flex-1">
                  {/* Session list + stats */}
                  <div className={`${selectedAssistantSession ? "hidden sm:flex" : "flex"} flex-col w-full sm:w-80 lg:w-96 border-r border-gray-200 bg-white`}>
                    {/* Stats summary */}
                    {assistantStats && (
                      <div className="p-3 border-b border-gray-200 space-y-3 bg-gray-50/50">
                        {/* Mood */}
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">Visitor Mood</div>
                          <div className="flex gap-2">
                            {[
                              { label: "Positive", count: assistantStats.sentiment.positive, color: "bg-emerald-500" },
                              { label: "Neutral", count: assistantStats.sentiment.neutral, color: "bg-gray-400" },
                              { label: "Negative", count: assistantStats.sentiment.negative, color: "bg-red-500" },
                            ].map((s) => {
                              const total = assistantStats.sentiment.positive + assistantStats.sentiment.neutral + assistantStats.sentiment.negative;
                              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                              return (
                                <div key={s.label} className="flex-1 text-center">
                                  <div className="text-sm font-bold text-gray-900">{pct}%</div>
                                  <div className="flex items-center justify-center gap-1 mt-0.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
                                    <span className="text-[10px] text-gray-500">{s.label}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {/* CTA stats */}
                        <div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">CTA Performance</div>
                          <div className="space-y-1">
                            {Object.entries(assistantStats.ctas).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([cta, count]) => {
                              const total = Object.values(assistantStats.ctas).reduce((a, b) => a + b, 0);
                              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                              return (
                                <div key={cta} className="flex items-center justify-between">
                                  <span className="text-[11px] text-gray-600">{cta.replace(/-/g, " ")}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} /></div>
                                    <span className="text-[10px] text-gray-500 w-6 text-right">{count}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                            <span className="text-[10px] text-gray-400">CTA clicks</span>
                            <span className="text-xs font-bold text-gray-900">{assistantStats.ctaClicks}</span>
                          </div>
                        </div>
                        {/* Totals */}
                        <div className="flex gap-3 text-center">
                          <div className="flex-1"><div className="text-sm font-bold text-gray-900">{assistantStats.totalConversations}</div><div className="text-[10px] text-gray-400">Chats</div></div>
                          <div className="flex-1"><div className="text-sm font-bold text-gray-900">{assistantStats.totalMessages}</div><div className="text-[10px] text-gray-400">Messages</div></div>
                        </div>
                      </div>
                    )}
                    <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">{assistantSessions.length} conversation(s)</span>
                      <button onClick={loadAssistantSessions} className="text-xs text-gray-400 hover:text-gray-600" aria-label="Refresh"><RefreshCw className="w-3 h-3" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {assistantSessions.length === 0 && <div className="py-12 text-center text-sm text-gray-400">No AI assistant conversations yet</div>}
                      {assistantSessions.map((s) => (
                        <button key={s.session_id} onClick={() => loadAssistantMessages(s.session_id)} className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedAssistantSession === s.session_id ? "bg-blue-50" : ""}`}>
                          <div className="text-sm font-medium text-gray-900 truncate">{s.first_user_message || "New conversation"}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-400">{s.messages} messages</span>
                            <span className="text-[10px] text-gray-400">·</span>
                            <span className="text-[10px] text-gray-400">{formatTime(s.last_message_at)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message view */}
                  <div className="flex-1 flex flex-col bg-gray-50">
                    {!selectedAssistantSession ? (
                      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Select a conversation</div>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
                          <button onClick={() => setSelectedAssistantSession(null)} className="sm:hidden text-xs text-gray-500">← Back</button>
                          <span className="text-xs text-gray-500 font-mono truncate">{selectedAssistantSession.slice(0, 16)}...</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {assistantMessages.map((msg) => {
                            const meta = (msg as unknown as { metadata?: Record<string, unknown> }).metadata;
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
                              {/* Sentiment + CTA badges for bot messages */}
                              {msg.role === "assistant" && (sentiment || cta) && (
                                <div className="flex items-center gap-1.5 mt-1 ml-1">
                                  {sentiment && sentiment !== "neutral" && SentimentIcon && (
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${sentimentColor}`}>
                                      <SentimentIcon className="w-2.5 h-2.5" /> {sentiment}
                                    </span>
                                  )}
                                  {cta && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-accent/10 text-accent">
                                      CTA: {cta.replace(/-/g, " ")}
                                    </span>
                                  )}
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

              {/* Support Conversations tab */}
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
                      return (
                        <button key={s} onClick={() => setConvFilter(s)} className={`px-2 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                          convFilter === s ? (s === "all" ? "bg-gray-900 text-white" : statusConfig[s as keyof typeof statusConfig].color) : "text-gray-400 hover:text-gray-600"
                        }`}>
                          {s === "all" ? "All" : statusConfig[s as keyof typeof statusConfig].label} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

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
                          selectedConv?.id === c.id ? "bg-blue-50/50" : ""
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
                    <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center gap-3 shrink-0">
                      <button onClick={() => setSelectedConv(null)} className="sm:hidden p-1 text-gray-400 hover:text-gray-700">
                        <ChevronLeft className="w-4 h-4" />
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

                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                      {convMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}>
                          <div className="max-w-[75%]">
                            <div className={`text-[10px] mb-0.5 ${msg.sender === "user" ? "text-gray-400 ml-1" : "text-gray-400 mr-1 text-right"}`}>
                              {msg.sender === "user" ? msg.sender_name : msg.sender === "admin" ? `${msg.sender_name} (you)` : "Bot"}
                            </div>
                            <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                              msg.sender === "user"
                                ? "bg-white border border-gray-200 text-gray-800 rounded-tl-md"
                                : msg.sender === "admin"
                                ? "bg-gray-900 text-white rounded-tr-md"
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

                    <div className="p-3 bg-white border-t border-gray-200 shrink-0">
                      <form onSubmit={(e) => { e.preventDefault(); handleReply(); }} className="flex items-end gap-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => { setReplyText(e.target.value); handleAdminTyping(); }}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                          placeholder="Type a reply..."
                          className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 text-gray-800 placeholder:text-gray-400 resize-none min-h-[42px] max-h-32"
                          rows={1}
                          disabled={sendingReply}
                        />
                        <button type="submit" disabled={!replyText.trim() || sendingReply} className="p-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-40 shrink-0">
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
            </div>
              )}
            </div>
          )}

          {/* ============================== REVENUE & BILLING ============================== */}
          {section === "revenue" && (() => {
            // Combine history + forecast for the chart
            const chartData = [
              ...revenueHistory.map((h) => ({ ...h, type: "actual" as const, forecastMrr: null as number | null })),
              ...revenueForecast.map((f) => ({ label: f.label, mrr: null as number | null, seats: f.seats, workspaces: f.workspaces, newBusiness: 0, churned: 0, type: "forecast" as const, forecastMrr: f.mrr })),
            ];
            // Bridge: last actual point should also have forecastMrr so the line connects
            if (chartData.length > 0 && revenueHistory.length > 0) {
              const lastActualIdx = revenueHistory.length - 1;
              chartData[lastActualIdx] = { ...chartData[lastActualIdx], forecastMrr: revenueHistory[lastActualIdx].mrr };
            }

            const totalChurned12m = revenueHistory.reduce((s, m) => s + m.churned, 0);
            const totalNew12m = revenueHistory.reduce((s, m) => s + m.newBusiness, 0);
            const peakMrr = Math.max(...revenueHistory.map((h) => h.mrr), 0);
            const avgMrr = revenueHistory.length > 0 ? Math.round(revenueHistory.reduce((s, h) => s + h.mrr, 0) / revenueHistory.length) : 0;
            const churnRate = revenueStats.businessCount > 0 ? ((revenueSummary.avgChurnRate / revenueStats.businessCount) * 100).toFixed(1) : "0";

            return (
            <div className="p-4 sm:p-6 max-w-7xl space-y-6">
              {/* Revenue KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Current MRR", value: `$${(revenueStats.mrr / 100).toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "ARR", value: `$${((revenueStats.mrr / 100) * 12).toLocaleString()}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Paid Workspaces", value: revenueStats.businessCount, icon: Crown, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Paid Seats", value: revenueStats.totalSeats, icon: CreditCard, color: "text-violet-600", bg: "bg-violet-50" },
                  { label: "Free Workspaces", value: revenueStats.freeCount, icon: Building2, color: "text-gray-500", bg: "bg-gray-100" },
                  { label: "Avg Revenue/WS", value: revenueStats.businessCount > 0 ? `$${Math.round(revenueStats.mrr / 100 / revenueStats.businessCount)}` : "$0", icon: BarChart3, color: "text-pink-600", bg: "bg-pink-50" },
                ].map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${kpi.color}`} />
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">{kpi.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* MRR Trend + Forecast Chart */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">MRR Trend & 3-Month Forecast</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Solid line = actual, dashed line = projected</p>
                  </div>
                  <button onClick={loadRevenueAnalytics} className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors">
                    <RefreshCw className={`w-3.5 h-3.5 ${revenueLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <div className="p-4 h-72">
                  {revenueLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">No revenue data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revMrr" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                          formatter={(val, name) => {
                            if (val === null || val === undefined) return ["-", String(name)];
                            return [String(name) === "forecastMrr" ? `$${val} (projected)` : `$${val}`, String(name) === "forecastMrr" ? "Forecast" : "MRR"];
                          }}
                        />
                        <Area type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} fill="url(#revMrr)" name="MRR" connectNulls={false} />
                        <Area type="monotone" dataKey="forecastMrr" stroke="#10b981" strokeWidth={2} strokeDasharray="6 4" fill="none" name="Forecast" connectNulls />
                        <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Churn & Growth row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Churn overview */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Churn (12 Months)</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Workspaces Churned</span>
                      <span className={`text-lg font-bold ${totalChurned12m > 0 ? "text-red-600" : "text-gray-900"}`}>{totalChurned12m}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Avg Monthly Churn</span>
                      <span className="text-lg font-bold text-gray-900">{revenueSummary.avgChurnRate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Churn Rate</span>
                      <span className={`text-lg font-bold ${Number(churnRate) > 5 ? "text-red-600" : "text-emerald-600"}`}>{churnRate}%</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <div className="h-24">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={14}>
                            <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 8, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "11px" }} />
                            <Bar dataKey="churned" fill="#ef4444" radius={[2, 2, 0, 0]} name="Churned" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Growth overview */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Growth (12 Months)</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">New Paid Workspaces</span>
                      <span className="text-lg font-bold text-emerald-600">{totalNew12m}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Avg Monthly New</span>
                      <span className="text-lg font-bold text-gray-900">{revenueSummary.avgNewRate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Net Growth</span>
                      <span className={`text-lg font-bold ${totalNew12m - totalChurned12m >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {totalNew12m - totalChurned12m >= 0 ? "+" : ""}{totalNew12m - totalChurned12m}
                      </span>
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <div className="h-24">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={revenueHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={14}>
                            <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 8, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "11px" }} />
                            <Bar dataKey="newBusiness" fill="#10b981" radius={[2, 2, 0, 0]} name="New Paid" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3-Month Forecast */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">3-Month Forecast</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="text-[11px] text-gray-400 mb-2">Based on 3-month trailing averages</div>
                    {revenueForecast.map((f, i) => (
                      <div key={f.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{f.label}</div>
                          <div className="text-[10px] text-gray-400">{f.seats} seats &middot; {f.workspaces} workspaces</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-600">${f.mrr}</div>
                          <div className="text-[10px] text-gray-400">
                            {revenueSummary.currentMrr > 0
                              ? `${((f.mrr / revenueSummary.currentMrr - 1) * 100).toFixed(0)}% vs now`
                              : "—"}
                          </div>
                        </div>
                      </div>
                    ))}
                    {revenueForecast.length === 0 && (
                      <div className="text-sm text-gray-400 text-center py-4">Not enough data for forecast</div>
                    )}
                    <div className="border-t border-gray-100 pt-3 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Avg MRR Growth/mo</span>
                        <span className={`text-sm font-bold ${revenueSummary.avgGrowth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {revenueSummary.avgGrowth >= 0 ? "+" : ""}${revenueSummary.avgGrowth}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue summary row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Seats over time */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Seat Growth (12 Months)</h3>
                  </div>
                  <div className="p-4 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revSeats" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "11px" }} />
                        <Area type="monotone" dataKey="seats" stroke="#6366f1" strokeWidth={2} fill="url(#revSeats)" name="Paid Seats" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Revenue Summary</h3>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500">Peak MRR (12m)</span>
                      <span className="text-sm font-bold text-gray-900">${peakMrr}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-50">
                      <span className="text-sm text-gray-500">Average MRR (12m)</span>
                      <span className="text-sm font-bold text-gray-900">${avgMrr}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-50">
                      <span className="text-sm text-gray-500">Revenue per Seat</span>
                      <span className="text-sm font-bold text-gray-900">$9/mo</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-50">
                      <span className="text-sm text-gray-500">Conversion (Free → Paid)</span>
                      <span className="text-sm font-bold text-gray-900">
                        {workspaces.length > 0 ? ((revenueStats.businessCount / workspaces.length) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-50">
                      <span className="text-sm text-gray-500">Projected ARR (3m out)</span>
                      <span className="text-sm font-bold text-emerald-600">
                        ${revenueForecast.length > 0 ? (revenueForecast[revenueForecast.length - 1].mrr * 12).toLocaleString() : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workspace Plans table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Workspace Plans</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50">
                        <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Workspace</th>
                        <th className="text-left px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                        <th className="text-center px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="text-center px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Seats</th>
                        <th className="text-right px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">MRR</th>
                        <th className="text-center px-5 py-2.5 text-[11px] font-medium text-gray-500 uppercase tracking-wider">Stripe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {workspaces.map((w) => {
                        const isBusiness = w.plan === "business";
                        const seatMrr = isBusiness ? w.member_count * 5 : 0;
                        return (
                          <tr key={w.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-900">{w.name}</td>
                            <td className="px-5 py-3 text-gray-500 text-xs">{w.owner_email}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isBusiness ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                {isBusiness && <Crown className="w-2.5 h-2.5" />}
                                {isBusiness ? "Business" : "Free"}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center">{w.member_count}</td>
                            <td className="px-5 py-3 text-right font-medium">{isBusiness ? `$${seatMrr}` : "—"}</td>
                            <td className="px-5 py-3 text-center">
                              {w.stripe_customer_id ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium"><CheckCircle2 className="w-3 h-3" /> Connected</span>
                              ) : (
                                <span className="text-[10px] text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {workspaces.length === 0 && (
                        <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No workspaces</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            );
          })()}

          {/* ============================== WORKSPACES ============================== */}
          {section === "workspaces" && (
            <div className="p-4 sm:p-6 max-w-7xl space-y-6">
              {selectedWorkspace ? (
                /* Workspace detail */
                <div className="space-y-6">
                  <button onClick={() => setSelectedWorkspace(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ChevronLeft className="w-4 h-4" /> Back to all workspaces
                  </button>

                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gray-500" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-lg font-bold text-gray-900">{selectedWorkspace.name}</h2>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 capitalize">{selectedWorkspace.industry?.replace(/-/g, " ") || "No industry"}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${selectedWorkspace.plan === "business" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                              {selectedWorkspace.plan === "business" ? "Business" : "Free"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-200">
                      <div className="p-4 text-center">
                        <div className="text-xl font-bold text-gray-900">{selectedWorkspace.member_count}</div>
                        <div className="text-xs text-gray-500">Members</div>
                      </div>
                      <div className="p-4 text-center">
                        <div className="text-xl font-bold text-gray-900">{selectedWorkspace.contact_count}</div>
                        <div className="text-xs text-gray-500">Contacts</div>
                      </div>
                      <div className="p-4 text-center">
                        <div className="text-xl font-bold text-gray-900">{selectedWorkspace.task_count || 0}</div>
                        <div className="text-xs text-gray-500">Tasks</div>
                      </div>
                      <div className="p-4 text-center">
                        <div className="text-sm font-medium text-gray-600">{formatDate(selectedWorkspace.created_at)}</div>
                        <div className="text-xs text-gray-500">Created</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Owner</span>
                          <a href={`mailto:${selectedWorkspace.owner_email}`} className="text-blue-600 hover:underline">{selectedWorkspace.owner_email}</a>
                        </div>
                        <div className="flex justify-between"><span className="text-gray-500">Industry</span><span className="text-gray-900 capitalize">{selectedWorkspace.industry?.replace(/-/g, " ") || "—"}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="text-gray-900 capitalize">{selectedWorkspace.plan}</span></div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Stripe Customer</span>
                          {selectedWorkspace.stripe_customer_id ? (
                            <a href={`https://dashboard.stripe.com/customers/${selectedWorkspace.stripe_customer_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{selectedWorkspace.stripe_customer_id}</a>
                          ) : (
                            <span className="text-gray-900 font-mono text-xs">—</span>
                          )}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Subscription</span>
                          {selectedWorkspace.stripe_subscription_id ? (
                            <a href={`https://dashboard.stripe.com/subscriptions/${selectedWorkspace.stripe_subscription_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{selectedWorkspace.stripe_subscription_id}</a>
                          ) : (
                            <span className="text-gray-900 font-mono text-xs">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
                      <div className="space-y-2">
                        <a
                          href={`mailto:${selectedWorkspace.owner_email}?subject=WorkChores — ${encodeURIComponent(selectedWorkspace.name)}`}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4 text-gray-400" /> Email owner
                          <span className="ml-auto text-[10px] text-gray-400 truncate max-w-[180px]">{selectedWorkspace.owner_email}</span>
                        </a>
                        {accessRequestStatus === "approved" ? (
                          <>
                            <button
                              onClick={() => openApprovedWorkspace(selectedWorkspace.id)}
                              className="w-full text-left px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-2 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Open workspace
                              <ExternalLink className="w-3 h-3 text-emerald-400 ml-auto" />
                            </button>
                            <div className="px-3 py-2 text-[11px] rounded-lg bg-emerald-50 text-emerald-600">
                              {accessRequestMsg}
                            </div>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => requestWorkspaceAccess(selectedWorkspace.id)}
                              disabled={accessRequestStatus === "sending" || accessRequestStatus === "pending"}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                              {accessRequestStatus === "sending" ? (
                                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                              ) : accessRequestStatus === "pending" ? (
                                <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                              ) : (
                                <Shield className="w-4 h-4 text-gray-400" />
                              )}
                              {accessRequestStatus === "idle" || accessRequestStatus === "error"
                                ? "View as workspace"
                                : accessRequestStatus === "sending"
                                ? "Sending request..."
                                : "Waiting for owner..."}
                              {(accessRequestStatus === "idle" || accessRequestStatus === "error") && <Lock className="w-3 h-3 text-gray-300 ml-auto" />}
                            </button>
                            {accessRequestMsg && (
                              <div className={`px-3 py-2 text-[11px] rounded-lg ${
                                accessRequestStatus === "error" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                              }`}>
                                {accessRequestMsg}
                              </div>
                            )}
                          </>
                        )}
                        {selectedWorkspace.stripe_customer_id ? (
                          <a
                            href={`https://dashboard.stripe.com/customers/${selectedWorkspace.stripe_customer_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4 text-gray-400" /> View in Stripe
                            <span className="ml-auto text-[10px] text-gray-400 font-mono">{selectedWorkspace.stripe_customer_id.slice(0, 18)}...</span>
                          </a>
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-400 rounded-lg flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-gray-300" /> No Stripe connection
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Workspace list */
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 max-w-md">
                      <Search className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={workspaceSearch}
                        onChange={(e) => setWorkspaceSearch(e.target.value)}
                        placeholder="Search workspaces..."
                        className="text-sm bg-transparent outline-none flex-1 text-gray-800 placeholder:text-gray-400"
                      />
                      {workspaceSearch && <button onClick={() => setWorkspaceSearch("")} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
                    </div>
                    <div className="text-xs text-gray-400">{filteredWorkspaces.length} workspaces</div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Workspace</th>
                            <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Industry</th>
                            <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-500">Plan</th>
                            <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-500">Members</th>
                            <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-500">Contacts</th>
                            <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-500">Tasks</th>
                            <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredWorkspaces.map((w) => (
                            <tr key={w.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedWorkspace(w)}>
                              <td className="px-5 py-3">
                                <div className="font-medium text-gray-900">{w.name}</div>
                                <div className="text-xs text-gray-400">{w.owner_email}</div>
                              </td>
                              <td className="px-5 py-3 text-gray-500 capitalize text-xs">{w.industry?.replace(/-/g, " ") || "—"}</td>
                              <td className="px-5 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${w.plan === "business" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                  {w.plan === "business" ? "Business" : "Free"}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-center">{w.member_count}</td>
                              <td className="px-5 py-3 text-center">{w.contact_count}</td>
                              <td className="px-5 py-3 text-center">{w.task_count || 0}</td>
                              <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(w.created_at)}</td>
                            </tr>
                          ))}
                          {filteredWorkspaces.length === 0 && (
                            <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No workspaces found</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============================== PEOPLE ============================== */}
          {section === "people" && (
            <div className="p-4 sm:p-6 max-w-7xl space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={Users} iconBg="bg-gray-100" iconColor="text-gray-600" value={people.length} label="Total People" />
                <KpiCard icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" value={userCount} label="Users" />
                <KpiCard icon={Mail} iconBg="bg-violet-50" iconColor="text-violet-600" value={subscriberCount} label="Subscribers" />
                <KpiCard icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" value={people.filter((p) => p.type === "both").length} label="User + Subscriber" />
              </div>

              {/* Search + filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 max-w-md min-w-[200px]">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={peopleSearch}
                    onChange={(e) => setPeopleSearch(e.target.value)}
                    placeholder="Search by name, email, workspace..."
                    className="text-sm bg-transparent outline-none flex-1 text-gray-800 placeholder:text-gray-400"
                  />
                  {peopleSearch && <button onClick={() => setPeopleSearch("")} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
                </div>
                <div className="flex gap-1">
                  {(["all", "user", "subscriber", "both"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setPeopleFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        peopleFilter === f ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700 bg-gray-100"
                      }`}
                    >
                      {f === "all" ? "All" : f === "user" ? "Users" : f === "subscriber" ? "Subscribers" : "Both"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Person</th>
                        <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-500">Type</th>
                        <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Workspace</th>
                        <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Role</th>
                        <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPeople.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            <div className="font-medium text-gray-900">{p.name || "—"}</div>
                            <div className="text-xs text-gray-400">{p.email}</div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            {p.type === "both" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">User + Subscriber</span>
                            ) : p.type === "user" ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">User</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-100 text-violet-700">Subscriber</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-xs">{p.workspace_name || "—"}</td>
                          <td className="px-5 py-3 text-gray-500 text-xs capitalize">{p.role || "—"}</td>
                          <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(p.created_at)}</td>
                        </tr>
                      ))}
                      {filteredPeople.length === 0 && (
                        <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">No people found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================== ACTIVITY FEED ============================== */}
          {section === "activity" && (
            <div className="p-4 sm:p-6 max-w-7xl space-y-6">
              {/* Activity Chart */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Activity Over Time</h3>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => { setAnalyticsRange("30d"); loadAnalytics("30d"); }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${analyticsRange === "30d" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Last 30 Days
                    </button>
                    <button
                      onClick={() => { setAnalyticsRange("12m"); loadAnalytics("12m"); }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${analyticsRange === "12m" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Last 12 Months
                    </button>
                  </div>
                </div>
                <div className="p-4" style={{ height: 320 }}>
                  {analyticsLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                  ) : analyticsData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400">No data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <defs>
                          <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorDemos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} interval={analyticsRange === "30d" ? 4 : 0} />
                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }}
                          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                        <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#6366f1" fill="url(#colorVisitors)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="demos" name="Demos" stroke="#3b82f6" fill="url(#colorDemos)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="signups" name="Signups" stroke="#10b981" fill="url(#colorSignups)" strokeWidth={2} dot={false} />
                        <Area type="monotone" dataKey="conversions" name="Conversions" stroke="#f59e0b" fill="url(#colorConversions)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Demo KPIs */}
              {(() => {
                const total = demoSessions.length;
                const clickedSignup = demoSessions.filter((d) => d.clicked_signup).length;
                const converted = demoSessions.filter((d) => d.converted_to_user).length;
                const avgDuration = total > 0 ? Math.floor(demoSessions.reduce((sum, d) => sum + d.duration_seconds, 0) / total) : 0;
                const convRate = total > 0 ? ((converted / total) * 100).toFixed(1) : "0";
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <KpiCard icon={Eye} iconBg="bg-gray-100" iconColor="text-gray-600" value={total} label="Total Demos" />
                    <KpiCard icon={UserPlus} iconBg="bg-blue-50" iconColor="text-blue-600" value={clickedSignup} label="Clicked Signup" />
                    <KpiCard icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" value={converted} label="Converted" />
                    <KpiCard icon={TrendingUp} iconBg="bg-violet-50" iconColor="text-violet-600" value={`${convRate}%`} label="Conv. Rate" prefix="" />
                    <KpiCard icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" value={`${Math.floor(avgDuration / 60)}m`} label="Avg Duration" prefix="" />
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
                      demoFilter === f ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700 bg-gray-100"
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
                              <td className="px-5 py-3 text-gray-500 capitalize text-xs">{d.industry?.replace(/-/g, " ") || "—"}</td>
                              <td className="px-5 py-3 text-center text-gray-600">{mins}m {secs}s</td>
                              <td className="px-5 py-3 text-center text-xs text-gray-500">{d.pages_visited?.length || 0}</td>
                              <td className="px-5 py-3 text-center text-xs text-gray-500">{d.features_used?.length || 0}</td>
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
                        <tr><td colSpan={7} className="px-5 py-8 text-center text-gray-400">No demo sessions recorded</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================== SYSTEM HEALTH ============================== */}
          {section === "health" && (() => {
            const statusColors: Record<string, { dot: string; badge: string; text: string }> = {
              healthy: { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700", text: "Healthy" },
              warning: { dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700", text: "Warning" },
              degraded: { dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700", text: "Degraded" },
              down: { dot: "bg-red-500", badge: "bg-red-100 text-red-700", text: "Down" },
            };
            const healthCategories = [...new Set(healthFindings.map(f => f.category))];
            const issueCount = healthFindings.filter(f => f.status !== "healthy").length;

            return (
              <div className="p-4 sm:p-6 max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">System Health</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {lastHealthTime
                        ? `Last check: ${new Date(lastHealthTime).toLocaleString()}`
                        : "No checks run yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setHistoryExpanded((p) => ({ ...p, health_check: !p.health_check })); if (!(auditHistory["health_check"] || []).length) loadAuditHistory("health_check"); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{historyExpanded["health_check"] ? "Hide History" : "History"}</button>
                    <button
                    onClick={runHealthCheck}
                    disabled={healthChecking}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-60"
                  >
                    {healthChecking ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...</>
                    ) : (
                      <><Activity className="w-3.5 h-3.5" /> Run Check</>
                    )}
                  </button>
                  </div>
                </div>

                {/* Summary card */}
                {healthSummary && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${healthSummary.down > 0 ? "bg-red-500 animate-pulse" : healthSummary.degraded > 0 ? "bg-orange-500 animate-pulse" : healthSummary.warning > 0 ? "bg-amber-500" : "bg-emerald-500"}`} />
                        <span className="text-sm font-medium text-gray-900">
                          {healthSummary.down > 0 ? "Services Down" : healthSummary.degraded > 0 ? "Performance Degraded" : healthSummary.warning > 0 ? "Warnings Detected" : "All Systems Operational"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {issueCount === 0 ? "No issues" : `${issueCount} issue${issueCount !== 1 ? "s" : ""}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {[
                        { label: "Checks", count: healthSummary.total, color: "text-gray-900" },
                        { label: "Healthy", count: healthSummary.healthy, color: healthSummary.healthy > 0 ? "text-emerald-600" : "text-gray-300" },
                        { label: "Warning", count: healthSummary.warning, color: healthSummary.warning > 0 ? "text-amber-600" : "text-gray-300" },
                        { label: "Degraded", count: healthSummary.degraded, color: healthSummary.degraded > 0 ? "text-orange-600" : "text-gray-300" },
                        { label: "Down", count: healthSummary.down, color: healthSummary.down > 0 ? "text-red-600" : "text-gray-300" },
                      ].map(c => (
                        <div key={c.label} className="text-center">
                          <div className={`text-xl font-bold ${c.color}`}>{c.count}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{c.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {healthFindings.length === 0 && !healthChecking && (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Server className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Run your first health check</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
                      Tests live connectivity to Supabase, Stripe, and SMTP. Checks database integrity, growth trends, and proactively flags potential issues.
                    </p>
                    <button onClick={runHealthCheck} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                      <Activity className="w-3.5 h-3.5" /> Run Check
                    </button>
                  </div>
                )}

                {/* Loading state */}
                {healthChecking && healthFindings.length === 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Loader2 className="w-7 h-7 text-gray-400 animate-spin mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Checking your system...</h3>
                    <p className="text-xs text-gray-500">Testing services, database, endpoints, and growth trends...</p>
                  </div>
                )}

                {/* Findings grouped by category */}
                {healthCategories.map(cat => {
                  const catFindings = healthFindings.filter(f => f.category === cat);
                  const catIssues = catFindings.filter(f => f.status !== "healthy").length;
                  return (
                    <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{cat}</h3>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{catFindings.length}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {catIssues === 0 ? "All healthy" : `${catIssues} issue${catIssues !== 1 ? "s" : ""}`}
                        </span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {catFindings.map(f => {
                          const colors = statusColors[f.status];
                          return (
                            <div key={f.id} className="px-5 py-3 flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${colors.dot} ${f.status === "down" ? "animate-pulse" : ""}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-sm font-medium text-gray-900 truncate">{f.title}</span>
                                </div>
                                <p className="text-xs text-gray-500">{f.description}</p>
                              </div>
                              {f.metric && (
                                <span className="text-xs font-mono text-gray-400 shrink-0">{f.metric}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              {/* Health History */}
                {historyExpanded["health_check"] && (() => {
                  const history = auditHistory["health_check"] || [];
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Check History</h3></div>
                      {history.length === 0 ? (<div className="p-6 text-center text-xs text-gray-400">No check history yet</div>) : (
                        <div className="divide-y divide-gray-50">
                          {history.map((run: AuditHistoryRun) => { const s = run.summary as Record<string, number>; return (
                            <div key={run.id} className="px-5 py-3 flex items-center justify-between">
                              <div><div className="text-xs font-medium text-gray-900">{new Date(run.created_at).toLocaleString()}</div><div className="text-[10px] text-gray-400 mt-0.5">{run.trigger === "cron" ? "Automated" : "Manual"} · {run.duration_ms}ms</div></div>
                              <div className="flex items-center gap-3">
                                {(s.down || 0) > 0 && <span className="text-[10px] font-semibold text-red-600">{s.down} down</span>}
                                {(s.warning || 0) > 0 && <span className="text-[10px] font-semibold text-amber-600">{s.warning} warn</span>}
                                <div className="text-right"><div className="text-sm font-bold text-gray-900">{s.healthy || 0}/{s.total || 0}</div><div className="text-[10px] text-gray-400">healthy</div></div>
                              </div>
                            </div>
                          ); })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {/* ============================== FEATURE USAGE ============================== */}
          {section === "usage" && (() => {
            // Static UI inventory — all trackable features in the app
            const uiInventory: { category: string; items: { event: string; label: string; location: string }[] }[] = [
              { category: "Navigation", items: [
                { event: "nav.dashboard", label: "Dashboard", location: "Sidebar" },
                { event: "nav.contacts", label: "Contacts", location: "Sidebar" },
                { event: "nav.pipeline", label: "Pipeline", location: "Sidebar" },
                { event: "nav.tasks", label: "Tasks", location: "Sidebar" },
                { event: "nav.calendar", label: "Calendar", location: "Sidebar" },
                { event: "nav.activity", label: "Activity Feed", location: "Sidebar" },
                { event: "nav.recommendations", label: "Recommendations", location: "Sidebar" },
                { event: "nav.reports", label: "Reports", location: "Sidebar" },
                { event: "nav.settings", label: "Settings", location: "Sidebar" },
                { event: "nav.import", label: "Import", location: "Sidebar" },
                { event: "nav.export", label: "Export", location: "Sidebar" },
              ]},
              { category: "Contacts", items: [
                { event: "contact.created", label: "Create Contact", location: "New Contact Modal" },
                { event: "contact.searched", label: "Search Contacts", location: "Contacts View" },
                { event: "contact.detail_viewed", label: "View Contact Detail", location: "Contact Card" },
                { event: "contact.email_sent", label: "Send Email", location: "Contact Detail" },
                { event: "contact.touchpoint_added", label: "Log Touchpoint", location: "Contact Detail" },
                { event: "contact.stage_changed", label: "Change Stage", location: "Contact Detail" },
                { event: "contact.bulk_action", label: "Bulk Action", location: "Contacts View" },
              ]},
              { category: "Tasks", items: [
                { event: "task.created", label: "Create Task", location: "New Task Modal" },
                { event: "task.completed", label: "Complete Task", location: "Tasks View" },
              ]},
              { category: "Pipeline", items: [
                { event: "pipeline.viewed", label: "View Pipeline", location: "Pipeline View" },
                { event: "pipeline.card_moved", label: "Move Deal", location: "Pipeline Board" },
              ]},
              { category: "Calendar", items: [
                { event: "calendar.viewed", label: "View Calendar", location: "Calendar View" },
                { event: "calendar.navigated", label: "Navigate Months", location: "Calendar View" },
              ]},
              { category: "Reports & Recommendations", items: [
                { event: "reports.viewed", label: "View Reports", location: "Reports View" },
                { event: "recommendations.viewed", label: "View Recommendations", location: "Recommendations View" },
              ]},
              { category: "Data", items: [
                { event: "import.started", label: "Start Import", location: "Import Wizard" },
                { event: "import.completed", label: "Complete Import", location: "Import Wizard" },
                { event: "export.downloaded", label: "Download Export", location: "Export View" },
              ]},
              { category: "Settings", items: [
                { event: "settings.tab_changed", label: "Switch Settings Tab", location: "Settings View" },
                { event: "settings.member_invited", label: "Invite Team Member", location: "Settings > Team" },
                { event: "settings.email_template_saved", label: "Save Email Template", location: "Settings > Templates" },
              ]},
              { category: "Support", items: [
                { event: "support.opened", label: "Open Support Chat", location: "Floating Widget" },
                { event: "support.message_sent", label: "Send Support Message", location: "Chat Widget" },
              ]},
            ];

            // Build lookup of event counts
            const eventCounts: Record<string, number> = {};
            if (usageData?.topEvents) {
              for (const e of usageData.topEvents) {
                eventCounts[e.name] = e.count;
              }
            }

            const maxCount = Math.max(...Object.values(eventCounts), 1);

            return (
              <div className="p-4 sm:p-6 max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Feature Usage</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Track which features your users actually use</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {[7, 30, 90].map(d => (
                      <button
                        key={d}
                        onClick={() => { setUsagePeriod(d as 7 | 30 | 90); loadFeatureUsage(d); }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${usagePeriod === d ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}
                      >
                        {d}d
                      </button>
                    ))}
                    <button
                      onClick={() => loadFeatureUsage()}
                      disabled={usageLoading}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-60 ml-1"
                    >
                      {usageLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Load
                    </button>
                  </div>
                </div>

                {/* Summary stats */}
                {usageData && (() => {
                  const priorEvents = usageData.priorPeriodEvents || 0;
                  const priorUsers = usageData.priorPeriodUsers || 0;
                  const eventsDelta = priorEvents > 0 ? Math.round(((usageData.totalEvents - priorEvents) / priorEvents) * 100) : usageData.totalEvents > 0 ? 100 : 0;
                  const usersDelta = priorUsers > 0 ? Math.round(((usageData.uniqueUsers - priorUsers) / priorUsers) * 100) : usageData.uniqueUsers > 0 ? 100 : 0;
                  return (<>
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: "Total Events", value: usageData.totalEvents.toLocaleString(), color: "text-gray-900", delta: eventsDelta, prior: priorEvents },
                        { label: "Unique Features", value: String(usageData.uniqueEvents), color: "text-blue-600", delta: null, prior: null },
                        { label: "Active Users", value: String(usageData.uniqueUsers), color: "text-emerald-600", delta: usersDelta, prior: priorUsers },
                        { label: "Period", value: `${usageData.period} days`, color: "text-gray-500", delta: null, prior: null },
                      ].map(s => (
                        <div key={s.label} className="text-center">
                          <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</div>
                          {s.delta !== null && s.prior !== null && (
                            <div className={`text-[10px] font-semibold mt-1 ${s.delta > 0 ? "text-emerald-600" : s.delta < 0 ? "text-red-600" : "text-gray-400"}`}>
                              {s.delta > 0 ? "+" : ""}{s.delta}% vs prior {usageData.period}d
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                {/* Daily activity sparkline */}
                {usageData.dailyActivity.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Daily Activity</h3>
                    <div className="flex items-end gap-px h-16">
                      {usageData.dailyActivity.map((d, i) => {
                        const maxDay = Math.max(...usageData.dailyActivity.map(x => x.count), 1);
                        const height = Math.max((d.count / maxDay) * 100, d.count > 0 ? 4 : 1);
                        return (
                          <div key={i} className="flex-1 group relative" title={`${d.date}: ${d.count} events`}>
                            <div
                              className={`w-full rounded-sm transition-colors ${d.count > 0 ? "bg-gray-900 hover:bg-gray-700" : "bg-gray-100"}`}
                              style={{ height: `${height}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] text-gray-400">{usageData.dailyActivity[0]?.date}</span>
                      <span className="text-[10px] text-gray-400">{usageData.dailyActivity[usageData.dailyActivity.length - 1]?.date}</span>
                    </div>
                  </div>
                )}
                </>);
                })()}

                {/* Empty state */}
                {!usageData && !usageLoading && (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Zap className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Load feature usage data</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
                      See which features your users actually use. Identify underused features to improve or remove, and popular ones to double down on.
                    </p>
                    <button onClick={() => loadFeatureUsage()} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                      <Zap className="w-3.5 h-3.5" /> Load Data
                    </button>
                  </div>
                )}

                {/* Loading */}
                {usageLoading && !usageData && (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Loader2 className="w-7 h-7 text-gray-400 animate-spin mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900">Loading usage data...</h3>
                  </div>
                )}

                {/* UI Inventory with usage data */}
                {uiInventory.map(cat => {
                  const catTotal = cat.items.reduce((sum, it) => sum + (eventCounts[it.event] || 0), 0);
                  return (
                    <div key={cat.category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{cat.category}</h3>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{cat.items.length}</span>
                        </div>
                        {usageData && (
                          <span className="text-[10px] text-gray-400 font-mono">{catTotal.toLocaleString()} events</span>
                        )}
                      </div>
                      <div className="divide-y divide-gray-50">
                        {cat.items.map(item => {
                          const count = eventCounts[item.event] || 0;
                          const barWidth = usageData ? Math.max((count / maxCount) * 100, count > 0 ? 2 : 0) : 0;
                          return (
                            <div key={item.event} className="px-5 py-2.5 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">{item.label}</span>
                                  <span className="text-[10px] text-gray-400">{item.location}</span>
                                </div>
                                <span className="text-[10px] font-mono text-gray-300">{item.event}</span>
                              </div>
                              {usageData && (
                                <div className="flex items-center gap-3 shrink-0 w-40">
                                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${count > 0 ? "bg-gray-900" : ""}`}
                                      style={{ width: `${barWidth}%` }}
                                    />
                                  </div>
                                  <span className={`text-xs font-mono w-10 text-right ${count > 0 ? "text-gray-700" : "text-gray-300"}`}>
                                    {count > 0 ? count.toLocaleString() : "—"}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ============================== ANNOUNCEMENTS ============================== */}
          {section === "announcements" && (
            <div className="p-4 sm:p-6 max-w-5xl space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Announcements & Notifications</h2>
                <button
                  onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New Announcement
                </button>
              </div>

              {showAnnouncementForm && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Title</label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      placeholder="Announcement title..."
                      className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 text-gray-800 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Message</label>
                    <textarea
                      value={announcementForm.message}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                      placeholder="Announcement message..."
                      className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-gray-900/20 text-gray-800 placeholder:text-gray-400 resize-none min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Type</label>
                    <div className="flex gap-2">
                      {(["info", "warning", "success", "update"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setAnnouncementForm({ ...announcementForm, type: t })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                            announcementForm.type === t
                              ? t === "info" ? "bg-blue-100 text-blue-700"
                                : t === "warning" ? "bg-amber-100 text-amber-700"
                                : t === "success" ? "bg-emerald-100 text-emerald-700"
                                : "bg-violet-100 text-violet-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={createAnnouncement} className="px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                      Publish
                    </button>
                    <button onClick={() => setShowAnnouncementForm(false)} className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Existing announcements */}
              <div className="space-y-3">
                {announcements.length === 0 && !showAnnouncementForm && (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <Megaphone className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No announcements yet</p>
                    <p className="text-xs text-gray-400 mt-1">Create one to notify all users</p>
                  </div>
                )}
                {announcements.map((a) => {
                  const typeColors = {
                    info: "border-l-blue-500 bg-blue-50/30",
                    warning: "border-l-amber-500 bg-amber-50/30",
                    success: "border-l-emerald-500 bg-emerald-50/30",
                    update: "border-l-violet-500 bg-violet-50/30",
                  };
                  return (
                    <div key={a.id} className={`bg-white rounded-xl border border-gray-200 border-l-4 ${typeColors[a.type]} overflow-hidden`}>
                      <div className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-gray-900">{a.title}</h3>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase ${
                                a.type === "info" ? "bg-blue-100 text-blue-600"
                                  : a.type === "warning" ? "bg-amber-100 text-amber-600"
                                  : a.type === "success" ? "bg-emerald-100 text-emerald-600"
                                  : "bg-violet-100 text-violet-600"
                              }`}>
                                {a.type}
                              </span>
                              {!a.active && <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-400">INACTIVE</span>}
                            </div>
                            <p className="text-sm text-gray-600">{a.message}</p>
                            <div className="text-[10px] text-gray-400 mt-2">{formatDate(a.created_at)}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => toggleAnnouncement(a.id, !a.active)} className={`p-1.5 rounded-lg text-xs transition-colors ${a.active ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"}`} title={a.active ? "Deactivate" : "Activate"}>
                              {a.active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => deleteAnnouncement(a.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================== SECURITY AUDIT ============================== */}
          {section === "security" && (() => {
            const items = scanFindings;
            const totalCount = items.length;
            const completedCount = items.filter((i) => securityChecklist[i.id]).length;

            const severityColors: Record<string, { bg: string; text: string; dot: string }> = {
              critical: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
              high: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
              medium: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
              low: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
            };

            // Group by category
            const categories = [...new Set(items.map((i) => i.category))];

            return (
              <div className="p-4 sm:p-6 max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Security Audit</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {lastScanTime
                        ? `Last scan: ${new Date(lastScanTime).toLocaleString()}`
                        : "No scans run yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setHistoryExpanded((p) => ({ ...p, security_scan: !p.security_scan })); if (!(auditHistory["security_scan"] || []).length) loadAuditHistory("security_scan"); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{historyExpanded["security_scan"] ? "Hide History" : "History"}</button>
                    <button
                      onClick={runSecurityScan}
                      disabled={scanning}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {scanning ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...</>
                      ) : (
                        <><Shield className="w-3.5 h-3.5" /> Run Scan</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Summary row */}
                {scanSummary && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${scanSummary.critical > 0 ? "bg-red-500 animate-pulse" : scanSummary.high > 0 ? "bg-amber-500" : scanSummary.medium > 0 ? "bg-blue-500" : "bg-emerald-500"}`} />
                        <span className="text-sm font-medium text-gray-900">
                          {scanSummary.critical > 0 ? "Critical Issues Found" : scanSummary.high > 0 ? "High Priority Issues" : scanSummary.medium > 0 ? "Minor Issues Detected" : "All Checks Passed"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{completedCount}/{totalCount} resolved</span>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {[
                        { label: "Total", count: scanSummary.total, color: "text-gray-900" },
                        { label: "Critical", count: scanSummary.critical, color: scanSummary.critical > 0 ? "text-red-600" : "text-gray-300" },
                        { label: "High", count: scanSummary.high, color: scanSummary.high > 0 ? "text-amber-600" : "text-gray-300" },
                        { label: "Medium", count: scanSummary.medium, color: scanSummary.medium > 0 ? "text-blue-600" : "text-gray-300" },
                        { label: "Low", count: scanSummary.low, color: scanSummary.low > 0 ? "text-gray-500" : "text-gray-300" },
                      ].map((c) => (
                        <div key={c.label} className="text-center">
                          <div className={`text-xl font-bold ${c.color}`}>{c.count}</div>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{c.label}</div>
                        </div>
                      ))}
                    </div>
                    {totalCount > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${completedCount === totalCount ? "bg-emerald-500" : "bg-gray-900"}`}
                            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty state */}
                {totalCount === 0 && !scanning && (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Shield className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Run your first security scan</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
                      Tests your live environment for misconfigurations, auth bypasses, missing rate limits, and input validation issues.
                    </p>
                    <button onClick={runSecurityScan} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors">
                      <Shield className="w-3.5 h-3.5" /> Run Scan
                    </button>
                  </div>
                )}

                {/* Scanning state */}
                {scanning && totalCount === 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Loader2 className="w-7 h-7 text-gray-400 animate-spin mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Scanning your system...</h3>
                    <p className="text-xs text-gray-500">Checking environment, authentication, endpoints, headers, and database...</p>
                  </div>
                )}

                {/* Findings by category */}
                {categories.map((category) => {
                  const categoryItems = items.filter((i) => i.category === category);
                  const categoryCompleted = categoryItems.filter((i) => securityChecklist[i.id]).length;

                  return (
                    <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{category}</h3>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{categoryItems.length}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">{categoryCompleted}/{categoryItems.length} resolved</span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {categoryItems.map((item) => {
                          const checked = securityChecklist[item.id] || false;
                          const colors = severityColors[item.severity] || severityColors.low;
                          return (
                            <div
                              key={item.id}
                              onClick={() => toggleSecurityItem(item.id)}
                              className={`px-5 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors ${checked ? "opacity-40" : ""}`}
                            >
                              <div className={`mt-0.5 w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`} style={{ width: 18, height: 18 }}>
                                {checked && (
                                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                    {item.severity.toUpperCase()}
                                  </span>
                                  <span className={`text-sm font-medium ${checked ? "line-through text-gray-400" : "text-gray-900"}`}>{item.title}</span>
                                </div>
                                <p className={`text-xs mt-0.5 leading-relaxed ${checked ? "text-gray-300" : "text-gray-500"}`}>{item.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Security History */}
                {historyExpanded["security_scan"] && (() => {
                  const history = auditHistory["security_scan"] || [];
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Scan History</h3></div>
                      {history.length === 0 ? (<div className="p-6 text-center text-xs text-gray-400">No scan history yet</div>) : (
                        <div className="divide-y divide-gray-50">
                          {history.map((run: AuditHistoryRun, i: number) => { const prev = history[i + 1]; const totalNow = run.summary?.total || 0; const totalPrev = prev ? (prev.summary?.total || 0) : null; const trend = totalPrev !== null ? totalNow - totalPrev : null; return (
                            <div key={run.id} className="px-5 py-3 flex items-center justify-between">
                              <div><div className="text-xs font-medium text-gray-900">{new Date(run.created_at).toLocaleString()}</div><div className="text-[10px] text-gray-400 mt-0.5">{run.trigger === "cron" ? "Automated" : "Manual"} · {run.duration_ms}ms</div></div>
                              <div className="flex items-center gap-3">
                                {trend !== null && trend !== 0 && (<span className={`text-[10px] font-semibold ${trend < 0 ? "text-emerald-600" : "text-red-600"}`}>{trend > 0 ? "+" : ""}{trend}</span>)}
                                <div className="text-right"><div className="text-sm font-bold text-gray-900">{totalNow}</div><div className="text-[10px] text-gray-400">finding(s)</div></div>
                              </div>
                            </div>
                          ); })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })()}

          {section === "sales" && (() => {
            const salesData: Record<string, { label: string; color: string; bg: string; oneLiner: string; pitch: string; usps: { title: string; desc: string }[]; objections: { q: string; a: string }[]; script: { tag: string; tagColor: string; tagBg: string; text: string }[]; targets: string[] }> = {
              general: {
                label: "General",
                color: "text-gray-700",
                bg: "bg-gray-100",
                oneLiner: "WorkChores is a dead-simple CRM that sets up in 60 seconds, customized to your industry — no training required.",
                pitch: "Most CRMs are built for enterprises and take weeks to set up. WorkChores is built for small teams who just need to track deals, follow up with contacts, and close more business. Pick your industry, and you get a fully customized CRM with pipeline stages, tracking fields, and sample data in under a minute. No spreadsheets, no bloated software — just the tools you actually use.",
                usps: [
                  { title: "60-Second Setup", desc: "Pick your industry → get a fully configured CRM instantly. No complex onboarding." },
                  { title: "Industry Templates", desc: "Pre-built for B2B Sales, SaaS, Real Estate, Recruiting, Consulting, and Home Services." },
                  { title: "No Training Needed", desc: "Click any field to edit. Auto-saves. If you can use a spreadsheet, you can use WorkChores." },
                  { title: "Built for Small Teams", desc: "Not another Salesforce. No 50-page setup guide. Just the features you need." },
                  { title: "Affordable", desc: "Free tier available. Pro plans that don't break the bank. No per-seat surprises." },
                  { title: "Pipeline + Contacts + Tasks", desc: "Everything in one place. Track deals, log calls, assign tasks, attach files." },
                ],
                objections: [
                  { q: "\"We already use spreadsheets.\"", a: "That's exactly who we built this for. WorkChores feels like a spreadsheet but gives you pipeline views, activity tracking, and auto-saves — things spreadsheets can't do." },
                  { q: "\"We tried a CRM before and it was too complicated.\"", a: "WorkChores sets up in 60 seconds. No training. No manual. Just click and edit — it works like you'd expect." },
                  { q: "\"Is it secure?\"", a: "Built on enterprise-grade infrastructure (Supabase/Postgres). Row-level security, encrypted connections, SOC 2-ready architecture." },
                  { q: "\"Can we customize it?\"", a: "Absolutely. Custom pipeline stages, custom tracking fields, tags, addresses, notes — all configurable in Settings after setup." },
                ],
                script: [
                  { tag: "Opening", tagColor: "text-blue-700", tagBg: "bg-blue-100", text: "\"Hey [Name], quick question — how are you currently tracking your leads and deals? Spreadsheets? Sticky notes? An old CRM you hate?\"" },
                  { tag: "Pain", tagColor: "text-purple-700", tagBg: "bg-purple-100", text: "\"Most small teams I talk to either have no system — so deals fall through the cracks — or they tried Salesforce/HubSpot and got overwhelmed. Sound familiar?\"" },
                  { tag: "Solution", tagColor: "text-emerald-700", tagBg: "bg-emerald-100", text: "\"WorkChores is a CRM built specifically for teams like yours. Pick your industry, and in 60 seconds you have a fully set up CRM. No training, no setup calls, no 30-day onboarding.\"" },
                  { tag: "Demo", tagColor: "text-amber-700", tagBg: "bg-amber-100", text: "\"Want to see it? Go to workchores.com right now — there's a live demo you can play with. No signup needed.\"" },
                  { tag: "Close", tagColor: "text-rose-700", tagBg: "bg-rose-100", text: "\"The free plan gets you started. When you're ready, Pro is affordable — no per-seat fees. Want to give it a shot?\"" },
                ],
                targets: ["Solo entrepreneurs", "Small sales teams (2-15)", "Agencies", "Anyone tired of spreadsheets"],
              },
              b2b: {
                label: "B2B Sales",
                color: "text-blue-700",
                bg: "bg-blue-100",
                oneLiner: "WorkChores gives B2B sales teams a CRM that's set up in 60 seconds with Lead → Qualified → Proposal → Negotiation → Closed pipeline — ready to sell today.",
                pitch: "Your sales reps shouldn't spend hours configuring a CRM. WorkChores comes pre-built for B2B sales with industry, employee count, and lead source tracking. Pipeline stages are ready out of the box. Click any field to edit, auto-saves on blur. Your reps will actually use this one.",
                usps: [
                  { title: "B2B Pipeline Ready", desc: "Lead → Qualified → Proposal → Negotiation → Closed Won/Lost. Pre-configured and customizable." },
                  { title: "Track What Matters", desc: "Industry, employee count, lead source — all built in. Add custom fields in seconds." },
                  { title: "Deal Value Tracking", desc: "See your total pipeline value, filter by stage, sort by deal size. Real visibility into revenue." },
                  { title: "Activity Logging", desc: "Log calls, emails, meetings. Never lose track of where a deal stands." },
                ],
                objections: [
                  { q: "\"We need Salesforce-level features.\"", a: "Do you though? Most B2B teams use 10% of Salesforce. WorkChores gives you the 10% that actually closes deals — pipeline, contacts, tasks, activity tracking." },
                  { q: "\"Our sales process is complex.\"", a: "You can customize every stage, add unlimited custom fields, and configure it exactly to your workflow. But it starts simple so your team actually adopts it." },
                  { q: "\"We need integrations.\"", a: "Email integration is built in. For everything else — we're building integrations based on customer requests. What do you need most?" },
                ],
                script: [
                  { tag: "Opening", tagColor: "text-blue-700", tagBg: "bg-blue-100", text: "\"Hey [Name], I saw you're running a B2B sales team. Quick question — what are you using to track your pipeline right now?\"" },
                  { tag: "Pain", tagColor: "text-purple-700", tagBg: "bg-purple-100", text: "\"Most B2B teams I talk to are either drowning in spreadsheets or paying $50/seat for a CRM their reps refuse to update. Which camp are you in?\"" },
                  { tag: "Solution", tagColor: "text-emerald-700", tagBg: "bg-emerald-100", text: "\"WorkChores comes pre-configured for B2B sales — Lead, Qualified, Proposal, Negotiation, Closed. Industry tracking, lead source, deal values — all ready. Your reps can start logging deals in literally 60 seconds.\"" },
                  { tag: "Demo", tagColor: "text-amber-700", tagBg: "bg-amber-100", text: "\"Go to workchores.com, pick B2B Sales, and you'll see a full working CRM with sample data. Play with it — no signup.\"" },
                  { tag: "Close", tagColor: "text-rose-700", tagBg: "bg-rose-100", text: "\"Free plan for small teams. Pro when you're ready. No per-seat pricing games. Want to set it up for your team?\"" },
                ],
                targets: ["B2B sales teams", "Account executives", "SDR/BDR teams", "Sales managers", "Startups with outbound sales"],
              },
              saas: {
                label: "SaaS",
                color: "text-violet-700",
                bg: "bg-violet-100",
                oneLiner: "WorkChores helps SaaS companies track trials, demos, and MRR in a CRM that's configured for software sales in 60 seconds.",
                pitch: "SaaS sales isn't like traditional B2B. You need to track MRR, active users, plan types, and trial-to-paid conversions. WorkChores comes pre-built with Awareness → Interest → Demo → Trial → Negotiation → Won pipeline and SaaS-specific fields. No more hacking HubSpot to fit your model.",
                usps: [
                  { title: "SaaS Pipeline", desc: "Awareness → Interest → Demo → Trial → Negotiation → Won. Built for the SaaS funnel." },
                  { title: "MRR Tracking", desc: "Track monthly recurring revenue per deal. See your pipeline in actual MRR terms." },
                  { title: "Trial & User Metrics", desc: "Active users, plan type, signup source — track the metrics that matter for SaaS." },
                  { title: "Churn Visibility", desc: "Separate Churned stage so you can see and recover at-risk accounts." },
                ],
                objections: [
                  { q: "\"We use HubSpot for marketing too.\"", a: "Keep HubSpot for marketing. Use WorkChores for sales pipeline — it's faster, simpler, and your reps will actually update it." },
                  { q: "\"We need product analytics integration.\"", a: "WorkChores focuses on the sales side. Track MRR and active users here, keep Mixpanel/Amplitude for product. One source of truth for pipeline." },
                ],
                script: [
                  { tag: "Opening", tagColor: "text-blue-700", tagBg: "bg-blue-100", text: "\"Hey [Name], how's your team tracking the trial-to-paid pipeline right now?\"" },
                  { tag: "Pain", tagColor: "text-purple-700", tagBg: "bg-purple-100", text: "\"Most SaaS teams I talk to have their pipeline in a spreadsheet or a CRM that wasn't built for SaaS. They're tracking MRR manually. Sound familiar?\"" },
                  { tag: "Solution", tagColor: "text-emerald-700", tagBg: "bg-emerald-100", text: "\"WorkChores is pre-configured for SaaS — trial, demo, MRR, active users, plan type. Your pipeline stages match how SaaS actually works. Set up in 60 seconds.\"" },
                  { tag: "Demo", tagColor: "text-amber-700", tagBg: "bg-amber-100", text: "\"Go to workchores.com, pick SaaS, and play with it live. No signup needed.\"" },
                  { tag: "Close", tagColor: "text-rose-700", tagBg: "bg-rose-100", text: "\"Free to start. Pro when your pipeline grows. What do you think?\"" },
                ],
                targets: ["SaaS founders", "Sales teams at startups", "Revenue ops", "Customer success teams doing expansion"],
              },
              realestate: {
                label: "Real Estate",
                color: "text-emerald-700",
                bg: "bg-emerald-100",
                oneLiner: "WorkChores gives real estate agents a CRM with Inquiry → Showing → Offer → Under Contract → Closed pipeline and property tracking — set up in 60 seconds.",
                pitch: "Real estate agents need to track properties, client types, and showings — not enterprise sales metrics. WorkChores comes pre-built with property address, type, bedrooms, square footage, and pre-approval status. Your pipeline matches how real estate actually works. No more forcing a generic CRM to fit.",
                usps: [
                  { title: "Real Estate Pipeline", desc: "Inquiry → Showing → Offer → Under Contract → Closed. Matches how you actually sell." },
                  { title: "Property Tracking", desc: "Address, property type, bedrooms, square feet — all built into each contact/deal." },
                  { title: "Client Type Filtering", desc: "Buyer vs. seller at a glance. Filter your pipeline by client type." },
                  { title: "Pre-Approval Status", desc: "Know instantly which clients are pre-approved and ready to move." },
                ],
                objections: [
                  { q: "\"I use my brokerage's CRM.\"", a: "Most brokerage CRMs are clunky and generic. WorkChores is built specifically for how agents work — and you own your data. If you switch brokerages, your contacts come with you." },
                  { q: "\"I just need to track listings.\"", a: "WorkChores does that — plus tracks buyer leads, showing schedules, and follow-ups. It's your whole pipeline, not just listings." },
                ],
                script: [
                  { tag: "Opening", tagColor: "text-blue-700", tagBg: "bg-blue-100", text: "\"Hey [Name], how are you keeping track of all your buyer and seller leads right now?\"" },
                  { tag: "Pain", tagColor: "text-purple-700", tagBg: "bg-purple-100", text: "\"Most agents I talk to are juggling a phone, a notebook, and maybe a spreadsheet. Leads slip through the cracks. Sound about right?\"" },
                  { tag: "Solution", tagColor: "text-emerald-700", tagBg: "bg-emerald-100", text: "\"WorkChores is a CRM built for real estate. Property details, showing pipeline, pre-approval tracking — all configured when you sign up. Takes 60 seconds.\"" },
                  { tag: "Demo", tagColor: "text-amber-700", tagBg: "bg-amber-100", text: "\"Go to workchores.com, pick Real Estate, and see it with sample properties and leads. No signup.\"" },
                  { tag: "Close", tagColor: "text-rose-700", tagBg: "bg-rose-100", text: "\"Free plan for solo agents. Pro for teams. Your data, your pipeline — take it wherever you go.\"" },
                ],
                targets: ["Solo real estate agents", "Small brokerages", "Real estate teams", "New agents building a book"],
              },
              recruiting: {
                label: "Recruiting",
                color: "text-amber-700",
                bg: "bg-amber-100",
                oneLiner: "WorkChores gives recruiters an ATS-style CRM with Applied → Screen → Interview → Offer → Hired pipeline and candidate tracking in 60 seconds.",
                pitch: "Recruiting is a pipeline business but most ATS tools are overbuilt and expensive. WorkChores gives you Applied → Phone Screen → Interview → Final Round → Offer → Hired stages, plus fields for position, experience, salary expectations, and notice period. Track candidates like deals.",
                usps: [
                  { title: "Recruiting Pipeline", desc: "Applied → Phone Screen → Interview → Final Round → Offer → Hired. Track every candidate." },
                  { title: "Candidate Fields", desc: "Position, years of experience, salary expectation, location preference, notice period — all built in." },
                  { title: "Activity Logging", desc: "Log screening calls, interviews, and emails. Full candidate timeline at a glance." },
                  { title: "Affordable ATS Alternative", desc: "No per-seat or per-job pricing. One simple plan for your whole recruiting pipeline." },
                ],
                objections: [
                  { q: "\"We already have an ATS.\"", a: "Most ATS tools cost $300+/month and are designed for HR departments. WorkChores is for recruiters who want speed, not compliance features." },
                  { q: "\"Can it post to job boards?\"", a: "WorkChores focuses on pipeline management — tracking candidates, not posting jobs. Use it alongside your job board to never lose track of a candidate." },
                ],
                script: [
                  { tag: "Opening", tagColor: "text-blue-700", tagBg: "bg-blue-100", text: "\"Hey [Name], how are you tracking candidates through your pipeline right now?\"" },
                  { tag: "Pain", tagColor: "text-purple-700", tagBg: "bg-purple-100", text: "\"Most recruiters I talk to are juggling candidates across spreadsheets, LinkedIn tabs, and email threads. Candidates fall through the cracks.\"" },
                  { tag: "Solution", tagColor: "text-emerald-700", tagBg: "bg-emerald-100", text: "\"WorkChores is set up for recruiting — screening, interview, offer, hired stages. Candidate details like salary expectations and notice period are built in. 60 seconds to set up.\"" },
                  { tag: "Demo", tagColor: "text-amber-700", tagBg: "bg-amber-100", text: "\"Go to workchores.com, pick Recruiting, and you'll see a working pipeline with sample candidates.\"" },
                  { tag: "Close", tagColor: "text-rose-700", tagBg: "bg-rose-100", text: "\"Free to start. Fraction of the cost of any ATS. Give it a try?\"" },
                ],
                targets: ["Agency recruiters", "Internal talent teams", "Solo headhunters", "Staffing firms"],
              },
              consulting: {
                label: "Consulting",
                color: "text-rose-700",
                bg: "bg-rose-100",
                oneLiner: "WorkChores helps consultants track engagements from Discovery → Scoping → Proposal → SOW → Engaged with day rates and team sizing in 60 seconds.",
                pitch: "Consulting is relationship-driven. You need to track project types, engagement length, day rates, and team sizes — not generic deal values. WorkChores comes pre-built with Discovery → Scoping → Proposal → SOW Review → Engaged pipeline and all the fields consultants actually care about.",
                usps: [
                  { title: "Consulting Pipeline", desc: "Discovery → Scoping → Proposal → SOW Review → Engaged. Matches how engagements actually flow." },
                  { title: "Engagement Tracking", desc: "Project type, engagement length, day rate, team size — track the economics of every deal." },
                  { title: "Relationship Timeline", desc: "Log every call, meeting, and proposal. Full history of every client relationship." },
                  { title: "Simple & Professional", desc: "No bloated features. A clean CRM that reflects how boutique firms actually work." },
                ],
                objections: [
                  { q: "\"We just use a spreadsheet.\"", a: "That works until you have 20+ prospects in different stages. WorkChores gives you that spreadsheet feel but with pipeline views, activity tracking, and auto-saves." },
                  { q: "\"We need project management too.\"", a: "WorkChores handles the sales pipeline. For project delivery, pair it with whatever PM tool you use. One tool per job, done well." },
                ],
                script: [
                  { tag: "Opening", tagColor: "text-blue-700", tagBg: "bg-blue-100", text: "\"Hey [Name], how are you currently managing your consulting pipeline — from initial conversation to signed SOW?\"" },
                  { tag: "Pain", tagColor: "text-purple-700", tagBg: "bg-purple-100", text: "\"Most consultants I talk to either have no system or are using tools built for product sales. Engagement length, day rates, SOW tracking — none of that fits a generic CRM.\"" },
                  { tag: "Solution", tagColor: "text-emerald-700", tagBg: "bg-emerald-100", text: "\"WorkChores is pre-configured for consulting. Discovery to engagement pipeline, day rates, team sizing, project types — all ready in 60 seconds.\"" },
                  { tag: "Demo", tagColor: "text-amber-700", tagBg: "bg-amber-100", text: "\"Check out workchores.com — pick Consulting and play with it. Sample engagements and everything.\"" },
                  { tag: "Close", tagColor: "text-rose-700", tagBg: "bg-rose-100", text: "\"Free for solo consultants. Pro for firms. Clean, fast, and built for how you work.\"" },
                ],
                targets: ["Solo consultants", "Boutique firms", "Management consultants", "Freelance advisors"],
              },
              services: {
                label: "Home Services",
                color: "text-cyan-700",
                bg: "bg-cyan-100",
                oneLiner: "WorkChores helps contractors track jobs from New Lead → Estimate → Scheduled → In Progress → Completed with job details and urgency tracking.",
                pitch: "Home service businesses need to track job addresses, service types, urgency levels, and estimated hours — not enterprise deal stages. WorkChores comes pre-built with a contractor's pipeline and all the fields you need to manage jobs from first call to completion.",
                usps: [
                  { title: "Contractor Pipeline", desc: "New Lead → Estimate Sent → Scheduled → In Progress → Completed. Track every job." },
                  { title: "Job Details Built In", desc: "Service type, job address, property type, urgency, estimated hours — all on every contact." },
                  { title: "Never Miss a Follow-Up", desc: "Task reminders and activity tracking so no estimate goes unfollowed." },
                  { title: "Mobile Friendly", desc: "Works on your phone. Update job status from the field. No app to install." },
                ],
                objections: [
                  { q: "\"I use ServiceTitan/Jobber.\"", a: "Those are great for scheduling and invoicing. WorkChores handles the sales pipeline — lead tracking, estimates, and follow-ups before the job is booked." },
                  { q: "\"I don't need a CRM, I get referrals.\"", a: "Referrals are great — but are you following up on all of them? WorkChores makes sure no lead slips through the cracks, even referrals." },
                ],
                script: [
                  { tag: "Opening", tagColor: "text-blue-700", tagBg: "bg-blue-100", text: "\"Hey [Name], how are you keeping track of all your leads and estimates right now?\"" },
                  { tag: "Pain", tagColor: "text-purple-700", tagBg: "bg-purple-100", text: "\"Most contractors I talk to have leads in their text messages, estimates in their head, and follow-ups that never happen. Money left on the table.\"" },
                  { tag: "Solution", tagColor: "text-emerald-700", tagBg: "bg-emerald-100", text: "\"WorkChores tracks your jobs from first call to completion. Service type, address, urgency — all organized. Takes 60 seconds to set up for home services.\"" },
                  { tag: "Demo", tagColor: "text-amber-700", tagBg: "bg-amber-100", text: "\"Go to workchores.com, pick Home Services, and see a working pipeline with sample jobs.\"" },
                  { tag: "Close", tagColor: "text-rose-700", tagBg: "bg-rose-100", text: "\"Free plan. Works on your phone. Start tracking leads today instead of losing them.\"" },
                ],
                targets: ["Plumbers", "Electricians", "HVAC contractors", "Landscapers", "General contractors", "Cleaning services"],
              },
            };

            const ind = salesData[salesIndustry] || salesData.general;

            return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-5xl space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Sales Hub</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Sales materials by industry. Click a tag to switch context.</p>
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById("sales-hub-content");
                    if (el) navigator.clipboard.writeText(el.innerText);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ClipboardCopy className="w-3.5 h-3.5" /> Copy All
                </button>
              </div>

              {/* Industry Tags */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(salesData).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setSalesIndustry(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      salesIndustry === key
                        ? `${val.bg} ${val.color} ring-2 ring-offset-1 ring-current`
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                    }`}
                  >
                    {val.label}
                  </button>
                ))}
              </div>

              <div id="sales-hub-content" className="space-y-4">
                {/* One-Liner */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">One-Liner</div>
                  <p className="text-sm font-medium text-gray-900 leading-relaxed">{ind.oneLiner}</p>
                </div>

                {/* Elevator Pitch */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Elevator Pitch</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{ind.pitch}</p>
                </div>

                {/* USPs */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Unique Selling Points</div>
                  </div>
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ind.usps.map((usp) => (
                      <div key={usp.title} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="text-xs font-semibold text-gray-900 mb-1">{usp.title}</div>
                        <div className="text-[11px] text-gray-500 leading-relaxed">{usp.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Customers */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Target Customers</div>
                  <div className="flex flex-wrap gap-2">
                    {ind.targets.map((t) => (
                      <span key={t} className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${ind.bg} ${ind.color}`}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* Objection Handlers */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Objection Handlers</div>
                  </div>
                  <div className="p-5 space-y-3">
                    {ind.objections.map((obj) => (
                      <div key={obj.q} className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                        <div className="text-xs font-semibold text-gray-900 mb-1">{obj.q}</div>
                        <div className="text-[11px] text-gray-600 leading-relaxed">{obj.a}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sales Script */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Sales Script</div>
                    <button
                      onClick={() => {
                        const el = document.getElementById("script-content");
                        if (el) navigator.clipboard.writeText(el.innerText);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium text-gray-400 hover:text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <ClipboardCopy className="w-3 h-3" /> Copy Script
                    </button>
                  </div>
                  <div id="script-content" className="p-5 space-y-4">
                    {ind.script.map((s) => (
                      <div key={s.tag}>
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full ${s.tagBg} ${s.tagColor} text-[10px] font-semibold uppercase tracking-wider mb-1.5`}>{s.tag}</div>
                        <p className="text-sm text-gray-700 leading-relaxed">{s.text}</p>
                      </div>
                    ))}
                    <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Tips</div>
                      <ul className="space-y-1 text-[11px] text-gray-500">
                        <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> Always offer the live demo — it sells itself</li>
                        <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> Ask about their current pain before pitching features</li>
                        <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> Emphasize &quot;60-second setup&quot; — biggest differentiator</li>
                        <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> For skeptics: &quot;Try the demo right now, zero commitment&quot;</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Quick Share */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick Share</div>
                  <p className="text-[11px] text-gray-500 mb-2">Send this link to anyone selling WorkChores or prospects.</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 font-mono truncate">https://workchores.com</div>
                    <button
                      onClick={() => navigator.clipboard.writeText("https://workchores.com")}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <ClipboardCopy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {/* ============================================================ */}
          {/* ============================================================ */}
          {/* TECH DEBT — LIVE SCAN (via GitHub Action) */}
          {/* ============================================================ */}
          {section === "tech-debt" && (() => {
            const items = tdFindings;
            const summary = tdSummary;
            const lastTime = lastTdScanTime;
            const history = auditHistory["tech_debt"] || [];
            const showHistory = historyExpanded["tech_debt"] || false;
            const sevColors: Record<string, { bg: string; text: string; dot: string }> = {
              critical: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
              high: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
              medium: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
              low: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
            };
            return (
              <div className="p-4 sm:p-6 max-w-5xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Tech Debt Scan</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{lastTime ? `Last scan: ${new Date(lastTime).toLocaleString()}` : "No scans run yet"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setHistoryExpanded((p) => ({ ...p, tech_debt: !p.tech_debt })); if (!history.length) loadAuditHistory("tech_debt"); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{showHistory ? "Hide History" : "History"}</button>
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg">
                      <Code2 className="w-3.5 h-3.5" /> Scanned via GitHub Action
                    </span>
                  </div>
                </div>
                {summary && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${summary.critical > 0 ? "bg-red-500 animate-pulse" : summary.high > 0 ? "bg-amber-500" : summary.medium > 0 ? "bg-blue-500" : "bg-emerald-500"}`} />
                        <span className="text-sm font-medium text-gray-900">{summary.critical > 0 ? "Critical Debt Found" : summary.high > 0 ? "Issues Found" : summary.medium > 0 ? "Minor Items" : "All Clear"}</span>
                      </div>
                      <span className="text-xs text-gray-400">{items.length} finding(s)</span>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {[{ label: "Total", count: summary.total, color: "text-gray-900" }, { label: "Critical", count: summary.critical, color: summary.critical > 0 ? "text-red-600" : "text-gray-300" }, { label: "High", count: summary.high, color: summary.high > 0 ? "text-amber-600" : "text-gray-300" }, { label: "Medium", count: summary.medium, color: summary.medium > 0 ? "text-blue-600" : "text-gray-300" }, { label: "Low", count: summary.low, color: summary.low > 0 ? "text-gray-500" : "text-gray-300" }].map((ct) => (
                        <div key={ct.label} className="text-center"><div className={`text-xl font-bold ${ct.color}`}>{ct.count}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{ct.label}</div></div>
                      ))}
                    </div>
                  </div>
                )}
                {items.length === 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Code2 className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{lastTime ? "No tech debt found" : "Waiting for first scan"}</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">{lastTime ? "Your codebase is clean. The GitHub Action will scan again tomorrow at 5AM EST." : "The GitHub Action runs daily at 5AM EST. You can also trigger it manually from your GitHub repo."}</p>
                  </div>
                )}
                <AuditFindingsList findings={items} dismissed={dismissedFindings} showDismissed={showDismissed} onToggleDismiss={toggleDismissed} onToggleShowDismissed={() => setShowDismissed(!showDismissed)} />
                {showHistory && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Scan History</h3></div>
                    {history.length === 0 ? (<div className="p-6 text-center text-xs text-gray-400">No scan history yet</div>) : (
                      <div className="divide-y divide-gray-50">
                        {history.map((run: AuditHistoryRun, i: number) => { const prev = history[i + 1]; const totalNow = run.summary?.total || 0; const totalPrev = prev ? (prev.summary?.total || 0) : null; const trend = totalPrev !== null ? totalNow - totalPrev : null; return (
                          <div key={run.id} className="px-5 py-3 flex items-center justify-between">
                            <div><div className="text-xs font-medium text-gray-900">{new Date(run.created_at).toLocaleString()}</div><div className="text-[10px] text-gray-400 mt-0.5">{run.trigger === "cron" ? "GitHub Action" : "Manual"} · {run.duration_ms}ms</div></div>
                            <div className="flex items-center gap-3">
                              {trend !== null && trend !== 0 && (<span className={`text-[10px] font-semibold ${trend < 0 ? "text-emerald-600" : "text-red-600"}`}>{trend > 0 ? "+" : ""}{trend}</span>)}
                              <div className="text-right"><div className="text-sm font-bold text-gray-900">{totalNow}</div><div className="text-[10px] text-gray-400">finding(s)</div></div>
                            </div>
                          </div>
                        ); })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          {/* UI/UX AUDIT — LIVE SCAN */}
          {/* ============================================================ */}
          {section === "ui-ux" && (() => {
            const items = uxFindings;
            const summary = uxSummary;
            const isScanning = uxScanning;
            const lastTime = lastUxScanTime;
            const history = auditHistory["uiux"] || [];
            const showHistory = historyExpanded["uiux"] || false;
            const sevColors: Record<string, { bg: string; text: string; dot: string }> = {
              critical: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
              high: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
              medium: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
              low: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
            };
            return (
              <div className="p-4 sm:p-6 max-w-5xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">UX & Accessibility Scan</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{lastTime ? `Last scan: ${new Date(lastTime).toLocaleString()}` : "No scans run yet"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setHistoryExpanded((p) => ({ ...p, uiux: !p.uiux })); if (!history.length) loadAuditHistory("uiux"); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{showHistory ? "Hide History" : "History"}</button>
                    <button onClick={runUxScan} disabled={isScanning} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-60">
                      {isScanning ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...</>) : (<><Palette className="w-3.5 h-3.5" /> Run Scan</>)}
                    </button>
                  </div>
                </div>
                {summary && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${summary.critical > 0 ? "bg-red-500 animate-pulse" : summary.high > 0 ? "bg-amber-500" : summary.medium > 0 ? "bg-blue-500" : "bg-emerald-500"}`} />
                        <span className="text-sm font-medium text-gray-900">{summary.critical > 0 ? "Critical Issues" : summary.high > 0 ? "Issues Found" : summary.medium > 0 ? "Minor Issues" : "All Checks Passed"}</span>
                      </div>
                      <span className="text-xs text-gray-400">{items.length} check(s)</span>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {[{ label: "Total", count: summary.total, color: "text-gray-900" }, { label: "Critical", count: summary.critical, color: summary.critical > 0 ? "text-red-600" : "text-gray-300" }, { label: "High", count: summary.high, color: summary.high > 0 ? "text-amber-600" : "text-gray-300" }, { label: "Medium", count: summary.medium, color: summary.medium > 0 ? "text-blue-600" : "text-gray-300" }, { label: "Low", count: summary.low, color: summary.low > 0 ? "text-gray-500" : "text-gray-300" }].map((ct) => (
                        <div key={ct.label} className="text-center"><div className={`text-xl font-bold ${ct.color}`}>{ct.count}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{ct.label}</div></div>
                      ))}
                    </div>
                  </div>
                )}
                {items.length === 0 && !isScanning && (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Palette className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Run your first UX scan</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">Checks skip navigation, ARIA live regions, and form hints on your live site.</p>
                    <button onClick={runUxScan} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"><Palette className="w-3.5 h-3.5" /> Run Scan</button>
                  </div>
                )}
                {isScanning && items.length === 0 && (<div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><Loader2 className="w-7 h-7 text-gray-400 animate-spin mx-auto mb-3" /><h3 className="text-sm font-semibold text-gray-900 mb-1">Scanning...</h3></div>)}
                <AuditFindingsList findings={items} dismissed={dismissedFindings} showDismissed={showDismissed} onToggleDismiss={toggleDismissed} onToggleShowDismissed={() => setShowDismissed(!showDismissed)} />
                {showHistory && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Scan History</h3></div>
                    {history.length === 0 ? (<div className="p-6 text-center text-xs text-gray-400">No scan history yet</div>) : (
                      <div className="divide-y divide-gray-50">
                        {history.map((run: AuditHistoryRun, i: number) => { const prev = history[i + 1]; const totalNow = run.summary?.total || 0; const totalPrev = prev ? (prev.summary?.total || 0) : null; const trend = totalPrev !== null ? totalNow - totalPrev : null; return (
                          <div key={run.id} className="px-5 py-3 flex items-center justify-between">
                            <div><div className="text-xs font-medium text-gray-900">{new Date(run.created_at).toLocaleString()}</div><div className="text-[10px] text-gray-400 mt-0.5">{run.trigger === "cron" ? "Automated" : "Manual"} · {run.duration_ms}ms</div></div>
                            <div className="flex items-center gap-3">
                              {trend !== null && trend !== 0 && (<span className={`text-[10px] font-semibold ${trend < 0 ? "text-emerald-600" : "text-red-600"}`}>{trend > 0 ? "+" : ""}{trend}</span>)}
                              <div className="text-right"><div className="text-sm font-bold text-gray-900">{totalNow}</div><div className="text-[10px] text-gray-400">finding(s)</div></div>
                            </div>
                          </div>
                        ); })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ============================================================ */}
          {/* SEARCH & SEO AUDIT — LIVE SCAN */}
          {/* ============================================================ */}
          {section === "seo" && (() => {
            const items = seoFindings;
            const summary = seoSummary;
            const isScanning = seoScanning;
            const lastTime = lastSeoScanTime;
            const history = auditHistory["seo"] || [];
            const showHistory = historyExpanded["seo"] || false;
            const sevColors: Record<string, { bg: string; text: string; dot: string }> = {
              critical: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
              high: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
              medium: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
              low: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
            };
            return (
              <div className="p-4 sm:p-6 max-w-5xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Search & SEO Scan</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{lastTime ? `Last scan: ${new Date(lastTime).toLocaleString()}` : "No scans run yet"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setHistoryExpanded((p) => ({ ...p, seo: !p.seo })); if (!history.length) loadAuditHistory("seo"); }} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{showHistory ? "Hide History" : "History"}</button>
                    <button onClick={runSeoScan} disabled={isScanning} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-60">
                      {isScanning ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scanning...</>) : (<><SearchCheck className="w-3.5 h-3.5" /> Run Scan</>)}
                    </button>
                  </div>
                </div>
                {summary && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${summary.critical > 0 ? "bg-red-500 animate-pulse" : summary.high > 0 ? "bg-amber-500" : summary.medium > 0 ? "bg-blue-500" : "bg-emerald-500"}`} />
                        <span className="text-sm font-medium text-gray-900">{summary.critical > 0 ? "Critical SEO Issues" : summary.high > 0 ? "Issues Found" : summary.medium > 0 ? "Minor Issues" : "All Checks Passed"}</span>
                      </div>
                      <span className="text-xs text-gray-400">{items.length} check(s)</span>
                    </div>
                    <div className="grid grid-cols-5 gap-4">
                      {[{ label: "Total", count: summary.total, color: "text-gray-900" }, { label: "Critical", count: summary.critical, color: summary.critical > 0 ? "text-red-600" : "text-gray-300" }, { label: "High", count: summary.high, color: summary.high > 0 ? "text-amber-600" : "text-gray-300" }, { label: "Medium", count: summary.medium, color: summary.medium > 0 ? "text-blue-600" : "text-gray-300" }, { label: "Low", count: summary.low, color: summary.low > 0 ? "text-gray-500" : "text-gray-300" }].map((ct) => (
                        <div key={ct.label} className="text-center"><div className={`text-xl font-bold ${ct.color}`}>{ct.count}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{ct.label}</div></div>
                      ))}
                    </div>
                  </div>
                )}
                {items.length === 0 && !isScanning && (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <SearchCheck className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Run your first SEO scan</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">Checks sitemap, robots.txt, metadata, OpenGraph, JSON-LD schemas, and security headers.</p>
                    <button onClick={runSeoScan} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"><SearchCheck className="w-3.5 h-3.5" /> Run Scan</button>
                  </div>
                )}
                {isScanning && items.length === 0 && (<div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><Loader2 className="w-7 h-7 text-gray-400 animate-spin mx-auto mb-3" /><h3 className="text-sm font-semibold text-gray-900 mb-1">Scanning...</h3></div>)}
                <AuditFindingsList findings={items} dismissed={dismissedFindings} showDismissed={showDismissed} onToggleDismiss={toggleDismissed} onToggleShowDismissed={() => setShowDismissed(!showDismissed)} />
                {showHistory && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Scan History</h3></div>
                    {history.length === 0 ? (<div className="p-6 text-center text-xs text-gray-400">No scan history yet</div>) : (
                      <div className="divide-y divide-gray-50">
                        {history.map((run: AuditHistoryRun, i: number) => { const prev = history[i + 1]; const totalNow = run.summary?.total || 0; const totalPrev = prev ? (prev.summary?.total || 0) : null; const trend = totalPrev !== null ? totalNow - totalPrev : null; return (
                          <div key={run.id} className="px-5 py-3 flex items-center justify-between">
                            <div><div className="text-xs font-medium text-gray-900">{new Date(run.created_at).toLocaleString()}</div><div className="text-[10px] text-gray-400 mt-0.5">{run.trigger === "cron" ? "Automated" : "Manual"} · {run.duration_ms}ms</div></div>
                            <div className="flex items-center gap-3">
                              {trend !== null && trend !== 0 && (<span className={`text-[10px] font-semibold ${trend < 0 ? "text-emerald-600" : "text-red-600"}`}>{trend > 0 ? "+" : ""}{trend}</span>)}
                              <div className="text-right"><div className="text-sm font-bold text-gray-900">{totalNow}</div><div className="text-[10px] text-gray-400">finding(s)</div></div>
                            </div>
                          </div>
                        ); })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}



          {/* ============================================================ */}
          {/* SAAS METRICS */}
          {/* ============================================================ */}
          {section === "metrics" && (() => {
            if (!saasMetrics && !saasLoading) {
              return (
                <div className="p-4 sm:p-6 max-w-5xl">
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Load SaaS Metrics</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">DAU/WAU/MAU, retention, unit economics, and growth metrics from your live data.</p>
                    <button onClick={loadSaasMetrics} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"><TrendingUp className="w-3.5 h-3.5" /> Load Metrics</button>
                  </div>
                </div>
              );
            }
            if (saasLoading) {
              return (
                <div className="p-4 sm:p-6 max-w-5xl">
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center"><Loader2 className="w-7 h-7 text-gray-400 animate-spin mx-auto mb-3" /><h3 className="text-sm font-semibold text-gray-900">Computing metrics...</h3></div>
                </div>
              );
            }
            const m = saasMetrics;
            return (
              <div className="p-4 sm:p-6 max-w-5xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">SaaS Metrics</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Real-time metrics from your live data</p>
                  </div>
                  <button onClick={loadSaasMetrics} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Refresh</button>
                </div>

                {/* Engagement */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Engagement</h3></div>
                  <div className="p-5 grid grid-cols-4 gap-6">
                    <div className="text-center"><div className="text-2xl font-bold text-gray-900">{m.engagement.dau}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">DAU</div><div className="text-[10px] text-gray-500 mt-0.5">Today</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-gray-900">{m.engagement.wau}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">WAU</div><div className="text-[10px] text-gray-500 mt-0.5">7 days</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-gray-900">{m.engagement.mau}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">MAU</div><div className="text-[10px] text-gray-500 mt-0.5">30 days</div></div>
                    <div className="text-center"><div className={`text-2xl font-bold ${m.engagement.dauMauRatio >= 20 ? "text-emerald-600" : m.engagement.dauMauRatio >= 10 ? "text-amber-600" : "text-red-600"}`}>{m.engagement.dauMauRatio}%</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">DAU/MAU</div><div className="text-[10px] text-gray-500 mt-0.5">{m.engagement.dauMauRatio >= 20 ? "Strong" : m.engagement.dauMauRatio >= 10 ? "Average" : "Low"}</div></div>
                  </div>
                </div>

                {/* Retention */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Retention</h3></div>
                  <div className="p-5 grid grid-cols-3 gap-6">
                    <div className="text-center"><div className={`text-2xl font-bold ${m.retention.userRetention >= 80 ? "text-emerald-600" : m.retention.userRetention >= 60 ? "text-amber-600" : "text-red-600"}`}>{m.retention.userRetention}%</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">User Retention</div><div className="text-[10px] text-gray-500 mt-0.5">Month-over-month</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-gray-900">{m.retention.retainedUsers}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Retained Users</div><div className="text-[10px] text-gray-500 mt-0.5">Active both months</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-gray-900">{m.retention.priorMau}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Prior MAU</div><div className="text-[10px] text-gray-500 mt-0.5">Last month</div></div>
                  </div>
                </div>

                {/* Revenue & Unit Economics */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Unit Economics</h3></div>
                  <div className="p-5 grid grid-cols-4 gap-6">
                    <div className="text-center"><div className="text-2xl font-bold text-gray-900">${(m.revenue.mrr / 100).toLocaleString()}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">MRR</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-gray-900">${(m.revenue.arr / 100).toLocaleString()}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">ARR</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-gray-900">${(m.revenue.arpu / 100).toFixed(0)}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">ARPU</div><div className="text-[10px] text-gray-500 mt-0.5">Per workspace/mo</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-gray-900">${(m.revenue.revenuePerSeat / 100).toFixed(0)}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Rev/Seat</div><div className="text-[10px] text-gray-500 mt-0.5">$9/seat/mo</div></div>
                  </div>
                </div>

                {/* Growth */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Growth</h3></div>
                  <div className="p-5 grid grid-cols-4 gap-6">
                    <div className="text-center"><div className="text-2xl font-bold text-gray-900">{m.growth.totalUsers}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Total Users</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-emerald-600">{m.growth.usersThisMonth}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">New (30d)</div></div>
                    <div className="text-center"><div className="text-2xl font-bold text-gray-500">{m.growth.usersLastMonth}</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Prior (30d)</div></div>
                    <div className="text-center"><div className={`text-2xl font-bold ${m.growth.userGrowthRate > 0 ? "text-emerald-600" : m.growth.userGrowthRate < 0 ? "text-red-600" : "text-gray-400"}`}>{m.growth.userGrowthRate > 0 ? "+" : ""}{m.growth.userGrowthRate}%</div><div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Growth Rate</div></div>
                  </div>
                </div>

                {/* Funnel */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Funnel (30d)</h3></div>
                  <div className="p-5">
                    <div className="flex items-center gap-3">
                      {[
                        { label: "Visitors", value: m.funnel.visitors, pct: 100 },
                        { label: "Demos", value: m.funnel.demos, pct: m.funnel.visitors > 0 ? Math.round((m.funnel.demos / m.funnel.visitors) * 100) : 0 },
                        { label: "Converted", value: m.funnel.demoConverted, pct: m.funnel.demos > 0 ? Math.round((m.funnel.demoConverted / m.funnel.demos) * 100) : 0 },
                        { label: "Paid", value: m.revenue.businessCount, pct: m.growth.totalUsers > 0 ? Math.round((m.revenue.businessCount / m.growth.totalUsers) * 100) : 0 },
                      ].map((step, i) => (
                        <div key={step.label} className="flex-1">
                          <div className="h-8 rounded-lg bg-gray-100 relative overflow-hidden">
                            <div className="h-full rounded-lg bg-gray-900 transition-all" style={{ width: `${Math.max(step.pct, 4)}%` }} />
                          </div>
                          <div className="mt-2 text-center">
                            <div className="text-sm font-bold text-gray-900">{step.value.toLocaleString()}</div>
                            <div className="text-[10px] text-gray-400">{step.label}</div>
                            {i > 0 && <div className="text-[10px] text-gray-500">{step.pct}%</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ============================================================ */}
          {/* VALUATION */}
          {/* ============================================================ */}
          {section === "valuation" && (() => {
            if (!saasMetrics) {
              return (
                <div className="p-4 sm:p-6 max-w-5xl">
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Crown className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Load metrics first</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">Valuation requires SaaS metrics. Load them to see your estimated valuation.</p>
                    <button onClick={() => { loadSaasMetrics(); }} className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"><Crown className="w-3.5 h-3.5" /> Load & Calculate</button>
                  </div>
                </div>
              );
            }
            const m = saasMetrics;
            const arrDollars = m.revenue.arr / 100;
            const mrrDollars = m.revenue.mrr / 100;

            // Base multiple based on ARR
            const baseMultiple = arrDollars < 100000 ? 6 : arrDollars < 1000000 ? 8 : arrDollars < 5000000 ? 12 : 15;

            // Growth premium
            const growthAdj = m.growth.userGrowthRate > 20 ? 4 : m.growth.userGrowthRate > 10 ? 2 : m.growth.userGrowthRate > 0 ? 0.5 : m.growth.userGrowthRate < -10 ? -3 : m.growth.userGrowthRate < 0 ? -1 : 0;

            // Retention premium
            const retentionAdj = m.retention.userRetention > 90 ? 3 : m.retention.userRetention > 80 ? 1.5 : m.retention.userRetention > 60 ? 0 : -2;

            // Churn penalty (estimate from retention)
            const monthlyChurn = 100 - m.retention.userRetention;
            const churnAdj = monthlyChurn > 10 ? -4 : monthlyChurn > 5 ? -2 : monthlyChurn > 3 ? -0.5 : 0;

            // Concentration penalty
            const concAdj = m.concentration.concentrationPct > 50 ? -3 : m.concentration.concentrationPct > 30 ? -1 : 0;

            const effectiveMultiple = Math.max(baseMultiple + growthAdj + retentionAdj + churnAdj + concAdj, 1);
            const midValuation = arrDollars * effectiveMultiple;
            const lowValuation = midValuation * 0.7;
            const highValuation = midValuation * 1.4;

            const factors = [
              { name: "ARR Base Multiple", value: `${baseMultiple}x`, adj: baseMultiple, color: "text-gray-900", desc: arrDollars < 100000 ? "Pre-seed / early stage" : arrDollars < 1000000 ? "Seed stage" : "Growth stage" },
              { name: "Growth Premium", value: `${growthAdj > 0 ? "+" : ""}${growthAdj}x`, adj: growthAdj, color: growthAdj > 0 ? "text-emerald-600" : growthAdj < 0 ? "text-red-600" : "text-gray-400", desc: `${m.growth.userGrowthRate}% MoM user growth` },
              { name: "Retention Premium", value: `${retentionAdj > 0 ? "+" : ""}${retentionAdj}x`, adj: retentionAdj, color: retentionAdj > 0 ? "text-emerald-600" : retentionAdj < 0 ? "text-red-600" : "text-gray-400", desc: `${m.retention.userRetention}% month-over-month retention` },
              { name: "Churn Penalty", value: `${churnAdj}x`, adj: churnAdj, color: churnAdj < 0 ? "text-red-600" : "text-emerald-600", desc: `${monthlyChurn}% estimated monthly churn` },
              { name: "Concentration Risk", value: `${concAdj}x`, adj: concAdj, color: concAdj < 0 ? "text-red-600" : "text-emerald-600", desc: `${m.concentration.concentrationPct}% revenue from largest customer` },
            ];

            // What moves the needle
            const levers = [
              { action: "Reduce churn by 5%", impact: Math.round(arrDollars * 2), priority: monthlyChurn > 5 },
              { action: "Grow MRR 20% MoM", impact: Math.round(arrDollars * 4), priority: m.growth.userGrowthRate < 20 },
              { action: "Improve retention to 90%+", impact: Math.round(arrDollars * 3), priority: m.retention.userRetention < 90 },
              { action: "Diversify customer base", impact: Math.round(arrDollars * 1.5), priority: m.concentration.concentrationPct > 30 },
            ].filter(l => l.priority).sort((a, b) => b.impact - a.impact);

            return (
              <div className="p-4 sm:p-6 max-w-5xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Estimated Valuation</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Multi-factor model based on your live SaaS metrics</p>
                  </div>
                  <button onClick={loadSaasMetrics} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Recalculate</button>
                </div>

                {/* Valuation range */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="text-center mb-6">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Estimated Valuation</div>
                    <div className="text-4xl font-bold text-gray-900">${midValuation < 1000 ? midValuation.toLocaleString() : midValuation < 1000000 ? (midValuation / 1000).toFixed(0) + "K" : (midValuation / 1000000).toFixed(1) + "M"}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Range: ${lowValuation < 1000 ? lowValuation.toLocaleString() : lowValuation < 1000000 ? (lowValuation / 1000).toFixed(0) + "K" : (lowValuation / 1000000).toFixed(1) + "M"} — ${highValuation < 1000 ? highValuation.toLocaleString() : highValuation < 1000000 ? (highValuation / 1000).toFixed(0) + "K" : (highValuation / 1000000).toFixed(1) + "M"}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center"><div className="text-lg font-bold text-gray-900">${mrrDollars.toLocaleString()}</div><div className="text-[10px] text-gray-400 uppercase">MRR</div></div>
                    <div className="text-center"><div className="text-lg font-bold text-gray-900">${arrDollars.toLocaleString()}</div><div className="text-[10px] text-gray-400 uppercase">ARR</div></div>
                    <div className="text-center"><div className="text-lg font-bold text-blue-600">{effectiveMultiple.toFixed(1)}x</div><div className="text-[10px] text-gray-400 uppercase">Multiple</div></div>
                  </div>
                </div>

                {/* Factor breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Factor Breakdown</h3></div>
                  <div className="divide-y divide-gray-50">
                    {factors.map((f) => (
                      <div key={f.name} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{f.name}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{f.desc}</div>
                        </div>
                        <div className={`text-sm font-bold ${f.color}`}>{f.value}</div>
                      </div>
                    ))}
                    <div className="px-5 py-3 flex items-center justify-between bg-gray-50">
                      <div className="text-sm font-semibold text-gray-900">Effective Multiple</div>
                      <div className="text-sm font-bold text-blue-600">{effectiveMultiple.toFixed(1)}x ARR</div>
                    </div>
                  </div>
                </div>

                {/* What moves the needle */}
                {levers.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">What Moves the Needle</h3></div>
                    <div className="divide-y divide-gray-50">
                      {levers.map((l) => (
                        <div key={l.action} className="px-5 py-3 flex items-center justify-between">
                          <div className="text-sm text-gray-900">{l.action}</div>
                          <div className="text-sm font-bold text-emerald-600">+${l.impact < 1000 ? l.impact.toLocaleString() : l.impact < 1000000 ? (l.impact / 1000).toFixed(0) + "K" : (l.impact / 1000000).toFixed(1) + "M"} valuation</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Benchmarks */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100"><h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">SaaS Benchmarks</h3></div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      {[
                        { label: "Median Seed ARR", benchmark: "$500K", yours: `$${arrDollars < 1000 ? arrDollars : arrDollars < 1000000 ? (arrDollars / 1000).toFixed(0) + "K" : (arrDollars / 1000000).toFixed(1) + "M"}` },
                        { label: "Target Churn", benchmark: "<5%/mo", yours: `${monthlyChurn}%/mo` },
                        { label: "Target DAU/MAU", benchmark: ">20%", yours: `${m.engagement.dauMauRatio}%` },
                        { label: "Target Retention", benchmark: ">80%", yours: `${m.retention.userRetention}%` },
                      ].map(b => (
                        <div key={b.label}>
                          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{b.label}</div>
                          <div className="text-xs text-gray-500">Benchmark: <span className="font-semibold">{b.benchmark}</span></div>
                          <div className="text-xs text-gray-900">Yours: <span className="font-semibold">{b.yours}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-surface border border-border">
                  <AlertTriangle className="w-4 h-4 text-muted mt-0.5 shrink-0" />
                  <p className="text-xs text-muted leading-relaxed">This is an estimated valuation based on a simplified multi-factor model. Actual valuations depend on market conditions, competitive landscape, team, IP, and investor sentiment. This is not financial advice.</p>
                </div>
              </div>
            );
          })()}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-6 py-3 flex items-center justify-between text-[11px] text-gray-400">
        <div className="flex items-center gap-4">
          <span>WorkChores Admin</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <a href="https://workchores.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors flex items-center gap-1">
            <Globe className="w-3 h-3" /> workchores.com
          </a>
          <a href="https://workchores.com/docs" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">Docs</a>
          <a href="mailto:support@workchores.com" className="hover:text-gray-600 transition-colors flex items-center gap-1">
            <Mail className="w-3 h-3" /> Support
          </a>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online</span>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// KPI Card Component
// ============================================================

// ============================================================
// Audit Findings List with Dismiss
// ============================================================

function AuditFindingsList({ findings, dismissed, showDismissed, onToggleDismiss, onToggleShowDismissed }: {
  findings: { id: string; severity: string; title: string; description: string; category: string }[];
  dismissed: Record<string, boolean>;
  showDismissed: boolean;
  onToggleDismiss: (id: string) => void;
  onToggleShowDismissed: () => void;
}) {
  const sevColors: Record<string, { bg: string; text: string; dot: string }> = {
    critical: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    high: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    medium: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    low: { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" },
  };

  const activeItems = findings.filter((f) => !dismissed[f.id]);
  const dismissedItems = findings.filter((f) => dismissed[f.id]);
  const displayItems = showDismissed ? findings : activeItems;

  if (findings.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Findings</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{activeItems.length} active</span>
        </div>
        {dismissedItems.length > 0 && (
          <button onClick={onToggleShowDismissed} className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
            {showDismissed ? "Hide resolved" : `Show ${dismissedItems.length} resolved`}
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {displayItems.map((item) => {
          const isDismissed = dismissed[item.id] || false;
          const colors = sevColors[item.severity] || sevColors.low;
          return (
            <div
              key={item.id}
              onClick={() => onToggleDismiss(item.id)}
              className={`px-5 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors ${isDismissed ? "opacity-40" : ""}`}
            >
              <div className={`mt-0.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isDismissed ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`} style={{ width: 18, height: 18 }}>
                {isDismissed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />{item.severity.toUpperCase()}
                  </span>
                  <span className={`text-sm font-medium ${isDismissed ? "line-through text-gray-400" : "text-gray-900"}`}>{item.title}</span>
                </div>
                <p className={`text-xs mt-0.5 leading-relaxed ${isDismissed ? "text-gray-300" : "text-gray-500"}`}>{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, iconBg, iconColor, value, label, prefix }: {
  icon: typeof LayoutDashboard;
  iconBg: string;
  iconColor: string;
  value: number | string;
  label: string;
  prefix?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center mb-2`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="text-2xl font-bold text-gray-900">{typeof prefix === "string" ? "" : ""}{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
