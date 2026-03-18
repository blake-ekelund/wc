"use client";

import { useState } from "react";
import {
  Building2,
  Monitor,
  Home,
  UsersRound,
  ClipboardList,
  Wrench,
  ArrowRight,
  Check,
  type LucideIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn } from "./animated";

interface Industry {
  icon: LucideIcon;
  name: string;
  description: string;
  stages: string[];
  metrics: string[];
  tasks: string[];
}

const industries: Industry[] = [
  {
    icon: Building2,
    name: "B2B Sales",
    description: "Track leads through qualification, proposals, and negotiations to close. Built for sales teams selling products or services to other businesses.",
    stages: ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won"],
    metrics: ["Pipeline Value", "Won This Month", "Active Deals", "Conversion Rate"],
    tasks: ["Send follow-up proposal", "Schedule discovery call", "Prepare quarterly review"],
  },
  {
    icon: Monitor,
    name: "SaaS",
    description: "Manage software trials, demos, and subscriptions. Track MRR, churn, and product-led growth from first signup to enterprise deal.",
    stages: ["Lead", "Trial", "Demo", "Negotiation", "Customer"],
    metrics: ["Pipeline ARR", "Active MRR", "Active Trials", "Churn Rate"],
    tasks: ["Follow up on trial expiry", "Schedule product demo", "Send onboarding guide"],
  },
  {
    icon: Home,
    name: "Real Estate",
    description: "Track buyers and sellers from first inquiry through viewings, offers, and closings. See your active listings and volume at a glance.",
    stages: ["New Lead", "Viewing", "Offer Made", "Under Contract", "Closed"],
    metrics: ["Active Listings", "Under Contract", "Closed Volume", "Avg. Days to Close"],
    tasks: ["Schedule showing", "Send comp analysis", "Follow up on offer"],
  },
  {
    icon: UsersRound,
    name: "Recruiting",
    description: "Move candidates from sourcing through screening, interviews, and offers. Track placements and time-to-fill across all open roles.",
    stages: ["Sourced", "Phone Screen", "Interview", "Offer", "Hired"],
    metrics: ["Active Candidates", "In Interviews", "Hires This Month", "Time to Fill"],
    tasks: ["Schedule phone screen", "Send interview prep", "Check references"],
  },
  {
    icon: ClipboardList,
    name: "Consulting",
    description: "Manage client engagements from discovery through proposals and SOW review. Track revenue booked and active engagement hours.",
    stages: ["Discovery", "Proposal", "SOW Review", "Engaged", "Completed"],
    metrics: ["Pipeline Value", "Active Engagements", "Revenue Booked", "Utilization"],
    tasks: ["Draft SOW", "Send project update", "Schedule kickoff call"],
  },
  {
    icon: Wrench,
    name: "Home Services",
    description: "Schedule and track jobs for plumbing, electrical, HVAC, and more. From estimate to completion with full job history on every customer.",
    stages: ["New Lead", "Estimate Sent", "Scheduled", "In Progress", "Completed"],
    metrics: ["Active Jobs", "Scheduled This Week", "Completed Revenue", "Avg. Job Value"],
    tasks: ["Send estimate", "Confirm appointment", "Follow up for review"],
  },
];

export default function Industries() {
  const [active, setActive] = useState(0);
  const ind = industries[active];

  return (
    <section id="industries" className="py-20 md:py-28 px-6 bg-surface">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Built for your industry
          </h2>
          <p className="mt-4 text-muted text-lg">
            Pick your industry and get a fully customized pipeline, dashboard,
            and sample data — ready in seconds.
          </p>
        </FadeIn>

        {/* Industry selector pills */}
        <FadeIn delay={0.1}>
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {industries.map((item, i) => {
              const isActive = i === active;
              return (
                <button
                  key={item.name}
                  onClick={() => setActive(i)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-accent text-white shadow-lg shadow-accent/20"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </FadeIn>

        {/* Selected industry detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl border border-border shadow-lg shadow-gray-200/30 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 sm:px-8 py-6 border-b border-border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
                  <ind.icon className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{ind.name}</h3>
                  <p className="text-sm text-muted mt-1 leading-relaxed max-w-lg">{ind.description}</p>
                </div>
              </div>
            </div>

            {/* Content grid */}
            <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {/* Pipeline stages */}
              <div className="px-6 sm:px-8 py-6">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Pipeline Stages</div>
                <div className="space-y-2.5">
                  {ind.stages.map((s, i) => (
                    <div key={s} className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        i === ind.stages.length - 1
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {i + 1}
                      </div>
                      <span className="text-sm text-foreground font-medium">{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashboard KPIs */}
              <div className="px-6 sm:px-8 py-6">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Dashboard KPIs</div>
                <div className="space-y-2.5">
                  {ind.metrics.map((m) => (
                    <div key={m} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-sm text-foreground">{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample tasks */}
              <div className="px-6 sm:px-8 py-6">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Sample Tasks</div>
                <div className="space-y-2.5">
                  {ind.tasks.map((t) => (
                    <div key={t} className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded border-2 border-gray-300 shrink-0" />
                      <span className="text-sm text-muted">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="px-6 sm:px-8 py-4 border-t border-border bg-surface/50">
              <a
                href="/demo"
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-dark transition-colors"
              >
                Try {ind.name} in the live demo
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
