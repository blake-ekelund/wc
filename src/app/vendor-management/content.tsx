"use client";

import {
  ArrowRight,
  Play,
  Factory,
  Briefcase,
  ShoppingBag,
  HeartPulse,
  Cpu,
  HardHat,
  Users,
  FileText,
  ShieldCheck,
  Link2,
  Bell,
  Paperclip,
  UserPlus,
  ClipboardList,
  Zap,
  Check,
  X,
} from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/animated";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

/* ───────────────────── Data ───────────────────── */

const industries = [
  { icon: Factory, label: "Manufacturing" },
  { icon: Briefcase, label: "Professional Services" },
  { icon: ShoppingBag, label: "Retail" },
  { icon: HeartPulse, label: "Healthcare" },
  { icon: Cpu, label: "Technology" },
  { icon: HardHat, label: "Construction" },
];

const features = [
  {
    id: "directory",
    icon: Users,
    title: "Vendor Directory",
    subtitle: "One source of truth",
    description:
      "Centralize every vendor in one searchable directory with contacts, status, and categories. Filter by type, status, or tag — and see at a glance who needs attention.",
    image: "/features/vendors-directory.jpg",
  },
  {
    id: "contracts",
    icon: FileText,
    title: "Contract & Cost Tracking",
    subtitle: "Know what you spend",
    description:
      "Track contract terms, renewal dates, payment frequency, and annual spend. Auto-calculate annual costs from frequency + amount. Never be surprised by a renewal again.",
    image: "/features/vendor-detail.jpg",
  },
  {
    id: "compliance",
    icon: ShieldCheck,
    title: "Compliance Management",
    subtitle: "Stay audit-ready",
    description:
      "Monitor W-9 status, 1099 requirements, and tax classifications. Flag vendors with missing docs and track filing deadlines — so nothing slips through the cracks.",
    image: "/features/vendor-compliance.jpg",
  },
  {
    id: "portal",
    icon: Link2,
    title: "Vendor Portal",
    subtitle: "Self-service document collection",
    description:
      "Send vendors a magic link to upload their own W-9, COI, and contracts. No back-and-forth emails. Documents land directly in the vendor record, ready for review.",
    image: "/features/vendor-portal.jpg",
  },
  {
    id: "alerts",
    icon: Bell,
    title: "Smart Alerts",
    subtitle: "Stay ahead of deadlines",
    description:
      "Get notified 90 days before contract renewals, missing compliance docs, and overdue items. Alerts surface in your dashboard so nothing gets buried in email.",
    image: "/features/vendor-alerts.jpg",
  },
  {
    id: "notes",
    icon: Paperclip,
    title: "Notes & Files",
    subtitle: "Full audit trail",
    description:
      "Attach contracts, track conversations, and keep a full audit trail for every vendor relationship. Search across notes and files to find anything instantly.",
    image: "/features/vendor-notes.jpg",
  },
];

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Add your vendors",
    description:
      "Import your vendor list from a spreadsheet or add vendors one by one with the guided wizard. Contacts, categories, and status are set up in seconds.",
  },
  {
    icon: ClipboardList,
    step: "02",
    title: "Track contracts & compliance",
    description:
      "Set up contract terms, W-9 status, payment details, and renewal dates. The system auto-calculates annual costs and flags gaps in compliance.",
  },
  {
    icon: Zap,
    step: "03",
    title: "Stay ahead",
    description:
      "Get alerts before renewals, request documents via the vendor portal, and keep your team aligned — all from one workspace.",
  },
];

const comparisons = [
  { ours: "Vendor directory with categories & status", theirs: "Scattered spreadsheets and shared drives" },
  { ours: "Self-service vendor portal (magic links)", theirs: "Endless email chains for documents" },
  { ours: "Built-in W-9, 1099 & insurance tracking", theirs: "Manual compliance checklists" },
  { ours: "Auto-calculated annual spend from contracts", theirs: "Manual cost roll-ups in Excel" },
  { ours: "Smart alerts 90 days before renewals", theirs: "Calendar reminders (if you remember to set them)" },
  { ours: "Notes, files & full audit trail per vendor", theirs: "Notes buried in email threads" },
  { ours: "Connected to CRM, tasks & calendar", theirs: "Vendor data siloed from operations" },
  { ours: "$5/seat/month — all features included", theirs: "Enterprise vendor tools start at $200+/mo" },
];

/* ───────────────────── Component ───────────────────── */

export default function VendorManagementContent() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible, activeFeature]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ────────── Hero ────────── */}
      <section className="pt-28 pb-20 md:pt-36 md:pb-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-light text-accent text-xs font-medium mb-6">
                Built for G&A and Operations leaders
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-[1.15] tracking-tight text-foreground">
                Your vendors. Your contracts.
                <br />
                Your compliance.
                <br />
                <span className="text-accent">Under control.</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="mt-5 text-lg text-muted leading-relaxed max-w-lg">
                Track every vendor relationship, contract renewal, and compliance
                requirement in one workspace. No more spreadsheet chaos.
              </p>
            </FadeIn>
            <FadeIn delay={0.25}>
              <div className="mt-6 flex flex-wrap gap-2">
                {industries.map((ind) => (
                  <span
                    key={ind.label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-muted"
                  >
                    <ind.icon className="w-3 h-3" />
                    {ind.label}
                  </span>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20"
                >
                  Start Free
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/app"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground bg-surface hover:bg-gray-100 border border-border rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  See it in action
                </a>
              </div>
              <p className="mt-3 text-xs text-muted">
                No credit card required. Set up in under a minute.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ────────── Features (icon-card tabs) ────────── */}
      <section id="features" ref={sectionRef} className="py-20 md:py-28 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Everything you need to manage vendors. Nothing you don&apos;t.
            </h2>
            <p className="mt-4 text-muted text-lg">
              Directory, contracts, compliance, vendor portal, alerts, and audit
              trail — all in one clean interface. No add-ons, no hidden fees.
            </p>
          </FadeIn>

          {/* Mobile: horizontal pill tabs */}
          <div className="lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex gap-2 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {features.map((f, i) => {
                const isActive = i === activeFeature;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFeature(i)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 whitespace-nowrap shrink-0 transition-all duration-200 text-sm font-medium ${
                      isActive
                        ? "border-accent bg-accent text-white shadow-lg shadow-accent/20"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <f.icon className="w-4 h-4" />
                    {f.title}
                  </button>
                );
              })}
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.p
                key={activeFeature}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-muted leading-relaxed mb-5 text-center"
              >
                {features[activeFeature].description}
              </motion.p>
            </AnimatePresence>

            {/* Mobile screenshot */}
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 p-1 shadow-lg shadow-gray-200/20 overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-t-xl border-b border-gray-100">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-3 py-0.5 bg-gray-50 rounded text-[9px] text-gray-400 font-medium">
                    app.workchores.com
                  </div>
                </div>
              </div>
              <div className="rounded-b-xl overflow-hidden bg-white">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src={features[activeFeature].image}
                      alt={features[activeFeature].title}
                      width={800}
                      height={500}
                      className="w-full h-auto"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Desktop: two-column layout */}
          <div className="hidden lg:grid lg:grid-cols-[340px_1fr] gap-8 items-start">
            {/* Left: Feature tabs */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-2"
            >
              {features.map((f, i) => {
                const isActive = i === activeFeature;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFeature(i)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 group ${
                      isActive
                        ? "border-accent bg-accent-light/50 shadow-lg shadow-accent/10"
                        : "border-transparent bg-white hover:border-gray-200 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? "bg-accent text-white"
                            : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                        }`}
                      >
                        <f.icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-sm font-semibold transition-colors ${
                            isActive ? "text-accent" : "text-foreground"
                          }`}
                        >
                          {f.title}
                        </h3>
                        <p
                          className={`text-xs mt-0.5 transition-colors ${
                            isActive ? "text-accent/70" : "text-muted"
                          }`}
                        >
                          {f.subtitle}
                        </p>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isActive && (
                        <motion.p
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-xs text-muted leading-relaxed pl-12 overflow-hidden"
                        >
                          {f.description}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </motion.div>

            {/* Right: Screenshot in browser chrome */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:sticky lg:top-24"
            >
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 p-1 shadow-xl shadow-gray-200/30 overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-t-xl border-b border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-3 py-0.5 bg-gray-50 rounded text-[9px] text-gray-400 font-medium">
                      app.workchores.com
                    </div>
                  </div>
                </div>
                <div className="rounded-b-xl overflow-hidden bg-white">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeFeature}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image
                        src={features[activeFeature].image}
                        alt={features[activeFeature].title}
                        width={800}
                        height={500}
                        className="w-full h-auto"
                        priority={activeFeature === 0}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ────────── How It Works ────────── */}
      <section id="how-it-works" className="py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Up and running in minutes
            </h2>
            <p className="mt-4 text-muted text-lg">
              No consultants. No month-long rollout. Add your vendors and start
              tracking today.
            </p>
          </FadeIn>

          <FadeInStagger className="grid sm:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <FadeInItem key={s.step}>
                <div className="relative text-center">
                  <div className="w-14 h-14 rounded-2xl bg-accent-light mx-auto flex items-center justify-center mb-4">
                    <s.icon className="w-6 h-6 text-accent" />
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden sm:block absolute top-7 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-border" />
                  )}
                  <div className="text-xs font-bold text-accent mb-2">
                    {s.step}
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* ────────── Why WorkChores for Vendors ────────── */}
      <section className="py-20 md:py-28 px-6 bg-surface">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Vendor management without the overhead
            </h2>
            <p className="mt-4 text-muted text-lg">
              Enterprise vendor platforms are built for enterprises. This one is
              built for teams that actually manage vendors day to day.
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="rounded-xl border border-border bg-white overflow-hidden shadow-lg shadow-gray-200/40">
              <div className="grid grid-cols-2">
                <div className="px-3 sm:px-6 py-3 bg-accent text-white text-xs sm:text-sm font-semibold">
                  WorkChores
                </div>
                <div className="px-3 sm:px-6 py-3 bg-gray-100 text-muted text-xs sm:text-sm font-semibold">
                  Spreadsheets &amp; Legacy Tools
                </div>
              </div>
              <div className="divide-y divide-border">
                {comparisons.map((c, i) => (
                  <div key={i} className="grid grid-cols-2">
                    <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" />
                      <span className="text-xs sm:text-sm text-foreground">
                        {c.ours}
                      </span>
                    </div>
                    <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 bg-gray-50/50">
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 shrink-0" />
                      <span className="text-xs sm:text-sm text-muted">
                        {c.theirs}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ────────── Final CTA ────────── */}
      <section className="py-20 md:py-28 px-6 bg-foreground">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Stop chasing vendors. Start managing them.
            </h2>
            <p className="mt-4 text-gray-400 text-lg">
              Centralize your vendor directory, automate compliance tracking, and
              never miss a contract renewal again.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-foreground bg-white hover:bg-gray-100 rounded-lg transition-colors"
              >
                Start Free &mdash; No Credit Card
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/app"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                See it in action
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
