"use client";

import { useState, useEffect } from "react";
import { CreditCard, ArrowUpRight, Check, X, Loader2, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { type TeamMember } from "@/components/demo/demo-app";
import { type Contact } from "@/components/demo/data";

interface BillingSectionProps {
  isLive: boolean;
  workspaceId?: string;
  teamMembers: TeamMember[];
  contacts: Contact[];
}

export default function BillingSection({ isLive, workspaceId, teamMembers, contacts }: BillingSectionProps) {
  const members = teamMembers;

  if (!isLive) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Billing</h2>
          <p className="text-sm text-muted mt-1">Manage your subscription and payment details</p>
        </div>
        <DemoBilling members={members} contacts={contacts} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Billing</h2>
        <p className="text-sm text-muted mt-1">Manage your subscription and payment details</p>
      </div>
      <LiveBilling workspaceId={workspaceId} members={members} contacts={contacts} />
    </div>
  );
}

function LiveBilling({ workspaceId, members, contacts }: { workspaceId?: string; members: TeamMember[]; contacts: Contact[] }) {
  const [plan, setPlan] = useState<string>("free");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;

    async function fetchPlan() {
      try {
        const res = await fetch(`/api/stripe/checkout?workspaceId=${workspaceId}`);
        const data = await res.json();
        if (data.plan) setPlan(data.plan);
        return data.plan;
      } catch { /* silent */ }
      setLoading(false);
      return null;
    }

    const params = new URLSearchParams(window.location.search);
    const checkoutPlan = params.get("plan");
    const sessionId = params.get("session_id");

    if (checkoutPlan === "business" && sessionId) {
      let attempts = 0;
      const maxAttempts = 10;

      async function pollForPlanUpdate() {
        const currentPlan = await fetchPlan();
        attempts++;

        if (currentPlan === "business") {
          setLoading(false);
          setShowUpgradeSuccess(true);
          const url = new URL(window.location.href);
          url.searchParams.delete("plan");
          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
          setTimeout(() => setShowUpgradeSuccess(false), 8000);
        } else if (attempts < maxAttempts) {
          setTimeout(pollForPlanUpdate, 2000);
        } else {
          setLoading(false);
          const url = new URL(window.location.href);
          url.searchParams.delete("plan");
          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
        }
      }

      pollForPlanUpdate();
    } else {
      fetchPlan().then(() => setLoading(false));
    }
  }, [workspaceId]);

  async function handleUpgrade() {
    if (!workspaceId) return;
    setUpgrading(true);
    try {
      const userEmail = members.find(m => m.ownerLabel === "You" || m.id === "u1")?.email || members[0]?.email;
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
    <>
      {/* Current plan */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Current Plan</h3>
        </div>
        <div className="p-5">
          {showUpgradeSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">Welcome to Business!</span>
              <span className="text-emerald-600">Your plan has been upgraded successfully.</span>
              <button onClick={() => setShowUpgradeSuccess(false)} className="ml-auto text-emerald-400 hover:text-emerald-600" aria-label="Dismiss">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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
            <div className="flex items-center gap-2">
              {!isFree && (
                <button
                  onClick={handleManageBilling}
                  disabled={managingBilling}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted border border-border hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-60"
                >
                  {managingBilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  {managingBilling ? "Opening..." : "Invoices & Billing"}
                </button>
              )}
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
                  {managingBilling ? "Opening..." : "Manage Plan"}
                </button>
              )}
            </div>
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
  );
}

function DemoBilling({ members, contacts }: { members: TeamMember[]; contacts: Contact[] }) {
  return (
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
                <CreditCard className="w-4 h-4 text-muted" />
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
  );
}
