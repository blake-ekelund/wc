"use client";

import Link from "next/link";
import { Users, Shield, Zap, Heart, Target, Building2, ArrowRight, MapPin } from "lucide-react";
import NavbarSimple from "@/components/navbar-simple";
import Footer from "@/components/footer";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/animated";

const features = [
  { icon: Users, title: "Contact Management", desc: "Store, search, and organize your contacts with custom fields and tags" },
  { icon: Target, title: "Deal Pipeline", desc: "Visual drag-and-drop pipeline with stages customized for your industry" },
  { icon: Zap, title: "Task & Activity Tracking", desc: "Log calls, emails, meetings, and follow-ups tied to each contact" },
  { icon: Building2, title: "Industry Templates", desc: "Pre-built workflows for real estate, consulting, home services, and more" },
  { icon: Shield, title: "Role-Based Access", desc: "Control what each team member can see with admin, manager, and member roles" },
  { icon: Heart, title: "Simple Pricing", desc: "Free starter plan, $5/seat/month for Business — no hidden fees, no contracts" },
];

const values = [
  { title: "Your data is yours", desc: "We never sell, share, or monetize your data. Period. Your contacts and business information belong to you, and you can export or delete everything at any time." },
  { title: "Honest pricing", desc: "No per-feature upsells, no usage caps designed to push you into higher tiers, no annual lock-in. $5 per seat per month gets you the full platform. Cancel anytime." },
  { title: "Built to be simple", desc: "We intentionally leave out features that add complexity without adding value for small teams. Every feature we ship should make your day easier, not harder." },
  { title: "Real support", desc: "When you reach out, a real person responds. We don\u2019t hide behind ticket queues or chatbots. Your questions and feedback directly shape what we build next." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] flex flex-col">
      <NavbarSimple />

      {/* Hero */}
      <section className="bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">About Us</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight max-w-2xl">
              Built for small teams that sell.
            </h1>
            <p className="text-muted mt-4 max-w-xl text-lg leading-relaxed">
              WorkChores is a focused CRM for teams of 1&ndash;25. No enterprise bloat, no surprise pricing &mdash; just the tools you need to manage relationships and close deals.
            </p>
          </FadeIn>
        </div>
      </section>

      <main className="flex-1">
        {/* Mission + Problem — two column */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-2 gap-16">
            <FadeIn>
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">Our Mission</h2>
              <p className="text-sm text-muted leading-relaxed">
                Small teams shouldn&apos;t need enterprise budgets to manage their relationships. We built WorkChores with a simple belief: the tools you use to grow your business should be affordable, intuitive, and designed for the way small teams actually work.
              </p>
              <p className="text-sm text-muted leading-relaxed mt-3">
                We help independent professionals, startups, and small businesses manage contacts, track deals, and close more sales &mdash; without the complexity or price tag of traditional CRMs.
              </p>
            </FadeIn>
            <FadeIn delay={0.15}>
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">The Problem We Saw</h2>
              <p className="text-sm text-muted leading-relaxed">
                Most CRM platforms are built for large sales teams with dedicated IT departments. They come with hundreds of features you&apos;ll never use, onboarding that takes weeks, and pricing that scales faster than your revenue.
              </p>
              <p className="text-sm text-muted leading-relaxed mt-3">
                We&apos;ve seen small business owners juggle spreadsheets, sticky notes, and email threads because every CRM they tried felt like overkill. That&apos;s the gap WorkChores fills.
              </p>
            </FadeIn>
          </div>
        </section>

        {/* Features grid */}
        <section className="bg-surface border-y border-border">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <FadeIn>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">What We Built</p>
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-8">Everything you need, nothing you don&apos;t.</h2>
            </FadeIn>
            <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((item) => (
                <FadeInItem key={item.title}>
                  <div className="bg-white border border-border rounded-xl p-6 h-full hover:shadow-lg hover:shadow-gray-200/40 transition-shadow">
                    <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center mb-4">
                      <item.icon className="w-4.5 h-4.5 text-accent" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1.5">{item.title}</h3>
                    <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                  </div>
                </FadeInItem>
              ))}
            </FadeInStagger>
          </div>
        </section>

        {/* Values */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Our Values</p>
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-8">What we stand for.</h2>
          </FadeIn>
          <FadeInStagger className="grid sm:grid-cols-2 gap-8">
            {values.map((v, i) => (
              <FadeInItem key={v.title}>
                <div className="flex gap-4">
                  <div className="text-2xl font-bold text-accent/20 leading-none mt-0.5">{String(i + 1).padStart(2, "0")}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1.5">{v.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </section>

        {/* Who + Company */}
        <section className="bg-surface border-y border-border">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="grid md:grid-cols-2 gap-16">
              <FadeIn>
                <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Our Customers</p>
                <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">Who WorkChores is for.</h2>
                <p className="text-sm text-muted leading-relaxed">
                  WorkChores is built for teams of 1 to 25 who need a CRM that works out of the box. Our customers include real estate agents, insurance brokers, financial advisors, consultants, contractors, home service providers, freelancers, and small agencies.
                </p>
                <p className="text-sm text-muted leading-relaxed mt-3">
                  If you manage client relationships and want a tool that respects your time and budget, WorkChores is for you.
                </p>
              </FadeIn>
              <FadeIn delay={0.15}>
                <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Our Company</p>
                <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">Small team, big ambition.</h2>
                <p className="text-sm text-muted leading-relaxed">
                  WorkChores, LLC is based in Gaithersburg, Maryland. We&apos;re a small team building tools for small teams. We bootstrap our growth, which means we answer to our customers &mdash; not investors.
                </p>
                <div className="flex items-center gap-2 mt-4 text-sm text-muted">
                  <MapPin className="w-4 h-4 text-accent" />
                  Gaithersburg, Maryland
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <FadeIn>
            <div className="bg-foreground rounded-2xl p-10 md:p-16 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">Ready to try it?</h2>
              <p className="text-white/60 mb-8 max-w-md mx-auto">Start free, no credit card required. See why small teams choose WorkChores.</p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="bg-accent text-white hover:bg-accent-dark rounded-lg px-6 py-3 text-sm font-medium transition-colors inline-flex items-center gap-2"
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/demo"
                  className="bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-lg px-6 py-3 text-sm font-medium transition-colors"
                >
                  Try the Demo
                </Link>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      <Footer />
    </div>
  );
}
