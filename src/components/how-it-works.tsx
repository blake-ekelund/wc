"use client";

import { Sparkles, SlidersHorizontal, Users, TrendingUp } from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "./animated";

const steps = [
  {
    icon: Sparkles,
    step: "01",
    title: "Pick your industry",
    description:
      "Choose from 6 industry templates during onboarding. Your pipeline, dashboard, and sample data are instantly customized.",
  },
  {
    icon: SlidersHorizontal,
    step: "02",
    title: "Customize your workspace",
    description:
      "Add custom fields, adjust pipeline stages, and set up your team hierarchy with role-based access controls.",
  },
  {
    icon: Users,
    step: "03",
    title: "Add your team",
    description:
      "Invite team members, assign roles (Admin, Manager, Member), and configure who can see whose data.",
  },
  {
    icon: TrendingUp,
    step: "04",
    title: "Start closing deals",
    description:
      "Track contacts, log touchpoints, manage tasks on your calendar, and watch your pipeline grow.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Up and running in under a minute
          </h2>
          <p className="mt-4 text-muted text-lg">
            No consultants. No training manuals. Pick your industry, name your
            workspace, and you&apos;re in.
          </p>
        </FadeIn>

        <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <FadeInItem key={s.step}>
              <div className="relative text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent-light mx-auto flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-accent" />
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-border" />
                )}
                <div className="text-xs font-bold text-accent mb-2">{s.step}</div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {s.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">{s.description}</p>
              </div>
            </FadeInItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
