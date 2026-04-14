"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  MessageSquare,
  CheckSquare,
  Search,
  Bell,
  Menu,
  X,
  ChevronLeft,
  Settings,
  Lightbulb,
  Clock,
  AlertTriangle,
  DollarSign,
  Phone,
  Eye,
  ChevronDown,
  Shield,
  Crown,
  User,
  Check,
  Calendar,
  ArrowRight,
  Trash2,
  Sparkles,
  Plus,
  Download,
  UserPlus,
  ListPlus,
  FileText,
  HelpCircle,
  Mail,
  MessageCircle,
  Upload,
  BarChart3,
  Save,
  Truck,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import PipelineView from "./views/pipeline-view";
import ContactsView from "./views/contacts-view";
import ActivityView from "./views/activity-view";
import TasksView from "./views/tasks-view";
import DashboardView from "./views/dashboard-view";
import ContactDetail from "./views/contact-detail";
import TaskDetail from "./views/task-detail";
import RecommendationsView from "./views/recommendations-view";
import CalendarView from "./views/calendar-view";
import ImportView from "./views/import-view";
import ExportView from "./views/export-view";
import ReportsView from "./views/reports-view";
import VendorsView from "./views/vendors-view";
import VendorDetail from "./views/vendor-detail";
import { defaultTemplates, type EmailTemplate } from "./email-templates";
import { ErrorBoundary } from "@/components/error-boundary";
import { getTheme, getThemeCssVars } from "@/lib/themes";
import { contacts as initialContacts, tasks as initialTasks, touchpoints as initialTouchpoints, stages as defaultStages, vendors as initialVendors, vendorContacts as initialVendorContacts, vendorNotes as initialVendorNotes, vendorContracts as initialVendorContracts, vendorTaxRecords as initialVendorTaxRecords, type Task, type Contact, type Touchpoint, type StageDefinition, type Vendor, type VendorContact, type VendorNote, type VendorContract, type VendorTax, getTaskStatus, formatDueDate, formatCurrency } from "./data";
import Onboarding from "./onboarding";
import { type IndustryPreset } from "./industry-presets";
import { trackEvent } from "@/lib/track-event";

type View = "dashboard" | "pipeline" | "contacts" | "activity" | "tasks" | "calendar" | "recommendations" | "reports" | "import" | "export" | "vendors" | "vendor-detail";

type NavItem = { id: View; label: string; icon: typeof LayoutDashboard };

const coreNavItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "pipeline", label: "Pipeline", icon: GitBranch },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
];

const moreNavItems: NavItem[] = [
  { id: "recommendations", label: "For You", icon: Lightbulb },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "activity", label: "Activity", icon: MessageSquare },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

const vendorNavItems: NavItem[] = [
  { id: "vendors", label: "All Vendors", icon: Truck },
];

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "member";
  avatar: string;
  avatarColor: string;
  status: "active" | "pending";
  ownerLabel: string; // maps to owner field in contacts/tasks/touchpoints
  reportsTo?: string; // team member id of their manager
}

type DemoRole = "admin" | "manager" | "member";

const roleConfig = {
  admin: { label: "Admin", icon: Crown, color: "text-red-700", bg: "bg-red-50 border-red-200" },
  manager: { label: "Manager", icon: Shield, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  member: { label: "Member", icon: User, color: "text-gray-600", bg: "bg-gray-50 border-gray-200" },
};

const defaultTeamMembers: TeamMember[] = [
  { id: "u1", name: "Alex Johnson", email: "alex@workchores.com", role: "admin", avatar: "AJ", avatarColor: "bg-accent", status: "active", ownerLabel: "You" },
  { id: "u2", name: "Lisa Park", email: "lisa@workchores.com", role: "manager", avatar: "LP", avatarColor: "bg-emerald-500", status: "active", ownerLabel: "Lisa", reportsTo: "u1" },
  { id: "u3", name: "Tom Martinez", email: "tom@workchores.com", role: "member", avatar: "TM", avatarColor: "bg-violet-500", status: "active", ownerLabel: "Tom", reportsTo: "u2" },
  { id: "u4", name: "Sarah Nguyen", email: "sarah.n@workchores.com", role: "member", avatar: "SN", avatarColor: "bg-pink-500", status: "active", ownerLabel: "Sarah N.", reportsTo: "u2" },
  { id: "u5", name: "James Cooper", email: "james@workchores.com", role: "member", avatar: "JC", avatarColor: "bg-sky-500", status: "pending", ownerLabel: "James", reportsTo: "u1" },
];

export interface CrmSyncCallbacks {
  saveContact?: (contact: Contact) => Promise<void>;
  deleteContact?: (id: string) => Promise<void>;
  saveTask?: (task: Task) => Promise<void>;
  deleteTask?: (id: string) => Promise<void>;
  saveTouchpoint?: (tp: Touchpoint) => Promise<void>;
  deleteTouchpoint?: (id: string) => Promise<void>;
  saveStages?: (stages: StageDefinition[]) => Promise<void>;
  saveWorkspaceName?: (name: string) => Promise<void>;
  saveWorkspaceTheme?: (theme: string) => Promise<void>;
  saveEnabledPlugins?: (plugins: string[]) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  saveAlertSettings?: (settings: any) => Promise<void>;
  saveCustomField?: (field: { id: string; label: string; type: string; options?: string[] }) => Promise<void>;
  deleteCustomField?: (id: string) => Promise<void>;
  saveCustomFieldValue?: (contactId: string, fieldId: string, value: string) => Promise<void>;
  saveTeamMembers?: (members: TeamMember[]) => Promise<void>;
  saveAllEmailTemplates?: (templates: EmailTemplate[]) => Promise<void>;
  saveDashboardKpis?: (kpiIds: string[]) => Promise<void>;
  saveSignature?: (signature: string) => Promise<void>;
  // Vendor Management
  saveVendor?: (vendor: Vendor) => Promise<void>;
  deleteVendor?: (id: string) => Promise<void>;
  saveVendorContact?: (contact: VendorContact) => Promise<void>;
  deleteVendorContact?: (id: string) => Promise<void>;
  saveVendorNote?: (note: VendorNote) => Promise<void>;
  deleteVendorNote?: (id: string) => Promise<void>;
  saveVendorContract?: (contract: VendorContract) => Promise<void>;
  deleteVendorContract?: (id: string) => Promise<void>;
  saveVendorTax?: (tax: VendorTax) => Promise<void>;
}

export interface CrmAppProps {
  mode?: "demo" | "live";
  initialData?: {
    contacts: Contact[];
    tasks: Task[];
    touchpoints: Touchpoint[];
    stages: StageDefinition[];
    teamMembers: TeamMember[];
    customFields: { id: string; label: string; type: "text" | "number" | "date" | "select"; options?: string[] }[];
    customFieldValues: Record<string, Record<string, string>>;
    alertSettings: {
      staleDays: number;
      atRiskTouchpoints: number;
      highValueThreshold: number;
      overdueAlerts: boolean;
      todayAlerts: boolean;
      negotiationAlerts: boolean;
      staleContactAlerts: boolean;
      atRiskAlerts: boolean;
    };
    companyName: string;
    industryId: string;
    userName: string;
    userEmail: string;
    userRole: "admin" | "manager" | "member";
    workspaceId?: string;
    plan?: "free" | "business";
    emailTemplates?: EmailTemplate[];
    dashboardKpis?: string[];
    emailSignature?: string;
    // Vendor Management
    vendors?: Vendor[];
    vendorContacts?: VendorContact[];
    vendorNotes?: VendorNote[];
    vendorContracts?: VendorContract[];
    vendorTaxRecords?: VendorTax[];
    theme?: string;
    enabledPlugins?: string[];
  };
  sync?: CrmSyncCallbacks;
}

export default function DemoApp({ mode = "demo", initialData, sync }: CrmAppProps = {}) {
  const isLive = mode === "live";

  // Onboarding state — null means show onboarding, once set we show the CRM
  // In live mode, we skip onboarding entirely
  const skipOnboarding = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("skip");
  const [onboarded, setOnboarded] = useState<{ preset: IndustryPreset; companyName: string } | null>(
    isLive || skipOnboarding ? { preset: { id: initialData?.industryId || "b2b" } as IndustryPreset, companyName: initialData?.companyName || "Acme Sales" } : null
  );
  const [industryId, setIndustryId] = useState(initialData?.industryId || "b2b");
  const [demoUserName, setDemoUserName] = useState(initialData?.userName || "Alex Johnson");
  const [demoUserEmail, setDemoUserEmail] = useState(initialData?.userEmail || "");

  // Demo role switcher — lets user preview different permission levels
  // In live mode, role is fixed from the workspace membership
  const [demoRole, setDemoRole] = useState<DemoRole>(initialData?.userRole || "admin");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Team members (lifted here for data filtering)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialData?.teamMembers || defaultTeamMembers);

  function handleOnboardingComplete(preset: IndustryPreset, name: string, userName: string, userEmail: string) {
    setOnboarded({ preset, companyName: name });
    setIndustryId(preset.id);
    if (userName) setDemoUserName(userName);
    if (userEmail) setDemoUserEmail(userEmail);

    // Extract email domain and update all team member emails
    const domain = userEmail ? userEmail.split("@")[1] : "";
    const initials = userName
      ? userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
      : "AJ";
    setTeamMembers((prev) =>
      prev.map((m) => {
        if (m.ownerLabel === "You") {
          return { ...m, name: userName || m.name, email: userEmail || m.email, avatar: initials };
        }
        if (domain) {
          const firstName = m.name.split(" ")[0].toLowerCase();
          return { ...m, email: `${firstName}@${domain}` };
        }
        return m;
      })
    );

    // Initialize all state from the selected preset
    setContactState(preset.contacts);
    setTouchpointState(preset.touchpoints);
    setTaskState(preset.tasks);
    setPipelineStages(preset.stages);
    setCompanyName(name);
    setCustomFields(preset.customFields.map((f) => ({ id: f.id, label: f.label, type: f.type, options: f.options })));
    // Initialize custom field values as empty for each contact
    const values: Record<string, Record<string, string>> = {};
    preset.contacts.forEach((c) => {
      values[c.id] = {};
    });
    setCustomFieldValues(values);
  }

  const [view, setView] = useState<View>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(224); // 14rem = 224px default
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [creatingContact, setCreatingContact] = useState(false);
  const [unsavedContactPrompt, setUnsavedContactPrompt] = useState<{ action: () => void } | null>(null);
  const [moreNavExpanded, setMoreNavExpanded] = useState(false);
  const [dataMenuOpen, setDataMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dataMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Contact state lifted here so contact detail can modify it
  const [contactState, setContactState] = useState(initialData?.contacts || initialContacts);

  // Touchpoint state lifted here so contact detail can add new ones
  const [touchpointState, setTouchpointState] = useState(initialData?.touchpoints || initialTouchpoints);

  // Auto-navigate to billing when returning from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("plan") && params.get("session_id")) {
      window.location.href = "/app/settings?plan=1&session_id=" + params.get("session_id");
    }
  }, []);

  // Company name (shared between sidebar and settings)
  const [companyName, setCompanyName] = useState(initialData?.companyName || "WorkChores");

  // Workspace theme
  const [workspaceTheme, setWorkspaceTheme] = useState(initialData?.theme || "blue");

  // Enabled plugins
  const [enabledPlugins, setEnabledPlugins] = useState<string[]>(initialData?.enabledPlugins || ["crm", "vendors", "tasks"]);

  // Alert settings (configurable thresholds)
  const [alertSettings, setAlertSettings] = useState(initialData?.alertSettings || {
    staleDays: 14,
    atRiskTouchpoints: 1,
    highValueThreshold: 10000,
    overdueAlerts: true,
    todayAlerts: true,
    negotiationAlerts: true,
    staleContactAlerts: true,
    atRiskAlerts: true,
  });

  // Email templates
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(
    initialData?.emailTemplates && initialData.emailTemplates.length > 0
      ? initialData.emailTemplates
      : defaultTemplates
  );

  // Dashboard KPI selection
  const [dashboardKpis, setDashboardKpis] = useState<string[]>(initialData?.dashboardKpis || []);

  // Email signature (per user)
  const [emailSignature, setEmailSignature] = useState(initialData?.emailSignature || "");

  // Vendor Management
  const [vendorState, setVendorState] = useState<Vendor[]>(initialData?.vendors || initialVendors);
  const [vendorContactState, setVendorContactState] = useState<VendorContact[]>(initialData?.vendorContacts || initialVendorContacts);
  const [vendorNoteState, setVendorNoteState] = useState<VendorNote[]>(initialData?.vendorNotes || initialVendorNotes);
  const [vendorContractState, setVendorContractState] = useState<VendorContract[]>(initialData?.vendorContracts || initialVendorContracts);
  const [vendorTaxState, setVendorTaxState] = useState<VendorTax[]>(initialData?.vendorTaxRecords || initialVendorTaxRecords);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // Plan enforcement (live mode only)
  const [workspacePlan, setWorkspacePlan] = useState<"free" | "business">(initialData?.plan || "free");
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Custom fields (workspace-level definitions + per-contact values)
  const [customFields, setCustomFields] = useState<{ id: string; label: string; type: "text" | "number" | "date" | "select"; options?: string[] }[]>(initialData?.customFields || []);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, Record<string, string>>>(initialData?.customFieldValues || {});

  // Pipeline stages (customizable funnel)
  const [pipelineStages, setPipelineStages] = useState<StageDefinition[]>(initialData?.stages || defaultStages);

  // Task state lifted here so task detail can modify it
  const [taskState, setTaskState] = useState(initialData?.tasks || initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [creatingTask, setCreatingTask] = useState(false);

  // Data filtering based on demo role
  const visibleOwnerLabels = useMemo(() => {
    if (demoRole === "admin") return null; // null = show all
    const currentUser = teamMembers.find((m) => m.ownerLabel === "You");
    if (!currentUser) return ["You"];
    if (demoRole === "manager") {
      const labels = ["You"];
      teamMembers.forEach((m) => {
        if (m.reportsTo === currentUser.id) labels.push(m.ownerLabel);
      });
      return labels;
    }
    return ["You"]; // member: own data only
  }, [demoRole, teamMembers]);

  // Active contacts: exclude trashed and archived
  const filteredContacts = useMemo(() => {
    let list = contactState.filter((c) => !c.trashedAt && !c.archived);
    if (visibleOwnerLabels) list = list.filter((c) => visibleOwnerLabels.includes(c.owner));
    return list;
  }, [contactState, visibleOwnerLabels]);

  // Archived contacts
  const archivedContacts = useMemo(() => {
    let list = contactState.filter((c) => c.archived && !c.trashedAt);
    if (visibleOwnerLabels) list = list.filter((c) => visibleOwnerLabels.includes(c.owner));
    return list;
  }, [contactState, visibleOwnerLabels]);

  // Trashed contacts
  const trashedContacts = useMemo(() => {
    let list = contactState.filter((c) => !!c.trashedAt);
    if (visibleOwnerLabels) list = list.filter((c) => visibleOwnerLabels.includes(c.owner));
    return list;
  }, [contactState, visibleOwnerLabels]);

  const filteredTasks = useMemo(() => {
    if (!visibleOwnerLabels) return taskState;
    return taskState.filter((t) => visibleOwnerLabels.includes(t.owner));
  }, [taskState, visibleOwnerLabels]);

  const filteredTouchpoints = useMemo(() => {
    if (!visibleOwnerLabels) return touchpointState;
    return touchpointState.filter((t) => visibleOwnerLabels.includes(t.owner));
  }, [touchpointState, visibleOwnerLabels]);

  // Filtered vendors (same role-based pattern)
  const filteredVendors = useMemo(() => {
    if (!visibleOwnerLabels) return vendorState;
    return vendorState.filter((v) => visibleOwnerLabels.includes(v.owner));
  }, [vendorState, visibleOwnerLabels]);

  // Task filter state lifted here so it persists when navigating to/from detail
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "overdue" | "today" | "upcoming" | "later" | "completed">("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [taskOwnerFilter, setTaskOwnerFilter] = useState("All");
  const [taskSourceFilter, setTaskSourceFilter] = useState<"all" | "crm" | "vendors" | "hr" | "budget" | "tasks">("all");

  // Plan enforcement — show upgrade modal when free plan exceeds limits
  // Uses ALL contacts (not filtered by role) since it's a workspace-wide limit
  const activeContactCount = useMemo(() => contactState.filter((c) => !c.trashedAt && !c.archived).length, [contactState]);
  const activeTeamMemberCount = teamMembers.filter((m) => m.status === "active").length;
  const contactLimitReached = isLive && workspacePlan === "free" && activeContactCount >= 100;
  const memberLimitReached = isLive && workspacePlan === "free" && activeTeamMemberCount >= 3;
  const anyLimitReached = contactLimitReached || memberLimitReached;

  // Conversion banner
  const [showConversionBanner, setShowConversionBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (isLive || bannerDismissed) return;
    const timer = setTimeout(() => setShowConversionBanner(true), 60000);
    return () => clearTimeout(timer);
  }, [bannerDismissed, isLive]);

  // ============================================
  // Demo session tracking
  // ============================================
  const demoSessionId = useRef<string | null>(null);
  const demoStartTime = useRef(Date.now());
  const demoActiveSeconds = useRef(0);
  const demoLastTick = useRef(Date.now());
  const demoPagesVisited = useRef<Set<string>>(new Set(["dashboard"]));
  const demoFeaturesUsed = useRef<Set<string>>(new Set());

  // Start demo session when onboarding completes (demo mode only)
  useEffect(() => {
    if (isLive || !onboarded || demoSessionId.current) return;
    async function startSession() {
      try {
        const res = await fetch("/api/demo-track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            email: demoUserEmail,
            name: demoUserName,
            industry: industryId,
            referrer: typeof document !== "undefined" ? document.referrer : "",
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          }),
        });
        const data = await res.json();
        if (data.sessionId) demoSessionId.current = data.sessionId;
      } catch { /* silent */ }
    }
    startSession();
  }, [isLive, onboarded, demoUserEmail, demoUserName, industryId]);

  // Active time tracker — counts seconds only when page is visible
  useEffect(() => {
    if (isLive) return;
    // Tick every second to accumulate active time
    const ticker = setInterval(() => {
      if (!document.hidden) {
        demoActiveSeconds.current += 1;
      }
    }, 1000);

    // Heartbeat every 30s (sends active time to server)
    const heartbeat = setInterval(() => {
      if (!demoSessionId.current) return;
      fetch("/api/demo-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "heartbeat",
          sessionId: demoSessionId.current,
          durationSeconds: demoActiveSeconds.current,
          pagesVisited: Array.from(demoPagesVisited.current),
          featuresUsed: Array.from(demoFeaturesUsed.current),
        }),
      }).catch(() => {});
    }, 30000);

    // Send final heartbeat on page unload
    function handleUnload() {
      if (!demoSessionId.current) return;
      navigator.sendBeacon("/api/demo-track", JSON.stringify({
        action: "heartbeat",
        sessionId: demoSessionId.current,
        durationSeconds: demoActiveSeconds.current,
        pagesVisited: Array.from(demoPagesVisited.current),
        featuresUsed: Array.from(demoFeaturesUsed.current),
      }));
    }
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(ticker);
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [isLive, onboarded]);

  // Track page visits
  useEffect(() => {
    if (!isLive) demoPagesVisited.current.add(view);
  }, [view, isLive]);

  // Track signup clicks
  function trackSignupClick() {
    if (isLive || !demoSessionId.current) return;
    demoFeaturesUsed.current.add("signup_click");
    fetch("/api/demo-track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signup_click", sessionId: demoSessionId.current }),
    }).catch(() => {});
  }

  // Track feature usage
  function trackFeature(feature: string) {
    if (isLive) return;
    demoFeaturesUsed.current.add(feature);
  }

  // Sidebar drag resize
  useEffect(() => {
    if (!isDraggingSidebar) return;

    function handleMouseMove(e: MouseEvent) {
      const newWidth = Math.min(Math.max(e.clientX, 64), 400); // min 64px (collapsed), max 400px
      if (newWidth <= 80) {
        setSidebarCollapsed(true);
        setSidebarWidth(64);
      } else {
        setSidebarCollapsed(false);
        setSidebarWidth(newWidth);
      }
    }

    function handleMouseUp() {
      setIsDraggingSidebar(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSidebar]);

  // Clear sample data handler
  function handleClearSampleData() {
    setContactState([]);
    setTaskState([]);
    setTouchpointState([]);
    setCustomFieldValues({});
    setCustomFields([]);
    setSelectedContactId(null);
    setSelectedTaskId(null);
    // Keep only the current user (u1), remove all other team members
    setTeamMembers((prev) => prev.filter((m) => m.id === "u1"));
    setView("dashboard");
  }

  // Global search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTrackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Quick-add dropdown
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const quickAddRef = useRef<HTMLDivElement>(null);

  // Support panel
  const [supportOpen, setSupportOpen] = useState(false);
  const supportRef = useRef<HTMLDivElement>(null);

  // Notifications
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Announcements (live mode only)
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; message: string; type: string; created_at: string }[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLive) return;
    async function fetchAnnouncements() {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data = await res.json();
          if (data.data) setAnnouncements(data.data);
        }
      } catch { /* non-blocking */ }
    }
    fetchAnnouncements();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnnouncements, 300000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Load dismissed from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("dismissed-announcements");
    if (stored) {
      try { setDismissedAnnouncements(new Set(JSON.parse(stored))); } catch { /* ignore */ }
    }
  }, []);

  const activeAnnouncements = announcements.filter((a) => !dismissedAnnouncements.has(a.id));
  const topBannerAnnouncement = activeAnnouncements[0] || null;

  function dismissAnnouncement(id: string) {
    setDismissedAnnouncements((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("dismissed-announcements", JSON.stringify([...next]));
      return next;
    });
  }

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { contacts: [], tasks: [] };
    const q = searchQuery.toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    return {
      contacts: filteredContacts.filter(
        (c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (qDigits.length >= 3 && c.phone.replace(/\D/g, "").includes(qDigits)) || c.role.toLowerCase().includes(q) || c.tags.some((tag) => tag.toLowerCase().includes(q)) || c.stage.toLowerCase().includes(q)
      ).slice(0, 5),
      tasks: filteredTasks.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
      ).slice(0, 5),
    };
  }, [searchQuery, filteredContacts, filteredTasks]);

  const hasResults = searchResults.contacts.length > 0 || searchResults.tasks.length > 0;

  // Urgent count for "For You" badge
  // Dynamic owner labels from team members (for dropdowns)
  const ownerLabels = useMemo(() => teamMembers.filter((m) => m.status === "active").map((m) => m.ownerLabel), [teamMembers]);

  const urgentCount = useMemo(() => {
    const activeContacts = filteredContacts.filter((c) => !c.stage.toLowerCase().includes("won") && !c.stage.toLowerCase().includes("lost"));
    let count = 0;
    // Overdue tasks (any priority)
    if (alertSettings.overdueAlerts) {
      count += filteredTasks.filter((t) => t.due && getTaskStatus(t.due, t.completed) === "overdue").length;
    }
    // Negotiation deals
    if (alertSettings.negotiationAlerts) {
      count += activeContacts.filter((c) => c.stage.toLowerCase().includes("negotiation")).length;
    }
    // Proposal deals going cold (limited touchpoints)
    if (alertSettings.atRiskAlerts) {
      count += activeContacts.filter((c) => {
        if (c.stage !== "Proposal") return false;
        return filteredTouchpoints.filter((t) => t.contactId === c.id).length <= alertSettings.atRiskTouchpoints;
      }).length;
    }
    // Tasks due today (any priority)
    if (alertSettings.todayAlerts) {
      count += filteredTasks.filter((t) => t.due && getTaskStatus(t.due, t.completed) === "today").length;
    }
    return count;
  }, [filteredContacts, filteredTasks, filteredTouchpoints, alertSettings]);

  const notifications = useMemo(() => {
    const notifs: { id: string; icon: "overdue" | "today" | "risk" | "deal" | "touchpoint"; title: string; detail: string; time: string; contactId?: string; taskId?: string }[] = [];
    // Overdue tasks
    if (alertSettings.overdueAlerts) {
      filteredTasks.filter((t) => t.due && getTaskStatus(t.due, t.completed) === "overdue").forEach((t) => {
        const c = filteredContacts.find((c) => c.id === t.contactId);
        notifs.push({ id: `n-ov-${t.id}`, icon: "overdue", title: `Task overdue: ${t.title}`, detail: c ? `${c.name} · ${t.priority}` : t.priority, time: formatDueDate(t.due), contactId: t.contactId, taskId: t.id });
      });
    }
    // Tasks due today
    if (alertSettings.todayAlerts) {
      filteredTasks.filter((t) => t.due && getTaskStatus(t.due, t.completed) === "today").forEach((t) => {
        const c = filteredContacts.find((c) => c.id === t.contactId);
        notifs.push({ id: `n-td-${t.id}`, icon: "today", title: `Due today: ${t.title}`, detail: c ? `${c.name}` : "", time: "Today", contactId: t.contactId, taskId: t.id });
      });
    }
    // Negotiation deals
    if (alertSettings.negotiationAlerts) {
      filteredContacts.filter((c) => c.stage.toLowerCase().includes("negotiation")).forEach((c) => {
        notifs.push({ id: `n-deal-${c.id}`, icon: "deal", title: `${c.name} in Negotiation`, detail: `${c.company} · ${formatCurrency(c.value)}`, time: "Action needed", contactId: c.id });
      });
    }
    // Recent touchpoints (last 3)
    filteredTouchpoints.slice(0, 3).forEach((t) => {
      const c = filteredContacts.find((c) => c.id === t.contactId);
      notifs.push({ id: `n-tp-${t.id}`, icon: "touchpoint", title: t.title, detail: c ? `${c.name} · ${t.type}` : t.type, time: t.date, contactId: t.contactId });
    });
    return notifs.slice(0, 8);
  }, [filteredTasks, filteredContacts, filteredTouchpoints, alertSettings]);

  const actionableNotifCount = notifications.filter((n) => n.icon !== "touchpoint").length + activeAnnouncements.length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (dataMenuRef.current && !dataMenuRef.current.contains(e.target as Node)) {
        setDataMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setQuickAddOpen(false);
      }
      if (supportRef.current && !supportRef.current.contains(e.target as Node)) {
        setSupportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Placeholder contact for "create new" mode (not saved until user clicks Save)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const newContactPlaceholder: Contact = useMemo(() => ({
    id: genId(),
    name: "New Contact",
    email: "",
    company: "",
    role: "",
    phone: "",
    avatar: "NC",
    avatarColor: ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500", "bg-cyan-500", "bg-amber-500", "bg-indigo-500", "bg-teal-500", "bg-pink-500", "bg-sky-500"][contactState.length % 10],
    stage: pipelineStages[0]?.label ?? "Lead",
    value: 0,
    owner: "You",
    lastContact: new Date().toISOString().slice(0, 10),
    created: new Date().toISOString().slice(0, 10),
    tags: [],
  }), [creatingContact]);

  const selectedContact = creatingContact
    ? newContactPlaceholder
    : selectedContactId
    ? filteredContacts.find((c) => c.id === selectedContactId) ?? null
    : null;

  const selectedTask = selectedTaskId
    ? filteredTasks.find((t) => t.id === selectedTaskId) ?? null
    : null;

  const isTaskDetail = view === "tasks" && (selectedTaskId !== null || creatingTask);

  function handleSelectContact(id: string) {
    setSelectedContactId(id);
  }

  function doLeaveContact() {
    setSelectedContactId(null);
    setCreatingContact(false);
    setUnsavedContactPrompt(null);
  }

  function handleBack() {
    if (creatingContact) {
      setUnsavedContactPrompt({ action: doLeaveContact });
      return;
    }
    setSelectedContactId(null);
  }

  function handleNavigate(v: View) {
    if (creatingContact) {
      setUnsavedContactPrompt({
        action: () => {
          setView(v);
          setSelectedContactId(null);
          setSelectedTaskId(null);
          setCreatingTask(false);
          setCreatingContact(false);
          setSidebarOpen(false);
          setUnsavedContactPrompt(null);
          if (isLive) trackEvent(`nav.${v}`);
        },
      });
      return;
    }
    setView(v);
    setSelectedContactId(null);
    setSelectedTaskId(null);
    setCreatingTask(false);
    setCreatingContact(false);
    setSidebarOpen(false);
    if (isLive) trackEvent(`nav.${v}`);
  }

  const avatarColors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500", "bg-cyan-500", "bg-amber-500", "bg-indigo-500", "bg-teal-500", "bg-pink-500", "bg-sky-500"];

  // Generate IDs: always use UUIDs for Supabase compatibility
  function genId() {
    return crypto.randomUUID();
  }

  const [showLimitToast, setShowLimitToast] = useState<string | null>(null);

  // ── Vendor handlers ──
  function handleAddVendor(vendor: Vendor) {
    setVendorState((prev) => [vendor, ...prev]);
    sync?.saveVendor?.(vendor);
  }
  function handleDeleteVendor(id: string) {
    setVendorState((prev) => prev.filter((v) => v.id !== id));
    setVendorContactState((prev) => prev.filter((c) => c.vendorId !== id));
    setVendorNoteState((prev) => prev.filter((n) => n.vendorId !== id));
    setVendorContractState((prev) => prev.filter((c) => c.vendorId !== id));
    setVendorTaxState((prev) => prev.filter((t) => t.vendorId !== id));
    sync?.deleteVendor?.(id);
  }
  function handleUpdateVendor(vendor: Vendor) {
    setVendorState((prev) => prev.map((v) => (v.id === vendor.id ? vendor : v)));
    sync?.saveVendor?.(vendor);
  }
  function handleAddVendorContact(contact: VendorContact) {
    setVendorContactState((prev) => [...prev, contact]);
    sync?.saveVendorContact?.(contact);
  }
  function handleDeleteVendorContact(id: string) {
    setVendorContactState((prev) => prev.filter((c) => c.id !== id));
    sync?.deleteVendorContact?.(id);
  }
  function handleAddVendorNote(note: VendorNote) {
    setVendorNoteState((prev) => [note, ...prev]);
    sync?.saveVendorNote?.(note);
  }
  function handleDeleteVendorNote(id: string) {
    setVendorNoteState((prev) => prev.filter((n) => n.id !== id));
    sync?.deleteVendorNote?.(id);
  }
  function handleAddVendorContract(contract: VendorContract) {
    setVendorContractState((prev) => [contract, ...prev]);
    sync?.saveVendorContract?.(contract);
  }
  function handleDeleteVendorContract(id: string) {
    setVendorContractState((prev) => prev.filter((c) => c.id !== id));
    sync?.deleteVendorContract?.(id);
  }
  function handleUpdateVendorTax(tax: VendorTax) {
    setVendorTaxState((prev) => {
      const idx = prev.findIndex((t) => t.vendorId === tax.vendorId);
      if (idx >= 0) { const next = [...prev]; next[idx] = tax; return next; }
      return [...prev, tax];
    });
    sync?.saveVendorTax?.(tax);
  }
  function handleSelectVendor(id: string) {
    setSelectedVendorId(id);
    setView("vendor-detail");
  }

  function handleNewContact() {
    if (contactLimitReached) {
      setShowLimitToast("You've reached the 100 contact limit on the free plan. Upgrade to add more.");
      setTimeout(() => setShowLimitToast(null), 4000);
      return;
    }
    trackFeature("create_contact");
    setSelectedContactId(null);
    setCreatingContact(true);
  }

  function handleNewActivity() {
    trackFeature("log_activity");
    const newTp: Touchpoint = {
      id: genId(),
      contactId: filteredContacts[0]?.id ?? "",
      type: "note",
      title: "New note",
      description: "",
      date: new Date().toISOString().slice(0, 10),
      owner: "You",
    };
    setTouchpointState((prev) => [newTp, ...prev]);
    setView("activity");
    sync?.saveTouchpoint?.(newTp);
  }

  function handleSaveContact(updated: Contact) {
    if (creatingContact) {
      // New contact — add to state for the first time
      updated = { ...updated, stageChangedAt: new Date().toISOString() };
      setContactState((prev) => [updated, ...prev]);
      setCreatingContact(false);
      setSelectedContactId(updated.id);
      if (isLive) trackEvent("contact.created");
    } else {
      setContactState((prev) =>
        prev.map((c) => {
          if (c.id === updated.id) {
            // Track stage changes
            if (c.stage !== updated.stage) {
              updated = { ...updated, stageChangedAt: new Date().toISOString() };
            }
            return updated;
          }
          return c;
        })
      );
    }
    sync?.saveContact?.(updated);
  }

  function handleUpdateContact(id: string, updates: Partial<Contact>) {
    setContactState((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = {
            ...c,
            ...updates,
            ...(updates.stage && updates.stage !== c.stage ? { stageChangedAt: new Date().toISOString() } : {}),
          };
          sync?.saveContact?.(updated);
          return updated;
        }
        return c;
      })
    );
  }

  function handleArchiveContact(id: string) {
    setContactState((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const archived = { ...c, archived: true };
          sync?.saveContact?.(archived);
          return archived;
        }
        return c;
      })
    );
    setSelectedContactId(null);
  }

  function handleUnarchiveContact(id: string) {
    setContactState((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const unarchived = { ...c, archived: false };
          sync?.saveContact?.(unarchived);
          return unarchived;
        }
        return c;
      })
    );
  }

  function handleDeleteContact(id: string) {
    // Soft-delete: move to trash (clears archived flag too)
    setContactState((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const trashed = { ...c, archived: false, trashedAt: new Date().toISOString() };
          sync?.saveContact?.(trashed);
          return trashed;
        }
        return c;
      })
    );
    setSelectedContactId(null);
  }

  function handleTrashArchivedContact(id: string) {
    // Move from archived → trash
    setContactState((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const trashed = { ...c, archived: false, trashedAt: new Date().toISOString() };
          sync?.saveContact?.(trashed);
          return trashed;
        }
        return c;
      })
    );
  }

  function handleRestoreContact(id: string) {
    setContactState((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const restored = { ...c, trashedAt: undefined };
          sync?.saveContact?.(restored);
          return restored;
        }
        return c;
      })
    );
  }

  function handlePermanentlyDeleteContact(id: string) {
    setContactState((prev) => prev.filter((c) => c.id !== id));
    setTaskState((prev) => prev.filter((t) => t.contactId !== id));
    setTouchpointState((prev) => prev.filter((tp) => tp.contactId !== id));
    sync?.deleteContact?.(id);
  }

  function handleEmptyTrash() {
    const trashedIds = contactState.filter((c) => c.trashedAt).map((c) => c.id);
    setContactState((prev) => prev.filter((c) => !c.trashedAt));
    setTaskState((prev) => prev.filter((t) => !trashedIds.includes(t.contactId)));
    setTouchpointState((prev) => prev.filter((tp) => !trashedIds.includes(tp.contactId)));
    trashedIds.forEach((id) => sync?.deleteContact?.(id));
  }

  function handleBulkArchive(ids: string[]) {
    setContactState((prev) =>
      prev.map((c) => {
        if (ids.includes(c.id)) {
          const updated = { ...c, archived: true };
          sync?.saveContact?.(updated);
          return updated;
        }
        return c;
      })
    );
  }

  function handleBulkTrash(ids: string[]) {
    const now = new Date().toISOString();
    setContactState((prev) =>
      prev.map((c) => {
        if (ids.includes(c.id)) {
          const updated = { ...c, trashedAt: now };
          sync?.saveContact?.(updated);
          return updated;
        }
        return c;
      })
    );
  }

  function handleBulkChangeStage(ids: string[], stage: string) {
    setContactState((prev) =>
      prev.map((c) => {
        if (ids.includes(c.id)) {
          const updated = { ...c, stage };
          sync?.saveContact?.(updated);
          return updated;
        }
        return c;
      })
    );
  }

  function handleBulkReassign(ids: string[], owner: string) {
    setContactState((prev) =>
      prev.map((c) => {
        if (ids.includes(c.id)) {
          const updated = { ...c, owner };
          sync?.saveContact?.(updated);
          return updated;
        }
        return c;
      })
    );
  }

  function handleToggleTask(id: string) {
    setTaskState((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== id) return t;
        const nowCompleted = !t.completed;
        if (isLive && nowCompleted) trackEvent("task.completed");
        return {
          ...t,
          completed: nowCompleted,
          completedAt: nowCompleted ? new Date().toISOString() : undefined,
        };
      });
      const task = updated.find((t) => t.id === id);
      if (task) sync?.saveTask?.(task);
      return updated;
    });
  }

  function handleSelectTask(id: string) {
    setSelectedTaskId(id);
    setCreatingTask(false);
  }

  function handleNewTask() {
    trackFeature("create_task");
    setSelectedTaskId(null);
    setCreatingTask(true);
  }

  function handleTaskBack() {
    setSelectedTaskId(null);
    setCreatingTask(false);
  }

  function handleSaveTask(task: Task) {
    setTaskState((prev) => {
      const exists = prev.find((t) => t.id === task.id);
      if (exists) {
        return prev.map((t) => (t.id === task.id ? task : t));
      }
      if (isLive) trackEvent("task.created");
      return [...prev, task];
    });
    setSelectedTaskId(null);
    setCreatingTask(false);
    sync?.saveTask?.(task);
  }

  function handleDeleteTask(id: string) {
    setTaskState((prev) => prev.filter((t) => t.id !== id));
    setSelectedTaskId(null);
    sync?.deleteTask?.(id);
  }

  function handleAddTouchpoint(touchpoint: Touchpoint) {
    setTouchpointState((prev) => [touchpoint, ...prev]);
    sync?.saveTouchpoint?.(touchpoint);
  }

  function handleAddTaskFromContact(task: Task) {
    setTaskState((prev) => [...prev, task]);
    sync?.saveTask?.(task);
  }

  function handleUpdateTouchpoint(touchpoint: Touchpoint) {
    setTouchpointState((prev) => prev.map((t) => (t.id === touchpoint.id ? touchpoint : t)));
    sync?.saveTouchpoint?.(touchpoint);
  }

  function handleDeleteTouchpoint(id: string) {
    setTouchpointState((prev) => prev.filter((t) => t.id !== id));
    sync?.deleteTouchpoint?.(id);
  }

  function handleUpdateTaskFromContact(task: Task) {
    setTaskState((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    sync?.saveTask?.(task);
  }

  function handleDeleteTaskFromContact(id: string) {
    setTaskState((prev) => prev.filter((t) => t.id !== id));
    sync?.deleteTask?.(id);
  }

  function handleUpdateStages(newStages: StageDefinition[], reassignments?: Record<string, string>) {
    setPipelineStages(newStages);
    sync?.saveStages?.(newStages);
    if (reassignments && Object.keys(reassignments).length > 0) {
      setContactState((prev) =>
        prev.map((c) => {
          if (reassignments[c.stage]) {
            const updated = { ...c, stage: reassignments[c.stage] };
            sync?.saveContact?.(updated);
            return updated;
          }
          return c;
        })
      );
    }
  }

  // Custom field handlers with sync
  function handleUpdateCustomFields(fields: typeof customFields) {
    // Diff to find added/removed fields
    const oldIds = new Set(customFields.map((f) => f.id));
    const newIds = new Set(fields.map((f) => f.id));

    // Sync new or updated fields
    fields.forEach((f) => {
      if (!oldIds.has(f.id) || JSON.stringify(customFields.find((cf) => cf.id === f.id)) !== JSON.stringify(f)) {
        sync?.saveCustomField?.(f);
      }
    });

    // Sync deleted fields
    customFields.forEach((f) => {
      if (!newIds.has(f.id)) {
        sync?.deleteCustomField?.(f.id);
      }
    });

    setCustomFields(fields);
  }

  function handleUpdateCustomFieldValues(values: Record<string, Record<string, string>>) {
    // Sync changed values
    Object.entries(values).forEach(([contactId, fieldValues]) => {
      Object.entries(fieldValues).forEach(([fieldId, value]) => {
        const old = customFieldValues[contactId]?.[fieldId];
        if (old !== value) {
          sync?.saveCustomFieldValue?.(contactId, fieldId, value);
        }
      });
    });

    setCustomFieldValues(values);
  }

  function handleReassignAndRemoveMember(memberId: string, reassignToLabel: string) {
    const member = teamMembers.find((m) => m.id === memberId);
    if (!member) return;
    const oldLabel = member.ownerLabel;
    setContactState((prev) => prev.map((c) => c.owner === oldLabel ? { ...c, owner: reassignToLabel } : c));
    setTaskState((prev) => prev.map((t) => t.owner === oldLabel ? { ...t, owner: reassignToLabel } : t));
    setTouchpointState((prev) => prev.map((tp) => tp.owner === oldLabel ? { ...tp, owner: reassignToLabel } : tp));
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));

    // Sync Stripe seat count after removal (live mode only)
    if (isLive && initialData?.workspaceId) {
      fetch("/api/stripe/sync-seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: initialData.workspaceId }),
      }).catch(() => {});
    }
  }

  const viewLabel = view === "recommendations" ? "For You" : view === "import" ? "Import Contacts" : view === "export" ? "Export Data" : view === "reports" ? "Reports" : view === "vendors" ? "All Vendors" : view === "vendor-detail" ? "Vendor Detail" : view;
  const headerLabel = isTaskDetail
    ? (creatingTask ? "New Task" : "Edit Task")
    : selectedContact
    ? null
    : viewLabel;

  // Show onboarding if not yet completed
  if (!onboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="h-screen flex bg-surface overflow-hidden font-[family-name:var(--font-geist-sans)]" style={getThemeCssVars(getTheme(workspaceTheme)) as React.CSSProperties}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed lg:relative z-40 lg:z-auto top-0 bottom-0 left-0 bg-white border-r border-border flex flex-col ${
          isDraggingSidebar ? "" : "transition-[width] duration-200"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ width: sidebarWidth }}
      >
        {/* Logo + collapse toggle */}
        <div className={`flex items-center h-14 border-b border-border shrink-0 ${sidebarCollapsed ? "lg:justify-center lg:px-0 px-5" : "px-5"} gap-2`}>
          <span className={`font-semibold text-foreground truncate ${sidebarCollapsed ? "lg:hidden" : ""}`}>
            {companyName}
          </span>
          <div className={`flex items-center gap-1 ${sidebarCollapsed ? "" : "ml-auto"}`}>
            <button
              onClick={() => {
                const next = !sidebarCollapsed;
                setSidebarCollapsed(next);
                setSidebarWidth(next ? 64 : 224);
              }}
              className={`hidden lg:flex p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-gray-100 transition-colors`}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-muted hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 px-3 overflow-y-auto">
          {/* CRM section header */}
          {!sidebarCollapsed && (
            <div className="px-3 pb-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">CRM</div>
          )}
          {/* Core */}
          <div className="space-y-0.5">
            {coreNavItems.filter((item) => item.id !== "tasks" || enabledPlugins.includes("tasks")).map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 py-2 rounded-lg text-sm transition-colors ${
                  sidebarCollapsed ? "lg:justify-center lg:px-0 px-3" : "px-3"
                } ${
                  view === item.id && !selectedContactId
                    ? "bg-accent-light text-accent font-medium"
                    : "text-muted hover:text-foreground hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className={sidebarCollapsed ? "lg:hidden" : ""}>{item.label}</span>
              </button>
            ))}
          </div>

          {/* More section */}
          <div className="mt-3">
            {!sidebarCollapsed && (
              <button
                onClick={() => setMoreNavExpanded((v) => !v)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider hover:text-foreground transition-colors"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${moreNavExpanded || moreNavItems.some((i) => i.id === view) ? "" : "-rotate-90"}`} />
                More
                {urgentCount > 0 && !moreNavExpanded && !moreNavItems.some((i) => i.id === view) && (
                  <span className="ml-auto w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">{urgentCount > 9 ? "9+" : urgentCount}</span>
                )}
              </button>
            )}
            {(moreNavExpanded || moreNavItems.some((i) => i.id === view) || sidebarCollapsed) && (
              <div className="space-y-0.5 mt-0.5">
                {moreNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 py-2 rounded-lg text-sm transition-colors ${
                      sidebarCollapsed ? "lg:justify-center lg:px-0 px-3" : "px-3"
                    } ${
                      view === item.id && !selectedContactId
                        ? "bg-accent-light text-accent font-medium"
                        : "text-muted hover:text-foreground hover:bg-gray-50"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <item.icon className="w-4 h-4" />
                      {item.id === "recommendations" && urgentCount > 0 && sidebarCollapsed && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">{urgentCount > 9 ? "9+" : urgentCount}</span>
                      )}
                    </div>
                    <span className={sidebarCollapsed ? "lg:hidden" : ""}>{item.label}</span>
                    {item.id === "recommendations" && urgentCount > 0 && !sidebarCollapsed && (
                      <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white min-w-[20px] text-center">{urgentCount}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vendor Management section */}
          {enabledPlugins.includes("vendors") && <div className="mt-4 pt-3 border-t border-border">
            {!sidebarCollapsed && (
              <div className="px-3 pb-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">Vendors</div>
            )}
            <div className="space-y-0.5">
              {vendorNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { handleNavigate(item.id); setSelectedVendorId(null); }}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 py-2 rounded-lg text-sm transition-colors ${
                    sidebarCollapsed ? "lg:justify-center lg:px-0 px-3" : "px-3"
                  } ${
                    (view === item.id || view === "vendor-detail") && !selectedContactId
                      ? "bg-accent-light text-accent font-medium"
                      : "text-muted hover:text-foreground hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className={sidebarCollapsed ? "lg:hidden" : ""}>{item.label}</span>
                  {!sidebarCollapsed && (
                    <span className="ml-auto text-[10px] text-muted">{filteredVendors.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>}
        </nav>

        {/* Bottom section — modern compact layout */}
        <div className="border-t border-border px-2 py-2 space-y-1">
          {/* Data Management */}
          <div ref={dataMenuRef} className="relative">
            <button
              onClick={() => { setDataMenuOpen((v) => !v); setUserMenuOpen(false); }}
              title={sidebarCollapsed ? "Data" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                sidebarCollapsed ? "lg:justify-center" : ""
              } ${
                dataMenuOpen || view === "import" || view === "export"
                  ? "bg-surface text-foreground"
                  : "text-muted hover:text-foreground hover:bg-surface/60"
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center shrink-0">
                <Download className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className={`font-medium ${sidebarCollapsed ? "lg:hidden" : ""}`}>Data</span>
              <ChevronDown className={`w-3 h-3 ml-auto text-muted/50 transition-transform ${sidebarCollapsed ? "lg:hidden" : ""} ${dataMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {dataMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 lg:right-auto mb-2 lg:w-64 bg-white rounded-2xl border border-border/60 shadow-2xl z-50 overflow-hidden backdrop-blur-sm">
                <div className="p-1.5">
                  <button
                    onClick={() => { handleNavigate("import"); setDataMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl text-sm text-foreground hover:bg-surface transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Upload className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium">Import</div>
                      <div className="text-[10px] text-muted">Upload contacts from file</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { handleNavigate("export"); setDataMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl text-sm text-foreground hover:bg-surface transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Download className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Export</div>
                      <div className="text-[10px] text-muted">Download your data</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Save your work CTA — demo only, inline */}
          {!isLive && !sidebarCollapsed && (
            <Link
              href={`/signup${demoUserEmail ? `?email=${encodeURIComponent(demoUserEmail)}&name=${encodeURIComponent(demoUserName)}` : ""}`}
              onClick={trackSignupClick}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-accent hover:bg-accent/5 transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
              </div>
              <span>Save your work</span>
              <ArrowRight className="w-3 h-3 ml-auto text-accent/50" />
            </Link>
          )}

          {/* User menu */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => { setUserMenuOpen((v) => !v); setDataMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                sidebarCollapsed ? "lg:justify-center" : ""
              } ${
                userMenuOpen ? "bg-surface" : "hover:bg-surface/60"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm">
                {demoUserName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div className={`min-w-0 flex-1 text-left ${sidebarCollapsed ? "lg:hidden" : ""}`}>
                <div className="text-sm font-medium text-foreground truncate">{demoUserName}</div>
                <div className={`text-[10px] truncate ${roleConfig[demoRole].color}`}>{roleConfig[demoRole].label}</div>
              </div>
              <div className={`w-5 h-5 rounded-md flex items-center justify-center ${sidebarCollapsed ? "lg:hidden" : ""} ${userMenuOpen ? "bg-gray-200" : "hover:bg-gray-100"}`}>
                <ChevronDown className={`w-3 h-3 text-muted transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </div>
            </button>
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 lg:right-auto mb-2 lg:w-72 bg-white rounded-2xl border border-border/60 shadow-2xl z-50 overflow-hidden backdrop-blur-sm">
                {/* User header */}
                <div className="px-4 py-3.5 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                      {demoUserName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{demoUserName}</div>
                      <div className="text-[11px] text-muted truncate">{demoUserEmail || (isLive ? "Account" : "Demo User")}</div>
                    </div>
                  </div>
                </div>

                <div className="p-1.5">
                  {/* Admin: Settings */}
                  {demoRole === "admin" && (
                    <Link
                      href="/app/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl text-sm text-foreground hover:bg-surface transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Settings className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">Settings</div>
                        <div className="text-[10px] text-muted">Team, pipeline, alerts</div>
                      </div>
                    </Link>
                  )}

                  {/* Demo: Role switcher */}
                  {!isLive && (
                    <>
                      <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted uppercase tracking-wider">Switch View</div>
                      {(["admin", "manager", "member"] as DemoRole[]).map((role) => {
                        const cfg = roleConfig[role];
                        const RIcon = cfg.icon;
                        const isActive = demoRole === role;
                        return (
                          <button
                            key={role}
                            onClick={() => { setDemoRole(role); setUserMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-xl text-sm transition-all ${
                              isActive ? "bg-accent/10 text-accent font-medium" : "text-foreground hover:bg-surface"
                            }`}
                          >
                            <RIcon className="w-4 h-4 shrink-0" />
                            <span className="flex-1">{cfg.label}</span>
                            {isActive && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>

                {/* Sign out / Sign up */}
                <div className="border-t border-border/50 p-1.5">
                  {isLive ? (
                    <button
                      onClick={async () => {
                        const { createClient } = await import("@/utils/supabase/client");
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        window.location.href = "/signin";
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <ArrowRight className="w-4 h-4 text-red-500 rotate-180" />
                      </div>
                      <span className="font-medium">Sign Out</span>
                    </button>
                  ) : (
                    <Link
                      href={`/signup${demoUserEmail ? `?email=${encodeURIComponent(demoUserEmail)}&name=${encodeURIComponent(demoUserName)}` : ""}`}
                      onClick={() => { trackSignupClick(); setUserMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-accent hover:bg-accent/5 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4 text-accent" />
                      </div>
                      <span>Create Free Account</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drag handle for resizing */}
        <div
          onMouseDown={(e) => { e.preventDefault(); setIsDraggingSidebar(true); }}
          className="hidden lg:block absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-accent/30 active:bg-accent/50 transition-colors z-10"
        />
      </aside>

      {/* Drag overlay to prevent iframe/selection interference */}
      {isDraggingSidebar && <div className="fixed inset-0 z-30 cursor-col-resize" />}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-white flex items-center gap-4 px-4 lg:px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 text-muted hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>

          {selectedContact ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          ) : isTaskDetail ? (
            <button
              onClick={handleTaskBack}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Tasks
            </button>
          ) : (
            <h1 className="text-sm font-semibold text-foreground capitalize">
              {headerLabel}
            </h1>
          )}

          <div className="flex-1" />

          <div className="hidden sm:block relative" ref={searchRef}>
            <div className={`flex items-center gap-2 bg-surface border rounded-lg px-3 py-1.5 w-64 transition-colors ${searchOpen ? "border-accent" : "border-border"}`}>
              <Search className="w-4 h-4 text-muted shrink-0" />
              <input
                type="text"
                placeholder="Search contacts, tasks..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); if (isLive && e.target.value.trim()) { if (searchTrackTimer.current) clearTimeout(searchTrackTimer.current); searchTrackTimer.current = setTimeout(() => trackEvent("contact.searched"), 1000); } }}
                onFocus={() => setSearchOpen(true)}
                className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-muted"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                  className="p-0.5 text-muted hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {searchOpen && searchQuery.trim() && (
              <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                {!hasResults ? (
                  <div className="px-4 py-6 text-sm text-muted text-center">No results for &ldquo;{searchQuery}&rdquo;</div>
                ) : (
                  <>
                    {searchResults.contacts.length > 0 && (
                      <>
                        <div className="px-3 py-1.5 text-[10px] font-medium text-muted uppercase tracking-wider bg-surface">Contacts</div>
                        {searchResults.contacts.map((c) => {
                          const q = searchQuery.toLowerCase();
                          const qDigits = q.replace(/\D/g, "");
                          const matchedPhone = qDigits.length >= 3 && c.phone.replace(/\D/g, "").includes(qDigits);
                          const matchedEmail = c.email.toLowerCase().includes(q) && !c.name.toLowerCase().includes(q) && !c.company.toLowerCase().includes(q);
                          const subtitle = matchedPhone ? c.phone : matchedEmail ? c.email : `${c.company} · ${c.stage}`;
                          return (
                            <button
                              key={c.id}
                              onClick={() => { handleSelectContact(c.id); setSearchQuery(""); setSearchOpen(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-surface transition-colors"
                            >
                              <div className={`w-7 h-7 rounded-full ${c.avatarColor} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}>
                                {c.avatar}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                                <div className="text-[11px] text-muted truncate">{subtitle}</div>
                              </div>
                            </button>
                          );
                        })}
                      </>
                    )}
                    {searchResults.tasks.length > 0 && (
                      <>
                        <div className="px-3 py-1.5 text-[10px] font-medium text-muted uppercase tracking-wider bg-surface">Tasks</div>
                        {searchResults.tasks.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => { setView("tasks"); handleSelectTask(t.id); setSearchQuery(""); setSearchOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-surface transition-colors"
                          >
                            <div className={`w-2 h-2 rounded-full shrink-0 ${t.priority === "high" ? "bg-red-500" : t.priority === "medium" ? "bg-amber-500" : "bg-gray-400"}`} />
                            <div className="min-w-0">
                              <div className="text-sm text-foreground truncate">{t.title}</div>
                              <div className="text-[11px] text-muted truncate">{t.owner} · {t.completed ? "Done" : t.priority}</div>
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick-add button */}
          <div ref={quickAddRef} className="relative">
            <button
              onClick={() => setQuickAddOpen((v) => !v)}
              className={`p-2 rounded-lg transition-colors ${quickAddOpen ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}
            >
              <Plus className="w-4 h-4" />
            </button>
            {quickAddOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-border shadow-xl z-50 overflow-hidden py-1">
                <button
                  onClick={() => { handleNewContact(); setQuickAddOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-surface transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">New Contact</div>
                  </div>
                </button>
                <button
                  onClick={() => { handleNewTask(); setView("tasks"); setQuickAddOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-surface transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <ListPlus className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">New Task</div>
                  </div>
                </button>
                <button
                  onClick={() => { handleNewActivity(); setQuickAddOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-surface transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Log Activity</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-2 text-muted hover:text-foreground transition-colors"
            >
              <Bell className="w-4 h-4" />
              {actionableNotifCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {actionableNotifCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-white rounded-xl border border-border shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-surface/50">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  <p className="text-[11px] text-muted">{actionableNotifCount} item{actionableNotifCount !== 1 ? "s" : ""} need your attention</p>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {/* Announcements */}
                  {activeAnnouncements.map((a) => (
                    <div key={a.id} className="flex gap-3 px-4 py-3 bg-blue-50/30">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        a.type === "warning" ? "bg-amber-100" : a.type === "success" ? "bg-emerald-100" : a.type === "update" ? "bg-violet-100" : "bg-blue-100"
                      }`}>
                        <Bell className={`w-3.5 h-3.5 ${
                          a.type === "warning" ? "text-amber-600" : a.type === "success" ? "text-emerald-600" : a.type === "update" ? "text-violet-600" : "text-blue-600"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{a.title}</div>
                        <div className="text-[11px] text-muted truncate">{a.message}</div>
                      </div>
                      <button onClick={() => dismissAnnouncement(a.id)} className="text-gray-400 hover:text-gray-600 shrink-0 mt-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {notifications.map((n) => {
                    const iconMap = {
                      overdue: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
                      today: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
                      risk: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-100" },
                      deal: { icon: DollarSign, color: "text-blue-600", bg: "bg-blue-100" },
                      touchpoint: { icon: Phone, color: "text-emerald-600", bg: "bg-emerald-100" },
                    };
                    const cfg = iconMap[n.icon];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={n.id}
                        className="w-full flex gap-3 px-4 py-3 hover:bg-surface/60 transition-colors text-left"
                        onClick={() => {
                          if (n.taskId) {
                            setView("tasks");
                            setSelectedTaskId(n.taskId);
                            setSelectedContactId(null);
                            setCreatingTask(false);
                          } else if (n.contactId) {
                            setSelectedContactId(n.contactId);
                            setSelectedTaskId(null);
                          }
                          setNotifOpen(false);
                        }}
                      >
                        <div className={`w-7 h-7 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">{n.title}</div>
                          <div className="text-[11px] text-muted truncate">{n.detail}</div>
                        </div>
                        <span className="text-[10px] text-muted shrink-0 mt-0.5">{n.time}</span>
                      </button>
                    );
                  })}
                </div>
                {notifications.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted">No notifications</div>
                )}
                {/* Admin: Configure Alerts link */}
                {demoRole === "admin" && (
                  <div className="px-4 py-2.5 border-t border-border bg-surface/30">
                    <Link
                      href="/app/settings"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-center gap-2 w-full text-xs font-medium text-accent hover:text-accent-dark transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Configure Alerts
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Support button */}
          <div ref={supportRef} className="relative">
            <button
              onClick={() => setSupportOpen((v) => !v)}
              className={`p-2 rounded-lg transition-colors ${supportOpen ? "bg-accent text-white" : "text-muted hover:text-foreground"}`}
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {supportOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-72 max-w-72 bg-white rounded-xl border border-border shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-surface/50">
                  <h3 className="text-sm font-semibold text-foreground">Need Help?</h3>
                  <p className="text-[11px] text-muted">We&apos;re here to help you get started</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { setSupportOpen(false); window.dispatchEvent(new CustomEvent("show-support-chat")); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Live Chat</div>
                      <div className="text-[11px] text-muted">Typically replies in under 5 min</div>
                    </div>
                  </button>
                  <a
                    href="/docs"
                    target="_blank"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Help Docs & FAQ</div>
                      <div className="text-[11px] text-muted">Guides, tutorials & more</div>
                    </div>
                  </a>
                </div>
                <div className="px-4 py-2.5 border-t border-border bg-surface/30">
                  <p className="text-[11px] text-muted text-center">Mon – Fri, 9am – 6pm ET</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Persistent upgrade banner when free plan limits reached */}
          {anyLimitReached && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 truncate">
                  <span className="font-semibold">Free plan limit reached</span>
                  {contactLimitReached && memberLimitReached
                    ? ` — ${activeContactCount}/100 contacts, ${activeTeamMemberCount}/3 members`
                    : contactLimitReached
                      ? ` — ${activeContactCount}/100 contacts`
                      : ` — ${activeTeamMemberCount}/3 team members`}
                </p>
              </div>
              <button
                onClick={async () => {
                  setUpgradeLoading(true);
                  try {
                    const res = await fetch("/api/stripe/checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        workspaceId: initialData?.workspaceId,
                        userEmail: demoUserEmail || initialData?.userEmail,
                        plan: "business",
                        seats: activeTeamMemberCount,
                      }),
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  } catch (err) {
                    console.error("Upgrade error:", err);
                  } finally {
                    setUpgradeLoading(false);
                  }
                }}
                disabled={upgradeLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shrink-0 disabled:opacity-50"
              >
                {upgradeLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Crown className="w-3 h-3" />}
                Upgrade
              </button>
            </div>
          )}
          {/* Announcement banner */}
          {topBannerAnnouncement && (
            <div className={`border-b px-4 py-2.5 flex items-center justify-between gap-3 ${
              topBannerAnnouncement.type === "warning" ? "bg-amber-50 border-amber-200" :
              topBannerAnnouncement.type === "success" ? "bg-emerald-50 border-emerald-200" :
              topBannerAnnouncement.type === "update" ? "bg-violet-50 border-violet-200" :
              "bg-blue-50 border-blue-200"
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <Bell className={`w-4 h-4 shrink-0 ${
                  topBannerAnnouncement.type === "warning" ? "text-amber-600" :
                  topBannerAnnouncement.type === "success" ? "text-emerald-600" :
                  topBannerAnnouncement.type === "update" ? "text-violet-600" :
                  "text-blue-600"
                }`} />
                <p className={`text-xs truncate ${
                  topBannerAnnouncement.type === "warning" ? "text-amber-800" :
                  topBannerAnnouncement.type === "success" ? "text-emerald-800" :
                  topBannerAnnouncement.type === "update" ? "text-violet-800" :
                  "text-blue-800"
                }`}>
                  <span className="font-semibold">{topBannerAnnouncement.title}</span>
                  {" — "}{topBannerAnnouncement.message}
                </p>
              </div>
              <button onClick={() => dismissAnnouncement(topBannerAnnouncement.id)} className="text-gray-400 hover:text-gray-600 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <AnimatePresence mode="wait">
            {selectedContact ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ContactDetail
                  key={selectedContact.id}
                  contact={selectedContact}
                  tasks={filteredTasks}
                  touchpoints={filteredTouchpoints}
                  stages={pipelineStages}
                  onBack={handleBack}
                  onSave={handleSaveContact}
                  onAddTouchpoint={handleAddTouchpoint}
                  onUpdateTouchpoint={handleUpdateTouchpoint}
                  onDeleteTouchpoint={handleDeleteTouchpoint}
                  onAddTask={handleAddTaskFromContact}
                  onUpdateTask={handleUpdateTaskFromContact}
                  onDeleteTask={handleDeleteTaskFromContact}
                  customFields={customFields}
                  onUpdateCustomFields={handleUpdateCustomFields}
                  customFieldValues={customFieldValues}
                  onUpdateCustomFieldValues={handleUpdateCustomFieldValues}
                  isAdmin={demoRole === "admin"}
                  ownerLabels={ownerLabels}
                  onArchiveContact={handleArchiveContact}
                  onDeleteContact={handleDeleteContact}
                  allContacts={filteredContacts}
                  emailTemplates={emailTemplates}
                  isLive={mode === "live"}
                  workspaceId={initialData?.workspaceId}
                  onAddTouchpointFromEmail={handleAddTouchpoint}
                  onSelectContact={handleSelectContact}
                />
              </motion.div>
            ) : isTaskDetail ? (
              <motion.div
                key="task-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <TaskDetail
                  task={creatingTask ? null : selectedTask}
                  vendors={vendorState}
                  onSave={handleSaveTask}
                  onDelete={handleDeleteTask}
                  onBack={handleTaskBack}
                  ownerLabels={ownerLabels}
                  isLive={isLive}
                  workspaceId={initialData?.workspaceId}
                />
              </motion.div>
            ) : (
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <ErrorBoundary>
                {view === "dashboard" && <DashboardView touchpoints={filteredTouchpoints} tasks={filteredTasks} contacts={filteredContacts} stages={pipelineStages} industryId={industryId} isLive={isLive} isAdmin={demoRole === "admin"} selectedKpis={dashboardKpis} onUpdateKpis={(ids) => { setDashboardKpis(ids); sync?.saveDashboardKpis?.(ids); }} onSelectContact={handleSelectContact} onNavigate={handleNavigate} onSelectTask={(id) => { setView("tasks"); handleSelectTask(id); }} />}
                {view === "pipeline" && <PipelineView contacts={filteredContacts} stages={pipelineStages} onSelectContact={handleSelectContact} ownerLabels={ownerLabels} />}
                {view === "contacts" && <ContactsView contacts={filteredContacts} archivedContacts={archivedContacts} trashedContacts={trashedContacts} stages={pipelineStages} onSelectContact={handleSelectContact} onUnarchiveContact={handleUnarchiveContact} onTrashArchivedContact={handleTrashArchivedContact} onRestoreContact={handleRestoreContact} onPermanentlyDeleteContact={handlePermanentlyDeleteContact} onEmptyTrash={handleEmptyTrash} onBulkArchive={handleBulkArchive} onBulkTrash={handleBulkTrash} onBulkChangeStage={handleBulkChangeStage} onBulkReassign={handleBulkReassign} ownerLabels={teamMembers.map((m) => m.ownerLabel)} isLive={mode === "live"} emailTemplates={emailTemplates} onAddTouchpoint={(tp) => { setTouchpointState((prev) => [tp, ...prev]); sync?.saveTouchpoint?.(tp); }} onAddContact={handleNewContact} />}
                {view === "activity" && <ActivityView touchpoints={filteredTouchpoints} contacts={filteredContacts} onSelectContact={handleSelectContact} />}
                {view === "tasks" && (
                  <TasksView
                    tasks={filteredTasks}
                    vendors={vendorState}
                    statusFilter={taskStatusFilter}
                    setStatusFilter={setTaskStatusFilter}
                    priorityFilter={taskPriorityFilter}
                    setPriorityFilter={setTaskPriorityFilter}
                    ownerFilter={taskOwnerFilter}
                    setOwnerFilter={setTaskOwnerFilter}
                    sourceFilter={taskSourceFilter}
                    setSourceFilter={setTaskSourceFilter}
                    onToggleTask={handleToggleTask}
                    onSelectTask={handleSelectTask}
                    onNewTask={handleNewTask}
                    ownerLabels={ownerLabels}
                  />
                )}
                {view === "calendar" && (
                  <CalendarView
                    tasks={filteredTasks}
                    touchpoints={filteredTouchpoints}
                    contacts={filteredContacts}
                    onSelectContact={handleSelectContact}
                    onSelectTask={(id) => { setView("tasks"); handleSelectTask(id); }}
                  />
                )}
                {view === "recommendations" && (
                  <RecommendationsView
                    contacts={filteredContacts}
                    tasks={filteredTasks}
                    touchpoints={filteredTouchpoints}
                    alertSettings={alertSettings}
                    onSelectContact={handleSelectContact}
                    onSelectTask={(id) => { setView("tasks"); handleSelectTask(id); }}
                    userName={demoUserName}
                  />
                )}
                {view === "import" && <ImportView contacts={contactState} stages={pipelineStages} customFields={customFields} customFieldValues={customFieldValues} contactsRemaining={contactLimitReached ? 0 : isLive && workspacePlan === "free" ? 100 - activeContactCount : undefined} onImportContacts={(newContacts, newFieldValues) => { setContactState((prev) => [...prev, ...newContacts]); newContacts.forEach((c) => sync?.saveContact?.(c)); if (newFieldValues && Object.keys(newFieldValues).length > 0) { setCustomFieldValues((prev) => ({ ...prev, ...newFieldValues })); Object.entries(newFieldValues).forEach(([contactId, fv]) => { Object.entries(fv).forEach(([fieldId, value]) => { sync?.saveCustomFieldValue?.(contactId, fieldId, value); }); }); } }} />}
                {view === "reports" && <ReportsView contacts={filteredContacts} tasks={filteredTasks} touchpoints={filteredTouchpoints} stages={pipelineStages} />}
                {view === "export" && <ExportView contacts={filteredContacts} tasks={filteredTasks} touchpoints={filteredTouchpoints} stages={pipelineStages} customFields={customFields} customFieldValues={customFieldValues} teamMembers={teamMembers} isAdmin={demoRole === "admin"} />}
                {view === "vendors" && (
                  <VendorsView
                    vendors={filteredVendors}
                    vendorContacts={vendorContactState}
                    onSelectVendor={handleSelectVendor}
                    onAddVendor={handleAddVendor}
                    onAddContract={handleAddVendorContract}
                    onUpdateTax={handleUpdateVendorTax}
                    onDeleteVendor={handleDeleteVendor}
                    ownerLabels={ownerLabels}
                    isLive={isLive}
                    workspaceId={initialData?.workspaceId}
                  />
                )}
                {view === "vendor-detail" && selectedVendorId && (() => {
                  const vendor = vendorState.find((v) => v.id === selectedVendorId);
                  if (!vendor) return null;
                  return (
                    <VendorDetail
                      vendor={vendor}
                      contacts={vendorContactState.filter((c) => c.vendorId === selectedVendorId)}
                      notes={vendorNoteState.filter((n) => n.vendorId === selectedVendorId)}
                      contracts={vendorContractState.filter((c) => c.vendorId === selectedVendorId)}
                      taxRecord={vendorTaxState.find((t) => t.vendorId === selectedVendorId)}
                      onBack={() => { setSelectedVendorId(null); setView("vendors"); }}
                      onUpdateVendor={handleUpdateVendor}
                      onAddContact={handleAddVendorContact}
                      onDeleteContact={handleDeleteVendorContact}
                      onAddNote={handleAddVendorNote}
                      onDeleteNote={handleDeleteVendorNote}
                      onAddContract={handleAddVendorContract}
                      onDeleteContract={handleDeleteVendorContract}
                      onUpdateTax={handleUpdateVendorTax}
                      ownerLabels={ownerLabels}
                      isLive={isLive}
                      workspaceId={initialData?.workspaceId}
                    />
                  );
                })()}
                </ErrorBoundary>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Plan limit toast */}
      <AnimatePresence>
        {showLimitToast && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-md"
          >
            <Crown className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs leading-relaxed">{showLimitToast}</p>
            <button
              onClick={async () => {
                setShowLimitToast(null);
                setUpgradeLoading(true);
                try {
                  const res = await fetch("/api/stripe/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      workspaceId: initialData?.workspaceId,
                      userEmail: demoUserEmail || initialData?.userEmail,
                      plan: "business",
                      seats: activeTeamMemberCount,
                    }),
                  });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                } catch (err) {
                  console.error("Upgrade error:", err);
                } finally {
                  setUpgradeLoading(false);
                }
              }}
              className="text-xs font-semibold text-accent hover:text-accent-dark whitespace-nowrap transition-colors"
            >
              Upgrade
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved contact prompt */}
      {unsavedContactPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setUnsavedContactPrompt(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Unsaved changes</h3>
              <p className="text-sm text-muted leading-relaxed">
                You haven&apos;t saved this contact yet. What would you like to do?
              </p>
            </div>
            <div className="px-6 pb-6 space-y-2">
              <button
                onClick={() => {
                  // Trigger save via a DOM event the contact-detail can listen to
                  const saveBtn = document.querySelector<HTMLButtonElement>("[data-save-contact]");
                  if (saveBtn) saveBtn.click();
                  setUnsavedContactPrompt(null);
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
              >
                <Save className="w-3.5 h-3.5" /> Save & Close
              </button>
              <button
                onClick={() => unsavedContactPrompt.action()}
                className="w-full px-4 py-2.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
              >
                Discard & Leave
              </button>
              <button
                onClick={() => setUnsavedContactPrompt(null)}
                className="w-full px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversion banner — slides up after 60 seconds (demo only) */}
      {!isLive && <AnimatePresence>
        {showConversionBanner && !bannerDismissed && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none"
          >
            <div className="max-w-lg mx-auto bg-foreground text-white rounded-xl shadow-2xl p-5 pointer-events-auto">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold mb-1">Enjoying the demo?</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">
                    Create a free account to save your pipeline, contacts, and settings. Your demo data can come with you.
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/signup${demoUserEmail ? `?email=${encodeURIComponent(demoUserEmail)}&name=${encodeURIComponent(demoUserName)}` : ""}`}
                      onClick={trackSignupClick}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-accent hover:bg-accent-dark text-white rounded-lg transition-colors"
                    >
                      Create Free Account
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={() => { setShowConversionBanner(false); setBannerDismissed(true); }}
                      className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                    >
                      Maybe later
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => { setShowConversionBanner(false); setBannerDismissed(true); }}
                  className="p-1 text-gray-500 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>}
    </div>
  );
}
