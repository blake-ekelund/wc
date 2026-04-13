"use client";

import { Check, X } from "lucide-react";
import { FadeIn } from "./animated";

const comparisons = [
  { ours: "60-second industry-specific setup", theirs: "Weeks of onboarding & config" },
  { ours: "Built-in Gmail integration & bulk email", theirs: "Email integration sold separately" },
  { ours: "Customizable dashboard (20+ KPI metrics)", theirs: "Fixed reports with limited customization" },
  { ours: "One-click data import & export", theirs: "Data locked behind export fees" },
  { ours: "Automatic duplicate detection", theirs: "Dedup tools cost extra" },
  { ours: "Role-based views (Admin/Manager/Member)", theirs: "Complex permission matrices" },
  { ours: "6 industry templates out of the box", theirs: "One-size-fits-all pipeline" },
  { ours: "File attachments on contacts & tasks", theirs: "Document storage is a paid add-on" },
  { ours: "Clean, fast interface", theirs: "Cluttered dashboards & slow loads" },
  { ours: "$9/seat/month — all features included", theirs: "Complex enterprise tiers & hidden add-ons" },
];

export default function WhyThisCrm() {
  return (
    <section className="py-20 md:py-28 px-6 bg-surface">
      <div className="max-w-4xl mx-auto">
        <FadeIn className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            CRM without the overhead
          </h2>
          <p className="mt-4 text-muted text-lg">
            Enterprise CRMs are built for enterprises. This one is built for
            teams that actually sell, recruit, and serve.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="rounded-xl border border-border bg-white overflow-hidden shadow-lg shadow-gray-200/40">
            <div className="grid grid-cols-2">
              <div className="px-3 sm:px-6 py-3 bg-accent text-white text-xs sm:text-sm font-semibold">
                WorkChores
              </div>
              <div className="px-3 sm:px-6 py-3 bg-gray-100 text-muted text-xs sm:text-sm font-semibold">
                Enterprise CRMs
              </div>
            </div>
            <div className="divide-y divide-border">
              {comparisons.map((c, i) => (
                <div key={i} className="grid grid-cols-2">
                  <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" />
                    <span className="text-xs sm:text-sm text-foreground">{c.ours}</span>
                  </div>
                  <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 bg-gray-50/50">
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 shrink-0" />
                    <span className="text-xs sm:text-sm text-muted">{c.theirs}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
