"use client";

import { ArrowRight } from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "./animated";
import ProductCard from "./product-card";
import { products } from "@/lib/products";
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
      {/* Live Products */}
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

          <FadeInStagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {liveProducts.map((product) => (
              <FadeInItem key={product.name}>
                <ProductCard {...product} />
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
            <div className="absolute left-[23px] top-2 bottom-2 w-px bg-border hidden sm:block" />

            <FadeInStagger className="space-y-10">
              {roadmapEntries.map(([date, dateProducts]) => (
                <FadeInItem key={date}>
                  <div className="flex gap-6">
                    {/* Timeline dot + date */}
                    <div className="hidden sm:flex flex-col items-center shrink-0">
                      <div className="w-[11px] h-[11px] rounded-full bg-accent ring-4 ring-accent-light mt-1.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="inline-flex items-center gap-2 mb-4">
                        <span className="text-sm font-bold text-accent uppercase tracking-wider">
                          {date}
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {dateProducts.map((product) => (
                          <Link
                            key={product.name}
                            href={product.href}
                            className="flex items-start gap-3 p-4 rounded-xl border border-border bg-white hover:border-accent/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                          >
                            <div className="p-2 rounded-lg bg-accent-light text-accent shrink-0">
                              <product.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">{product.name}</span>
                                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700">
                                  Coming Soon
                                </span>
                              </div>
                              <p className="text-xs text-muted mt-0.5">{product.tagline}</p>
                              <span className="inline-flex items-center gap-1 text-xs text-accent font-medium mt-2">
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
