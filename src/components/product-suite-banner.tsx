"use client";

import { ArrowRight } from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "./animated";
import { products } from "@/lib/products";
import Link from "next/link";

const statusConfig = {
  live: { label: "Live", className: "bg-emerald-100 text-emerald-700" },
  "coming-soon": { label: "Coming Soon", className: "bg-amber-100 text-amber-700" },
  beta: { label: "Beta", className: "bg-blue-100 text-blue-700" },
};

export default function ProductSuiteBanner({ currentProduct }: { currentProduct?: string }) {
  return (
    <section className="py-16 md:py-20 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Explore the WorkChores Suite
          </h2>
          <p className="mt-2 text-muted">
            One platform, every tool your small team needs.
          </p>
        </FadeIn>

        <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const isCurrent = product.href === currentProduct;
            const badge = statusConfig[product.status];

            return (
              <FadeInItem key={product.name}>
                <Link
                  href={product.href}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 ${
                    isCurrent
                      ? "border-accent bg-accent-light/50 shadow-sm"
                      : "border-border bg-white hover:border-accent/30 hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isCurrent ? "bg-accent text-white" : "bg-accent-light text-accent"}`}>
                    <product.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{product.name}</span>
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">{product.tagline}</p>
                    {isCurrent && (
                      <span className="text-[10px] font-medium text-accent mt-1 inline-block">You are here</span>
                    )}
                  </div>
                  {!isCurrent && <ArrowRight className="w-3.5 h-3.5 text-muted mt-1 shrink-0" />}
                </Link>
              </FadeInItem>
            );
          })}
        </FadeInStagger>
      </div>
    </section>
  );
}
