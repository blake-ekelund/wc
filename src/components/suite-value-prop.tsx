"use client";

import { Eye, Zap, Shield, Download } from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "./animated";

const props = [
  {
    icon: Eye,
    title: "Full Visibility",
    description: "Revenue, people, vendors, budgets — all in one dashboard. No more hunting across tools.",
  },
  {
    icon: Zap,
    title: "No Enterprise Bloat",
    description: "You don't need Salesforce + SAP + Workday. You need something that works in 5 minutes.",
  },
  {
    icon: Shield,
    title: "Built for Ops, Not IT",
    description: "No implementation team required. If you can use a spreadsheet, you can use WorkChores.",
  },
  {
    icon: Download,
    title: "Your Data, Always",
    description: "Full import and export. No data lock-in. Take your data wherever you go.",
  },
];

export default function SuiteValueProp() {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Why ops leaders choose WorkChores
          </h2>
          <p className="mt-3 text-lg text-muted">
            You run the business. Your tools should keep up.
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
