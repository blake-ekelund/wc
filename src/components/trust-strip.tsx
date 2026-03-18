"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "6", label: "Industries Supported" },
  { value: "12+", label: "Built-in Features" },
  { value: "3", label: "Role-Based Views" },
  { value: "60s", label: "Avg. Setup Time" },
];

export default function TrustStrip() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-foreground"
    >
      <div className="max-w-6xl mx-auto px-6 py-6 md:py-7">
        <div className="flex items-center justify-between md:justify-center gap-6 md:gap-16 lg:gap-24 overflow-x-auto">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="flex items-center gap-3 shrink-0"
            >
              <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {s.value}
              </span>
              <span className="text-xs md:text-sm text-white/60 font-medium leading-tight max-w-[100px]">
                {s.label}
              </span>
              {i < stats.length - 1 && (
                <div className="hidden md:block w-px h-8 bg-white/15 ml-6 md:ml-10 lg:ml-16" />
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
