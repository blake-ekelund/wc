"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, Play } from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "./animated";
import { products, type Product } from "@/lib/products";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const liveProducts = products.filter((p) => p.status === "live");
const upcomingProducts = products.filter((p) => p.status !== "live");

// Group upcoming products by targetDate
const roadmap = upcomingProducts.reduce<Record<string, typeof upcomingProducts>>((acc, product) => {
  const date = product.targetDate || "TBD";
  if (!acc[date]) acc[date] = [];
  acc[date].push(product);
  return acc;
}, {});

const roadmapEntries = Object.entries(roadmap);

function LiveProductCard({ product }: { product: Product }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Always visible — compact summary */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent text-white">
              <product.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
              <p className="text-sm text-muted">{product.tagline}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 shrink-0">
            Live
          </span>
        </div>

        <p className="mt-3 text-sm text-muted leading-relaxed">{product.description}</p>

        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-3 h-3" />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-foreground bg-surface hover:bg-gray-100 border border-border rounded-lg transition-colors"
          >
            <Play className="w-3 h-3" />
            Demo
          </Link>
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-dark transition-colors"
          >
            {expanded ? "Less" : "More details"}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Expandable — feature highlights + pricing */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-border pt-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {product.features.map((feature) => (
                  <div key={feature} className="text-xs text-muted bg-surface rounded-lg px-3 py-2 text-center">
                    {feature}
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Link
                  href={product.href}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
                >
                  Full Details
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SuiteProducts() {
  return (
    <>
      {/* Live Plugins */}
      <section id="products" className="py-20 md:py-28 px-6 bg-surface">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Live Plugins
            </h2>
            <p className="mt-3 text-lg text-muted">
              Included with every seat. Ready to use today.
            </p>
          </FadeIn>

          <FadeInStagger className="space-y-4">
            {liveProducts.map((product) => (
              <FadeInItem key={product.name}>
                <LiveProductCard product={product} />
              </FadeInItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* Product Roadmap */}
      <section id="roadmap" className="py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Product Roadmap
            </h2>
            <p className="mt-3 text-lg text-muted">
              What&apos;s coming and when. We ship fast.
            </p>
          </FadeIn>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[23px] top-2 bottom-2 w-px bg-accent/20 hidden sm:block" />

            <FadeInStagger className="space-y-12">
              {roadmapEntries.map(([date, dateProducts], index) => (
                <FadeInItem key={date}>
                  <div className="flex gap-6">
                    {/* Subtle pulsing dot */}
                    <div className="hidden sm:flex flex-col items-center shrink-0">
                      <div className="relative mt-1.5">
                        <motion.div
                          className="absolute inset-0 rounded-full bg-accent"
                          animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.8,
                          }}
                          style={{ width: 11, height: 11 }}
                        />
                        <div className="w-[11px] h-[11px] rounded-full bg-accent relative z-10" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-accent/10">
                        <span className="text-sm font-bold text-accent">
                          {date}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {dateProducts.map((product) => (
                          <Link
                            key={product.name}
                            href={product.href}
                            className="group flex items-start gap-3 p-5 rounded-xl border border-border bg-white hover:border-accent/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                          >
                            <div className="p-2 rounded-lg bg-accent-light text-accent shrink-0">
                              <product.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-foreground">{product.name}</span>
                              <p className="text-xs text-muted mt-0.5">{product.tagline}</p>
                              <span className="inline-flex items-center gap-1 text-xs text-accent font-medium mt-2 group-hover:gap-2 transition-all duration-200">
                                Learn more <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </FadeInItem>
              ))}
            </FadeInStagger>
          </div>
        </div>
      </section>
    </>
  );
}
