"use client";

import { ArrowRight } from "lucide-react";
import { FadeIn } from "./animated";
import Link from "next/link";

export default function SuiteCta() {
  return (
    <section className="py-20 md:py-28 px-6 bg-foreground">
      <div className="max-w-2xl mx-auto text-center">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Stop duct-taping your operations together.
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            Start with CRM today. Add vendors, HR, budgets, and tasks as we build them.
            One platform that grows with your operations.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-foreground bg-white hover:bg-gray-100 rounded-lg transition-colors"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#products"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
            >
              See the Full Suite
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
