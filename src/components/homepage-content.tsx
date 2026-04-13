"use client";

import { ArrowRight, Play, Check, Users, Truck, CheckSquare, Puzzle, Star } from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "./animated";
import { CrmPreview } from "./crm-mock";
import Link from "next/link";
import { products } from "@/lib/products";

const pluginPitches = [
  {
    id: "CRM",
    headline: "Close more deals without the chaos",
    pitch: "Your pipeline, contacts, and follow-ups in one place. No more lost leads in spreadsheets or forgotten follow-ups in your inbox. See every deal, every touchpoint, and every next step at a glance.",
    outcomes: [
      "Never lose track of a deal or contact again",
      "See your entire pipeline in one drag-and-drop view",
      "Log calls, emails, and meetings in seconds",
      "Pick your industry — get a CRM that fits how you work",
    ],
  },
  {
    id: "Vendor Management",
    headline: "Stop chasing contracts and compliance docs",
    pitch: "Every vendor, contract, tax record, and renewal date in one place. No more scrambling at year-end or missing a renewal because it was buried in someone's email.",
    outcomes: [
      "Track every vendor contract and renewal date",
      "W9 and 1099 compliance without the spreadsheet",
      "Vendor portal — they submit docs, you review",
      "Never miss a renewal or compliance deadline",
    ],
  },
  {
    id: "Task Tracker",
    headline: "One task list across your entire operation",
    pitch: "Tasks that live alongside your contacts and vendors — not in a separate app. Assign work, set deadlines, and see what's overdue across your whole team without another login.",
    outcomes: [
      "Tasks linked to contacts, vendors, and deals",
      "Assign to teammates with priorities and due dates",
      "Filter by status, owner, or source in one view",
      "No separate tool — it's built into your workflow",
    ],
  },
];

const livePlugins = products.filter((p) => p.status === "live");

export default function HomepageContent() {
  return (
    <>
      {/* ============================================================
          1. HERO — Hook with product visual
          ============================================================ */}
      <section className="pt-6 pb-12 md:pt-10 md:pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-light text-accent text-xs font-medium mb-6">
                  CRM + Vendor Management + Tasks — $9/seat
                </div>
              </FadeIn>
              <FadeIn delay={0.1}>
                <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-[1.1] tracking-tight text-foreground">
                  One platform for
                  <br />
                  the people who
                  <br />
                  <span className="text-accent">run the business.</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.2}>
                <p className="mt-5 text-lg text-muted leading-relaxed max-w-lg">
                  Stop duct-taping spreadsheets, shared drives, and inbox folders together. WorkChores gives ops leaders one place to manage contacts, vendors, tasks, and deals.
                </p>
              </FadeIn>
              <FadeIn delay={0.3}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20"
                  >
                    Sign Up Free
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/demo"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-foreground bg-surface hover:bg-gray-100 border border-border rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Try the Live Demo
                  </Link>
                </div>
                <p className="mt-3 text-xs text-muted">Every plugin included with every seat. Set up in 60 seconds.</p>
              </FadeIn>
            </div>
            <FadeIn delay={0.2} className="lg:pl-4">
              <CrmPreview />
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. SOCIAL PROOF BAR
          ============================================================ */}
      <section className="py-8 border-y border-border/60 bg-surface/50">
        <div className="max-w-5xl mx-auto px-6">
          <FadeIn>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: "60s", label: "Setup time" },
                { value: "6", label: "Industry templates" },
                { value: "$9", label: "Per seat / month" },
                { value: "100%", label: "Your data, always" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl md:text-3xl font-extrabold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================
          3. PLUGINS — What you get
          ============================================================ */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-5">
              <Puzzle className="w-3.5 h-3.5" />
              Every plugin included
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              One seat. Every tool we build.
            </h2>
            <p className="mt-3 text-lg text-muted max-w-2xl mx-auto">
              No per-module pricing. No feature tiers. Every seat gets full access to every plugin — past, present, and future.
            </p>
          </FadeIn>

          <FadeInStagger className="space-y-6">
            {livePlugins.map((plugin) => {
              const pitch = pluginPitches.find((p) => p.id === plugin.name);
              if (!pitch) return null;
              return (
              <FadeInItem key={plugin.name}>
                <div className="rounded-2xl border border-border bg-white overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className="p-8 md:p-10">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-accent text-white shrink-0">
                        <plugin.icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-accent uppercase tracking-wider">{plugin.name}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full uppercase tracking-wider ml-auto">Included</span>
                    </div>

                    {/* Headline */}
                    <h3 className="text-2xl font-bold text-foreground mb-3">{pitch.headline}</h3>
                    <p className="text-sm text-muted leading-relaxed max-w-2xl mb-6">{pitch.pitch}</p>

                    {/* Outcomes */}
                    <div className="space-y-3 mb-8">
                      {pitch.outcomes.map((outcome) => (
                        <div key={outcome} className="flex items-start gap-3">
                          <div className="mt-0.5 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-accent" />
                          </div>
                          <span className="text-sm text-foreground">{outcome}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTAs */}
                    <div className="flex items-center gap-3">
                      <Link href={plugin.href} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-sm">
                        Explore {plugin.name} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link href="/demo" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
                        <Play className="w-3.5 h-3.5" /> Try demo
                      </Link>
                    </div>
                  </div>
                </div>
              </FadeInItem>
              );
            })}
          </FadeInStagger>
        </div>
      </section>

      {/* ============================================================
          4. WHY — Short value props
          ============================================================ */}
      <section className="py-16 px-6 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto">
          <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "60-second setup", desc: "Pick your industry, name your company, start working. No onboarding calls." },
              { title: "No training needed", desc: "If you can use a spreadsheet, you can use WorkChores. Click to edit, auto-saves." },
              { title: "Full data ownership", desc: "Import and export anytime. CSV, Excel. No lock-in, no hostage data." },
              { title: "Built for small teams", desc: "Not another Salesforce. No 50-page setup guide. Just the tools you need." },
            ].map((prop) => (
              <FadeInItem key={prop.title}>
                <div>
                  <h3 className="text-sm font-bold text-foreground mb-1.5">{prop.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{prop.desc}</p>
                </div>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* ============================================================
          5. PRICING — Remove the objection
          ============================================================ */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
              One price. Everything included.
            </h2>
            <p className="text-lg text-muted mb-10 max-w-xl mx-auto">
              Every seat gets full access to every plugin, every feature, and everything we build next.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Free */}
              <div className="rounded-xl border border-border bg-white p-6 text-left">
                <div className="text-sm font-semibold text-foreground mb-1">Starter</div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-extrabold text-foreground">Free</span>
                </div>
                <p className="text-xs text-muted mb-4">100 contacts, 1,000 actions/mo. All features.</p>
                <Link href="/signup" className="block text-center px-4 py-2.5 text-sm font-semibold text-foreground border border-border hover:bg-gray-50 rounded-lg transition-colors">
                  Get Started
                </Link>
              </div>

              {/* Business */}
              <div className="rounded-xl border-2 border-accent bg-white p-6 text-left shadow-lg shadow-accent/10 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-white text-[10px] font-bold rounded-full uppercase tracking-wider">Most Popular</div>
                <div className="text-sm font-semibold text-foreground mb-1">Business</div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-3xl font-extrabold text-foreground">$9</span>
                  <span className="text-sm text-muted">/seat/month</span>
                </div>
                <p className="text-xs text-muted mb-4">50,000 contacts, 500K actions/mo. Priority support.</p>
                <Link href="/signup" className="block text-center px-4 py-2.5 text-sm font-semibold text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20">
                  Start Free, Upgrade Anytime
                </Link>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted">
              <span>No credit card required</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>Cancel anytime</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <Link href="/pricing" className="text-accent hover:text-accent-dark font-medium">Compare all plans</Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================
          6. FINAL CTA — Ask
          ============================================================ */}
      <section className="py-20 md:py-28 px-6 bg-foreground">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Your operations team deserves real tools.
            </h2>
            <p className="mt-4 text-gray-400 text-lg">
              Sign up in 60 seconds. Pick your industry. Start managing contacts, vendors, and tasks today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-foreground bg-white hover:bg-gray-100 rounded-lg transition-colors"
              >
                Sign Up Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                Try the Demo
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
