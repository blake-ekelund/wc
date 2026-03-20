"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Users,
  Shield,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  CreditCard,
  Receipt,
  ArrowUpRight,
  Mail,
  BellRing,
  AlertTriangle,
  Clock,
  PhoneOff,
  DollarSign,
  GitBranch,
  GripVertical,
  ChevronRight,
  RotateCcw,
  Eye,
  Crown,
  User,
  ArrowRight,
  ChevronDown,
  Search,
  Link2,
  Unlink,
  Loader2,
} from "lucide-react";
import { type Contact, type StageDefinition } from "../data";
import { type EmailTemplate } from "../email-templates";
import { type TeamMember } from "../demo-app";

export interface AlertSettings {
  staleDays: number;
  atRiskTouchpoints: number;
  highValueThreshold: number;
  overdueAlerts: boolean;
  todayAlerts: boolean;
  negotiationAlerts: boolean;
  staleContactAlerts: boolean;
  atRiskAlerts: boolean;
}

const roleColors = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-amber-100 text-amber-700",
  member: "bg-gray-100 text-gray-600",
};

type SettingsTab = "company" | "billing" | "team" | "pipeline" | "alerts" | "templates";

const tabs: { id: SettingsTab; label: string; icon: typeof Building2 }[] = [
  { id: "company", label: "Company Info", icon: Building2 },
  { id: "billing", label: "Billing & Plan", icon: CreditCard },
  { id: "team", label: "Team Members", icon: Users },
  { id: "pipeline", label: "Pipeline", icon: GitBranch },
  { id: "alerts", label: "Alerts", icon: BellRing },
  { id: "templates", label: "Email Templates", icon: Mail },
];

const tabOrder: Record<SettingsTab, number> = { company: 0, billing: 1, team: 2, pipeline: 3, alerts: 4, templates: 5 };

const stageColorOptions = [
  { color: "text-blue-700", bgColor: "bg-blue-100", label: "Blue" },
  { color: "text-purple-700", bgColor: "bg-purple-100", label: "Purple" },
  { color: "text-amber-700", bgColor: "bg-amber-100", label: "Amber" },
  { color: "text-orange-700", bgColor: "bg-orange-100", label: "Orange" },
  { color: "text-emerald-700", bgColor: "bg-emerald-100", label: "Emerald" },
  { color: "text-red-700", bgColor: "bg-red-100", label: "Red" },
  { color: "text-cyan-700", bgColor: "bg-cyan-100", label: "Cyan" },
  { color: "text-pink-700", bgColor: "bg-pink-100", label: "Pink" },
  { color: "text-indigo-700", bgColor: "bg-indigo-100", label: "Indigo" },
  { color: "text-teal-700", bgColor: "bg-teal-100", label: "Teal" },
];

interface SettingsViewProps {
  alertSettings: AlertSettings;
  onUpdateAlertSettings: (settings: AlertSettings) => void;
  activeTab: SettingsTab;
  onChangeTab: (tab: SettingsTab) => void;
  companyName: string;
  onChangeCompanyName: (name: string) => void;
  pipelineStages: StageDefinition[];
  onUpdateStages: (stages: StageDefinition[], reassignments?: Record<string, string>) => void;
  contacts: Contact[];
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (members: TeamMember[]) => void;
  onReassignAndRemoveMember?: (memberId: string, reassignToLabel: string) => void;
  onClearSampleData?: () => void;
  isLive?: boolean;
  workspaceId?: string;
  emailTemplates?: EmailTemplate[];
  onUpdateEmailTemplates?: (templates: EmailTemplate[]) => void;
  emailSignature?: string;
  onUpdateSignature?: (signature: string) => void;
  memberLimitReached?: boolean;
}

// =============================================
// Billing Section (live mode only)
// =============================================
function BillingSection({ workspaceId, members, contacts, userEmail }: { workspaceId?: string; members: TeamMember[]; contacts: Contact[]; userEmail?: string }) {
  const [plan, setPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    async function fetchPlan() {
      try {
        const res = await fetch(`/api/stripe/checkout?workspaceId=${workspaceId}`);
        const data = await res.json();
        if (data.plan) setPlan(data.plan);
      } catch { /* silent */ }
      setLoading(false);
    }
    fetchPlan();
  }, [workspaceId]);

  async function handleUpgrade() {
    if (!workspaceId) return;
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, userEmail, plan: "business", seats: members.filter(m => m.status === "active").length }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { /* silent */ }
    setUpgrading(false);
  }

  async function handleManageBilling() {
    if (!workspaceId) return;
    setManagingBilling(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { /* silent */ }
    setManagingBilling(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-muted animate-spin" />
      </div>
    );
  }

  const isFree = plan === "free";
  const contactLimit = isFree ? 100 : 50000;
  const userLimit = isFree ? 3 : Infinity;
  const contactPercent = Math.min((contacts.length / contactLimit) * 100, 100);

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-bold text-foreground">{isFree ? "Starter" : "Business"} Plan</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${isFree ? "bg-gray-100 text-gray-600" : "bg-accent-light text-accent"}`}>
              {isFree ? "Free" : "Active"}
            </span>
          </div>
          <p className="text-sm text-muted">
            {members.filter(m => m.status === "active").length} active seat{members.filter(m => m.status === "active").length !== 1 ? "s" : ""}{members.filter(m => m.status === "pending").length > 0 ? `, ${members.filter(m => m.status === "pending").length} pending` : ""}
            {!isFree && ` · $${members.filter(m => m.status === "active").length * 5}.00/month ($5/seat)`}
            {isFree && ` · ${userLimit} user limit`}
          </p>
        </div>
        {isFree ? (
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-60"
          >
            {upgrading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
            {upgrading ? "Redirecting..." : "Upgrade to Business"}
          </button>
        ) : (
          <button
            onClick={handleManageBilling}
            disabled={managingBilling}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-accent border border-accent/30 hover:bg-accent-light rounded-lg transition-colors disabled:opacity-60"
          >
            {managingBilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
            {managingBilling ? "Opening..." : "Manage Billing"}
          </button>
        )}
      </div>

      {/* Contact usage */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted mb-1.5">
          <span>Contacts</span>
          <span>{contacts.length.toLocaleString()} / {contactLimit.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${contactPercent > 90 ? "bg-red-500" : contactPercent > 70 ? "bg-amber-500" : "bg-accent"}`}
            style={{ width: `${contactPercent}%` }}
          />
        </div>
        {isFree && contactPercent > 80 && (
          <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Approaching contact limit. Upgrade for up to 50,000 contacts.
          </p>
        )}
      </div>

      {/* User/seat usage */}
      {(() => {
        const activeCount = members.filter(m => m.status === "active").length;
        const pendingCount = members.filter(m => m.status === "pending").length;
        const activePercent = isFree ? (activeCount / userLimit) * 100 : 0;
        const pendingPercent = isFree ? (pendingCount / userLimit) * 100 : 0;
        return (
          <div>
            <div className="flex items-center justify-between text-xs text-muted mb-1.5">
              <span>{isFree ? "Users" : "Seats"}</span>
              <span>
                {activeCount} active{pendingCount > 0 ? `, ${pendingCount} pending` : ""}
                {isFree ? ` / ${userLimit}` : ` · $${activeCount * 5}.00/mo`}
              </span>
            </div>
            {isFree && (
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all ${activeCount >= userLimit ? "bg-red-500" : "bg-accent"}`}
                  style={{ width: `${Math.min(activePercent, 100)}%` }}
                />
                {pendingCount > 0 && (
                  <div
                    className="h-full bg-gray-300 transition-all"
                    style={{ width: `${Math.min(pendingPercent, 100 - activePercent)}%` }}
                  />
                )}
              </div>
            )}
            {isFree && activeCount >= userLimit && (
              <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                User limit reached. Upgrade for unlimited users.
              </p>
            )}
            {isFree && pendingCount > 0 && activeCount < userLimit && (
              <p className="text-[11px] text-muted mt-1.5">
                Pending invites don&apos;t count toward your limit until accepted.
              </p>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function parseFormattedNumber(s: string): number {
  const cleaned = s.replace(/[^0-9]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
}

const tabTransition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] };

export default function SettingsView({ alertSettings, onUpdateAlertSettings, activeTab, onChangeTab, companyName, onChangeCompanyName, pipelineStages, onUpdateStages, contacts, teamMembers, onUpdateTeamMembers, onReassignAndRemoveMember, onClearSampleData, isLive, workspaceId, emailTemplates = [], onUpdateEmailTemplates, emailSignature = "", onUpdateSignature, memberLimitReached }: SettingsViewProps) {
  const [prevTab, setPrevTab] = useState<SettingsTab>(activeTab);
  const [showClearModal, setShowClearModal] = useState(false);
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [reassignTo, setReassignTo] = useState("");
  const [showVisibility, setShowVisibility] = useState(false);
  // Email template editing
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editTemplateName, setEditTemplateName] = useState("");
  const [editTemplateSubject, setEditTemplateSubject] = useState("");
  const [editTemplateBody, setEditTemplateBody] = useState("");
  const [editTemplateCategory, setEditTemplateCategory] = useState<EmailTemplate["category"]>("follow-up");
  const [showAddTemplate, setShowAddTemplate] = useState(false);

  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<"all" | "admin" | "manager" | "member">("all");
  const [collapsedRoles, setCollapsedRoles] = useState<Set<string>>(new Set());

  // Direction for slide animation
  const direction = tabOrder[activeTab] > tabOrder[prevTab] ? 1 : -1;

  function switchTab(tab: SettingsTab) {
    setPrevTab(activeTab);
    onChangeTab(tab);
  }

  // Company info state
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(companyName);
  const [timezone, setTimezone] = useState("America/New_York");

  // Team state (members come from props)
  const members = teamMembers;
  const setMembers = onUpdateTeamMembers;
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "manager" | "member">("member");

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "member">("member");
  const [inviteSent, setInviteSent] = useState(false);

  // High-value threshold formatted display
  const [thresholdDisplay, setThresholdDisplay] = useState(formatNumber(alertSettings.highValueThreshold));

  // Pipeline editing state
  const [editingStages, setEditingStages] = useState<StageDefinition[]>(pipelineStages);
  const [pipelineDirty, setPipelineDirty] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [removedStages, setRemovedStages] = useState<string[]>([]);
  const [reassignments, setReassignments] = useState<Record<string, string>>({});
  const [newStageName, setNewStageName] = useState("");
  const [dragStageIdx, setDragStageIdx] = useState<number | null>(null);
  const [dragOverStageIdx, setDragOverStageIdx] = useState<number | null>(null);

  function saveName() {
    if (tempName.trim()) onChangeCompanyName(tempName.trim());
    setEditingName(false);
  }

  async function addMember() {
    if (memberLimitReached) {
      setInviteError("Free plan is limited to 3 team members. Upgrade to add more.");
      return;
    }
    if (!newName.trim() || !newEmail.trim()) return;
    const initials = newName.trim().split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
    const colors = ["bg-cyan-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500"];
    const ownerLabel = newName.trim();

    if (isLive && workspaceId) {
      // Live mode — call invite API (same endpoint, sends email invite)
      try {
        const res = await fetch("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: newEmail.trim(),
            role: newRole,
            workspaceId,
            ownerLabel,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setInviteError(data.error || "Failed to add member");
          return;
        }
        if (data.signupUrl) {
          setInviteError(`Email rate limited. Share this link: ${data.signupUrl}`);
        }
      } catch {
        setInviteError("Failed to add member. Please try again.");
        return;
      }
    }

    setMembers([
      ...members,
      {
        id: crypto.randomUUID(),
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        avatar: initials,
        avatarColor: colors[members.length % colors.length],
        status: "pending" as const,
        ownerLabel,
      },
    ]);
    setNewName("");
    setNewEmail("");
    setNewRole("member");
    setShowAddForm(false);
  }

  function removeMember(id: string) {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    // Count how many contacts/tasks are assigned to this member
    const assignedCount = contacts.filter((c) => c.owner === member.ownerLabel).length;
    if (assignedCount === 0 && member.status === "pending") {
      // Pending member with no assignments — remove directly
      setMembers(members.filter((m) => m.id !== id));
      return;
    }
    // Show reassignment modal
    const defaultReassign = members.find((m) => m.ownerLabel === "You")?.ownerLabel ?? members[0]?.ownerLabel ?? "You";
    setReassignTo(defaultReassign);
    setRemovingMember(member);
  }

  function confirmRemoveMember() {
    if (!removingMember || !reassignTo) return;
    if (onReassignAndRemoveMember) {
      onReassignAndRemoveMember(removingMember.id, reassignTo);
    }
    setRemovingMember(null);
    setReassignTo("");
  }

  function updateRole(id: string, role: "admin" | "manager" | "member") {
    setMembers(members.map((m) => (m.id === id ? { ...m, role } : m)));
  }

  function updateReportsTo(id: string, reportsTo: string | undefined) {
    setMembers(members.map((m) => (m.id === id ? { ...m, reportsTo } : m)));
  }

  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  async function handleInvite() {
    if (memberLimitReached) {
      setInviteError("Free plan is limited to 3 team members. Upgrade to add more.");
      return;
    }
    if (!inviteEmail.trim()) return;
    const emailName = inviteEmail.trim().split("@")[0];
    const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    const initials = displayName.slice(0, 2).toUpperCase();
    const colors = ["bg-cyan-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500"];
    const ownerLabel = displayName;

    // In live mode, call the invite API
    if (isLive && workspaceId) {
      setInviteLoading(true);
      setInviteError("");
      try {
        const res = await fetch("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: inviteEmail.trim(),
            role: inviteRole,
            workspaceId,
            ownerLabel,
          }),
        });
        const data = await res.json();
        setInviteLoading(false);

        if (!res.ok) {
          setInviteError(data.error || "Failed to send invite");
          return;
        }

        // If rate limited but invite was created, show the signup link
        if (data.signupUrl) {
          setInviteError(`Email rate limited. Share this link instead: ${data.signupUrl}`);
        }

        // Add to local state
        setMembers([
          ...members,
          {
            id: crypto.randomUUID(),
            name: displayName,
            email: inviteEmail.trim(),
            role: inviteRole,
            avatar: initials,
            avatarColor: colors[members.length % colors.length],
            status: data.status === "active" ? "active" as const : "pending" as const,
            ownerLabel,
          },
        ]);
      } catch {
        setInviteLoading(false);
        setInviteError("Failed to send invite. Please try again.");
        return;
      }
    } else {
      // Demo mode — just add locally
      setMembers([
        ...members,
        {
          id: crypto.randomUUID(),
          name: displayName,
          email: inviteEmail.trim(),
          role: inviteRole,
          avatar: initials,
          avatarColor: colors[members.length % colors.length],
          status: "pending" as const,
          ownerLabel,
        },
      ]);
    }

    setInviteSent(true);
    setTimeout(() => {
      setInviteSent(false);
      setInviteEmail("");
      setInviteRole("member");
      setInviteError("");
    }, 2000);
  }

  // Managers and admins who can be "reports to" targets
  const managersAndAdmins = members.filter((m) => m.role === "admin" || m.role === "manager");

  function handleThresholdChange(value: string) {
    // Allow only digits and commas while typing
    const raw = value.replace(/[^0-9]/g, "");
    if (!raw) {
      setThresholdDisplay("");
      return;
    }
    const num = parseInt(raw, 10);
    setThresholdDisplay(formatNumber(num));
    onUpdateAlertSettings({ ...alertSettings, highValueThreshold: num });
  }

  function handleThresholdBlur() {
    if (!thresholdDisplay || parseFormattedNumber(thresholdDisplay) === 0) {
      setThresholdDisplay(formatNumber(1000));
      onUpdateAlertSettings({ ...alertSettings, highValueThreshold: 1000 });
    }
  }

  // Pipeline functions
  function handleStageRename(index: number, newLabel: string) {
    const updated = [...editingStages];
    updated[index] = { ...updated[index], label: newLabel };
    setEditingStages(updated);
    setPipelineDirty(true);
  }

  function handleStageColorChange(index: number, colorOption: typeof stageColorOptions[0]) {
    const updated = [...editingStages];
    updated[index] = { ...updated[index], color: colorOption.color, bgColor: colorOption.bgColor };
    setEditingStages(updated);
    setPipelineDirty(true);
  }

  function handleRemoveStage(index: number) {
    const updated = [...editingStages];
    updated.splice(index, 1);
    setEditingStages(updated);
    setPipelineDirty(true);
  }

  function handleAddStage() {
    if (!newStageName.trim()) return;
    const usedColors = editingStages.map((s) => s.color);
    const availableColor = stageColorOptions.find((c) => !usedColors.includes(c.color)) || stageColorOptions[0];
    setEditingStages([
      ...editingStages,
      { label: newStageName.trim(), color: availableColor.color, bgColor: availableColor.bgColor },
    ]);
    setNewStageName("");
    setPipelineDirty(true);
  }

  function handleStageDragStart(index: number) {
    setDragStageIdx(index);
  }

  function handleStageDragEnter(index: number) {
    setDragOverStageIdx(index);
  }

  function handleStageDragEnd() {
    if (dragStageIdx !== null && dragOverStageIdx !== null && dragStageIdx !== dragOverStageIdx) {
      const reordered = [...editingStages];
      const [removed] = reordered.splice(dragStageIdx, 1);
      reordered.splice(dragOverStageIdx, 0, removed);
      setEditingStages(reordered);
      setPipelineDirty(true);
    }
    setDragStageIdx(null);
    setDragOverStageIdx(null);
  }

  function handleSavePipeline() {
    const currentLabels = pipelineStages.map((s) => s.label);
    const newLabels = editingStages.map((s) => s.label);
    const removed = currentLabels.filter((l) => !newLabels.includes(l));

    // Check if any contacts are on removed stages
    const affectedStages = removed.filter((label) =>
      contacts.some((c) => c.stage === label)
    );

    if (affectedStages.length > 0) {
      setRemovedStages(affectedStages);
      const defaultReassignments: Record<string, string> = {};
      affectedStages.forEach((s) => {
        defaultReassignments[s] = newLabels[0] || "";
      });
      setReassignments(defaultReassignments);
      setShowReassignModal(true);
    } else {
      onUpdateStages(editingStages);
      setPipelineDirty(false);
    }
  }

  function handleConfirmReassignment() {
    onUpdateStages(editingStages, reassignments);
    setShowReassignModal(false);
    setRemovedStages([]);
    setReassignments({});
    setPipelineDirty(false);
  }

  function handleCancelPipelineChanges() {
    setEditingStages(pipelineStages);
    setPipelineDirty(false);
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        </div>
        <p className="text-sm text-muted">
          Manage your workspace, billing, and team.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-foreground hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content with AnimatePresence */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "company" && (
            <motion.div
              key="company"
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={tabTransition}
              className="space-y-6"
            >
              {/* Admin banner */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-sm text-amber-800">
                  You are signed in as <span className="font-medium">{teamMembers.find((m) => m.ownerLabel === "You")?.name ?? "Admin"} (Admin)</span>.
                </span>
              </div>

              {/* Company info card */}
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Company Information</h3>
                </div>
                <div className="divide-y divide-border">
                  {/* Company name */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <label className="text-xs font-medium text-muted block mb-1">Company Name</label>
                      {editingName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && saveName()}
                          />
                          <button onClick={saveName} className="p-1.5 text-accent hover:bg-accent-light rounded-lg transition-colors">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setEditingName(false); setTempName(companyName); }} className="p-1.5 text-muted hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{companyName}</span>
                          <button onClick={() => { setTempName(companyName); setEditingName(true); }} className="p-1 text-muted hover:text-accent transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timezone */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <label className="text-xs font-medium text-muted block mb-1">Timezone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Berlin">Berlin (CET)</option>
                      </select>
                    </div>
                  </div>

                  {/* Plan */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <label className="text-xs font-medium text-muted block mb-1">Current Plan</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">Team</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-light text-accent">Active</span>
                      </div>
                    </div>
                    <button
                      onClick={() => switchTab("billing")}
                      className="text-xs text-accent hover:text-accent-dark font-medium"
                    >
                      Manage plan
                    </button>
                  </div>
                </div>
              </div>

              {/* Clear sample data — demo only */}
              {onClearSampleData && !isLive && (
                <div className="bg-white rounded-xl border border-border overflow-hidden">
                  <div className="px-5 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Sample Data</h3>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-foreground">Clear all sample data</div>
                        <p className="text-xs text-muted mt-0.5">Remove all demo contacts, tasks, and touchpoints so you can start fresh with your own data.</p>
                      </div>
                      <button
                        onClick={() => setShowClearModal(true)}
                        className="shrink-0 ml-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 border border-amber-200 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear Data
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Clear sample data confirmation modal */}
              <AnimatePresence>
                {showClearModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={() => setShowClearModal(false)}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      transition={{ duration: 0.15 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-sm overflow-hidden"
                    >
                      <div className="p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                          <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">Clear all sample data?</h3>
                        <p className="text-sm text-muted leading-relaxed">
                          This will permanently remove all demo contacts, tasks, and touchpoints. You&apos;ll start with a clean workspace to add your own data.
                        </p>
                      </div>
                      <div className="px-6 pb-6 flex gap-3">
                        <button
                          onClick={() => setShowClearModal(false)}
                          className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-white border border-border hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onClearSampleData!();
                            setShowClearModal(false);
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-lg shadow-amber-600/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear Data
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Danger zone */}
              <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-red-200">
                  <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    {isLive ? (
                      <>
                        <div>
                          <div className="text-sm font-medium text-foreground">Cancel workspace</div>
                          <p className="text-xs text-muted mt-0.5">Cancel your workspace subscription and remove all data. This cannot be undone.</p>
                        </div>
                        <button className="shrink-0 ml-4 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors">
                          Cancel Workspace
                        </button>
                      </>
                    ) : (
                      <>
                        <div>
                          <div className="text-sm font-medium text-muted">Delete workspace</div>
                          <p className="text-xs text-muted mt-0.5">This action is disabled in the demo.</p>
                        </div>
                        <button disabled className="shrink-0 ml-4 px-3 py-1.5 text-xs font-medium text-gray-400 border border-gray-200 rounded-lg cursor-not-allowed opacity-50">
                          Delete Workspace
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "billing" && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={tabTransition}
              className="space-y-6"
            >
              {isLive ? (
                /* LIVE MODE — Real Stripe billing */
                <>
                  {/* Current plan */}
                  <div className="bg-white rounded-xl border border-border overflow-hidden">
                    <div className="px-5 py-3 border-b border-border">
                      <h3 className="text-sm font-semibold text-foreground">Current Plan</h3>
                    </div>
                    <div className="p-5">
                      <BillingSection workspaceId={workspaceId} members={members} contacts={contacts} userEmail={members.find(m => m.ownerLabel === "You" || m.id === "u1")?.email || members[0]?.email} />
                    </div>
                  </div>

                  {/* Plan comparison */}
                  <div className="bg-white rounded-xl border border-border overflow-hidden">
                    <div className="px-5 py-3 border-b border-border">
                      <h3 className="text-sm font-semibold text-foreground">Plan Comparison</h3>
                    </div>
                    <div className="p-5">
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="rounded-lg border border-border p-4">
                          <h4 className="text-sm font-semibold text-foreground mb-1">Starter</h4>
                          <div className="text-2xl font-bold text-foreground">Free</div>
                          <ul className="mt-3 space-y-1.5 text-xs text-muted">
                            <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" />Up to 100 contacts</li>
                            <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" />Up to 3 users</li>
                            <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" />All industry templates</li>
                            <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" />Import & export</li>
                          </ul>
                        </div>
                        <div className="rounded-lg border-2 border-accent p-4 bg-accent/5">
                          <h4 className="text-sm font-semibold text-accent mb-1">Business</h4>
                          <div className="text-2xl font-bold text-foreground">$5<span className="text-sm font-normal text-muted">/seat/mo</span></div>
                          <ul className="mt-3 space-y-1.5 text-xs text-muted">
                            <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-accent" />Up to 50,000 contacts</li>
                            <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-accent" />Unlimited users</li>
                            <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-accent" />Gmail integration</li>
                            <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-accent" />Email templates & bulk</li>
                            <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-accent" />File attachments</li>
                            <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-accent" />Custom KPI dashboard</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* DEMO MODE — Fake billing data */
                <>
                  <div className="bg-white rounded-xl border border-border overflow-hidden">
                    <div className="px-5 py-3 border-b border-border">
                      <h3 className="text-sm font-semibold text-foreground">Current Plan</h3>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl font-bold text-foreground">Business Plan</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-light text-accent">Active</span>
                          </div>
                          <p className="text-sm text-muted">
                            {members.filter(m => m.status === "active").length} active seat{members.filter(m => m.status === "active").length !== 1 ? "s" : ""} &middot; ${members.filter(m => m.status === "active").length * 5}.00/month ($5/seat)
                          </p>
                        </div>
                        <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors opacity-60 cursor-not-allowed" disabled>
                          Manage Billing
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs text-muted mb-1.5">
                          <span>Contacts</span>
                          <span>{contacts.length.toLocaleString()} / 50,000</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min((contacts.length / 50000) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <p className="text-[11px] text-muted mt-3 italic">Billing management is available in the live app.</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-border overflow-hidden">
                    <div className="px-5 py-3 border-b border-border">
                      <h3 className="text-sm font-semibold text-foreground">Invoices</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {[
                        { date: "Mar 1, 2026", amount: `$${members.filter(m => m.status === "active").length * 5}.00`, status: "Paid" },
                        { date: "Feb 1, 2026", amount: `$${members.filter(m => m.status === "active").length * 5}.00`, status: "Paid" },
                        { date: "Jan 1, 2026", amount: `$${members.filter(m => m.status === "active").length * 5}.00`, status: "Paid" },
                      ].map((inv) => (
                        <div key={inv.date} className="flex items-center justify-between px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Receipt className="w-4 h-4 text-muted" />
                            <span className="text-sm text-foreground">{inv.date}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-foreground">{inv.amount}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">{inv.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === "team" && (
            <motion.div
              key="team"
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={tabTransition}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                {/* Header with invite inline */}
                <div className="px-5 py-3 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      Team ({members.length})
                    </h3>
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent border border-accent/30 hover:bg-accent-light rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Manually
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-muted"
                      />
                    </div>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as "admin" | "manager" | "member")}
                      className="text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={handleInvite}
                      disabled={!inviteEmail.trim() || inviteSent || inviteLoading}
                      className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {inviteSent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Sent!
                        </>
                      ) : inviteLoading ? (
                        <>
                          <Mail className="w-3.5 h-3.5 animate-pulse" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5" />
                          Send Invite
                        </>
                      )}
                    </button>
                  </div>
                  {inviteError && (
                    <div className="px-5 pb-3">
                      <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                        {inviteError}
                      </div>
                    </div>
                  )}
                </div>

                {/* Add manually form */}
                {showAddForm && (
                  <div className="px-5 py-4 border-b border-border bg-surface">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted block mb-1">Name</label>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="Full name"
                          className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted block mb-1">Email</label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="email@company.com"
                          className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted block mb-1">Role</label>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value as "admin" | "manager" | "member")}
                          className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                        >
                          <option value="member">Member</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={addMember}
                        disabled={!newName.trim() || !newEmail.trim()}
                        className="px-4 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Member
                      </button>
                      <button
                        onClick={() => { setShowAddForm(false); setNewName(""); setNewEmail(""); setNewRole("member"); }}
                        className="px-4 py-1.5 text-xs font-medium text-muted hover:text-foreground border border-border rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Search & role filter */}
                <div className="px-5 py-2.5 border-b border-border bg-surface/30 flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-1.5">
                    <Search className="w-3.5 h-3.5 text-muted shrink-0" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search members..."
                      className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-muted"
                    />
                    {memberSearch && (
                      <button onClick={() => setMemberSearch("")} className="p-0.5 text-muted hover:text-foreground">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(["all", "admin", "manager", "member"] as const).map((r) => {
                      const count = r === "all" ? members.length : members.filter((m) => m.role === r).length;
                      return (
                        <button
                          key={r}
                          onClick={() => setMemberRoleFilter(r)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                            memberRoleFilter === r
                              ? r === "all" ? "bg-accent text-white" : roleColors[r]
                              : "text-muted hover:text-foreground"
                          }`}
                        >
                          {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role-grouped member rows */}
                {(["admin", "manager", "member"] as const).map((roleGroup) => {
                  const roleMembers = members.filter((m) => {
                    if (m.role !== roleGroup) return false;
                    if (memberRoleFilter !== "all" && m.role !== memberRoleFilter) return false;
                    if (memberSearch) {
                      const q = memberSearch.toLowerCase();
                      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
                    }
                    return true;
                  });
                  if (roleMembers.length === 0) return null;
                  const isCollapsed = collapsedRoles.has(roleGroup);
                  const roleLabel = roleGroup.charAt(0).toUpperCase() + roleGroup.slice(1);
                  const roleIcon = roleGroup === "admin" ? Crown : roleGroup === "manager" ? Shield : User;
                  const RoleIcon = roleIcon;
                  return (
                    <div key={roleGroup}>
                      <button
                        onClick={() => setCollapsedRoles((prev) => {
                          const next = new Set(prev);
                          if (next.has(roleGroup)) next.delete(roleGroup); else next.add(roleGroup);
                          return next;
                        })}
                        className="w-full flex items-center gap-2 px-5 py-2 bg-surface/20 border-b border-border hover:bg-surface/40 transition-colors"
                      >
                        <ChevronDown className={`w-3 h-3 text-muted transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                        <RoleIcon className={`w-3 h-3 ${roleGroup === "admin" ? "text-red-600" : roleGroup === "manager" ? "text-amber-600" : "text-gray-500"}`} />
                        <span className="text-xs font-semibold text-foreground">{roleLabel}s</span>
                        <span className="text-[11px] text-muted">({roleMembers.length})</span>
                      </button>
                      {!isCollapsed && (
                        <div className="divide-y divide-border">
                          {roleMembers.map((m) => {
                            const isNonAdmin = m.role !== "admin";
                            return (
                              <div key={m.id} className={`px-5 py-2.5 hover:bg-surface/50 transition-colors ${m.status === "pending" ? "bg-amber-50/40" : ""}`}>
                                <div className="flex items-center gap-2.5">
                                  <div className="relative shrink-0">
                                    <div className={`w-7 h-7 rounded-full ${m.status === "pending" ? "opacity-60" : ""} ${m.avatarColor} flex items-center justify-center text-[10px] font-bold text-white`}>
                                      {m.avatar}
                                    </div>
                                    {m.status === "pending" && (
                                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
                                        <Clock className="w-1.5 h-1.5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-foreground truncate">
                                      {m.name}
                                      {m.id === "u1" && <span className="text-xs text-muted font-normal ml-1">(You)</span>}
                                      {m.status === "pending" && (
                                        <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-100 text-amber-700">Pending</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted truncate">
                                      {m.email}
                                      {m.status === "pending" && <span className="ml-1 text-amber-600">· Invite sent</span>}
                                      {isNonAdmin && m.status === "active" && (
                                        <span className="ml-1">
                                          · reports to{" "}
                                          <select
                                            value={m.reportsTo || ""}
                                            onChange={(e) => { e.stopPropagation(); updateReportsTo(m.id, e.target.value || undefined); }}
                                            className="text-xs bg-transparent border-0 outline-none cursor-pointer text-accent font-medium p-0 pr-3 appearance-none"
                                            style={{ backgroundImage: "none" }}
                                          >
                                            <option value="">no one</option>
                                            {managersAndAdmins
                                              .filter((mgr) => mgr.id !== m.id)
                                              .map((mgr) => (
                                                <option key={mgr.id} value={mgr.id}>
                                                  {mgr.name}
                                                </option>
                                              ))}
                                          </select>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <select
                                    value={m.role}
                                    onChange={(e) => updateRole(m.id, e.target.value as "admin" | "manager" | "member")}
                                    disabled={m.id === "u1"}
                                    className={`text-[11px] font-medium rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer ${roleColors[m.role]} ${
                                      m.id === "u1" ? "opacity-60 cursor-not-allowed" : ""
                                    }`}
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="manager">Manager</option>
                                    <option value="member">Member</option>
                                  </select>
                                  {m.id !== "u1" && (
                                    <button
                                      onClick={() => removeMember(m.id)}
                                      className="p-1 text-muted hover:text-red-500 transition-colors"
                                      title={m.status === "pending" ? "Revoke invite" : "Remove member"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                {members.filter((m) => {
                  if (memberRoleFilter !== "all" && m.role !== memberRoleFilter) return false;
                  if (memberSearch) {
                    const q = memberSearch.toLowerCase();
                    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
                  }
                  return true;
                }).length === 0 && (
                  <div className="px-5 py-8 text-center text-sm text-muted">
                    No members match your search.
                  </div>
                )}

                {/* Collapsible Data Visibility accordion */}
                <div className="border-t border-border">
                  <button
                    onClick={() => setShowVisibility((v) => !v)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium text-foreground">Data Visibility</span>
                      <span className="text-xs text-muted">— who sees what</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted transition-transform ${showVisibility ? "rotate-180" : ""}`} />
                  </button>
                  {showVisibility && (
                    <div className="border-t border-border">
                      {/* Compact role legend */}
                      <div className="px-5 py-3 bg-surface/30 border-b border-border">
                        <div className="flex items-center gap-4 text-[11px]">
                          <span className="flex items-center gap-1.5"><Crown className="w-3 h-3 text-red-600" /><span className="font-medium">Admin</span> <span className="text-muted">All data</span></span>
                          <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-amber-600" /><span className="font-medium">Manager</span> <span className="text-muted">Own + reports</span></span>
                          <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-gray-500" /><span className="font-medium">Member</span> <span className="text-muted">Own only</span></span>
                        </div>
                      </div>
                      {/* Per-member access */}
                      <div className="divide-y divide-border">
                        {members.map((m) => {
                          let canSee: string[] = [];
                          if (m.role === "admin") {
                            canSee = members.map((x) => x.name);
                          } else if (m.role === "manager") {
                            canSee = [m.name];
                            members.forEach((x) => {
                              if (x.reportsTo === m.id) canSee.push(x.name);
                            });
                          } else {
                            canSee = [m.name];
                          }
                          const contactCount = contacts.filter((c) => {
                            const ownerLabels = canSee.map((name) => {
                              const member = members.find((x) => x.name === name);
                              return member?.ownerLabel || "";
                            });
                            return ownerLabels.includes(c.owner);
                          }).length;

                          return (
                            <div key={m.id} className="flex items-center gap-3 px-5 py-2.5">
                              <div className={`w-6 h-6 rounded-full ${m.avatarColor} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}>
                                {m.avatar}
                              </div>
                              <div className="flex-1 min-w-0 text-xs text-muted truncate">
                                <span className="font-medium text-foreground">{m.name}</span>
                                {m.id === "u1" && <span className="ml-1">(You)</span>}
                                {" — "}
                                {canSee.length === members.length ? (
                                  <span className="text-emerald-600 font-medium">all team data</span>
                                ) : (
                                  <span>{canSee.join(", ")}&apos;s data</span>
                                )}
                              </div>
                              <span className="text-[11px] font-medium text-muted tabular-nums">{contactCount} contacts</span>
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${roleColors[m.role]}`}>
                                {m.role}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "pipeline" && (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={tabTransition}
              className="space-y-6"
            >
              {/* Info banner */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
                <GitBranch className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-sm text-blue-800">
                  Customize your sales funnel stages. Drag to reorder, rename, or add new stages to match your workflow.
                </span>
              </div>

              {/* Company-wide warning */}
              <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-amber-900">Company-wide setting</span>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Changes to the pipeline affect <span className="font-medium">all team members</span>. Contacts on removed stages will need to be reassigned.
                  </p>
                </div>
              </div>

              {/* Funnel editor */}
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Pipeline Stages</h3>
                    <p className="text-xs text-muted mt-0.5">{editingStages.length} stages · Drag to reorder</p>
                  </div>
                  {pipelineDirty && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelPipelineChanges}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted border border-border hover:bg-surface rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Discard
                      </button>
                      <button
                        onClick={handleSavePipeline}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Save Changes
                      </button>
                    </div>
                  )}
                </div>

                {/* Visual funnel preview */}
                <div className="px-5 pt-5 pb-3">
                  <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    {editingStages.map((s, i) => (
                      <div key={i} className="flex items-center gap-1 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${s.bgColor} ${s.color}`}>
                          {s.label}
                        </span>
                        {i < editingStages.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-muted/40" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stage list */}
                <div className="divide-y divide-border">
                  {editingStages.map((stage, index) => {
                    const contactCount = contacts.filter((c) => c.stage === stage.label).length;
                    return (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleStageDragStart(index)}
                        onDragEnter={() => handleStageDragEnter(index)}
                        onDragEnd={handleStageDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className={`flex items-center gap-3 px-5 py-3 group cursor-grab active:cursor-grabbing transition-colors ${
                          dragOverStageIdx === index ? "bg-accent/5" : "hover:bg-surface/50"
                        }`}
                      >
                        <GripVertical className="w-4 h-4 text-muted/30 group-hover:text-muted shrink-0 transition-colors" />
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-medium text-muted w-5 text-center">{index + 1}</span>
                          <span className={`w-3 h-3 rounded-full ${stage.bgColor} border ${stage.color.replace("text-", "border-")}`} />
                        </div>
                        <input
                          type="text"
                          value={stage.label}
                          onChange={(e) => handleStageRename(index, e.target.value)}
                          className="flex-1 text-sm font-medium bg-transparent text-foreground outline-none border-b border-transparent focus:border-accent transition-colors"
                        />
                        {/* Color picker dots */}
                        <div className="hidden group-hover:flex items-center gap-1">
                          {stageColorOptions.slice(0, 6).map((opt) => (
                            <button
                              key={opt.label}
                              onClick={() => handleStageColorChange(index, opt)}
                              className={`w-4 h-4 rounded-full ${opt.bgColor} border ${opt.color.replace("text-", "border-")} transition-transform hover:scale-125 ${
                                stage.color === opt.color ? "ring-2 ring-offset-1 ring-accent" : ""
                              }`}
                              title={opt.label}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {contactCount > 0 && (
                            <span className="text-[10px] text-muted bg-surface px-1.5 py-0.5 rounded-full">
                              {contactCount} deal{contactCount !== 1 ? "s" : ""}
                            </span>
                          )}
                          {editingStages.length > 2 && (
                            <button
                              onClick={() => handleRemoveStage(index)}
                              className="p-1 text-muted/30 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                              title="Remove stage"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add new stage */}
                <div className="px-5 py-3 border-t border-border bg-surface/30">
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-accent shrink-0" />
                    <input
                      type="text"
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddStage()}
                      placeholder="Add a new stage..."
                      className="flex-1 text-sm bg-transparent text-foreground outline-none placeholder:text-muted"
                    />
                    {newStageName.trim() && (
                      <button
                        onClick={handleAddStage}
                        className="px-3 py-1 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Stage templates */}
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Quick Templates</h3>
                  <p className="text-xs text-muted mt-0.5">Start from a common pipeline template.</p>
                </div>
                <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      name: "B2B Sales",
                      desc: "Classic 6-stage funnel",
                      stages: [
                        { label: "Lead", color: "text-blue-700", bgColor: "bg-blue-100" },
                        { label: "Qualified", color: "text-purple-700", bgColor: "bg-purple-100" },
                        { label: "Proposal", color: "text-amber-700", bgColor: "bg-amber-100" },
                        { label: "Negotiation", color: "text-orange-700", bgColor: "bg-orange-100" },
                        { label: "Closed Won", color: "text-emerald-700", bgColor: "bg-emerald-100" },
                        { label: "Closed Lost", color: "text-red-700", bgColor: "bg-red-100" },
                      ],
                    },
                    {
                      name: "SaaS Pipeline",
                      desc: "Product-led growth",
                      stages: [
                        { label: "Awareness", color: "text-blue-700", bgColor: "bg-blue-100" },
                        { label: "Interest", color: "text-cyan-700", bgColor: "bg-cyan-100" },
                        { label: "Demo", color: "text-purple-700", bgColor: "bg-purple-100" },
                        { label: "Trial", color: "text-amber-700", bgColor: "bg-amber-100" },
                        { label: "Negotiation", color: "text-orange-700", bgColor: "bg-orange-100" },
                        { label: "Closed Won", color: "text-emerald-700", bgColor: "bg-emerald-100" },
                        { label: "Closed Lost", color: "text-red-700", bgColor: "bg-red-100" },
                      ],
                    },
                    {
                      name: "Simple 3-Stage",
                      desc: "Minimal pipeline",
                      stages: [
                        { label: "New", color: "text-blue-700", bgColor: "bg-blue-100" },
                        { label: "In Progress", color: "text-amber-700", bgColor: "bg-amber-100" },
                        { label: "Won", color: "text-emerald-700", bgColor: "bg-emerald-100" },
                        { label: "Lost", color: "text-red-700", bgColor: "bg-red-100" },
                      ],
                    },
                    {
                      name: "Real Estate",
                      desc: "Property sales flow",
                      stages: [
                        { label: "Inquiry", color: "text-blue-700", bgColor: "bg-blue-100" },
                        { label: "Viewing", color: "text-purple-700", bgColor: "bg-purple-100" },
                        { label: "Offer", color: "text-amber-700", bgColor: "bg-amber-100" },
                        { label: "Under Contract", color: "text-orange-700", bgColor: "bg-orange-100" },
                        { label: "Closed Won", color: "text-emerald-700", bgColor: "bg-emerald-100" },
                        { label: "Closed Lost", color: "text-red-700", bgColor: "bg-red-100" },
                      ],
                    },
                    {
                      name: "Consulting",
                      desc: "Service engagement",
                      stages: [
                        { label: "Discovery", color: "text-blue-700", bgColor: "bg-blue-100" },
                        { label: "Scoping", color: "text-purple-700", bgColor: "bg-purple-100" },
                        { label: "Proposal", color: "text-amber-700", bgColor: "bg-amber-100" },
                        { label: "SOW Review", color: "text-orange-700", bgColor: "bg-orange-100" },
                        { label: "Engaged", color: "text-emerald-700", bgColor: "bg-emerald-100" },
                      ],
                    },
                    {
                      name: "Recruiting",
                      desc: "Hiring pipeline",
                      stages: [
                        { label: "Applied", color: "text-blue-700", bgColor: "bg-blue-100" },
                        { label: "Phone Screen", color: "text-cyan-700", bgColor: "bg-cyan-100" },
                        { label: "Interview", color: "text-purple-700", bgColor: "bg-purple-100" },
                        { label: "Technical", color: "text-indigo-700", bgColor: "bg-indigo-100" },
                        { label: "Offer", color: "text-amber-700", bgColor: "bg-amber-100" },
                        { label: "Hired", color: "text-emerald-700", bgColor: "bg-emerald-100" },
                        { label: "Rejected", color: "text-red-700", bgColor: "bg-red-100" },
                        { label: "Withdrawn", color: "text-orange-700", bgColor: "bg-orange-100" },
                      ],
                    },
                  ].map((template) => (
                    <button
                      key={template.name}
                      onClick={() => { setEditingStages(template.stages); setPipelineDirty(true); }}
                      className="text-left rounded-lg border border-border p-3 hover:border-accent/50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-foreground">{template.name}</div>
                        <span className="text-[10px] text-muted">{template.stages.length} stages</span>
                      </div>
                      <p className="text-[11px] text-muted mb-2">{template.desc}</p>
                      <div className="flex flex-wrap gap-1">
                        {template.stages.map((s, i) => (
                          <span key={i} className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${s.bgColor} ${s.color}`}>
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Reassignment modal */}
          {showReassignModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowReassignModal(false)} />
              <div className="relative bg-white rounded-xl border border-border shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-base font-semibold text-foreground">Reassign Contacts</h3>
                  <p className="text-sm text-muted mt-1">
                    The following stages are being removed and have contacts assigned. Choose where to move them.
                  </p>
                </div>
                <div className="p-5 space-y-4">
                  {removedStages.map((oldStage) => {
                    const count = contacts.filter((c) => c.stage === oldStage).length;
                    const oldStageInfo = pipelineStages.find((s) => s.label === oldStage);
                    return (
                      <div key={oldStage} className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {oldStageInfo && (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${oldStageInfo.bgColor} ${oldStageInfo.color}`}>
                                {oldStage}
                              </span>
                            )}
                            <span className="text-xs text-red-600 font-medium">Removing</span>
                          </div>
                          <span className="text-xs text-muted">
                            {count} contact{count !== 1 ? "s" : ""} affected
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted shrink-0">Move to:</span>
                          <select
                            value={reassignments[oldStage] || ""}
                            onChange={(e) => setReassignments((prev) => ({ ...prev, [oldStage]: e.target.value }))}
                            className="flex-1 text-sm bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                          >
                            {editingStages.map((s) => (
                              <option key={s.label} value={s.label}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-5 py-4 border-t border-border bg-surface/30 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowReassignModal(false)}
                    className="px-4 py-2 text-sm font-medium text-muted border border-border hover:bg-surface rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReassignment}
                    className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
                  >
                    Confirm & Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "alerts" && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={tabTransition}
              className="space-y-6"
            >
              {/* Info banner */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
                <BellRing className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-sm text-blue-800">
                  Configure when contacts, deals, and tasks trigger alerts in <span className="font-medium">For You</span> and the notification bell.
                </span>
              </div>

              {/* Company-wide warning */}
              <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-amber-900">Company-wide setting</span>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Changes here apply to <span className="font-medium">all team members</span> in your workspace. Alert thresholds and preferences will update across every user&apos;s dashboard, notifications, and daily briefing.
                  </p>
                </div>
              </div>

              {/* Alert toggles */}
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Alert Types</h3>
                  <p className="text-xs text-muted mt-0.5">Choose which alert categories to show.</p>
                </div>
                <div className="divide-y divide-border">
                  {/* Overdue tasks */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Overdue tasks</div>
                        <div className="text-xs text-muted">Alert when tasks pass their due date</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpdateAlertSettings({ ...alertSettings, overdueAlerts: !alertSettings.overdueAlerts })}
                      className={`relative w-10 h-6 rounded-full transition-colors ${alertSettings.overdueAlerts ? "bg-accent" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${alertSettings.overdueAlerts ? "left-5" : "left-1"}`} />
                    </button>
                  </div>

                  {/* Due today */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Due today reminders</div>
                        <div className="text-xs text-muted">Remind about tasks due today</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpdateAlertSettings({ ...alertSettings, todayAlerts: !alertSettings.todayAlerts })}
                      className={`relative w-10 h-6 rounded-full transition-colors ${alertSettings.todayAlerts ? "bg-accent" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${alertSettings.todayAlerts ? "left-5" : "left-1"}`} />
                    </button>
                  </div>

                  {/* Negotiation deals */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Negotiation stage deals</div>
                        <div className="text-xs text-muted">Alert for deals in Negotiation that need action</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpdateAlertSettings({ ...alertSettings, negotiationAlerts: !alertSettings.negotiationAlerts })}
                      className={`relative w-10 h-6 rounded-full transition-colors ${alertSettings.negotiationAlerts ? "bg-accent" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${alertSettings.negotiationAlerts ? "left-5" : "left-1"}`} />
                    </button>
                  </div>

                  {/* Stale contacts */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <PhoneOff className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Stale contacts</div>
                        <div className="text-xs text-muted">Alert when contacts have no recent touchpoints</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpdateAlertSettings({ ...alertSettings, staleContactAlerts: !alertSettings.staleContactAlerts })}
                      className={`relative w-10 h-6 rounded-full transition-colors ${alertSettings.staleContactAlerts ? "bg-accent" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${alertSettings.staleContactAlerts ? "left-5" : "left-1"}`} />
                    </button>
                  </div>

                  {/* At risk proposals */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">At-risk proposals</div>
                        <div className="text-xs text-muted">Alert for proposals with low engagement</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onUpdateAlertSettings({ ...alertSettings, atRiskAlerts: !alertSettings.atRiskAlerts })}
                      className={`relative w-10 h-6 rounded-full transition-colors ${alertSettings.atRiskAlerts ? "bg-accent" : "bg-gray-300"}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${alertSettings.atRiskAlerts ? "left-5" : "left-1"}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Threshold settings */}
              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Thresholds</h3>
                  <p className="text-xs text-muted mt-0.5">Fine-tune when alerts are triggered.</p>
                </div>
                <div className="divide-y divide-border">
                  {/* Stale days */}
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">Stale contact threshold</div>
                        <div className="text-xs text-muted">Days without a touchpoint before flagging a contact</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-accent">{alertSettings.staleDays}</span>
                        <span className="text-xs text-muted">days</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={3}
                      max={90}
                      value={alertSettings.staleDays}
                      onChange={(e) => onUpdateAlertSettings({ ...alertSettings, staleDays: Number(e.target.value) })}
                      className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-accent"
                    />
                    <div className="flex justify-between text-[10px] text-muted mt-1">
                      <span>3 days</span>
                      <span>30 days</span>
                      <span>90 days</span>
                    </div>
                  </div>

                  {/* At risk touchpoints */}
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">At-risk touchpoint minimum</div>
                        <div className="text-xs text-muted">Proposals with this many or fewer touchpoints are flagged</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onUpdateAlertSettings({ ...alertSettings, atRiskTouchpoints: Math.max(0, alertSettings.atRiskTouchpoints - 1) })}
                          className="w-7 h-7 rounded-lg border border-border text-foreground hover:bg-surface flex items-center justify-center text-sm font-medium transition-colors"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-lg font-bold text-accent">{alertSettings.atRiskTouchpoints}</span>
                        <button
                          onClick={() => onUpdateAlertSettings({ ...alertSettings, atRiskTouchpoints: alertSettings.atRiskTouchpoints + 1 })}
                          className="w-7 h-7 rounded-lg border border-border text-foreground hover:bg-surface flex items-center justify-center text-sm font-medium transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* High value threshold */}
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">High-value deal threshold</div>
                        <div className="text-xs text-muted">Early-stage deals above this amount get flagged for follow-up</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-muted">$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={thresholdDisplay}
                          onChange={(e) => handleThresholdChange(e.target.value)}
                          onBlur={handleThresholdBlur}
                          className="w-28 text-sm font-medium text-right bg-white border border-border rounded-lg px-3 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset defaults */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    onUpdateAlertSettings({
                      staleDays: 14,
                      atRiskTouchpoints: 1,
                      highValueThreshold: 10000,
                      overdueAlerts: true,
                      todayAlerts: true,
                      negotiationAlerts: true,
                      staleContactAlerts: true,
                      atRiskAlerts: true,
                    });
                    setThresholdDisplay(formatNumber(10000));
                  }}
                  className="px-4 py-2 text-xs font-medium text-muted border border-border hover:text-foreground hover:border-gray-400 rounded-lg transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>
            </motion.div>
          )}

          {/* Email Templates Tab */}
          {activeTab === "templates" && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={tabTransition}
              className="space-y-6"
            >
              {/* Gmail Integration */}
              <IntegrationsPanel isLive={!!isLive} />

              {/* Email Signature */}
              <SignatureEditor
                signature={emailSignature}
                onSave={(sig) => onUpdateSignature?.(sig)}
                isLive={!!isLive}
              />

              <div className="bg-white rounded-xl border border-border overflow-hidden">
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Email Templates</h3>
                    <p className="text-xs text-muted mt-0.5">Customize templates your team uses when emailing contacts</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddTemplate(true);
                      setEditingTemplateId(null);
                      setEditTemplateName("");
                      setEditTemplateSubject("");
                      setEditTemplateBody("");
                      setEditTemplateCategory("follow-up");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent border border-accent/30 hover:bg-accent-light rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Template
                  </button>
                </div>

                {/* Add / Edit template form */}
                {(showAddTemplate || editingTemplateId) && (
                  <div className="px-5 py-4 border-b border-border bg-surface/50">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted block mb-1">Template Name</label>
                          <input
                            type="text"
                            value={editTemplateName}
                            onChange={(e) => setEditTemplateName(e.target.value)}
                            placeholder="e.g., Follow-Up After Demo"
                            className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted block mb-1">Category</label>
                          <select
                            value={editTemplateCategory}
                            onChange={(e) => setEditTemplateCategory(e.target.value as EmailTemplate["category"])}
                            className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                          >
                            <option value="follow-up">Follow-Up</option>
                            <option value="intro">Introduction</option>
                            <option value="proposal">Proposal</option>
                            <option value="thank-you">Thank You</option>
                            <option value="check-in">Check-In</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted block mb-1">Subject Line</label>
                        <input
                          type="text"
                          value={editTemplateSubject}
                          onChange={(e) => setEditTemplateSubject(e.target.value)}
                          placeholder="e.g., Great connecting, {{firstName}}!"
                          className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted block mb-1">Body</label>
                        <textarea
                          value={editTemplateBody}
                          onChange={(e) => setEditTemplateBody(e.target.value)}
                          placeholder="Hi {{firstName}},&#10;&#10;Write your template here..."
                          rows={6}
                          className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted resize-none"
                        />
                      </div>
                      <div className="bg-surface rounded-lg px-3 py-2 border border-border">
                        <p className="text-[11px] text-muted">
                          <span className="font-medium">Available variables:</span>{" "}
                          <code className="text-accent">{"{{firstName}}"}</code>{" "}
                          <code className="text-accent">{"{{company}}"}</code>{" "}
                          <code className="text-accent">{"{{senderName}}"}</code>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (!editTemplateName.trim() || !editTemplateSubject.trim()) return;
                            if (editingTemplateId) {
                              // Update existing
                              const updated = emailTemplates.map((t) =>
                                t.id === editingTemplateId
                                  ? { ...t, name: editTemplateName.trim(), subject: editTemplateSubject.trim(), body: editTemplateBody.trim(), category: editTemplateCategory }
                                  : t
                              );
                              onUpdateEmailTemplates?.(updated);
                            } else {
                              // Add new
                              const newTemplate: EmailTemplate = {
                                id: `t-${Date.now()}`,
                                name: editTemplateName.trim(),
                                subject: editTemplateSubject.trim(),
                                body: editTemplateBody.trim(),
                                category: editTemplateCategory,
                              };
                              onUpdateEmailTemplates?.([...emailTemplates, newTemplate]);
                            }
                            setEditingTemplateId(null);
                            setShowAddTemplate(false);
                            setEditTemplateName("");
                            setEditTemplateSubject("");
                            setEditTemplateBody("");
                          }}
                          disabled={!editTemplateName.trim() || !editTemplateSubject.trim()}
                          className="px-4 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {editingTemplateId ? "Save Changes" : "Add Template"}
                        </button>
                        <button
                          onClick={() => { setEditingTemplateId(null); setShowAddTemplate(false); }}
                          className="px-4 py-1.5 text-xs font-medium text-muted hover:text-foreground border border-border rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Template list */}
                <div className="divide-y divide-border">
                  {emailTemplates.map((t) => {
                    const categoryColors: Record<string, { bg: string; text: string }> = {
                      "follow-up": { bg: "bg-blue-50", text: "text-blue-700" },
                      intro: { bg: "bg-emerald-50", text: "text-emerald-700" },
                      proposal: { bg: "bg-violet-50", text: "text-violet-700" },
                      "thank-you": { bg: "bg-amber-50", text: "text-amber-700" },
                      "check-in": { bg: "bg-gray-100", text: "text-gray-700" },
                    };
                    const cat = categoryColors[t.category] || categoryColors["check-in"];
                    return (
                      <div key={t.id} className="px-5 py-3 hover:bg-surface/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${cat.bg} flex items-center justify-center shrink-0`}>
                            <Mail className={`w-4 h-4 ${cat.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground">{t.name}</div>
                            <div className="text-xs text-muted truncate">{t.subject}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cat.bg} ${cat.text} shrink-0 hidden sm:inline`}>
                            {t.category}
                          </span>
                          <button
                            onClick={() => {
                              setEditingTemplateId(t.id);
                              setShowAddTemplate(false);
                              setEditTemplateName(t.name);
                              setEditTemplateSubject(t.subject);
                              setEditTemplateBody(t.body);
                              setEditTemplateCategory(t.category);
                            }}
                            className="p-1.5 text-muted hover:text-foreground transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              onUpdateEmailTemplates?.(emailTemplates.filter((et) => et.id !== t.id));
                            }}
                            className="p-1.5 text-muted hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {emailTemplates.length === 0 && (
                    <div className="text-center py-12 text-sm text-muted">
                      No email templates yet. Add one to get started.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Reassignment modal */}
      <AnimatePresence>
        {removingMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setRemovingMember(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1 text-center">Remove {removingMember.name}?</h3>
                <p className="text-sm text-muted leading-relaxed text-center mb-5">
                  {(() => {
                    const count = contacts.filter((c) => c.owner === removingMember.ownerLabel).length;
                    if (count === 0) return "This member has no assigned contacts. Their tasks and activities will be reassigned.";
                    return `${count} contact${count !== 1 ? "s" : ""}, plus any tasks and activities assigned to ${removingMember.name.split(" ")[0]}, will be reassigned.`;
                  })()}
                </p>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Reassign everything to
                </label>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer"
                >
                  {members
                    .filter((m) => m.id !== removingMember.id && m.status === "active")
                    .map((m) => (
                      <option key={m.id} value={m.ownerLabel}>
                        {m.name}{m.ownerLabel === "You" ? " (You)" : ""} — {m.role}
                      </option>
                    ))}
                </select>
              </div>
              <div className="px-6 pb-4 flex gap-3">
                <button
                  onClick={() => setRemovingMember(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-white border border-border hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveMember}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-600/20 whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  Remove &amp; Reassign
                </button>
              </div>
              <div className="px-6 pb-6 border-t border-border pt-3">
                <button
                  onClick={() => {
                    if (onReassignAndRemoveMember && removingMember) {
                      onReassignAndRemoveMember(removingMember.id, "Unassigned");
                    }
                    setRemovingMember(null);
                    setReassignTo("");
                  }}
                  className="w-full text-center text-xs font-medium text-muted hover:text-foreground transition-colors py-1"
                >
                  Skip for now — mark as unassigned
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================
// Integrations Panel (Gmail OAuth connect/disconnect)
// =============================================
function SignatureEditor({ signature, onSave, isLive }: { signature: string; onSave: (sig: string) => void; isLive: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(signature);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(signature);
  }, [signature]);

  function handleSave() {
    onSave(draft);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const previewHtml = draft
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#3b82f6">$1</a>');

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Email Signature</h3>
          <p className="text-xs text-muted mt-0.5">Automatically appended to every email you send</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent border border-accent/30 hover:bg-accent-light rounded-lg transition-colors"
          >
            <Pencil className="w-3 h-3" />
            {draft ? "Edit" : "Create"}
          </button>
        )}
      </div>

      {editing ? (
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted block mb-1.5">Signature Content</label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              placeholder={"Best regards,\n**Your Name**\nYour Title | Company Name\n(555) 123-4567\n[company.com](https://company.com)"}
              className="w-full text-sm bg-white border border-border rounded-lg px-3 py-3 outline-none focus:ring-1 focus:ring-accent resize-y placeholder:text-muted font-mono"
            />
            <div className="flex items-center gap-3 mt-1.5">
              <p className="text-[10px] text-muted flex-1">
                Use **bold** for emphasis, [text](url) for links. Supports {"{{senderName}}"}.
              </p>
            </div>
          </div>

          {draft.trim() && (
            <div>
              <label className="text-xs font-medium text-muted block mb-1.5">Preview</label>
              <div className="bg-gray-50 border border-border rounded-lg p-4">
                <div className="border-t-2 border-gray-300 pt-3 mt-1">
                  <div
                    className="text-sm text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Save Signature
            </button>
            <button
              onClick={() => { setEditing(false); setDraft(signature); }}
              className="px-4 py-2 text-xs font-medium text-muted hover:text-foreground border border-border rounded-lg transition-colors"
            >
              Cancel
            </button>
            {draft.trim() && (
              <button
                onClick={() => { setDraft(""); }}
                className="px-4 py-2 text-xs font-medium text-red-500 hover:text-red-700 transition-colors ml-auto"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-5">
          {draft.trim() ? (
            <div className="bg-gray-50 border border-border rounded-lg p-4">
              <div className="border-t-2 border-gray-300 pt-3 mt-1">
                <div
                  className="text-sm text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted">No signature configured yet.</p>
              <p className="text-xs text-muted mt-1">Add a professional signature that appears at the bottom of every email.</p>
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-600">
              <Check className="w-3.5 h-3.5" />
              Signature saved!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IntegrationsPanel({ isLive }: { isLive: boolean }) {
  const [gmailStatus, setGmailStatus] = useState<{ connected: boolean; email?: string; loading: boolean }>({ connected: false, loading: !isLive ? false : true });
  const [disconnecting, setDisconnecting] = useState(false);

  // Fetch Gmail connection status on mount (only in live mode)
  useEffect(() => {
    if (!isLive) return;
    fetch("/api/auth/google/status")
      .then((res) => res.json())
      .then((data) => setGmailStatus({ connected: data.connected, email: data.email, loading: false }))
      .catch(() => setGmailStatus({ connected: false, loading: false }));
  }, [isLive]);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/auth/google/disconnect", { method: "POST" });
      setGmailStatus({ connected: false, loading: false });
    } catch {
      // ignore
    }
    setDisconnecting(false);
  }

  const gmailIcon = (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
      <path d="M22 6.5V17.5C22 18.6046 21.1046 19.5 20 19.5H18V8.5L12 12.5L6 8.5V19.5H4C2.89543 19.5 2 18.6046 2 17.5V6.5C2 5.39543 2.89543 4.5 4 4.5H4.5L12 9.5L19.5 4.5H20C21.1046 4.5 22 5.39543 22 6.5Z" fill="#EA4335"/>
      <path d="M22 6.5L12 12.5L2 6.5" stroke="#EA4335" strokeWidth="0"/>
      <path d="M6 8.5V19.5H4C2.89543 19.5 2 18.6046 2 17.5V6.5L12 12.5" fill="#34A853"/>
      <path d="M18 8.5V19.5H20C21.1046 19.5 22 18.6046 22 17.5V6.5L12 12.5" fill="#4285F4"/>
      <path d="M2 6.5C2 5.39543 2.89543 4.5 4 4.5H4.5L12 9.5L2 3.5V6.5Z" fill="#FBBC05"/>
      <path d="M22 6.5C22 5.39543 21.1046 4.5 20 4.5H19.5L12 9.5L22 3.5V6.5Z" fill="#C5221F"/>
    </svg>
  );

  const microsoftIcon = (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  );

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Email Integration</h3>
          <p className="text-xs text-muted mt-0.5">Connect your email to send messages directly from WorkChores</p>
        </div>
        {!isLive && (
          <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent bg-accent/10 rounded-full border border-accent/20">
            Available with account
          </span>
        )}
      </div>

      <div className={`p-5 ${!isLive ? "opacity-50 pointer-events-none select-none" : ""}`}>
        {/* Gmail */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface/30">
          <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">
            {gmailIcon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">Gmail / Google Workspace</div>
            {isLive && gmailStatus.loading ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Loader2 className="w-3 h-3 text-muted animate-spin" />
                <span className="text-xs text-muted">Checking connection...</span>
              </div>
            ) : isLive && gmailStatus.connected ? (
              <div className="text-xs text-muted mt-0.5">
                Connected as <span className="font-medium text-emerald-600">{gmailStatus.email}</span>
              </div>
            ) : (
              <div className="text-xs text-muted mt-0.5">
                Send emails from your Gmail account directly within WorkChores
              </div>
            )}
          </div>

          {isLive ? (
            gmailStatus.loading ? null : gmailStatus.connected ? (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
                Disconnect
              </button>
            ) : (
              <a
                href="/api/auth/google/connect"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
              >
                <Link2 className="w-3.5 h-3.5" />
                Connect Gmail
              </a>
            )
          ) : (
            <span className="px-3 py-1.5 text-xs font-medium text-muted bg-gray-100 rounded-lg">
              Connect Gmail
            </span>
          )}
        </div>

        {/* Microsoft — coming soon */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface/30 mt-3 opacity-60">
          <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">
            {microsoftIcon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground">Microsoft Outlook / 365</div>
            <div className="text-xs text-muted mt-0.5">Coming soon</div>
          </div>
          <span className="px-3 py-1.5 text-xs font-medium text-muted bg-gray-100 rounded-lg">Coming Soon</span>
        </div>
      </div>

      {/* Sign up CTA for demo mode */}
      {!isLive && (
        <div className="px-5 py-3 border-t border-border bg-accent/5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">
              <a href="/signup" className="font-medium text-accent hover:underline">Create a free account</a> to connect your Gmail and send emails from WorkChores.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
