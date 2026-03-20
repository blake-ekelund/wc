"use client";

import { ArrowRight, Check } from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "./animated";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Everything you need to start managing your pipeline. No limits, no tricks.",
    features: [
      "Up to 100 contacts",
      "Up to 3 users",
      "All 6 industry templates",
      "Full pipeline tracking",
      "Touchpoint & task logging",
      "Calendar view",
      "Universal search",
      "Data import & export",
    ],
    cta: "Get Started Free",
    featured: false,
  },
  {
    name: "Business",
    price: "$5",
    period: "/seat/month",
    description: "The full platform. Every feature unlocked — scales with your team at just $5 per person.",
    features: [
      "Everything in Starter",
      "Up to 50,000 contacts",
      "Unlimited users",
      "Gmail integration & bulk email",
      "Email templates & signatures",
      "Custom pipeline stages & fields",
      "Customizable KPI dashboard (20+ metrics)",
      "File attachments & duplicate detection",
      "Role-based access & team visibility",
      "Smart recommendations & alerts",
      "Archive & trash management",
      "Priority support",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Pricing to make our competition nervous
          </h2>
          <p className="mt-4 text-muted text-lg">
            We believe powerful software shouldn&apos;t cost a fortune. We&apos;re
            democratizing CRM technology and passing the savings to you —
            unlimited contacts, unlimited users, all features —{" "}
            <span className="text-foreground font-semibold">$5/seat/month</span>.
          </p>
        </FadeIn>

        <FadeInStagger className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
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
                    Best Value
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
                  href="/signup"
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

        {/* Bottom reassurance */}
        <FadeIn delay={0.3}>
          <div className="mt-10 text-center text-sm text-muted">
            <p>No credit card required to start. Cancel anytime. Your data is always yours.</p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
