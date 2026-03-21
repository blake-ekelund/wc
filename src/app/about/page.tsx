import Link from "next/link";
import { Users, Shield, Zap, Heart, Target, Building2 } from "lucide-react";
import NavbarSimple from "@/components/navbar-simple";
import Footer from "@/components/footer";

export default function About() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] flex flex-col">
      <NavbarSimple />

      <main className="flex-1 max-w-6xl mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">About WorkChores</h1>
        <p className="text-muted mt-2 mb-12">Built for small teams that sell.</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-10">
          {/* Mission */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Our Mission</h2>
            <p className="text-sm text-muted leading-relaxed">
              Small teams shouldn&apos;t need enterprise budgets to manage their relationships. WorkChores was built with a simple belief: the tools you use to grow your business should be affordable, intuitive, and designed for the way small teams actually work &mdash; not stripped-down versions of software built for Fortune 500 companies.
            </p>
            <p className="text-sm text-muted leading-relaxed mt-3">
              We&apos;re here to help independent professionals, startups, and small businesses manage their contacts, track their deals, and close more sales &mdash; without the complexity, bloat, or price tag of traditional CRMs.
            </p>
          </section>

          {/* The Problem */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">The Problem We Saw</h2>
            <p className="text-sm text-muted leading-relaxed">
              Most CRM platforms are built for large sales teams with dedicated IT departments. They come with hundreds of features you&apos;ll never use, onboarding processes that take weeks, and pricing that scales faster than your revenue. For a 3-person real estate team or a solo consultant, these tools create more work than they eliminate.
            </p>
            <p className="text-sm text-muted leading-relaxed mt-3">
              We&apos;ve seen small business owners juggle spreadsheets, sticky notes, and email threads because every CRM they tried felt like overkill. That&apos;s the gap WorkChores fills.
            </p>
          </section>

          {/* What We Built */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">What We Built</h2>
            <p className="text-sm text-muted leading-relaxed mb-4">
              WorkChores is a focused CRM with everything a small team needs and nothing they don&apos;t:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Users, title: "Contact Management", desc: "Store, search, and organize your contacts with custom fields and tags" },
                { icon: Target, title: "Deal Pipeline", desc: "Visual drag-and-drop pipeline with stages customized for your industry" },
                { icon: Zap, title: "Task & Activity Tracking", desc: "Log calls, emails, meetings, and follow-ups tied to each contact" },
                { icon: Building2, title: "Industry Templates", desc: "Pre-built workflows for real estate, consulting, home services, and more" },
                { icon: Shield, title: "Role-Based Access", desc: "Control what each team member can see with admin, manager, and member roles" },
                { icon: Heart, title: "Simple Pricing", desc: "Free starter plan, $5/seat/month for Business — no hidden fees, no contracts" },
              ].map((item) => (
                <div key={item.title} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Values */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">What We Stand For</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Your data is yours</h3>
                <p className="text-sm text-muted leading-relaxed">
                  We never sell, share, or monetize your data. Period. Your contacts and business information belong to you, and you can export or delete everything at any time.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Honest pricing</h3>
                <p className="text-sm text-muted leading-relaxed">
                  No per-feature upsells, no usage caps designed to push you into higher tiers, no annual lock-in. $5 per seat per month gets you the full platform. Cancel anytime.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Built to be simple</h3>
                <p className="text-sm text-muted leading-relaxed">
                  We intentionally leave out features that add complexity without adding value for small teams. Every feature we ship should make your day easier, not harder.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Real support</h3>
                <p className="text-sm text-muted leading-relaxed">
                  When you reach out, a real person responds. We don&apos;t hide behind ticket queues or chatbots. Your questions and feedback directly shape what we build next.
                </p>
              </div>
            </div>
          </section>

          {/* Who It's For */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Who WorkChores Is For</h2>
            <p className="text-sm text-muted leading-relaxed">
              WorkChores is built for teams of 1 to 25 who need a CRM that works out of the box. Our customers include real estate agents, insurance brokers, financial advisors, consultants, contractors, home service providers, freelancers, and small agencies. If you manage client relationships and want a tool that respects your time and budget, WorkChores is for you.
            </p>
          </section>

          {/* Company */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Our Company</h2>
            <p className="text-sm text-muted leading-relaxed">
              WorkChores, LLC is based in Gaithersburg, Maryland. We&apos;re a small team building tools for small teams. We bootstrap our growth, which means we answer to our customers &mdash; not investors. Every decision we make is driven by what&apos;s best for the people who use WorkChores every day.
            </p>
          </section>

          {/* CTA */}
          <section className="bg-surface border border-border rounded-xl p-8 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">Ready to try it?</h2>
            <p className="text-sm text-muted mb-5">Start free, no credit card required. See why small teams choose WorkChores.</p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/signup"
                className="bg-accent text-white hover:bg-accent-dark rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/demo"
                className="bg-white border border-border text-foreground hover:bg-gray-50 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              >
                Try the Demo
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
