"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import { FadeIn } from "./animated";
import Link from "next/link";

export default function SuiteHero() {
  return (
    <section className="pt-28 pb-20 md:pt-36 md:pb-28 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-light text-accent text-xs font-medium mb-6">
            Built for G&A and Operations leaders
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-foreground">
            Ops leaders deserve better
            <br />
            <span className="text-accent">than spreadsheets.</span>
          </h1>
        </FadeIn>
        <FadeIn delay={0.2}>
          <p className="mt-6 text-lg md:text-xl text-muted leading-relaxed max-w-2xl mx-auto">
            Revenue data in one tab. Vendor contracts in another. HR info in a shared drive.
            Budget in someone&apos;s inbox. WorkChores puts it all in one place — so the person
            running operations can actually see the full picture.
          </p>
        </FadeIn>
        <FadeIn delay={0.3}>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/crm"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20"
            >
              Start with CRM
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#products"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-foreground bg-surface hover:bg-gray-100 border border-border rounded-lg transition-colors"
            >
              See the Full Suite
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
