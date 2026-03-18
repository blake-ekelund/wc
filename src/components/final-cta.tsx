"use client";

import { ArrowRight, Play } from "lucide-react";
import { FadeIn } from "./animated";

export default function FinalCta() {
  return (
    <section id="cta" className="py-20 md:py-28 px-6 bg-foreground">
      <div className="max-w-2xl mx-auto text-center">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Your industry. Your pipeline. Ready in 60 seconds.
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            Pick your template, name your workspace, and start tracking deals
            immediately. No credit card, no setup calls, no bloat.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-foreground bg-white hover:bg-gray-100 rounded-lg transition-colors"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Try the Live Demo
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
