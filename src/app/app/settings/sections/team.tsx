"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Check,
  X,
  Mail,
  Clock,
  Crown,
  Shield,
  User,
  ChevronDown,
  Search,
  Eye,
  Loader2,
  Puzzle,
} from "lucide-react";
import { type Contact } from "@/components/demo/data";
import { type TeamMember } from "@/components/demo/demo-app";
import { trackEvent } from "@/lib/track-event";

const roleColors = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-amber-100 text-amber-700",
  member: "bg-gray-100 text-gray-600",
};

interface TeamSectionProps {
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (members: TeamMember[]) => void;
  onReassignAndRemoveMember: (memberId: string, reassignToLabel: string) => void;
  contacts: Contact[];
  isLive: boolean;
  workspaceId?: string;
  memberLimitReached: boolean;
  enabledPlugins: string[];
  onSaveMemberPlugins?: (memberId: string, allowedPlugins: string[] | null) => void;
}

export default function TeamSection({
  teamMembers,
  onUpdateTeamMembers,
  onReassignAndRemoveMember,
  contacts,
  isLive,
  workspaceId,
  memberLimitReached,
  enabledPlugins,
  onSaveMemberPlugins,
}: TeamSectionProps) {
  const members = teamMembers;
  const setMembers = onUpdateTeamMembers;

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "manager" | "member">("member");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "member">("member");
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState<"all" | "admin" | "manager" | "member">("all");
  const [collapsedRoles, setCollapsedRoles] = useState<Set<string>>(new Set());
  const [showVisibility, setShowVisibility] = useState(false);
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  const managersAndAdmins = members.filter((m) => m.role === "admin" || m.role === "manager");

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
      try {
        const res = await fetch("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail.trim(), role: newRole, workspaceId, ownerLabel }),
        });
        const data = await res.json();
        if (!res.ok) { setInviteError(data.error || "Failed to add member"); return; }
        if (data.signupUrl) { setInviteError(`Email rate limited. Share this link: ${data.signupUrl}`); }
      } catch { setInviteError("Failed to add member. Please try again."); return; }
    }

    setMembers([
      ...members,
      { id: crypto.randomUUID(), name: newName.trim(), email: newEmail.trim(), role: newRole, avatar: initials, avatarColor: colors[members.length % colors.length], status: "pending" as const, ownerLabel },
    ]);
    setNewName(""); setNewEmail(""); setNewRole("member"); setShowAddForm(false);
  }

  function removeMember(id: string) {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    const assignedCount = contacts.filter((c) => c.owner === member.ownerLabel).length;
    if (assignedCount === 0 && member.status === "pending") {
      setMembers(members.filter((m) => m.id !== id));
      return;
    }
    const defaultReassign = members.find((m) => m.ownerLabel === "You")?.ownerLabel ?? members[0]?.ownerLabel ?? "You";
    setReassignTo(defaultReassign);
    setRemovingMember(member);
  }

  function confirmRemoveMember() {
    if (!removingMember || !reassignTo) return;
    onReassignAndRemoveMember(removingMember.id, reassignTo);
    setRemovingMember(null);
    setReassignTo("");
  }

  function updateRole(id: string, role: "admin" | "manager" | "member") {
    setMembers(members.map((m) => (m.id === id ? { ...m, role } : m)));
  }

  function updateReportsTo(id: string, reportsTo: string | undefined) {
    setMembers(members.map((m) => (m.id === id ? { ...m, reportsTo } : m)));
  }

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

    if (isLive && workspaceId) {
      setInviteLoading(true); setInviteError("");
      try {
        const res = await fetch("/api/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole, workspaceId, ownerLabel }),
        });
        const data = await res.json();
        setInviteLoading(false);
        if (!res.ok) { setInviteError(data.error || "Failed to send invite"); return; }
        if (data.signupUrl) { setInviteError(`Email rate limited. Share this link instead: ${data.signupUrl}`); }
        setMembers([
          ...members,
          { id: crypto.randomUUID(), name: displayName, email: inviteEmail.trim(), role: inviteRole, avatar: initials, avatarColor: colors[members.length % colors.length], status: data.status === "active" ? "active" as const : "pending" as const, ownerLabel },
        ]);
      } catch { setInviteLoading(false); setInviteError("Failed to send invite. Please try again."); return; }
    } else {
      setMembers([
        ...members,
        { id: crypto.randomUUID(), name: displayName, email: inviteEmail.trim(), role: inviteRole, avatar: initials, avatarColor: colors[members.length % colors.length], status: "pending" as const, ownerLabel },
      ]);
    }

    setInviteSent(true);
    if (isLive) trackEvent("settings.member_invited");
    setTimeout(() => { setInviteSent(false); setInviteEmail(""); setInviteRole("member"); setInviteError(""); }, 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Team</h2>
        <p className="text-sm text-muted mt-1">Manage team members, roles, and permissions</p>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        {/* Header with invite inline */}
        <div className="px-5 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Team ({members.length})</h3>
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
              {inviteSent ? (<><Check className="w-3.5 h-3.5" />Sent!</>) : inviteLoading ? (<><Mail className="w-3.5 h-3.5 animate-pulse" />Sending...</>) : (<><Mail className="w-3.5 h-3.5" />Send Invite</>)}
            </button>
          </div>
          {inviteError && (
            <div className="px-5 pb-3">
              <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{inviteError}</div>
            </div>
          )}
        </div>

        {/* Add manually form */}
        {showAddForm && (
          <div className="px-5 py-4 border-b border-border bg-surface">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Name</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Email</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@company.com" className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent placeholder:text-muted" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as "admin" | "manager" | "member")} className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-accent cursor-pointer">
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={addMember} disabled={!newName.trim() || !newEmail.trim()} className="px-4 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Add Member</button>
              <button onClick={() => { setShowAddForm(false); setNewName(""); setNewEmail(""); setNewRole("member"); }} className="px-4 py-1.5 text-xs font-medium text-muted hover:text-foreground border border-border rounded-lg transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {/* Search & role filter */}
        <div className="px-5 py-2.5 border-b border-border bg-surface/30 flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white border border-border rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input type="text" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search members..." className="text-sm bg-transparent outline-none flex-1 text-foreground placeholder:text-muted" />
            {memberSearch && (
              <button onClick={() => setMemberSearch("")} className="p-0.5 text-muted hover:text-foreground" aria-label="Clear search"><X className="w-3 h-3" /></button>
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
          const RoleIcon = roleGroup === "admin" ? Crown : roleGroup === "manager" ? Shield : User;
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
                            <div className={`w-7 h-7 rounded-full ${m.status === "pending" ? "opacity-60" : ""} ${m.avatarColor} flex items-center justify-center text-[10px] font-bold text-white`}>{m.avatar}</div>
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
                              {m.status === "pending" && <span className="ml-1 text-amber-600">&middot; Invite sent</span>}
                              {isNonAdmin && m.status === "active" && (
                                <span className="ml-1">
                                  &middot; reports to{" "}
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
                                        <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
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
                            className={`text-[11px] font-medium rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer ${roleColors[m.role]} ${m.id === "u1" ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="member">Member</option>
                          </select>
                          {m.id !== "u1" && (
                            <button onClick={() => removeMember(m.id)} className="p-1 text-muted hover:text-red-500 transition-colors" title={m.status === "pending" ? "Revoke invite" : "Remove member"} aria-label={m.status === "pending" ? "Revoke invite" : "Remove member"}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {/* Plugin permissions — admin can control per member */}
                        {m.id !== "u1" && m.role !== "admin" && m.status === "active" && (
                          <div className="mt-2 ml-9.5 flex items-center gap-1.5">
                            <Puzzle className="w-3 h-3 text-muted shrink-0" />
                            {enabledPlugins.filter((p) => p !== "tasks").map((plugin) => {
                              const memberPlugins = (m as unknown as { allowed_plugins?: string[] | null }).allowed_plugins;
                              const hasAccess = !memberPlugins || memberPlugins.includes(plugin);
                              return (
                                <button
                                  key={plugin}
                                  onClick={() => {
                                    const current = (m as unknown as { allowed_plugins?: string[] | null }).allowed_plugins;
                                    let next: string[] | null;
                                    if (!current) {
                                      // Currently inheriting all — restrict to all except this one
                                      next = enabledPlugins.filter((p) => p !== plugin);
                                    } else if (hasAccess) {
                                      // Remove this plugin
                                      next = current.filter((p) => p !== plugin);
                                      if (next.length === 0) next = ["tasks"]; // always keep tasks
                                    } else {
                                      // Add this plugin
                                      next = [...current, plugin];
                                    }
                                    // If all plugins are enabled, set to null (inherit)
                                    if (next && enabledPlugins.every((p) => next!.includes(p))) next = null;
                                    onSaveMemberPlugins?.(m.id, next);
                                    // Update local state
                                    const updated = members.map((mem) => mem.id === m.id ? { ...mem, allowed_plugins: next } as unknown as TeamMember : mem);
                                    setMembers(updated);
                                    onUpdateTeamMembers(updated);
                                  }}
                                  className={`px-2 py-0.5 text-[9px] font-medium rounded-full border transition-colors capitalize ${
                                    hasAccess
                                      ? "bg-accent/10 text-accent border-accent/20 hover:bg-accent/20"
                                      : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200 line-through"
                                  }`}
                                  title={hasAccess ? `Click to hide ${plugin} from ${m.name}` : `Click to show ${plugin} to ${m.name}`}
                                >
                                  {plugin}
                                </button>
                              );
                            })}
                          </div>
                        )}
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
          <div className="px-5 py-8 text-center text-sm text-muted">No members match your search.</div>
        )}

        {/* Data Visibility */}
        <div className="border-t border-border">
          <button
            onClick={() => setShowVisibility((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 hover:bg-surface/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Data Visibility</span>
              <span className="text-xs text-muted">-- who sees what</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted transition-transform ${showVisibility ? "rotate-180" : ""}`} />
          </button>
          {showVisibility && (
            <div className="border-t border-border">
              <div className="px-5 py-3 bg-surface/30 border-b border-border">
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5"><Crown className="w-3 h-3 text-red-600" /><span className="font-medium">Admin</span> <span className="text-muted">All data</span></span>
                  <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-amber-600" /><span className="font-medium">Manager</span> <span className="text-muted">Own + reports</span></span>
                  <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-gray-500" /><span className="font-medium">Member</span> <span className="text-muted">Own only</span></span>
                </div>
              </div>
              <div className="divide-y divide-border">
                {members.map((m) => {
                  let canSee: string[] = [];
                  if (m.role === "admin") {
                    canSee = members.map((x) => x.name);
                  } else if (m.role === "manager") {
                    canSee = [m.name];
                    members.forEach((x) => { if (x.reportsTo === m.id) canSee.push(x.name); });
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
                      <div className={`w-6 h-6 rounded-full ${m.avatarColor} flex items-center justify-center text-[8px] font-bold text-white shrink-0`}>{m.avatar}</div>
                      <div className="flex-1 min-w-0 text-xs text-muted truncate">
                        <span className="font-medium text-foreground">{m.name}</span>
                        {m.id === "u1" && <span className="ml-1">(You)</span>}
                        {" -- "}
                        {canSee.length === members.length ? (
                          <span className="text-emerald-600 font-medium">all team data</span>
                        ) : (
                          <span>{canSee.join(", ")}&apos;s data</span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-muted tabular-nums">{contactCount} contacts</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${roleColors[m.role]}`}>{m.role}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
                <label className="block text-sm font-medium text-foreground mb-2">Reassign everything to</label>
                <select
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className="w-full text-sm bg-white border border-border rounded-lg px-3 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer"
                >
                  {members
                    .filter((m) => m.id !== removingMember.id && m.status === "active")
                    .map((m) => (
                      <option key={m.id} value={m.ownerLabel}>
                        {m.name}{m.ownerLabel === "You" ? " (You)" : ""} -- {m.role}
                      </option>
                    ))}
                </select>
              </div>
              <div className="px-6 pb-4 flex gap-3">
                <button onClick={() => setRemovingMember(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-foreground bg-white border border-border hover:bg-gray-50 rounded-lg transition-colors">Cancel</button>
                <button onClick={confirmRemoveMember} className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-600/20 whitespace-nowrap">
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  Remove &amp; Reassign
                </button>
              </div>
              <div className="px-6 pb-6 border-t border-border pt-3">
                <button
                  onClick={() => {
                    onReassignAndRemoveMember(removingMember.id, "Unassigned");
                    setRemovingMember(null);
                    setReassignTo("");
                  }}
                  className="w-full text-center text-xs font-medium text-muted hover:text-foreground transition-colors py-1"
                >
                  Skip for now -- mark as unassigned
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
