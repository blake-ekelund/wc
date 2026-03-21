"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      setValue(Math.round(eased * target));
      if (elapsed < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {prefix}{value.toLocaleString("en-US")}{suffix}
    </span>
  );
}

const stats = [
  {
    value: 6,
    prefix: "",
    suffix: "",
    label: "Industry templates",
  },
  {
    value: 5,
    prefix: "$",
    suffix: "/seat",
    label: "Simple monthly pricing",
    noAnimate: true,
  },
  {
    value: 60,
    prefix: "",
    suffix: "s",
    label: "To get started",
  },
  {
    value: 100,
    prefix: "",
    suffix: "%",
    label: "Your data, always",
  },
];


export default function SocialProof() {
  return (
    <section className="py-10 md:py-12 border-y border-border/60 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="text-center"
            >
              <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                {"noAnimate" in s && s.noAnimate ? (
                  <span>{s.prefix}{s.value}{s.suffix}</span>
                ) : (
                  <Counter target={s.value} prefix={s.prefix} suffix={s.suffix} />
                )}
              </div>
              <div className="text-xs sm:text-sm text-muted font-medium mt-1">
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
