"use client";

import { FadeIn } from "./animated";
import { DetailedCrmMock } from "./crm-mock";

export default function ProductPreview() {
  return (
    <section className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <FadeIn className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Your sales process, at a glance
          </h2>
          <p className="mt-4 text-muted text-lg">
            Contacts, touchpoints, tasks, and funnel — all in one workspace your
            team will actually use.
          </p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <DetailedCrmMock />
        </FadeIn>
      </div>
    </section>
  );
}
