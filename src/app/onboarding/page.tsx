"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Briefcase,
  Home,
  Users,
  Wrench,
  Monitor,
  Check,
  Loader2,
  Sparkles,
  GitBranch,
  Plus,
  X,
  GripVertical,
  UserPlus,
  Mail,
  FileText,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const industries = [
  { id: "b2b-sales", label: "B2B Sales", icon: Briefcase, description: "Sell products or services to other businesses", color: "bg-blue-50 border-blue-200 text-blue-700", activeColor: "bg-blue-100 border-blue-500 ring-2 ring-blue-500/20" },
  { id: "saas", label: "SaaS", icon: Monitor, description: "Software subscriptions and recurring revenue", color: "bg-violet-50 border-violet-200 text-violet-700", activeColor: "bg-violet-100 border-violet-500 ring-2 ring-violet-500/20" },
  { id: "real-estate", label: "Real Estate", icon: Home, description: "Property sales, listings, and client management", color: "bg-emerald-50 border-emerald-200 text-emerald-700", activeColor: "bg-emerald-100 border-emerald-500 ring-2 ring-emerald-500/20" },
  { id: "recruiting", label: "Recruiting", icon: Users, description: "Candidate sourcing, placement, and hiring", color: "bg-amber-50 border-amber-200 text-amber-700", activeColor: "bg-amber-100 border-amber-500 ring-2 ring-amber-500/20" },
  { id: "consulting", label: "Consulting", icon: Briefcase, description: "Professional services and advisory", color: "bg-rose-50 border-rose-200 text-rose-700", activeColor: "bg-rose-100 border-rose-500 ring-2 ring-rose-500/20" },
  { id: "home-services", label: "Home Services", icon: Wrench, description: "Contractors, repairs, and home improvement", color: "bg-cyan-50 border-cyan-200 text-cyan-700", activeColor: "bg-cyan-100 border-cyan-500 ring-2 ring-cyan-500/20" },
];

const stageColors = [
  { color: "text-blue-700", bgColor: "bg-blue-100" },
  { color: "text-purple-700", bgColor: "bg-purple-100" },
  { color: "text-amber-700", bgColor: "bg-amber-100" },
  { color: "text-orange-700", bgColor: "bg-orange-100" },
  { color: "text-emerald-700", bgColor: "bg-emerald-100" },
  { color: "text-red-700", bgColor: "bg-red-100" },
  { color: "text-cyan-700", bgColor: "bg-cyan-100" },
  { color: "text-pink-700", bgColor: "bg-pink-100" },
];

const defaultStages: Record<string, { label: string; color: string; bgColor: string }[]> = {
  "b2b-sales": [
    { label: "Lead", color: "text-blue-700", bgColor: "bg-blue-100" },
    { label: "Qualified", color: "text-purple-700", bgColor: "bg-purple-100" },
    { label: "Proposal", color: "text-amber-700", bgColor: "bg-amber-100" },
    { label: "Negotiation", color: "text-orange-700", bgColor: "bg-orange-100" },
    { label: "Closed Won", color: "text-emerald-700", bgColor: "bg-emerald-100" },
    { label: "Closed Lost", color: "text-red-700", bgColor: "bg-red-100" },
  ],
  "saas": [
    { label: "Trial", color: "text-blue-700", bgColor: "bg-blue-100" },
    { label: "Qualified", color: "text-purple-700", bgColor: "bg-purple-100" },
    { label: "Demo", color: "text-amber-700", bgColor: "bg-amber-100" },
    { label: "Proposal", color: "text-orange-700", bgColor: "bg-orange-100" },
    { label: "Closed Won", color: "text-emerald-700", bgColor: "bg-emerald-100" },
    { label: "Churned", color: "text-red-700", bgColor: "bg-red-100" },
  ],
  "real-estate": [
    { label: "Inquiry", color: "text-blue-700", bgColor: "bg-blue-100" },
    { label: "Showing", color: "text-purple-700", bgColor: "bg-purple-100" },
    { label: "Offer", color: "text-amber-700", bgColor: "bg-amber-100" },
    { label: "Under Contract", color: "text-orange-700", bgColor: "bg-orange-100" },
    { label: "Closed", color: "text-emerald-700", bgColor: "bg-emerald-100" },
    { label: "Lost", color: "text-red-700", bgColor: "bg-red-100" },
  ],
  "recruiting": [
    { label: "Sourced", color: "text-blue-700", bgColor: "bg-blue-100" },
    { label: "Screening", color: "text-purple-700", bgColor: "bg-purple-100" },
    { label: "Interview", color: "text-amber-700", bgColor: "bg-amber-100" },
    { label: "Offer", color: "text-orange-700", bgColor: "bg-orange-100" },
    { label: "Hired", color: "text-emerald-700", bgColor: "bg-emerald-100" },
    { label: "Declined", color: "text-red-700", bgColor: "bg-red-100" },
  ],
  "consulting": [
    { label: "Lead", color: "text-blue-700", bgColor: "bg-blue-100" },
    { label: "Discovery", color: "text-purple-700", bgColor: "bg-purple-100" },
    { label: "Proposal", color: "text-amber-700", bgColor: "bg-amber-100" },
    { label: "Engagement", color: "text-orange-700", bgColor: "bg-orange-100" },
    { label: "Completed", color: "text-emerald-700", bgColor: "bg-emerald-100" },
    { label: "Lost", color: "text-red-700", bgColor: "bg-red-100" },
  ],
  "home-services": [
    { label: "New Lead", color: "text-blue-700", bgColor: "bg-blue-100" },
    { label: "Estimate", color: "text-purple-700", bgColor: "bg-purple-100" },
    { label: "Scheduled", color: "text-amber-700", bgColor: "bg-amber-100" },
    { label: "In Progress", color: "text-orange-700", bgColor: "bg-orange-100" },
    { label: "Completed", color: "text-emerald-700", bgColor: "bg-emerald-100" },
    { label: "Cancelled", color: "text-red-700", bgColor: "bg-red-100" },
  ],
};

const defaultContactFields = [
  { id: "name", label: "Name", type: "text", required: true, locked: true },
  { id: "email", label: "Email", type: "text", required: true, locked: true },
  { id: "phone", label: "Phone", type: "text", required: false, locked: true },
  { id: "company", label: "Company", type: "text", required: false, locked: true },
  { id: "title", label: "Job Title", type: "text", required: false, locked: false },
  { id: "value", label: "Deal Value", type: "number", required: false, locked: false },
  { id: "source", label: "Lead Source", type: "select", required: false, locked: false },
];

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Pipeline stages (editable)
  const [stages, setStages] = useState(defaultStages["b2b-sales"]);
  const [newStageName, setNewStageName] = useState("");

  // Contact fields
  const [contactFields, setContactFields] = useState(defaultContactFields);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "number" | "date" | "select">("text");

  // Team invites
  const [invites, setInvites] = useState<{ email: string; role: "admin" | "manager" | "member" }[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "member">("member");

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || "");
        setUserEmail(user.email || "");
      }
    }
    loadUser();
  }, []);

  // Update stages when industry changes
  function handleIndustrySelect(id: string) {
    setIndustry(id);
    setStages(defaultStages[id] || defaultStages["b2b-sales"]);
  }

  function addStage() {
    if (!newStageName.trim() || stages.length >= 10) return;
    const colorIdx = stages.length % stageColors.length;
    setStages([...stages, { label: newStageName.trim(), ...stageColors[colorIdx] }]);
    setNewStageName("");
  }

  function removeStage(index: number) {
    if (stages.length <= 2) return;
    setStages(stages.filter((_, i) => i !== index));
  }

  function moveStage(index: number, direction: -1 | 1) {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= stages.length) return;
    const newStages = [...stages];
    [newStages[index], newStages[newIdx]] = [newStages[newIdx], newStages[index]];
    setStages(newStages);
  }

  function addContactField() {
    if (!newFieldName.trim()) return;
    setContactFields([...contactFields, {
      id: `custom_${Date.now()}`,
      label: newFieldName.trim(),
      type: newFieldType,
      required: false,
      locked: false,
    }]);
    setNewFieldName("");
    setNewFieldType("text");
  }

  function removeContactField(id: string) {
    setContactFields(contactFields.filter((f) => f.id !== id));
  }

  function addInvite() {
    if (!inviteEmail.trim() || invites.some((i) => i.email === inviteEmail.trim())) return;
    setInvites([...invites, { email: inviteEmail.trim(), role: inviteRole }]);
    setInviteEmail("");
  }

  function removeInvite(email: string) {
    setInvites(invites.filter((i) => i.email !== email));
  }

  async function handleComplete() {
    if (!companyName.trim()) return;
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      const baseSlug = companyName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const slug = `${baseSlug}-${Date.now().toString(36)}`;

      // Create workspace
      const { data: workspace, error: wsError } = await supabase
        .from("workspaces")
        .insert({
          name: companyName.trim(),
          slug,
          industry: industry || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (wsError) {
        setError(wsError.message);
        setLoading(false);
        return;
      }

      // Add creator as owner
      const { error: memberError } = await supabase
        .from("workspace_members")
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: "owner",
          owner_label: userName || "You",
          status: "active",
        });

      if (memberError) {
        setError(memberError.message);
        setLoading(false);
        return;
      }

      // Create pipeline stages
      const stageInserts = stages.map((s, i) => ({
        workspace_id: workspace.id,
        label: s.label,
        color: s.color,
        bg_color: s.bgColor,
        sort_order: i,
      }));
      await supabase.from("pipeline_stages").insert(stageInserts);

      // Create default alert settings
      await supabase.from("alert_settings").insert({
        workspace_id: workspace.id,
      });

      // Create custom fields (non-default ones)
      const customFields = contactFields.filter((f) => f.id.startsWith("custom_"));
      if (customFields.length > 0) {
        const fieldInserts = customFields.map((f, i) => ({
          workspace_id: workspace.id,
          label: f.label,
          type: f.type,
          sort_order: i,
        }));
        await supabase.from("custom_fields").insert(fieldInserts);
      }

      // Send team invites
      for (const invite of invites) {
        try {
          await fetch("/api/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: invite.email,
              role: invite.role,
              workspaceId: workspace.id,
              ownerLabel: invite.email.split("@")[0],
            }),
          });
        } catch {
          // Non-blocking — continue with other invites
        }
      }

      router.push("/app");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Onboarding error:", err);
      setLoading(false);
    }
  }

  const firstName = userName.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-xl font-semibold text-foreground">WorkChores</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 px-4">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${step >= i + 1 ? "bg-accent" : "bg-border"}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-xl shadow-gray-200/40 overflow-hidden">
          {/* Step 1: Company Name */}
          {step === 1 && (
            <div className="p-8">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6 text-accent" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-1">
                Welcome, {firstName}!
              </h1>
              <p className="text-sm text-muted mb-6">
                Let&apos;s set up your workspace. What&apos;s your company or business called?
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Company name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Inc."
                    className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-foreground placeholder:text-muted outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter" && companyName.trim()) setStep(2); }}
                  />
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!companyName.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Industry */}
          {step === 2 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep(1)} className="p-1.5 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">What industry are you in?</h1>
                  <p className="text-sm text-muted">This customizes your pipeline stages and templates.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {industries.map((ind) => {
                  const Icon = ind.icon;
                  const isSelected = industry === ind.id;
                  return (
                    <button
                      key={ind.id}
                      onClick={() => handleIndustrySelect(ind.id)}
                      className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected ? ind.activeColor : `${ind.color} border-transparent hover:border-gray-300`
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className="w-5 h-5" />
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{ind.label}</div>
                        <div className="text-[11px] opacity-70 leading-snug mt-0.5">{ind.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep(3)}
                disabled={!industry}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 3: Pipeline Stages */}
          {step === 3 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep(2)} className="p-1.5 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Customize your pipeline</h1>
                  <p className="text-sm text-muted">Drag to reorder, add or remove stages. You can always change this later.</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {stages.map((stage, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveStage(i, -1)}
                        disabled={i === 0}
                        className="p-0.5 text-muted hover:text-foreground disabled:opacity-20 transition-colors"
                      >
                        <GripVertical className="w-3 h-3" />
                      </button>
                    </div>
                    <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg ${stage.bgColor}`}>
                      <GitBranch className={`w-3.5 h-3.5 ${stage.color}`} />
                      <span className={`text-sm font-medium ${stage.color}`}>{stage.label}</span>
                    </div>
                    <button
                      onClick={() => removeStage(i)}
                      disabled={stages.length <= 2}
                      className="p-1 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {stages.length < 10 && (
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="Add a stage..."
                    className="flex-1 px-3 py-2 border border-border rounded-lg text-sm text-foreground placeholder:text-muted outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                    onKeyDown={(e) => { if (e.key === "Enter") addStage(); }}
                  />
                  <button
                    onClick={addStage}
                    disabled={!newStageName.trim()}
                    className="px-3 py-2 text-sm font-medium text-accent border border-accent/30 hover:bg-accent-light rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                onClick={() => setStep(4)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 4: Contact Fields */}
          {step === 4 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep(3)} className="p-1.5 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">What info do you track?</h1>
                  <p className="text-sm text-muted">Choose what fields appear on each contact. Add custom ones too.</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {contactFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-surface group">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-3.5 h-3.5 text-muted" />
                      <span className="text-sm text-foreground">{field.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-muted">{field.type}</span>
                      {field.required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">Required</span>}
                    </div>
                    {!field.locked ? (
                      <button
                        onClick={() => removeContactField(field.id)}
                        className="p-1 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-muted">Built-in</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Add a field..."
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm text-foreground placeholder:text-muted outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                  onKeyDown={(e) => { if (e.key === "Enter") addContactField(); }}
                />
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as "text" | "number" | "date" | "select")}
                  className="px-2 py-2 border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="select">Dropdown</option>
                </select>
                <button
                  onClick={addContactField}
                  disabled={!newFieldName.trim()}
                  className="px-3 py-2 text-sm font-medium text-accent border border-accent/30 hover:bg-accent-light rounded-lg transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setStep(5)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 5: Invite Team */}
          {step === 5 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-5">
                <button onClick={() => setStep(4)} className="p-1.5 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Invite your team</h1>
                  <p className="text-sm text-muted">Add team members now or skip and invite them later from Settings.</p>
                </div>
              </div>

              {/* Current user */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-accent/5 border border-accent/20 mb-4">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-semibold">
                  {userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "ME"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{userName || "You"}</div>
                  <div className="text-xs text-muted truncate">{userEmail}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">Owner</span>
              </div>

              {/* Invited members */}
              {invites.length > 0 && (
                <div className="space-y-2 mb-4">
                  {invites.map((invite) => (
                    <div key={invite.email} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface group">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-semibold">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground truncate">{invite.email}</div>
                        <div className="text-xs text-muted capitalize">{invite.role}</div>
                      </div>
                      <button
                        onClick={() => removeInvite(invite.email)}
                        className="p-1 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add invite form */}
              <div className="flex gap-2 mb-6">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm text-foreground placeholder:text-muted outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                  onKeyDown={(e) => { if (e.key === "Enter") addInvite(); }}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "manager" | "member")}
                  className="px-2 py-2 border border-border rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={addInvite}
                  disabled={!inviteEmail.trim()}
                  className="px-3 py-2 text-sm font-medium text-accent border border-accent/30 hover:bg-accent-light rounded-lg transition-colors disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      {invites.length > 0 ? "Create Workspace & Send Invites" : "Create Workspace"}
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          You can change all of this later in Settings.
        </p>
      </div>
    </div>
  );
}
