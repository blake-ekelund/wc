"use client";

import { Check, ArrowRight, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface ProductCardProps {
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  href: string;
  status: "live" | "coming-soon" | "beta";
  features: string[];
}

const statusConfig = {
  live: { label: "Live", className: "bg-emerald-100 text-emerald-700" },
  "coming-soon": { label: "Coming Soon", className: "bg-amber-100 text-amber-700" },
  beta: { label: "Beta", className: "bg-blue-100 text-blue-700" },
};

export default function ProductCard({
  name,
  tagline,
  description,
  icon: Icon,
  href,
  status,
  features,
}: ProductCardProps) {
  const badge = statusConfig[status];

  return (
    <div
      className={`relative rounded-2xl border border-border bg-white p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        status === "coming-soon" ? "opacity-90" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="p-3 rounded-xl bg-accent-light text-accent">
          <Icon className="w-6 h-6" />
        </div>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <h3 className="text-xl font-bold text-foreground">{name}</h3>
      <p className="mt-1 text-sm font-medium text-accent">{tagline}</p>
      <p className="mt-3 text-sm text-muted leading-relaxed">{description}</p>

      <ul className="mt-5 space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-muted">
            <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-6 pt-5 border-t border-border">
        {status === "live" ? (
          <Link
            href={href}
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-dark transition-colors"
          >
            Learn More
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href={href}
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            Get Notified
          </Link>
        )}
      </div>
    </div>
  );
}
