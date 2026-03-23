"use client";

import { ArrowRight, Check, Play } from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "./animated";
import { products } from "@/lib/products";
import { motion } from "framer-motion";
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

export default function SuiteProducts() {
  return (
    <>
      {/* Live Products — featured hero-style, not a sad card grid */}
      <section id="products" className="py-20 md:py-28 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Available Now
            </h2>
            <p className="mt-3 text-lg text-muted">
              Live and ready to use today.
            </p>
          </FadeIn>

          {liveProducts.map((product) => (
            <FadeIn key={product.name}>
              <div className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10 pointer-events-none" />
                <div className="relative p-8 md:p-12">
                  <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                    {/* Left — product info */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 rounded-xl bg-accent text-white">
                          <product.icon className="w-5 h-5" />
                        </div>
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                          Live
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-base font-medium text-accent">{product.tagline}</p>
                      <p className="mt-3 text-muted leading-relaxed">{product.description}</p>

                      <ul className="mt-5 grid grid-cols-2 gap-2">
                        {product.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-muted">
                            <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                          href="/signup"
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20"
                        >
                          Get Started Free
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                          href="/demo"
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground bg-surface hover:bg-gray-100 border border-border rounded-lg transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Try the Live Demo
                        </Link>
                      </div>
                    </div>

                    {/* Right — visual stats */}
                    <div className="hidden md:grid grid-cols-2 gap-4">
                      {[
                        { value: "6", label: "Industry Templates" },
                        { value: "$5", label: "Per Seat / Month" },
                        { value: "60s", label: "Setup Time" },
                        { value: "0", label: "Credit Cards Required" },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="text-center p-5 rounded-xl bg-surface border border-border"
                        >
                          <div className="text-2xl font-bold text-accent">{stat.value}</div>
                          <div className="text-xs text-muted mt-1">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Product Roadmap — alive and pulsing */}
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
            {/* Animated gradient timeline line */}
            <div className="absolute left-[23px] top-2 bottom-2 w-px hidden sm:block overflow-hidden">
              <motion.div
                className="w-full h-full"
                style={{
                  background: "linear-gradient(180deg, var(--accent) 0%, var(--accent-light) 50%, var(--accent) 100%)",
                  backgroundSize: "100% 200%",
                }}
                animate={{ backgroundPosition: ["0% 0%", "0% 100%", "0% 0%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            <FadeInStagger className="space-y-12">
              {roadmapEntries.map(([date, dateProducts], index) => (
                <FadeInItem key={date}>
                  <div className="flex gap-6">
                    {/* Pulsing timeline dot */}
                    <div className="hidden sm:flex flex-col items-center shrink-0">
                      <div className="relative mt-1.5">
                        <motion.div
                          className="absolute inset-0 rounded-full bg-accent"
                          animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: index * 0.5,
                          }}
                          style={{ width: 11, height: 11 }}
                        />
                        <div className="w-[11px] h-[11px] rounded-full bg-accent relative z-10" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Pulsing date badge */}
                      <motion.div
                        className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20"
                        animate={{ borderColor: ["rgba(37,99,235,0.2)", "rgba(37,99,235,0.5)", "rgba(37,99,235,0.2)"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
                      >
                        <motion.div
                          className="w-2 h-2 rounded-full bg-accent"
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
                        />
                        <span className="text-sm font-bold text-accent">
                          {date}
                        </span>
                      </motion.div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {dateProducts.map((product) => (
                          <Link
                            key={product.name}
                            href={product.href}
                            className="group flex items-start gap-3 p-5 rounded-xl border border-border bg-white hover:border-accent/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                          >
                            <div className="p-2 rounded-lg bg-accent-light text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                              <product.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-foreground">{product.name}</span>
                              <p className="text-xs text-muted mt-0.5">{product.tagline}</p>
                              <span className="inline-flex items-center gap-1 text-xs text-accent font-medium mt-2 group-hover:gap-2 transition-all duration-300">
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
