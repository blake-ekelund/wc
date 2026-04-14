"use client";

import { useState } from "react";
import { User, Pencil, Check, X, Lock, Loader2, AlertTriangle, CheckCircle2, Mail } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface ProfileSectionProps {
  userName: string;
  userEmail: string;
  onUpdateName: (name: string) => void;
}

export default function ProfileSection({ userName, userEmail, onUpdateName }: ProfileSectionProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(userName);
  const [savingName, setSavingName] = useState(false);

  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  async function saveName() {
    if (!nameValue.trim()) return;
    setSavingName(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ full_name: nameValue.trim() }).eq("id", user.id);
        await supabase.auth.updateUser({ data: { full_name: nameValue.trim() } });
        onUpdateName(nameValue.trim());
      }
    } catch { /* ignore */ }
    setSavingName(false);
    setEditingName(false);
  }

  async function changePassword() {
    setPasswordError("");
    if (newPassword.length < 8) { setPasswordError("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords don't match"); return; }

    setChangingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordChange(false);
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch {
      setPasswordError("Something went wrong.");
    }
    setChangingPassword(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Profile</h2>
        <p className="text-sm text-muted mt-1">Manage your personal account information</p>
      </div>

      {/* Success message */}
      {passwordSuccess && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> Password updated successfully.
        </div>
      )}

      {/* Avatar + Name + Email */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-white">
                {userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </span>
            </div>

            <div className="flex-1 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Full Name</label>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                      autoFocus
                    />
                    <button onClick={saveName} disabled={savingName || !nameValue.trim()} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50" aria-label="Save name">
                      {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => { setEditingName(false); setNameValue(userName); }} className="p-2 text-muted hover:bg-surface rounded-lg transition-colors" aria-label="Cancel">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{userName}</span>
                    <button onClick={() => setEditingName(true)} className="p-1 text-muted hover:text-foreground transition-colors" aria-label="Edit name">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-muted" />
                  <span className="text-sm text-foreground">{userEmail}</span>
                </div>
                <p className="text-[10px] text-muted mt-1">Contact support to change your email address.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Lock className="w-4.5 h-4.5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Password</h3>
              <p className="text-xs text-muted">Update your account password</p>
            </div>
          </div>
          {!showPasswordChange && (
            <button onClick={() => setShowPasswordChange(true)} className="px-3 py-1.5 text-xs font-medium text-foreground border border-border hover:bg-surface rounded-lg transition-colors">
              Change Password
            </button>
          )}
        </div>

        {showPasswordChange && (
          <div className="px-6 pb-5 border-t border-border pt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted block mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted block mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                placeholder="Re-enter your password"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
              />
            </div>
            {passwordError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{passwordError}
              </div>
            )}
            <div className="flex items-center gap-3 pt-1">
              <button onClick={changePassword} disabled={changingPassword || !newPassword || !confirmPassword} className="px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
                {changingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                Update Password
              </button>
              <button onClick={() => { setShowPasswordChange(false); setNewPassword(""); setConfirmPassword(""); setPasswordError(""); }} className="px-4 py-2 text-xs font-medium text-muted hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <p className="text-xs text-muted">Your profile information is visible to other members of your workspace. Your password and security settings are private.</p>
      </div>
    </div>
  );
}
