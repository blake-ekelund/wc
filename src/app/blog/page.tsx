"use client";

import Link from "next/link";
import NavbarSimple from "@/components/navbar-simple";
import Footer from "@/components/footer";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/animated";
import { Clock, Pencil, BookOpen, TrendingUp, Users, Settings, ArrowRight } from "lucide-react";

const publishedPosts = [
  {
    title: "Contact Management Beyond Spreadsheets",
    category: "Getting Started",
    date: "Mar 24, 2026",
    readTime: "9 min read",
    href: "/blog/contact-management-beyond-spreadsheets",
    icon: BookOpen,
  },
  {
    title: "Why Small Teams Don't Need HubSpot",
    category: "Insights",
    date: "Mar 23, 2026",
    readTime: "8 min read",
    href: "/blog/why-small-teams-dont-need-hubspot",
    icon: TrendingUp,
  },
];

const upcomingPosts = [
  {
    title: "How to Set Up Pipeline Stages for Your Industry",
    category: "Best Practices",
    status: "Drafting",
    icon: Settings,
  },
  {
    title: "The Follow-Up Framework That Closes Deals",
    category: "Sales Tips",
    status: "Drafting",
    icon: TrendingUp,
  },
  {
    title: "CRM Data Hygiene: Keep Your Contacts Clean",
    category: "Best Practices",
    status: "Planned",
    icon: Settings,
  },
  {
    title: "Setting Up Team Roles: Who Should See What?",
    category: "Team Management",
    status: "Planned",
    icon: Users,
  },
];

const statusColor: Record<string, string> = {
  Writing: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Drafting: "bg-amber-50 text-amber-700 border-amber-200",
  Planned: "bg-gray-50 text-gray-500 border-gray-200",
};

export default function Blog() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] flex flex-col">
      <NavbarSimple />

      {/* Hero */}
      <section className="bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Blog</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight max-w-2xl">
              Practical advice for small teams.
            </h1>
            <p className="text-muted mt-4 max-w-xl text-lg leading-relaxed">
              Guides, tips, and insights on CRM, sales, and growing a small business &mdash; written by the team behind WorkChores.
            </p>
          </FadeIn>
        </div>
      </section>

      <main className="flex-1">
        {/* Published posts */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Latest</p>
            <h2 className="text-2xl font-bold text-foreground tracking-tight mb-8">Published</h2>
          </FadeIn>
          <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {publishedPosts.map((post) => (
              <FadeInItem key={post.title}>
                <Link href={post.href} className="block group">
                  <div className="bg-white border border-border rounded-xl p-6 h-full hover:shadow-lg hover:shadow-gray-200/40 transition-shadow group-hover:border-accent/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center">
                        <post.icon className="w-4.5 h-4.5 text-accent" />
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                        Published
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-accent transition-colors">{post.title}</h3>
                    <p className="text-xs text-muted flex items-center gap-3">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                      <span>{post.date}</span>
                    </p>
                  </div>
                </Link>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </section>

        {/* Upcoming posts */}
        <section className="bg-surface border-y border-border">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <FadeIn>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">In Progress</p>
              <h2 className="text-2xl font-bold text-foreground tracking-tight mb-8">What&apos;s in the pipeline.</h2>
            </FadeIn>
            <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingPosts.map((post) => (
                <FadeInItem key={post.title}>
                  <div className="bg-white border border-border rounded-xl p-6 h-full hover:shadow-lg hover:shadow-gray-200/40 transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center">
                        <post.icon className="w-4.5 h-4.5 text-accent" />
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColor[post.status]}`}>
                        {post.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1.5">{post.title}</h3>
                    <p className="text-xs text-muted flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {post.category}
                    </p>
                  </div>
                </FadeInItem>
              ))}
            </FadeInStagger>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <FadeIn>
            <div className="bg-foreground rounded-2xl p-10 md:p-16 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">Get notified when we publish</h2>
              <p className="text-white/60 mb-8 max-w-md mx-auto">Be the first to read new posts. No spam, unsubscribe anytime.</p>
              <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder-white/40 outline-none focus:border-white/50 transition-colors"
                />
                <button className="bg-accent text-white hover:bg-accent-dark rounded-lg px-5 py-3 text-sm font-medium transition-colors whitespace-nowrap inline-flex items-center gap-2">
                  Subscribe <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </FadeIn>
        </section>
      </main>

      <Footer />
    </div>
  );
}
