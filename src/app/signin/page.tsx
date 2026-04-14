"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needs2fa, setNeeds2fa] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Invalid email or password. Please try again.");
      return;
    }

    // Check if user has 2FA enabled
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const res = await fetch("/api/user-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get-status" }),
        });
        const data = await res.json();
        if (data.enabled) {
          // User has 2FA — need code before proceeding
          if (!needs2fa) {
            setNeeds2fa(true);
            setUserId(user.id);
            setLoading(false);
            return;
          }
          // Verify TOTP code
          const verifyRes = await fetch("/api/user-2fa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "check-login", userId: user.id, code: totpCode }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.valid) {
            setLoading(false);
            setError("Invalid 2FA code. Please try again.");
            setTotpCode("");
            return;
          }
        }
      } catch {
        // If 2FA check fails, continue without it
      }

      // Activate any pending invites
      try {
        await fetch("/api/accept-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } catch {
        // Not critical
      }
    }

    setLoading(false);
    router.push("/app");
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
          <h1 className="text-xl font-bold text-foreground mb-1">Welcome back</h1>
          <p className="text-sm text-muted mb-6">Sign in to your WorkChores account.</p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="jane@company.com"
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-foreground placeholder:text-muted outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                required
                autoFocus
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Link href="/forgot-password" className="text-xs text-accent hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-foreground placeholder:text-muted outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 2FA code input */}
            {needs2fa && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">2FA Code</label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-foreground placeholder:text-muted outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors tracking-widest text-center font-mono text-lg"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-[10px] text-muted mt-1 text-center">From your authenticator app</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (needs2fa && totpCode.length !== 6)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {needs2fa ? "Verifying..." : "Signing in..."}
                </>
              ) : (
                <>
                  {needs2fa ? "Verify & Sign In" : "Sign In"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-accent font-medium hover:underline">Create one free</Link>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          Or{" "}
          <Link href="/demo" className="text-accent hover:underline font-medium">
            try the live demo
          </Link>{" "}
          without an account
        </p>
      </div>
    </div>
  );
}
