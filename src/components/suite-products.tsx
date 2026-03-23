"use client";

import { FadeIn, FadeInStagger, FadeInItem } from "./animated";
import ProductCard from "./product-card";
import { products } from "@/lib/products";

export default function SuiteProducts() {
  return (
    <section id="products" className="py-20 md:py-28 px-6 bg-surface">
      <div className="max-w-5xl mx-auto">
        <FadeIn className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Our Products
          </h2>
          <p className="mt-3 text-lg text-muted">
            Built for teams that move fast — with more on the way.
          </p>
        </FadeIn>

        <FadeInStagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <FadeInItem key={product.name}>
              <ProductCard {...product} />
            </FadeInItem>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}
