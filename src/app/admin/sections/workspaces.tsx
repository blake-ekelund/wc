"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, Search, X, ChevronLeft, Mail, Crown, CheckCircle2, ExternalLink, Shield, Lock, Loader2, Clock } from "lucide-react";
import { adminFetch, formatDate, type WorkspaceStat } from "./_shared";

interface WorkspacesSectionProps {
  workspaces: WorkspaceStat[];
}

export default function WorkspacesSection({ workspaces }: WorkspacesSectionProps) {
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceStat | null>(null);
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [accessRequestStatus, setAccessRequestStatus] = useState<"idle" | "sending" | "pending" | "approved" | "error">("idle");
  const [accessRequestMsg, setAccessRequestMsg] = useState("");
  const accessPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filteredWorkspaces = workspaces.filter((w) => {
    if (!workspaceSearch) return true;
    const q = workspaceSearch.toLowerCase();
    return w.name.toLowerCase().includes(q) || (w.industry || "").toLowerCase().includes(q) || w.owner_email.toLowerCase().includes(q);
  });

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
        if (check.status === "approved") { setAccessRequestStatus("approved"); setAccessRequestMsg("Owner approved your access. Click below to open the workspace."); if (accessPollRef.current) clearInterval(accessPollRef.current); }
        else if (check.status === "expired" || check.status === "none") { setAccessRequestStatus("error"); setAccessRequestMsg("Access request expired. Please try again."); if (accessPollRef.current) clearInterval(accessPollRef.current); }
      } catch { /* keep polling */ }
    }, 5000);
  }

  function openApprovedWorkspace(workspaceId: string) {
    window.open(`/admin/workspace?id=${workspaceId}`, "_blank");
    setAccessRequestStatus("idle");
    setAccessRequestMsg("");
  }

  useEffect(() => {
    if (!selectedWorkspace) {
      setAccessRequestStatus("idle");
      setAccessRequestMsg("");
      if (accessPollRef.current) clearInterval(accessPollRef.current);
      return;
    }
    (async () => {
      try {
        const check = await adminFetch("check-workspace-access", { workspaceId: selectedWorkspace.id });
        if (check.status === "approved") { setAccessRequestStatus("approved"); setAccessRequestMsg("Owner approved your access. Click below to open the workspace."); }
        else if (check.status === "pending") { setAccessRequestStatus("pending"); setAccessRequestMsg("Waiting for owner to approve..."); startAccessPolling(selectedWorkspace.id); }
        else { setAccessRequestStatus("idle"); setAccessRequestMsg(""); }
      } catch { setAccessRequestStatus("idle"); setAccessRequestMsg(""); }
    })();
    return () => { if (accessPollRef.current) clearInterval(accessPollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspace]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl space-y-6">
      {selectedWorkspace ? (
        <div className="space-y-6">
          <button onClick={() => setSelectedWorkspace(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ChevronLeft className="w-4 h-4" /> Back to all workspaces</button>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center"><Building2 className="w-6 h-6 text-gray-500" /></div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">{selectedWorkspace.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 capitalize">{selectedWorkspace.industry?.replace(/-/g, " ") || "No industry"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${selectedWorkspace.plan === "business" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{selectedWorkspace.plan === "business" ? "Business" : "Free"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-200">
              <div className="p-4 text-center"><div className="text-xl font-bold text-gray-900">{selectedWorkspace.member_count}</div><div className="text-xs text-gray-500">Members</div></div>
              <div className="p-4 text-center"><div className="text-xl font-bold text-gray-900">{selectedWorkspace.contact_count}</div><div className="text-xs text-gray-500">Contacts</div></div>
              <div className="p-4 text-center"><div className="text-xl font-bold text-gray-900">{selectedWorkspace.task_count || 0}</div><div className="text-xs text-gray-500">Tasks</div></div>
              <div className="p-4 text-center"><div className="text-sm font-medium text-gray-600">{formatDate(selectedWorkspace.created_at)}</div><div className="text-xs text-gray-500">Created</div></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Owner</span><a href={`mailto:${selectedWorkspace.owner_email}`} className="text-blue-600 hover:underline">{selectedWorkspace.owner_email}</a></div>
                <div className="flex justify-between"><span className="text-gray-500">Industry</span><span className="text-gray-900 capitalize">{selectedWorkspace.industry?.replace(/-/g, " ") || "\u2014"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="text-gray-900 capitalize">{selectedWorkspace.plan}</span></div>
                <div className="flex justify-between items-start"><span className="text-gray-500">Plugins</span><div className="flex flex-wrap gap-1 justify-end">{(selectedWorkspace.enabled_plugins || ["crm", "vendors", "tasks"]).map((p) => (<span key={p} className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-accent/10 text-accent capitalize">{p}</span>))}</div></div>
                <div className="flex justify-between"><span className="text-gray-500">Stripe Customer</span>{selectedWorkspace.stripe_customer_id ? (<a href={`https://dashboard.stripe.com/customers/${selectedWorkspace.stripe_customer_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{selectedWorkspace.stripe_customer_id}</a>) : (<span className="text-gray-900 font-mono text-xs">{"\u2014"}</span>)}</div>
                <div className="flex justify-between"><span className="text-gray-500">Subscription</span>{selectedWorkspace.stripe_subscription_id ? (<a href={`https://dashboard.stripe.com/subscriptions/${selectedWorkspace.stripe_subscription_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono text-xs">{selectedWorkspace.stripe_subscription_id}</a>) : (<span className="text-gray-900 font-mono text-xs">{"\u2014"}</span>)}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <a href={`mailto:${selectedWorkspace.owner_email}?subject=WorkChores — ${encodeURIComponent(selectedWorkspace.name)}`} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> Email owner<span className="ml-auto text-[10px] text-gray-400 truncate max-w-[180px]">{selectedWorkspace.owner_email}</span></a>
                {accessRequestStatus === "approved" ? (
                  <>
                    <button onClick={() => openApprovedWorkspace(selectedWorkspace.id)} className="w-full text-left px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-2 transition-colors"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Open workspace<ExternalLink className="w-3 h-3 text-emerald-400 ml-auto" /></button>
                    <div className="px-3 py-2 text-[11px] rounded-lg bg-emerald-50 text-emerald-600">{accessRequestMsg}</div>
                  </>
                ) : (
                  <>
                    <button onClick={() => requestWorkspaceAccess(selectedWorkspace.id)} disabled={accessRequestStatus === "sending" || accessRequestStatus === "pending"} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2 disabled:opacity-50">
                      {accessRequestStatus === "sending" ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : accessRequestStatus === "pending" ? <Clock className="w-4 h-4 text-amber-500 animate-pulse" /> : <Shield className="w-4 h-4 text-gray-400" />}
                      {accessRequestStatus === "idle" || accessRequestStatus === "error" ? "View as workspace" : accessRequestStatus === "sending" ? "Sending request..." : "Waiting for owner..."}
                      {(accessRequestStatus === "idle" || accessRequestStatus === "error") && <Lock className="w-3 h-3 text-gray-300 ml-auto" />}
                    </button>
                    {accessRequestMsg && <div className={`px-3 py-2 text-[11px] rounded-lg ${accessRequestStatus === "error" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>{accessRequestMsg}</div>}
                  </>
                )}
                {selectedWorkspace.stripe_customer_id ? (<a href={`https://dashboard.stripe.com/customers/${selectedWorkspace.stripe_customer_id}`} target="_blank" rel="noopener noreferrer" className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"><ExternalLink className="w-4 h-4 text-gray-400" /> View in Stripe<span className="ml-auto text-[10px] text-gray-400 font-mono">{selectedWorkspace.stripe_customer_id.slice(0, 18)}...</span></a>) : (<div className="px-3 py-2 text-sm text-gray-400 rounded-lg flex items-center gap-2"><ExternalLink className="w-4 h-4 text-gray-300" /> No Stripe connection</div>)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 max-w-md">
              <Search className="w-4 h-4 text-gray-400" />
              <input type="text" value={workspaceSearch} onChange={(e) => setWorkspaceSearch(e.target.value)} placeholder="Search workspaces..." className="text-sm bg-transparent outline-none flex-1 text-gray-800 placeholder:text-gray-400" />
              {workspaceSearch && <button onClick={() => setWorkspaceSearch("")} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <div className="text-xs text-gray-400">{filteredWorkspaces.length} workspaces</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Workspace</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Industry</th>
                  <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-500">Plan</th>
                  <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-500">Members</th>
                  <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-500">Contacts</th>
                  <th className="text-center px-5 py-2.5 text-xs font-medium text-gray-500">Tasks</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Plugins</th>
                  <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">Created</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredWorkspaces.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedWorkspace(w)}>
                      <td className="px-5 py-3"><div className="font-medium text-gray-900">{w.name}</div><div className="text-xs text-gray-400">{w.owner_email}</div></td>
                      <td className="px-5 py-3 text-gray-500 capitalize text-xs">{w.industry?.replace(/-/g, " ") || "\u2014"}</td>
                      <td className="px-5 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${w.plan === "business" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{w.plan === "business" ? "Business" : "Free"}</span></td>
                      <td className="px-5 py-3 text-center">{w.member_count}</td>
                      <td className="px-5 py-3 text-center">{w.contact_count}</td>
                      <td className="px-5 py-3 text-center">{w.task_count || 0}</td>
                      <td className="px-5 py-3"><div className="flex flex-wrap gap-1">{(w.enabled_plugins || ["crm", "vendors", "tasks"]).map((p) => (<span key={p} className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-gray-100 text-gray-600 capitalize">{p}</span>))}</div></td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(w.created_at)}</td>
                    </tr>
                  ))}
                  {filteredWorkspaces.length === 0 && (<tr><td colSpan={8} className="px-5 py-8 text-center text-gray-400">No workspaces found</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
