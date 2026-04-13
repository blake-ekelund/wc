"use client";

import { ArrowRight, Check } from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "./animated";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Full access to every feature and plugin. Start managing your pipeline today.",
    features: [
      "All features included",
      "All plugins (CRM, Vendors, Tasks, and future releases)",
      "Up to 100 contacts",
      "1,000 actions/month",
      "All 6 industry templates",
      "Pipeline, calendar, reports, and more",
      "Data import & export",
    ],
    cta: "Get Started Free",
    featured: false,
  },
  {
    name: "Business",
    price: "$9",
    period: "/seat/month",
    description: "Scale your team. Same features, higher limits. One price per person, everything included.",
    features: [
      "Everything in Starter",
      "Up to 50,000 contacts",
      "500,000 actions/month",
      "Unlimited users",
      "Gmail integration & bulk email",
      "Priority support",
    ],
    cta: "Start Free, Upgrade Anytime",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large teams that need custom limits, dedicated support, and SLAs.",
    features: [
      "Everything in Business",
      "Unlimited contacts",
      "Unlimited actions",
      "Dedicated account manager",
      "Custom onboarding",
      "SLA & uptime guarantee",
    ],
    cta: "Contact Sales",
    featured: false,
    href: "/contact",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            One price. Every feature. Every plugin.
          </h2>
          <p className="mt-4 text-muted text-lg">
            No feature gating. No per-module pricing. Every seat gets full access to every tool we build — past, present, and future — for{" "}
            <span className="text-foreground font-semibold">$9/seat/month</span>.
          </p>
        </FadeIn>

        <FadeInStagger className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <FadeInItem key={plan.name}>
              <div
                className={`relative rounded-xl border p-6 sm:p-8 h-full flex flex-col ${
                  plan.featured
                    ? "border-accent bg-white shadow-xl shadow-accent/10 ring-1 ring-accent"
                    : "border-border bg-white hover:shadow-lg hover:shadow-gray-200/50"
                } transition-all duration-300`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-xs font-semibold rounded-full shadow-lg shadow-accent/20">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted">{plan.period}</span>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-muted leading-relaxed">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={(plan as { href?: string }).href || "/signup"}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg transition-colors ${
                    plan.featured
                      ? "bg-accent text-white hover:bg-accent-dark shadow-lg shadow-accent/20"
                      : "bg-surface text-foreground border border-border hover:bg-gray-100"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </FadeInItem>
          ))}
        </FadeInStagger>

        {/* What counts as an action */}
        <FadeIn delay={0.2}>
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="bg-surface rounded-xl border border-border p-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">What counts as an action?</h3>
              <p className="text-xs text-muted leading-relaxed mb-3">Actions are meaningful operations you perform — not clicks or page views. Browsing, searching, and viewing data are always free and unlimited.</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted">
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-accent shrink-0" /> Creating or editing a contact</div>
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-accent shrink-0" /> Logging a touchpoint</div>
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-accent shrink-0" /> Creating or completing a task</div>
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-accent shrink-0" /> Sending an email</div>
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-accent shrink-0" /> Importing contacts</div>
                <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-accent shrink-0" /> Exporting data</div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Bottom reassurance */}
        <FadeIn delay={0.3}>
          <div className="mt-8 text-center text-sm text-muted">
            <p>No credit card required to start. Cancel anytime. Your data is always yours.</p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
