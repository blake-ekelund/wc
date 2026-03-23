"use client";

import { CheckSquare, Users, CalendarClock, BarChart3, Bell, ArrowLeft } from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/animated";
import Link from "next/link";
import { useState } from "react";

const features = [
  {
    icon: Users,
    title: "Team Assignment",
    description: "Assign tasks to team members so everyone knows what they're responsible for.",
  },
  {
    icon: CalendarClock,
    title: "Due Dates & Priorities",
    description: "Set deadlines and priority levels to keep the most important work on track.",
  },
  {
    icon: CheckSquare,
    title: "Status Tracking",
    description: "Move tasks through stages — to do, in progress, done. Simple and visual.",
  },
  {
    icon: BarChart3,
    title: "CRM Integration",
    description: "Link tasks to contacts and deals in your CRM so nothing falls through the cracks.",
  },
];

export default function TaskTrackerContent() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "task-tracker-waitlist" }),
      });
    } catch {
      // silent fail
    }
    setSubmitted(true);
  }

  return (
    <>
      <section className="pt-28 pb-20 md:pt-36 md:pb-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all products
            </Link>
          </FadeIn>
          <FadeIn delay={0.05}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium mb-6">
              <Bell className="w-3 h-3" />
              Coming Soon
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-foreground">
              Task Tracker
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-5 text-lg text-muted leading-relaxed max-w-xl mx-auto">
              A simple way to manage tasks across your team — who&apos;s doing what,
              where, and by when. No complex project management, just get things done.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            {submitted ? (
              <div className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
                <Bell className="w-4 h-4" />
                You&apos;re on the list! We&apos;ll notify you when it launches.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shrink-0"
                >
                  Get Notified
                </button>
              </form>
            )}
          </FadeIn>
        </div>
      </section>

      <section className="py-20 px-6 bg-surface">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              What to expect
            </h2>
          </FadeIn>
          <FadeInStagger className="grid sm:grid-cols-2 gap-6">
            {features.map((feature) => (
              <FadeInItem key={feature.title}>
                <div className="p-6 rounded-xl border border-border bg-white">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-accent-light text-accent mb-4">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{feature.description}</p>
                </div>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </div>
      </section>
    </>
  );
}
