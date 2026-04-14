"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  LayoutDashboard,
  Headphones,
  DollarSign,
  Activity,
  Bell,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Zap,
  Shield,
  Crown,
  Menu,
  X,
  Megaphone,
  Briefcase,
  Code2,
  Palette,
  SearchCheck,
  RefreshCw,
  Building2,
  Users,
} from "lucide-react";

import {
  adminFetch,
  type AdminSection,
  type WorkspaceStat,
  type Conversation,
  type PersonRecord,
  type Announcement,
  type DemoSession,
  type AnalyticsPoint,
} from "./sections/_shared";

// Section components
import OverviewSection from "./sections/overview";
import SupportSection from "./sections/support";
import RevenueSection from "./sections/revenue";
import WorkspacesSection from "./sections/workspaces";
import PeopleSection from "./sections/people";
import ActivitySection from "./sections/activity";
import HealthSection from "./sections/health";
import AnnouncementsSection from "./sections/announcements";
import SecuritySection from "./sections/security";
import UsageSection from "./sections/usage";
import SalesSection from "./sections/sales";
import TechDebtSection from "./sections/tech-debt";
import UiuxSection from "./sections/uiux";
import SeoSection from "./sections/seo";
import MetricsSection from "./sections/metrics";
import ValuationSection from "./sections/valuation";

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
      { key: "health", label: "System Health", icon: Activity },
      { key: "security", label: "Security", icon: Shield },
      { key: "tech-debt", label: "Tech Debt", icon: Code2 },
      { key: "ui-ux", label: "UI / UX", icon: Palette },
      { key: "seo", label: "Search & SEO", icon: SearchCheck },
    ],
  },
];

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
  const [needs2fa, setNeeds2fa] = useState(false);
  const [totpCode, setTotpCode] = useState("");

  // Navigation
  const [section, setSection] = useState<AdminSection>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({ "Dashboard": true, "Business": true, "Support": true, "System": true });

  // Shared data (used by multiple sections)
  const [workspaces, setWorkspaces] = useState<WorkspaceStat[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalContacts, setTotalContacts] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [demoSessions, setDemoSessions] = useState<DemoSession[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsPoint[]>([]);
  const [analyticsRange, setAnalyticsRange] = useState<"30d" | "12m">("30d");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [assistantStats, setAssistantStats] = useState<{ sentiment: { positive: number; neutral: number; negative: number }; ctas: Record<string, number>; ctaClicks: number; totalConversations: number; totalMessages: number } | null>(null);

  // Overview needs to set workspace detail when clicking "View all"
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceStat | null>(null);
  // Overview needs to set conv filter
  const [convFilter, setConvFilter] = useState<"all" | "new" | "active" | "resolved" | "closed">("all");

  // Unified dismissed findings across audit sections
  const [dismissedFindings, setDismissedFindings] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try { const saved = localStorage.getItem("admin-dismissed-findings"); if (saved) return JSON.parse(saved); } catch { /* ignore */ }
    }
    return {};
  });
  const [showDismissed, setShowDismissed] = useState(false);

  function toggleDismissed(id: string) {
    setDismissedFindings((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("admin-dismissed-findings", JSON.stringify(next));
      return next;
    });
  }

  // ============================================================
  // DATA LOADERS
  // ============================================================

  const loadConversations = useCallback(async () => {
    try { const res = await adminFetch("get-conversations"); if (res.data) setConversations(res.data); } catch { /* handled */ }
  }, []);

  const loadOverview = useCallback(async () => {
    try { const res = await adminFetch("get-overview"); if (res.workspaces) { setWorkspaces(res.workspaces); setTotalUsers(res.totalUsers); setTotalContacts(res.totalContacts); } } catch { /* handled */ }
  }, []);

  const loadDemoSessions = useCallback(async () => {
    try { const res = await adminFetch("get-demo-sessions"); if (res.data) setDemoSessions(res.data); } catch { /* handled */ }
  }, []);

  const loadAnalytics = useCallback(async (range: "30d" | "12m") => {
    setAnalyticsLoading(true);
    try { const res = await adminFetch("get-analytics", { range }); if (res.data) setAnalyticsData(res.data); } catch { /* handled */ }
    setAnalyticsLoading(false);
  }, []);

  const loadPeople = useCallback(async () => {
    try { const res = await adminFetch("get-people"); if (res.data) setPeople(res.data); } catch { /* handled */ }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    try { const res = await adminFetch("get-announcements"); if (res.data) setAnnouncements(res.data); } catch { /* handled */ }
  }, []);

  const loadAssistantStats = useCallback(async () => {
    try { const stats = await adminFetch("get-assistant-stats"); setAssistantStats(stats); } catch { /* ignore */ }
  }, []);

  // Check auth
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get-overview" }) });
        if (res.ok) setAuthenticated(true);
      } catch { /* Not authenticated */ }
      setLoading(false);
    }
    checkAuth();
  }, []);

  // Load data on auth
  useEffect(() => {
    if (authenticated) {
      loadConversations();
      loadOverview();
      loadDemoSessions();
      loadPeople();
      loadAnnouncements();
      loadAnalytics("30d");
      loadAssistantStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, loadConversations, loadOverview, loadDemoSessions, loadPeople, loadAnnouncements]);

  // Poll conversations
  useEffect(() => {
    if (!authenticated) return;
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, [authenticated, loadConversations]);

  // ============================================================
  // HANDLERS
  // ============================================================

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "login", password, totpCode: totpCode || undefined }) });
      const data = await res.json();
      if (res.ok && data.requires2fa) {
        setNeeds2fa(true);
        setLoggingIn(false);
        return;
      }
      if (res.ok && data.success) { setAuthenticated(true); setNeeds2fa(false); setTotpCode(""); }
      else if (res.status === 403) setLoginError("Access denied from this location.");
      else setLoginError(data.error || "Invalid password.");
    } catch { setLoginError("Connection error."); }
    setLoggingIn(false);
  }

  function refreshAll() {
    loadConversations();
    loadOverview();
    loadDemoSessions();
    loadPeople();
    loadAnnouncements();
    loadAssistantStats();
  }

  // ============================================================
  // COMPUTED
  // ============================================================

  const newCount = conversations.filter((c) => c.status === "new").length;
  const subscriberCount = people.filter((p) => p.type === "subscriber" || p.type === "both").length;

  // ============================================================
  // RENDER: Loading / Login
  // ============================================================

  if (loading) {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>);
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm overflow-hidden">
          <div className="bg-gray-900 px-6 py-5 text-center">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3"><Lock className="w-6 h-6 text-white" /></div>
            <h1 className="text-lg font-bold text-white">Command Center</h1>
            <p className="text-sm text-white/50 mt-1">WorkChores Admin</p>
          </div>
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setLoginError(""); }} placeholder="Enter admin password" className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 text-gray-800 placeholder:text-gray-400" autoFocus />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            {/* 2FA code input */}
            {needs2fa && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">2FA Code</label>
                <input type="text" value={totpCode} onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setLoginError(""); }} placeholder="Enter 6-digit code" className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 text-gray-800 placeholder:text-gray-400 tracking-widest text-center font-mono text-lg" maxLength={6} autoFocus />
                <p className="text-[10px] text-gray-400 mt-1 text-center">From your authenticator app</p>
              </div>
            )}
            {loginError && (<div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"><AlertTriangle className="w-3.5 h-3.5 shrink-0" />{loginError}</div>)}
            <button type="submit" disabled={!password.trim() || loggingIn || (needs2fa && totpCode.length !== 6)} className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loggingIn ? "Authenticating..." : needs2fa ? "Verify & Sign In" : "Sign In"}
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
      {mobileSidebarOpen && (<div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />)}

      {/* Sidebar */}
      <aside className={`${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen bg-gray-900 text-white flex flex-col transition-all duration-200 ${sidebarCollapsed ? "w-16" : "w-60"}`}>
        <div className={`h-14 flex items-center border-b border-white/10 shrink-0 ${sidebarCollapsed ? "justify-center px-2" : "px-4 gap-3"}`}>
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0"><Zap className="w-4 h-4 text-white" /></div>
          {!sidebarCollapsed && (<div className="flex-1 min-w-0"><div className="text-sm font-bold truncate">WorkChores</div><div className="text-[10px] text-white/40">Command Center</div></div>)}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:block p-1 text-white/40 hover:text-white transition-colors">{sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}</button>
          <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden p-1 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {navGroups.map((group, gi) => {
            const isGroupCollapsed = collapsedGroups[group.label] || false;
            const hasActiveItem = group.items.some((nav) => section === nav.key);
            return (
              <div key={group.label} className={gi > 0 ? "mt-0.5" : ""}>
                {!sidebarCollapsed && (
                  <button onClick={() => setCollapsedGroups((prev) => ({ ...prev, [group.label]: !prev[group.label] }))} className="w-full flex items-center justify-between px-4 pt-3 pb-1.5 group cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-widest transition-colors ${hasActiveItem ? "text-white/50" : "text-white/25 group-hover:text-white/40"}`}>{group.label}</span>
                      {isGroupCollapsed && hasActiveItem && (<span className="w-1.5 h-1.5 rounded-full bg-white/50" />)}
                    </div>
                    <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${isGroupCollapsed ? "text-white/20 group-hover:text-white/40" : "rotate-90 text-white/30 group-hover:text-white/40"}`} />
                  </button>
                )}
                {sidebarCollapsed && gi > 0 && (<div className="mx-3 my-2 border-t border-white/10" />)}
                <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isGroupCollapsed && !sidebarCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"}`}>
                  <div className="space-y-0.5">
                    {group.items.map((nav) => {
                      const Icon = nav.icon;
                      const isActive = section === nav.key;
                      const badge = nav.key === "support" && newCount > 0 ? newCount : null;
                      return (
                        <button key={nav.key} onClick={() => { setSection(nav.key); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 transition-all ${sidebarCollapsed ? "justify-center px-2 py-2.5 mx-auto" : "px-4 py-2"} ${isActive ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`} title={sidebarCollapsed ? nav.label : undefined}>
                          <div className="relative shrink-0">
                            <Icon className="w-4.5 h-4.5" />
                            {badge && (<span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-1 flex items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">{badge}</span>)}
                          </div>
                          {!sidebarCollapsed && (
                            <>
                              <span className="text-sm font-medium flex-1 text-left">{nav.label}</span>
                              {badge && (<span className="min-w-[18px] h-4.5 px-1 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">{badge}</span>)}
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

        <div className={`border-t border-white/10 p-3 ${sidebarCollapsed ? "text-center" : ""}`}>
          {!sidebarCollapsed && (<div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-[10px] text-white/40">System Online</span></div>)}
          <button onClick={async () => { await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); setAuthenticated(false); }} className={`text-xs text-white/30 hover:text-red-400 transition-colors ${sidebarCollapsed ? "" : "w-full text-left"}`}>
            {sidebarCollapsed ? "Exit" : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-14 flex items-center px-4 sm:px-6 gap-3 shrink-0">
          <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700"><Menu className="w-5 h-5" /></button>
          <h1 className="text-sm font-bold text-gray-900 capitalize">{navGroups.flatMap((g) => g.items).find((n) => n.key === section)?.label || "Overview"}</h1>
          <div className="flex-1" />
          <button onClick={refreshAll} className="p-2 text-gray-400 hover:text-gray-700 transition-colors" title="Refresh all"><RefreshCw className="w-4 h-4" /></button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {section === "overview" && (
            <OverviewSection
              workspaces={workspaces}
              totalUsers={totalUsers}
              totalContacts={totalContacts}
              conversations={conversations}
              demoSessions={demoSessions}
              analyticsData={analyticsData}
              analyticsRange={analyticsRange}
              analyticsLoading={analyticsLoading}
              loadAnalytics={loadAnalytics}
              setAnalyticsRange={setAnalyticsRange}
              setSection={setSection}
              setConvFilter={setConvFilter}
              setSelectedWorkspace={(w) => { setSelectedWorkspace(w); setSection("workspaces"); }}
              subscriberCount={subscriberCount}
              assistantStats={assistantStats}
            />
          )}
          {section === "support" && <SupportSection conversations={conversations} loadConversations={loadConversations} />}
          {section === "revenue" && <RevenueSection workspaces={workspaces} />}
          {section === "workspaces" && <WorkspacesSection workspaces={workspaces} />}
          {section === "people" && <PeopleSection people={people} />}
          {section === "activity" && <ActivitySection />}
          {section === "health" && <HealthSection />}
          {section === "announcements" && <AnnouncementsSection announcements={announcements} onReload={loadAnnouncements} />}
          {section === "security" && <SecuritySection />}
          {section === "usage" && <UsageSection />}
          {section === "sales" && <SalesSection />}
          {section === "tech-debt" && <TechDebtSection dismissedFindings={dismissedFindings} showDismissed={showDismissed} toggleDismissed={toggleDismissed} setShowDismissed={setShowDismissed} />}
          {section === "ui-ux" && <UiuxSection dismissedFindings={dismissedFindings} showDismissed={showDismissed} toggleDismissed={toggleDismissed} setShowDismissed={setShowDismissed} />}
          {section === "seo" && <SeoSection dismissedFindings={dismissedFindings} showDismissed={showDismissed} toggleDismissed={toggleDismissed} setShowDismissed={setShowDismissed} />}
          {section === "metrics" && <MetricsSection />}
          {section === "valuation" && <ValuationSection />}
        </div>
      </main>
    </div>
  );
}
