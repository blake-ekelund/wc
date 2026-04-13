"use client";

import {
  ArrowRight,
  Play,
  Users,
  CalendarClock,
  CheckSquare,
  Filter,
  GitBranch,
  Link2,
  Check,
  X,
  Zap,
  ClipboardList,
  LayoutList,
} from "lucide-react";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/animated";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ───────────────────── Data ───────────────────── */

const features = [
  {
    id: "linked",
    icon: Link2,
    title: "Linked to CRM & Vendors",
    subtitle: "Tasks in context",
    description:
      "Tasks aren't isolated — they're connected to contacts, deals, and vendors. Open a contact and see every task tied to that relationship. Create a task from a vendor page and it shows up in your unified task list.",
  },
  {
    id: "assign",
    icon: Users,
    title: "Team Assignment",
    subtitle: "Clear ownership",
    description:
      "Assign tasks to any team member. They see it in their filtered task list. No confusion about who owns what — and managers can filter by owner to see the full picture.",
  },
  {
    id: "priority",
    icon: CalendarClock,
    title: "Due Dates & Priorities",
    subtitle: "Never miss a deadline",
    description:
      "Set high, medium, or low priority. Set a due date. Overdue tasks surface automatically. Sort and filter to focus on what matters most right now.",
  },
  {
    id: "filter",
    icon: Filter,
    title: "Filter by Everything",
    subtitle: "Find what matters fast",
    description:
      "Filter tasks by status (open/completed), priority, owner, or source (CRM, vendors, or standalone). Two clicks to find exactly what you need across your whole operation.",
  },
  {
    id: "complete",
    icon: CheckSquare,
    title: "One-Click Completion",
    subtitle: "Full audit trail",
    description:
      "Click to mark done. See what's completed, when it was completed, and who did it. Toggle between active and completed views to track progress over time.",
  },
  {
    id: "sources",
    icon: GitBranch,
    title: "Multi-Source Tasks",
    subtitle: "One unified list",
    description:
      "Tasks can originate from CRM deals, vendor follow-ups, or be created standalone. They all appear in one unified task list — no switching between apps.",
  },
];

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Create a task",
    description: "From the task list, a contact page, or a vendor page. Set title, owner, priority, and due date.",
  },
  {
    icon: LayoutList,
    step: "02",
    title: "Track progress",
    description: "Filter by status, priority, or owner. See what's overdue. Click to complete. Full audit trail.",
  },
  {
    icon: Zap,
    step: "03",
    title: "Stay accountable",
    description: "Everyone sees their own tasks. Managers see the whole team. No standups needed to know who's behind.",
  },
];

const comparisons = [
  { ours: "Tasks linked to contacts and vendors", theirs: "Tasks in a separate app with no context" },
  { ours: "One task list across CRM + vendors + standalone", theirs: "Different to-do lists in different tools" },
  { ours: "Filter by owner, priority, status, or source", theirs: "Manual sorting in spreadsheets" },
  { ours: "Assign to teammates with one click", theirs: "Email someone and hope they remember" },
  { ours: "Automatic overdue tracking", theirs: "Calendar reminders you forget to set" },
  { ours: "Full completion audit trail", theirs: "No record of who did what or when" },
  { ours: "Included free — no add-on cost", theirs: "Project management tools start at $10+/user/mo" },
];

/* ───────────────────── Component ───────────────────── */

export default function TaskTrackerContent() {
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
      <section className="pt-6 pb-12 md:pt-10 md:pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-medium mb-6">
                Included with every WorkChores seat
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-[1.15] tracking-tight text-foreground">
                One task list across
                <br />
                your entire
                <br />
                <span className="text-violet-600">operation.</span>
              </h1>
            </FadeIn>
            <FadeIn delay={0.2}>
              <p className="mt-5 text-lg text-muted leading-relaxed max-w-lg">
                Tasks that live alongside your contacts and vendors — not in a separate
                app. Assign work, set deadlines, and see what&apos;s overdue across your
                whole team without another login.
              </p>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors shadow-lg shadow-violet-600/20"
                >
                  Start Free
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/demo"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-foreground bg-surface hover:bg-gray-100 border border-border rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Try the Demo
                </a>
              </div>
              <p className="mt-3 text-xs text-muted">
                Included with every seat. Set up in under a minute.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ────────── Features (tabs) ────────── */}
      <section id="features" ref={sectionRef} className="py-20 md:py-28 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Task management built for ops. Not project managers.
            </h2>
            <p className="mt-4 text-muted text-lg">
              No Gantt charts. No sprint planning. Just the task features operations teams actually need.
            </p>
          </FadeIn>

          {/* Tabs + detail */}
          <div className="grid lg:grid-cols-[280px_1fr] gap-8">
            {/* Tab list */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 -mx-6 px-6 lg:mx-0 lg:px-0">
              {features.map((f, i) => {
                const isActive = i === activeFeature;
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveFeature(i)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left whitespace-nowrap lg:whitespace-normal shrink-0 transition-all duration-200 ${
                      isActive
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
                        : "bg-white border border-border text-foreground hover:border-violet-200 hover:bg-violet-50/30"
                    }`}
                  >
                    <f.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-violet-500"}`} />
                    <span className="text-sm font-medium">{f.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            <div className="bg-white rounded-2xl border border-border p-8 md:p-10 min-h-[280px] flex items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={features[activeFeature].id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">{features[activeFeature].subtitle}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">{features[activeFeature].title}</h3>
                  <p className="text-sm text-muted leading-relaxed max-w-lg">{features[activeFeature].description}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ────────── How it works ────────── */}
      <section className="py-20 md:py-28 px-6 bg-surface">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">How it works</h2>
            <p className="mt-3 text-muted">Three steps. No training required.</p>
          </FadeIn>
          <FadeInStagger className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <FadeInItem key={step.step}>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 mb-4">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-2">{step.step}</div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{step.description}</p>
                </div>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </div>
      </section>

      {/* ────────── Comparison ────────── */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              WorkChores vs. the old way
            </h2>
          </FadeIn>
          <FadeIn>
            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="grid grid-cols-2 bg-surface border-b border-border">
                <div className="px-5 py-3 text-xs font-semibold text-violet-600 uppercase tracking-wider">WorkChores</div>
                <div className="px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Without WorkChores</div>
              </div>
              {comparisons.map((row, i) => (
                <div key={i} className="grid grid-cols-2 border-b border-border last:border-0">
                  <div className="px-5 py-3 flex items-start gap-2 text-sm text-foreground bg-white">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {row.ours}
                  </div>
                  <div className="px-5 py-3 flex items-start gap-2 text-sm text-muted bg-gray-50/50">
                    <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    {row.theirs}
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ────────── Final CTA ────────── */}
      <section className="py-20 md:py-28 px-6 bg-foreground">
        <div className="max-w-2xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Stop losing tasks between tools.
            </h2>
            <p className="mt-4 text-gray-400 text-lg">
              Sign up in 60 seconds. Create your first task. See everything your team needs to do in one place.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="/signup" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-foreground bg-white hover:bg-gray-100 rounded-lg transition-colors">
                Sign Up Free <ArrowRight className="w-4 h-4" />
              </a>
              <a href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors">
                See Pricing
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-500">Included free with every WorkChores seat. No add-on cost.</p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
