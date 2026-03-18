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

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || "");
      }
    }
    loadUser();
  }, []);

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

      // Generate a unique slug from company name
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

      // Create pipeline stages for selected industry (or default b2b)
      const stages = defaultStages[industry] || defaultStages["b2b-sales"];
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

      // Redirect to the app
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
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-accent" : "bg-border"}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-accent" : "bg-border"}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 3 ? "bg-accent" : "bg-border"}`} />
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
                <button
                  onClick={() => setStep(1)}
                  className="p-1.5 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    What industry are you in?
                  </h1>
                  <p className="text-sm text-muted">
                    This customizes your pipeline stages and templates.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {industries.map((ind) => {
                  const Icon = ind.icon;
                  const isSelected = industry === ind.id;
                  return (
                    <button
                      key={ind.id}
                      onClick={() => setIndustry(ind.id)}
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

              {error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setIndustry(""); handleComplete(); }}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-muted border border-border hover:text-foreground hover:border-gray-400 rounded-lg transition-colors disabled:opacity-50"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleComplete}
                  disabled={!industry || loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Create Workspace
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
