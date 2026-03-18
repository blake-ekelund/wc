"use client";

import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordValid) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 font-[family-name:var(--font-geist-sans)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-xl font-semibold text-foreground">
              WorkChores
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-xl shadow-gray-200/40 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Password reset</h1>
            <p className="text-sm text-muted leading-relaxed mb-6">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <Link
              href="/signin"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-semibold text-foreground">
            WorkChores
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-xl shadow-gray-200/40 p-8">
          <h1 className="text-xl font-bold text-foreground mb-1">Set a new password</h1>
          <p className="text-sm text-muted mb-6">
            Enter your new password below. Must be at least 8 characters.
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-foreground placeholder:text-muted outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors pr-10"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${passwordValid ? "text-emerald-600" : "text-amber-600"}`}>
                  {passwordValid ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-amber-400 inline-block" />}
                  {passwordValid ? "Looks good" : `${8 - password.length} more character${8 - password.length === 1 ? "" : "s"} needed`}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirm new password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  placeholder="Re-enter your new password"
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-foreground placeholder:text-muted outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${passwordsMatch ? "text-emerald-600" : "text-red-500"}`}>
                  {passwordsMatch ? <Check className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-red-400 inline-block" />}
                  {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20 mt-2"
            >
              Reset Password
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
