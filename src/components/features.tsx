"use client";

import { useState, useEffect, useRef } from "react";
import {
  GitBranch,
  Users,
  CheckSquare,
  Calendar,
  Search,
  LayoutDashboard,
  ChevronRight,
  ArrowRight,
  Eye,
  Mail,
  Upload,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const features = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Customizable Dashboard",
    subtitle: "20+ metrics, your way",
    description:
      "Pick from 20+ KPI metrics to build your perfect dashboard. Start with smart defaults for your industry, then customize — pipeline value, win rate, activities, and more. Real-time data, 30-day trend comparisons.",
    image: "/features/dashboard.jpg",
  },
  {
    id: "contacts",
    icon: Users,
    title: "Contact Intelligence",
    subtitle: "Full relationship context",
    description:
      "Rich profiles with custom fields, file attachments, related contacts at the same company, and a color-coded last-contacted indicator. Automatic duplicate detection catches copies before they happen.",
    image: "/features/contact-detail-v2.jpg",
  },
  {
    id: "pipeline",
    icon: GitBranch,
    title: "Visual Pipeline",
    subtitle: "Drag-and-drop deal flow",
    description:
      "Pre-built pipelines for 6 industries or build your own. See deal values by stage, filter by owner, and track stage changes with timestamps. Bulk actions let you move, reassign, or archive contacts in seconds.",
    image: "/features/pipeline.jpg",
  },
  {
    id: "email",
    icon: Mail,
    title: "Gmail Integration",
    subtitle: "Send emails without leaving the CRM",
    description:
      "Connect your Gmail and send emails directly from any contact page. Choose from reusable templates with auto-filled variables, add your signature, or compose freeform. Bulk email your pipeline with one click.",
    image: "/features/email-v2.jpg",
  },
  {
    id: "tasks",
    icon: CheckSquare,
    title: "Tasks & Calendar",
    subtitle: "Never miss a follow-up",
    description:
      "Create tasks with notes, file attachments, due dates, priorities, and owners. See everything on a monthly calendar — or swipe through days on mobile. Smart alerts flag overdue and high-priority items.",
    image: "/features/calendar.jpg",
  },
  {
    id: "data",
    icon: Upload,
    title: "Import & Export",
    subtitle: "Your data, your way",
    description:
      "Import contacts from any spreadsheet with our guided wizard — we generate a template with dropdown validations for your pipeline stages. Export contacts, tasks, and activity as Excel or CSV anytime.",
    image: "/features/import.jpg",
  },
  {
    id: "roles",
    icon: Shield,
    title: "Roles & Permissions",
    subtitle: "Right data, right people",
    description:
      "Three role levels — Admin, Manager, Member — each seeing exactly the data they should. Set reporting hierarchies, manage your team, and configure workspace settings from a clean admin panel.",
    image: "/features/roles.jpg",
  },
  {
    id: "search",
    icon: Search,
    title: "Universal Search",
    subtitle: "Find anything instantly",
    description:
      "Search across contacts, tasks, emails, phone numbers, tags, stages, and more. Phone search normalizes formats automatically. Results show contextual subtitles — the matched field surfaces first.",
    image: "/features/search.jpg",
  },
];

export default function Features() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const featureRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Auto-cycle through features
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible, activeFeature]);

  // Intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="py-20 md:py-28 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <p className="mt-4 text-muted text-lg">
            Contacts, pipeline, email, tasks, calendar, import/export, and role-based
            permissions — all in one clean interface. No add-ons, no hidden fees.
          </p>
        </motion.div>

        {/* Mobile: horizontal pill tabs + screenshot */}
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

          {/* Screenshot */}
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
                    width={1200}
                    height={800}
                    className="w-full h-auto"
                    priority={activeFeature === 0}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-dark transition-colors"
            >
              Try it yourself in the live demo
              <ArrowRight className="w-4 h-4" />
            </Link>
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
                  ref={(el) => { featureRefs.current[i] = el; }}
                  onClick={() => setActiveFeature(i)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 group ${
                    isActive
                      ? "border-accent bg-accent-light/50 shadow-lg shadow-accent/10"
                      : "border-transparent bg-white hover:border-gray-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive ? "bg-accent text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                    }`}>
                      <f.icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-semibold transition-colors ${isActive ? "text-accent" : "text-foreground"}`}>
                          {f.title}
                        </h3>
                        <ChevronRight className={`w-4 h-4 transition-all ${isActive ? "text-accent translate-x-0 opacity-100" : "text-gray-300 -translate-x-1 opacity-0 group-hover:opacity-50 group-hover:translate-x-0"}`} />
                      </div>
                      <p className={`text-xs mt-0.5 transition-colors ${isActive ? "text-accent/70" : "text-muted"}`}>
                        {f.subtitle}
                      </p>
                      {isActive && (
                        <motion.div className="mt-2.5 h-0.5 bg-accent/20 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 5, ease: "linear" }}
                            key={activeFeature}
                            className="h-full bg-accent rounded-full"
                          />
                        </motion.div>
                      )}
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

          {/* Right: Real screenshot */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:sticky lg:top-24"
          >
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 p-1.5 shadow-xl shadow-gray-200/30 overflow-hidden">
              {/* Mock browser chrome */}
              <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-t-xl border-b border-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-gray-50 rounded-md text-[10px] text-gray-400 font-medium">
                    app.workchores.com
                  </div>
                </div>
                <div className="w-12" />
              </div>
              {/* Screenshot */}
              <div className="rounded-b-xl overflow-hidden bg-white">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Image
                      src={features[activeFeature].image}
                      alt={features[activeFeature].title}
                      width={1200}
                      height={800}
                      className="w-full h-auto"
                      priority={activeFeature === 0}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-4 text-center"
            >
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-dark transition-colors"
              >
                Try it yourself in the live demo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
