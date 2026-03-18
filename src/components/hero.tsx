"use client";

import { ArrowRight, Play, Building2, Monitor, Home, UsersRound, ClipboardList, Wrench } from "lucide-react";
import { FadeIn } from "./animated";
import { CrmPreview } from "./crm-mock";

const industries = [
  { icon: Building2, label: "B2B Sales" },
  { icon: Monitor, label: "SaaS" },
  { icon: Home, label: "Real Estate" },
  { icon: UsersRound, label: "Recruiting" },
  { icon: ClipboardList, label: "Consulting" },
  { icon: Wrench, label: "Home Services" },
];

export default function Hero() {
  return (
    <section className="pt-28 pb-20 md:pt-36 md:pb-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-light text-accent text-xs font-medium mb-6">
                Built for teams that sell, recruit, and serve
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-[1.15] tracking-tight text-foreground">
                Your pipeline.
                <br />
                Your workflow.
                <br />
                <span className="text-accent">Your CRM.</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="mt-5 text-lg text-muted leading-relaxed max-w-lg">
                A lightweight CRM that adapts to your industry — with custom pipelines,
                role-based views, a built-in calendar, and everything your team needs to
                close more deals.
              </p>
            </FadeIn>
            <FadeIn delay={0.25}>
              <div className="mt-6 flex flex-wrap gap-2">
                {industries.map((ind) => (
                  <span key={ind.label} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-muted">
                    <ind.icon className="w-3 h-3" />
                    {ind.label}
                  </span>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/demo"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground bg-surface hover:bg-gray-100 border border-border rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Try the Live Demo
                </a>
              </div>
              <p className="mt-3 text-xs text-muted">No credit card required. Set up in under a minute.</p>
            </FadeIn>
          </div>
          <FadeIn delay={0.2} className="lg:pl-4">
            <CrmPreview />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
