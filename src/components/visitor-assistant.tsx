"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Search, ArrowRight, ChevronDown, ChevronRight, Send, ExternalLink, MessageSquare, Zap, HelpCircle } from "lucide-react";
import Link from "next/link";
import { trackEvent } from "@/lib/track-event";

// ============================================================
// KNOWLEDGE BASE
// ============================================================

interface KBEntry {
  q: string;
  a: string;
  keywords: string[];
  link?: { label: string; href: string };
  category: string;
}

const knowledgeBase: KBEntry[] = [
  // PRICING
  { q: "What does WorkChores cost?", a: "Free to start. $9/seat/month for Business. Every seat gets full access to every feature and every plugin — past, present, and future. No feature gating.", keywords: ["cost", "price", "pricing", "how much", "pay", "money", "expensive", "cheap", "affordable"], link: { label: "See pricing", href: "/pricing" }, category: "Pricing" },
  { q: "Is there a free plan?", a: "Yes! The Starter plan is free forever with all features and all plugins included. The only limits are 100 contacts and 1,000 actions per month.", keywords: ["free", "starter", "no cost", "trial", "try"], link: { label: "Sign up free", href: "/signup" }, category: "Pricing" },
  { q: "What's included in the Business plan?", a: "Everything. All features, all plugins, up to 50,000 contacts, 500,000 actions/month, unlimited users, and priority support. $9/seat/month.", keywords: ["business", "plan", "paid", "premium", "upgrade", "included"], link: { label: "See pricing", href: "/pricing" }, category: "Pricing" },
  { q: "Can I cancel anytime?", a: "Yes. No contracts, no cancellation fees. Downgrade to the free plan whenever you want and keep your data.", keywords: ["cancel", "quit", "stop", "contract", "commitment", "lock"], category: "Pricing" },
  { q: "Do you charge per contact?", a: "No. We charge per seat (user), not per contact. Every seat gets access to everything for $9/month.", keywords: ["per contact", "charge", "contact limit", "seat"], category: "Pricing" },
  { q: "What counts as an action?", a: "Actions are meaningful operations: creating/editing contacts, logging touchpoints, creating tasks, sending emails, importing, or exporting. Browsing, searching, and viewing are always free and unlimited.", keywords: ["action", "actions", "limit", "cap", "usage", "count"], link: { label: "See pricing details", href: "/pricing" }, category: "Pricing" },

  // FEATURES
  { q: "What is WorkChores?", a: "WorkChores is an operations platform for small teams. It includes CRM, vendor management, task tracking, and more. Think of it as Salesforce simplicity meets spreadsheet ease, built for teams of 1-25.", keywords: ["what is", "workchores", "about", "overview", "platform", "product"], link: { label: "Learn more", href: "/about" }, category: "Features" },
  { q: "What CRM features do you have?", a: "Contact management with custom fields, visual drag-and-drop pipeline, touchpoint logging (calls, emails, meetings), task management, calendar view, email integration, reports, and smart recommendations.", keywords: ["crm", "features", "contact", "pipeline", "sales", "deals"], link: { label: "See CRM features", href: "/crm" }, category: "Features" },
  { q: "Do you have email integration?", a: "Yes! Connect your Gmail account on the Business plan to send emails directly from WorkChores, use email templates, and track conversations. Each email is sent individually.", keywords: ["email", "gmail", "integration", "send", "connect", "inbox"], category: "Features" },
  { q: "Can I import my contacts?", a: "Yes. Import contacts from CSV or Excel files with our 4-step import wizard. Map your columns to WorkChores fields and import in bulk.", keywords: ["import", "csv", "excel", "upload", "migrate", "transfer", "spreadsheet"], category: "Features" },
  { q: "What industries do you support?", a: "We have 6 pre-built templates: B2B Sales, SaaS, Real Estate, Recruiting, Consulting, and Home Services. Each comes with custom pipeline stages, tracking fields, and sample data. Pick one during setup.", keywords: ["industry", "template", "real estate", "saas", "recruiting", "consulting", "b2b", "home service"], category: "Features" },
  { q: "Do you have a mobile app?", a: "WorkChores is web-based and fully responsive. It works great on mobile browsers. No app download needed.", keywords: ["mobile", "app", "phone", "ios", "android", "responsive"], category: "Features" },
  { q: "What is vendor management?", a: "Track your vendors, contracts, compliance documents, tax records (W9/1099), payment schedules, and contact information. Includes a vendor portal where vendors can submit documents directly.", keywords: ["vendor", "supplier", "contract", "compliance", "w9", "1099"], link: { label: "See vendor management", href: "/vendor-management" }, category: "Features" },
  { q: "Do you have task tracking?", a: "Yes. Create tasks with priorities, due dates, and assignees. Tasks can be linked to contacts or vendors. Filter by status, priority, owner, or source.", keywords: ["task", "todo", "assign", "due date", "priority", "checklist"], link: { label: "See task tracker", href: "/task-tracker" }, category: "Features" },
  { q: "Do you have reports or analytics?", a: "Yes. The dashboard shows 20+ KPI metrics including pipeline value, conversion rates, activity trends, and task completion. Reports view shows detailed breakdowns with charts.", keywords: ["report", "analytics", "dashboard", "metrics", "kpi", "chart", "data"], category: "Features" },

  // GETTING STARTED
  { q: "How do I get started?", a: "Sign up for free, pick your industry, name your workspace, and you're ready in 60 seconds. No credit card needed.", keywords: ["get started", "start", "begin", "sign up", "create account", "register"], link: { label: "Sign up free", href: "/signup" }, category: "Getting Started" },
  { q: "How long does setup take?", a: "60 seconds. Pick your industry template, name your company, and you have a fully configured CRM with pipeline stages, sample data, and tracking fields.", keywords: ["setup", "how long", "time", "quick", "fast", "60 seconds", "onboarding"], category: "Getting Started" },
  { q: "Do I need training?", a: "No. WorkChores is designed to work like a spreadsheet. Click any field to edit, changes auto-save. No manual, no training videos needed.", keywords: ["training", "learn", "tutorial", "manual", "documentation", "help", "complicated", "hard"], link: { label: "Read the docs", href: "/docs" }, category: "Getting Started" },
  { q: "Can I try before signing up?", a: "Yes! We have a live interactive demo with sample data. No signup required. Try the full CRM experience right now.", keywords: ["try", "demo", "test", "preview", "sample", "before"], link: { label: "Try the demo", href: "/demo" }, category: "Getting Started" },
  { q: "How do I invite my team?", a: "Go to Settings > Team Members and invite by email. You can set roles (Admin, Manager, Member) to control what each person can see and do.", keywords: ["invite", "team", "add user", "member", "collaborate", "share"], category: "Getting Started" },

  // SECURITY & DATA
  { q: "Is my data secure?", a: "Yes. Built on enterprise-grade infrastructure (Supabase/PostgreSQL). Row-level security, encrypted connections, HTTPS everywhere, and security headers (CSP, HSTS, X-Frame-Options).", keywords: ["secure", "security", "safe", "encryption", "protect", "hack"], link: { label: "See privacy policy", href: "/privacy" }, category: "Security" },
  { q: "Do you sell my data?", a: "Never. We will never sell, rent, or share your personal information or business data. Your contacts and deals belong to you.", keywords: ["sell data", "privacy", "share data", "third party"], link: { label: "Privacy policy", href: "/privacy" }, category: "Security" },
  { q: "Can I export my data?", a: "Yes. Export your contacts, tasks, and touchpoints to CSV or Excel anytime. Your data is always yours.", keywords: ["export", "download", "backup", "my data", "leave"], category: "Security" },
  { q: "Where is data stored?", a: "Your data is stored on US-based servers via Supabase (built on AWS). All connections are encrypted.", keywords: ["where", "stored", "server", "location", "hosting", "aws", "cloud"], category: "Security" },

  // COMPARISONS
  { q: "How is WorkChores different from HubSpot?", a: "HubSpot starts free but gets expensive fast ($800+/mo for basic features). WorkChores is $9/seat/month with no surprises. Setup takes 60 seconds vs weeks. Built for small teams, not enterprises.", keywords: ["hubspot", "vs", "compare", "comparison", "alternative", "better than", "switch"], link: { label: "Read the comparison", href: "/blog/why-small-teams-dont-need-hubspot" }, category: "Comparisons" },
  { q: "How is it different from Salesforce?", a: "Salesforce is built for enterprises with hundreds of users. WorkChores is built for teams of 1-25. No consultants needed, no 30-day onboarding. Pick your industry and start in 60 seconds.", keywords: ["salesforce", "enterprise", "complex", "big", "complicated"], category: "Comparisons" },
  { q: "Why not just use a spreadsheet?", a: "Spreadsheets break when your contact list grows. You lose pipeline views, activity history, team collaboration, and follow-up reminders. WorkChores feels like a spreadsheet but gives you the tools spreadsheets can't.", keywords: ["spreadsheet", "excel", "google sheets", "why not", "simple"], link: { label: "Read more", href: "/blog/contact-management-beyond-spreadsheets" }, category: "Comparisons" },
];

const categories = [...new Set(knowledgeBase.map((e) => e.category))];

function matchQuery(query: string): KBEntry | null {
  if (!query.trim()) return null;
  const words = query.toLowerCase().split(/\s+/);
  let bestMatch: KBEntry | null = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    let score = 0;
    for (const word of words) {
      for (const kw of entry.keywords) {
        if (kw.includes(word) || word.includes(kw)) {
          score += Math.max(word.length, kw.length);
        }
      }
      // Also match against the question text
      if (entry.q.toLowerCase().includes(word) && word.length > 2) {
        score += word.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  return bestScore >= 4 ? bestMatch : null;
}

// ============================================================
// COMPONENT
// ============================================================

type Tab = "ask" | "actions" | "faq";

interface AiAnswer {
  answer: string;
  sources: { title: string; url: string }[];
}

export default function VisitorAssistant() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("ask");
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<AiAnswer | null>(null);
  const [thinking, setThinking] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && tab === "ask") inputRef.current?.focus();
  }, [open, tab]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || thinking) return;

    setThinking(true);
    setAnswer(null);
    trackEvent("visitor_assistant.question", { query });

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query.trim(), sessionId }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnswer({ answer: data.answer, sources: data.sources || [] });
        if (data.sessionId) setSessionId(data.sessionId);
      } else {
        setAnswer({ answer: "Sorry, I couldn't process that. Try rephrasing or reach out to support@workchores.com.", sources: [] });
      }
    } catch {
      setAnswer({ answer: "Something went wrong. Please try again.", sources: [] });
    }
    setThinking(false);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "visitor-assistant" }),
      });
      setEmailSent(true);
      trackEvent("visitor_assistant.email_capture", { email: email.trim() });
    } catch { /* ignore */ }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent hover:bg-accent-dark text-white shadow-lg shadow-accent/30 flex items-center justify-center transition-all hover:scale-105"
          aria-label="Open assistant"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-full sm:w-[400px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden font-[family-name:var(--font-geist-sans)]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-accent/5 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">WorkChores</div>
                <div className="text-[10px] text-muted">How can we help?</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-gray-100" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {([
              { id: "ask" as Tab, label: "Ask", icon: Search },
              { id: "actions" as Tab, label: "Quick Actions", icon: Zap },
              { id: "faq" as Tab, label: "FAQ", icon: HelpCircle },
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setAnswer(null); setQuery(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                  tab === t.id ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* ASK TAB */}
            {tab === "ask" && (
              <div className="p-4 space-y-4">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setAnswer(null); }}
                    placeholder="Ask about features, pricing, setup..."
                    className="w-full pl-4 pr-10 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-muted bg-gray-50"
                    disabled={thinking}
                  />
                  <button type="submit" disabled={thinking} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors disabled:opacity-50" aria-label="Ask">
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Suggested queries */}
                {!answer && !thinking && !query && (
                  <div className="space-y-2">
                    <div className="text-[10px] text-muted uppercase tracking-wider font-semibold">Popular questions</div>
                    {["What does WorkChores cost?", "Can I try before signing up?", "What industries do you support?", "How is it different from HubSpot?"].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setQuery(q); setTimeout(() => { const form = inputRef.current?.closest("form"); if (form) form.requestSubmit(); }, 50); }}
                        className="w-full text-left px-3 py-2.5 text-xs text-foreground bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between group"
                      >
                        <span>{q}</span>
                        <ChevronRight className="w-3 h-3 text-muted group-hover:text-accent transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Thinking */}
                {thinking && (
                  <div className="flex items-center gap-3 py-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-muted">Thinking...</span>
                  </div>
                )}

                {/* Answer */}
                {answer && (
                  <div className="space-y-3">
                    <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
                      <p className="text-sm text-foreground leading-relaxed">{answer.answer}</p>
                    </div>
                    {answer.sources.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {answer.sources.map((s) => (
                          <Link key={s.url} href={s.url} className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-accent bg-accent/5 border border-accent/20 rounded-lg hover:bg-accent/10 transition-colors">
                            <ExternalLink className="w-2.5 h-2.5" /> {s.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* QUICK ACTIONS TAB */}
            {tab === "actions" && (
              <div className="p-4 space-y-3">
                <div className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-1">Jump to</div>
                {[
                  { label: "Try the Live Demo", desc: "Explore the CRM with sample data. No signup.", href: "/demo", color: "bg-blue-50 text-blue-700 border-blue-200", icon: "cursor-pointer" },
                  { label: "See Pricing", desc: "Free starter plan. $9/seat/month for Business.", href: "/pricing", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "dollar" },
                  { label: "Sign Up Free", desc: "Create your workspace in 60 seconds.", href: "/signup", color: "bg-purple-50 text-purple-700 border-purple-200", icon: "user" },
                  { label: "Contact Us", desc: "Questions? We respond within 24 hours.", href: "/contact", color: "bg-amber-50 text-amber-700 border-amber-200", icon: "mail" },
                  { label: "Read the Docs", desc: "Full documentation for every feature.", href: "/docs", color: "bg-gray-50 text-gray-700 border-gray-200", icon: "book" },
                  { label: "Read the Blog", desc: "CRM tips and insights for small teams.", href: "/blog", color: "bg-rose-50 text-rose-700 border-rose-200", icon: "article" },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    onClick={() => trackEvent("visitor_assistant.quick_action", { action: action.label })}
                    className={`block px-4 py-3 rounded-xl border ${action.color} hover:shadow-sm transition-all group`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">{action.label}</div>
                        <div className="text-[11px] opacity-70 mt-0.5">{action.desc}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* FAQ TAB */}
            {tab === "faq" && (
              <div className="p-4 space-y-4">
                {categories.map((cat) => {
                  const entries = knowledgeBase.filter((e) => e.category === cat);
                  return (
                    <div key={cat}>
                      <div className="text-[10px] text-muted uppercase tracking-wider font-semibold mb-2">{cat}</div>
                      <div className="space-y-1">
                        {entries.map((entry) => {
                          const isExpanded = expandedFaq === entry.q;
                          return (
                            <div key={entry.q} className="border border-gray-100 rounded-lg overflow-hidden">
                              <button
                                onClick={() => setExpandedFaq(isExpanded ? null : entry.q)}
                                className="w-full text-left px-3 py-2.5 text-xs font-medium text-foreground hover:bg-gray-50 transition-colors flex items-center justify-between"
                              >
                                <span>{entry.q}</span>
                                <ChevronDown className={`w-3 h-3 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </button>
                              {isExpanded && (
                                <div className="px-3 pb-3 space-y-2">
                                  <p className="text-xs text-muted leading-relaxed">{entry.a}</p>
                                  {entry.link && (
                                    <Link href={entry.link.href} className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-dark">
                                      {entry.link.label} <ExternalLink className="w-3 h-3" />
                                    </Link>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-[10px] text-muted">Powered by WorkChores</span>
            <Link href="/contact" className="inline-flex items-center gap-1 text-[10px] text-muted hover:text-accent transition-colors">
              <MessageSquare className="w-3 h-3" /> Talk to a human
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
