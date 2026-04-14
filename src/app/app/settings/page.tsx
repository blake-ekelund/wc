"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { fetchWorkspaceData, createSupabaseSyncCallbacks } from "@/lib/supabase-crm";
import { type AlertSettings } from "./sections/notifications";
import { type TeamMember, type CrmSyncCallbacks } from "@/components/demo/demo-app";
import { type StageDefinition, type Contact } from "@/components/demo/data";
import { type EmailTemplate, defaultTemplates } from "@/components/demo/email-templates";
import { Loader2, ArrowLeft, Building2, Palette, Puzzle, Shield, CreditCard, Users, GitBranch, Bell, Mail } from "lucide-react";

import GeneralSection from "./sections/general";
import AppearanceSection from "./sections/appearance";
import PluginsSection from "./sections/plugins";
import SecuritySection from "./sections/security";
import BillingSection from "./sections/billing";
import TeamSection from "./sections/team";
import PipelineSection from "./sections/pipeline";
import NotificationsSection from "./sections/notifications";
import EmailSection from "./sections/email";

type SettingsSection = "general" | "appearance" | "plugins" | "security" | "billing" | "team" | "pipeline" | "notifications" | "email";

const sections: { id: SettingsSection; label: string; icon: typeof Building2 }[] = [
  { id: "general", label: "General", icon: Building2 },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "plugins", label: "Plugins", icon: Puzzle },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "team", label: "Team", icon: Users },
  { id: "pipeline", label: "Pipeline", icon: GitBranch },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "email", label: "Email", icon: Mail },
];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  // Settings data state
  const [workspaceId, setWorkspaceId] = useState("");
  const [companyName, setCompanyName] = useState("WorkChores");
  const [workspaceTheme, setWorkspaceTheme] = useState("blue");
  const [enabledPlugins, setEnabledPlugins] = useState<string[]>(["crm", "vendors", "tasks"]);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    staleDays: 14,
    atRiskTouchpoints: 1,
    highValueThreshold: 10000,
    overdueAlerts: true,
    todayAlerts: true,
    negotiationAlerts: true,
    staleContactAlerts: true,
    atRiskAlerts: true,
  });
  const [pipelineStages, setPipelineStages] = useState<StageDefinition[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [emailSignature, setEmailSignature] = useState("");
  const [workspacePlan, setWorkspacePlan] = useState<"free" | "business">("free");
  const [sync, setSync] = useState<CrmSyncCallbacks>({});

  useEffect(() => {
    async function loadWorkspace() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/signin");
        return;
      }

      // Get user's workspace membership
      const { data: memberships } = await supabase
        .from("workspace_members")
        .select("workspace_id, role")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);

      if (!memberships || memberships.length === 0) {
        router.push("/onboarding");
        return;
      }

      const wsId = memberships[0].workspace_id;
      const memberRole = memberships[0].role === "owner" ? "admin" : memberships[0].role;

      if (memberRole !== "admin") {
        router.push("/app");
        return;
      }

      try {
        const data = await fetchWorkspaceData(wsId, user.id);
        if (!data) {
          setError("Could not load workspace data.");
          setLoading(false);
          return;
        }

        const syncCallbacks = createSupabaseSyncCallbacks(wsId);

        setWorkspaceId(wsId);
        setCompanyName(data.workspace.name);
        setWorkspaceTheme(data.workspace.theme || "blue");
        setEnabledPlugins(data.workspace.enabledPlugins || ["crm", "vendors", "tasks"]);
        setAlertSettings(data.alertSettings as AlertSettings);
        setPipelineStages(data.stages);
        setContacts(data.contacts);
        setTeamMembers(data.teamMembers);
        setEmailTemplates(data.emailTemplates && data.emailTemplates.length > 0 ? data.emailTemplates : defaultTemplates);
        setEmailSignature(data.emailSignature || "");
        setWorkspacePlan(data.workspace.plan === "business" ? "business" : "free");
        setSync(syncCallbacks);
        setLoading(false);

        // Auto-navigate to billing tab when returning from Stripe checkout
        const params = new URLSearchParams(window.location.search);
        if (params.get("plan") && params.get("session_id")) {
          setActiveSection("billing");
        }
      } catch {
        setError("Failed to load workspace. Please try again.");
        setLoading(false);
      }
    }

    loadWorkspace();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center font-[family-name:var(--font-geist-sans)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center font-[family-name:var(--font-geist-sans)]">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h1 className="text-lg font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-sm text-muted mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Plan enforcement
  const activeTeamMemberCount = teamMembers.filter((m) => m.status === "active").length;
  const memberLimitReached = workspacePlan === "free" && activeTeamMemberCount >= 3;

  function handleUpdateStages(newStages: StageDefinition[], reassignments?: Record<string, string>) {
    setPipelineStages(newStages);
    sync.saveStages?.(newStages);
    if (reassignments) {
      setContacts((prev) =>
        prev.map((c) => {
          if (reassignments[c.stage]) {
            const updated = { ...c, stage: reassignments[c.stage] };
            sync.saveContact?.(updated);
            return updated;
          }
          return c;
        })
      );
    }
  }

  function handleReassignAndRemoveMember(memberId: string, reassignToLabel: string) {
    const member = teamMembers.find((m) => m.id === memberId);
    if (!member) return;
    setContacts((prev) =>
      prev.map((c) => {
        if (c.owner === member.ownerLabel) {
          const updated = { ...c, owner: reassignToLabel };
          sync.saveContact?.(updated);
          return updated;
        }
        return c;
      })
    );
    const updated = teamMembers.filter((m) => m.id !== memberId);
    setTeamMembers(updated);
    sync.saveTeamMembers?.(updated);
  }

  return (
    <div className="h-screen flex font-[family-name:var(--font-geist-sans)]">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-white flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <Link href="/app" className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to CRM
          </Link>
          <h1 className="text-lg font-bold text-foreground mt-3">Settings</h1>
        </div>

        {/* Section links */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeSection === s.id
                    ? "bg-accent-light text-accent font-medium"
                    : "text-muted hover:text-foreground hover:bg-surface"
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-surface">
        <div className="max-w-3xl mx-auto p-6 sm:p-8">
          {activeSection === "general" && (
            <GeneralSection
              companyName={companyName}
              onChangeCompanyName={(n) => { setCompanyName(n); sync.saveWorkspaceName?.(n); }}
              isLive
            />
          )}
          {activeSection === "appearance" && (
            <AppearanceSection
              theme={workspaceTheme}
              onChangeTheme={(t) => { setWorkspaceTheme(t); sync.saveWorkspaceTheme?.(t); }}
            />
          )}
          {activeSection === "plugins" && (
            <PluginsSection
              enabledPlugins={enabledPlugins}
              onChangePlugins={(p) => { setEnabledPlugins(p); sync.saveEnabledPlugins?.(p); }}
            />
          )}
          {activeSection === "security" && (
            <SecuritySection isLive />
          )}
          {activeSection === "billing" && (
            <BillingSection
              isLive
              workspaceId={workspaceId}
              teamMembers={teamMembers}
              contacts={contacts}
            />
          )}
          {activeSection === "team" && (
            <TeamSection
              teamMembers={teamMembers}
              onUpdateTeamMembers={(m) => { setTeamMembers(m); sync.saveTeamMembers?.(m); }}
              onReassignAndRemoveMember={handleReassignAndRemoveMember}
              contacts={contacts}
              isLive
              workspaceId={workspaceId}
              memberLimitReached={memberLimitReached}
            />
          )}
          {activeSection === "pipeline" && (
            <PipelineSection
              pipelineStages={pipelineStages}
              onUpdateStages={handleUpdateStages}
              contacts={contacts}
            />
          )}
          {activeSection === "notifications" && (
            <NotificationsSection
              alertSettings={alertSettings}
              onUpdateAlertSettings={(s) => { setAlertSettings(s); sync.saveAlertSettings?.(s); }}
            />
          )}
          {activeSection === "email" && (
            <EmailSection
              emailTemplates={emailTemplates}
              onUpdateEmailTemplates={(t) => { setEmailTemplates(t); sync.saveAllEmailTemplates?.(t); }}
              emailSignature={emailSignature}
              onUpdateSignature={(sig) => { setEmailSignature(sig); sync.saveSignature?.(sig); }}
              isLive
            />
          )}
        </div>
      </div>
    </div>
  );
}
