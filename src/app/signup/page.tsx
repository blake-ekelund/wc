"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const benefits = [
  "6 industry-specific templates",
  "Custom pipeline stages & fields",
  "Built-in calendar & task manager",
  "Role-based team access",
  "Free forever for 1 user",
];

function SignupForm() {
  const searchParams = useSearchParams();
  const [name, setName] = useState(searchParams.get("name") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        setError("This email is already registered. Try signing in instead.");
      } else {
        setError(signUpError.message);
      }
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 font-[family-name:var(--font-geist-sans)]">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">You&apos;re all set!</h1>
          <p className="text-muted mb-8">
            We&apos;ve sent a confirmation email to <strong className="text-foreground">{email}</strong>.
            Check your inbox and click the link to activate your account.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20"
            >
              Try the Live Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-foreground bg-white border border-border hover:bg-gray-50 rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Left — Value prop */}
        <div className="hidden lg:block">
          <Link href="/" className="text-xl font-semibold text-foreground mb-8 inline-block">
            WorkChores
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-4 leading-tight">
            Start tracking your pipeline in under a minute
          </h1>
          <p className="text-muted text-lg mb-8 leading-relaxed">
            Pick your industry, customize your workflow, and start closing more deals — no credit card required.
          </p>
          <ul className="space-y-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-foreground">
                <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-accent" />
                </div>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Right — Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="text-xl font-semibold text-foreground">
              WorkChores
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-xl shadow-gray-200/40 p-8">
            <h2 className="text-xl font-bold text-foreground mb-1">Create your account</h2>
            <p className="text-sm text-muted mb-6">Free forever for individuals. No credit card needed.</p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-foreground placeholder:text-muted outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Work email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-foreground placeholder:text-muted outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    minLength={8}
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

              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-border accent-accent"
                  required
                  disabled={loading}
                />
                <span className="text-xs text-muted leading-relaxed">
                  I agree to the{" "}
                  <a href="/terms" className="text-accent hover:underline">Terms of Service</a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center">
              <p className="text-sm text-muted">
                Already have an account?{" "}
                <Link href="/signin" className="text-accent font-medium hover:underline">Sign in</Link>
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            Or{" "}
            <Link href="/demo" className="text-accent hover:underline font-medium">
              try the live demo
            </Link>{" "}
            without signing up
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
