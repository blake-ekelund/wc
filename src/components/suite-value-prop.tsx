"use client";

import { Layers, Zap, Building2, Download } from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "./animated";

const props = [
  {
    icon: Layers,
    title: "Unified Platform",
    description: "All your tools in one place — one login, one bill, no juggling between apps.",
  },
  {
    icon: Zap,
    title: "Built for Small Teams",
    description: "No enterprise bloat. Fast setup, simple pricing, and only the features you actually need.",
  },
  {
    icon: Building2,
    title: "Industry-Specific",
    description: "Templates and workflows tailored to your business — from B2B sales to home services.",
  },
  {
    icon: Download,
    title: "Your Data, Always",
    description: "Full import and export. No data lock-in. Your business data belongs to you.",
  },
];

export default function SuiteValueProp() {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Why teams choose WorkChores
          </h2>
          <p className="mt-3 text-lg text-muted">
            Simple tools that work together, so your team can focus on what matters.
          </p>
        </FadeIn>

        <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {props.map((prop) => (
            <FadeInItem key={prop.title}>
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-light text-accent mb-4">
                  <prop.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{prop.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{prop.description}</p>
              </div>
            </FadeInItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
