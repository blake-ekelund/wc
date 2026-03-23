"use client";

import {
  ArrowRight,
  Check,
  Play,
  LayoutDashboard,
  Users,
  GitBranch,
  Mail,
  CalendarCheck,
  Upload,
  Shield,
  Search,
} from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "./animated";
import { products } from "@/lib/products";
import { motion } from "framer-motion";
import Link from "next/link";

const upcomingProducts = products.filter((p) => p.status !== "live");

// Group upcoming products by targetDate
const roadmap = upcomingProducts.reduce<Record<string, typeof upcomingProducts>>((acc, product) => {
  const date = product.targetDate || "TBD";
  if (!acc[date]) acc[date] = [];
  acc[date].push(product);
  return acc;
}, {});

const roadmapEntries = Object.entries(roadmap);

const crmFeatures = [
  {
    icon: LayoutDashboard,
    title: "Customizable Dashboard",
    desc: "20+ KPI metrics. Pick what matters to your business.",
  },
  {
    icon: Users,
    title: "Contact Intelligence",
    desc: "Rich profiles, custom fields, duplicate detection, last-contacted tracking.",
  },
  {
    icon: GitBranch,
    title: "Visual Pipeline",
    desc: "Drag-and-drop deals across stages. 6 industry templates or build your own.",
  },
  {
    icon: Mail,
    title: "Gmail Integration",
    desc: "Send emails from contact pages. Reusable templates with auto-filled variables.",
  },
  {
    icon: CalendarCheck,
    title: "Tasks & Calendar",
    desc: "Due dates, priorities, file attachments. Monthly calendar view.",
  },
  {
    icon: Upload,
    title: "Import & Export",
    desc: "Guided spreadsheet import. Export contacts, tasks, and activity anytime.",
  },
  {
    icon: Shield,
    title: "Roles & Permissions",
    desc: "Admin, Manager, Member — each sees exactly the data they should.",
  },
  {
    icon: Search,
    title: "Universal Search",
    desc: "Find anything across contacts, tasks, emails, tags, and stages.",
  },
];

const crmDiffPoints = [
  { us: "60-second setup", them: "Weeks of onboarding" },
  { us: "Gmail built in", them: "Email integration sold separately" },
  { us: "20+ KPI dashboard", them: "Fixed reports, limited customization" },
  { us: "One-click import & export", them: "Data locked behind export fees" },
  { us: "$5/seat — everything included", them: "Complex tiers & hidden add-ons" },
];

export default function SuiteProducts() {
  return (
    <>
      {/* CRM — the flagship, full showcase */}
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

          {/* CRM Hero Card */}
          <FadeIn>
            <div className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/10 pointer-events-none" />
              <div className="relative p-8 md:p-12">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-xl bg-accent text-white">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                    Live
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">CRM</h3>
                <p className="mt-1 text-lg text-muted max-w-2xl">
                  A lightweight CRM that adapts to your industry — with custom pipelines,
                  Gmail integration, built-in calendar, and a complete toolkit for managing
                  contacts, emails, and deals.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
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
                  <Link
                    href="/crm"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-accent hover:text-accent-dark transition-colors"
                  >
                    Full Details
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Feature Grid */}
          <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {crmFeatures.map((f) => (
              <FadeInItem key={f.title}>
                <div className="p-5 rounded-xl border border-border bg-white">
                  <div className="p-2 rounded-lg bg-accent-light text-accent inline-flex mb-3">
                    <f.icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">{f.title}</h4>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </FadeInItem>
            ))}
          </FadeInStagger>

          {/* Us vs. Them */}
          <FadeIn className="mt-8">
            <div className="rounded-xl border border-border bg-white overflow-hidden">
              <div className="grid grid-cols-2 text-xs font-semibold uppercase tracking-wider text-muted border-b border-border">
                <div className="px-5 py-3 bg-accent/5 text-accent">WorkChores</div>
                <div className="px-5 py-3">Enterprise CRMs</div>
              </div>
              {crmDiffPoints.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-2 text-sm ${i < crmDiffPoints.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="px-5 py-3 flex items-center gap-2 bg-accent/5">
                    <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="text-foreground font-medium">{row.us}</span>
                  </div>
                  <div className="px-5 py-3 text-muted">{row.them}</div>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Pricing callout */}
          <FadeIn className="mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-xl bg-foreground text-white">
              <div>
                <div className="text-2xl font-bold">
                  $5<span className="text-base font-normal text-gray-400">/seat/month</span>
                </div>
                <p className="text-sm text-gray-400 mt-0.5">All features included. Free tier available. No credit card required.</p>
              </div>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground bg-white hover:bg-gray-100 rounded-lg transition-colors shrink-0"
              >
                Start Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Product Roadmap — subtle pulse, not a rave */}
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
            {/* Static timeline line */}
            <div className="absolute left-[23px] top-2 bottom-2 w-px bg-accent/20 hidden sm:block" />

            <FadeInStagger className="space-y-12">
              {roadmapEntries.map(([date, dateProducts], index) => (
                <FadeInItem key={date}>
                  <div className="flex gap-6">
                    {/* Single subtle pulse on the dot only */}
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
