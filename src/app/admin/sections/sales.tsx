"use client";

import { useState } from "react";
import { ClipboardCopy } from "lucide-react";

export default function SalesSection() {
  const [salesIndustry, setSalesIndustry] = useState("general");
  const salesData: Record<string, { label: string; color: string; bg: string; oneLiner: string; pitch: string; usps: { title: string; desc: string }[]; objections: { q: string; a: string }[]; script: { tag: string; tagColor: string; tagBg: string; text: string }[]; targets: string[] }> = {
  general: {
    label: "General",
    color: "text-gray-700",
    bg: "bg-gray-100",
    oneLiner: "WorkChores is a dead-simple CRM that sets up in 60 seconds, customized to your industry — no training required.",
    pitch: "Most CRMs are built for enterprises and take weeks to set up. WorkChores is built for small teams who just need to track deals, follow up with contacts, and close more business. Pick your industry, and you get a fully customized CRM with pipeline stages, tracking fields, and sample data in under a minute. No spreadsheets, no bloated software — just the tools you actually use.",
    usps: [
      { title: "60-Second Setup", desc: "Pick your industry → get a fully configured CRM instantly. No complex onboarding." },
      { title: "Industry Templates", desc: "Pre-built for B2B Sales, SaaS, Real Estate, Recruiting, Consulting, and Home Services." },
      { title: "No Training Needed", desc: "Click any field to edit. Auto-saves. If you can use a spreadsheet, you can use WorkChores." },
      { title: "Built for Small Teams", desc: "Not another Salesforce. No 50-page setup guide. Just the features you need." },
      { title: "Affordable", desc: "Free tier available. Pro plans that don't break the bank. No per-seat surprises." },
      { title: "Pipeline + Contacts + Tasks", desc: "Everything in one place. Track deals, log calls, assign tasks, attach files." },
    ],
    objections: [
      { q: "\"We already use spreadsheets.\"", a: "That's exactly who we built this for. WorkChores feels like a spreadsheet but gives you pipeline views, activity tracking, and auto-saves — things spreadsheets can't do." },
      { q: "\"We tried a CRM before and it was too complicated.\"", a: "WorkChores sets up in 60 seconds. No training. No manual. Just click and edit — it works like you'd expect." },
      { q: "\"Is it secure?\"", a: "Built on enterprise-grade infrastructure (Supabase/Postgres). Row-level security, encrypted connections, SOC 2-ready architecture." },
      { q: "\"Can we customize it?\"", a: "Absolutely. Custom pipeline stages, custom tracking fields, tags, addresses, notes — all configurable in Settings after setup." },
    ],
    script: [
      { tag: "Opening", tagColor: "text-blue-700", tagBg: "bg-blue-100", text: "\"Hey [Name], quick question — how are you currently tracking your leads and deals? Spreadsheets? Sticky notes? An old CRM you hate?\"" },
      { tag: "Pain", tagColor: "text-purple-700", tagBg: "bg-purple-100", text: "\"Most small teams I talk to either have no system — so deals fall through the cracks — or they tried Salesforce/HubSpot and got overwhelmed. Sound familiar?\"" },
      { tag: "Solution", tagColor: "text-emerald-700", tagBg: "bg-emerald-100", text: "\"WorkChores is a CRM built specifically for teams like yours. Pick your industry, and in 60 seconds you have a fully set up CRM. No training, no setup calls, no 30-day onboarding.\"" },
      { tag: "Demo", tagColor: "text-amber-700", tagBg: "bg-amber-100", text: "\"Want to see it? Go to workchores.com right now — there's a live demo you can play with. No signup needed.\"" },
      { tag: "Close", tagColor: "text-rose-700", tagBg: "bg-rose-100", text: "\"The free plan gets you started. When you're ready, Pro is affordable — no per-seat fees. Want to give it a shot?\"" },
    ],
    targets: ["Solo entrepreneurs", "Small sales teams (2-15)", "Agencies", "Anyone tired of spreadsheets"],
  },
  b2b: {
    label: "B2B Sales",
    color: "text-blue-700",
    bg: "bg-blue-100",
    oneLiner: "WorkChores gives B2B sales teams a CRM that's set up in 60 seconds with Lead → Qualified → Proposal → Negotiation → Closed pipeline — ready to sell today.",
    pitch: "Your sales reps shouldn't spend hours configuring a CRM. WorkChores comes pre-built for B2B sales with industry, employee count, and lead source tracking. Pipeline stages are ready out of the box. Click any field to edit, auto-saves on blur. Your reps will actually use this one.",
    usps: [
      { title: "B2B Pipeline Ready", desc: "Lead → Qualified → Proposal → Negotiation → Closed Won/Lost. Pre-configured and customizable." },
      { title: "Track What Matters", desc: "Industry, employee count, lead source — all built in. Add custom fields in seconds." },
      { title: "Deal Value Tracking", desc: "See your total pipeline value, filter by stage, sort by deal size. Real visibility into revenue." },
      { title: "Activity Logging", desc: "Log calls, emails, meetings. Never lose track of where a deal stands." },
    ],
    objections: [
      { q: "\"We need Salesforce-level features.\"", a: "Do you though? Most B2B teams use 10% of Salesforce. WorkChores gives you the 10% that actually closes deals — pipeline, contacts, tasks, activity tracking." },
      { q: "\"Our sales process is complex.\"", a: "You can customize every stage, add unlimited custom fields, and configure it exactly to your workflow. But it starts simple so your team actually adopts it." },
      { q: "\"We need integrations.\"", a: "Email integration is built in. For everything else — we're building integrations based on customer requests. What do you need most?" },
    ],
    script: [
      { tag: "Opening", tagColor: "text-blue-700", tagBg: "bg-blue-100", text: "\"Hey [Name], I saw you're running a B2B sales team. Quick question — what are you using to track your pipeline right now?\"" },
      { tag: "Pain", tagColor: "text-purple-700", tagBg: "bg-purple-100", text: "\"Most B2B teams I talk to are either drowning in spreadsheets or paying $50/seat for a CRM their reps refuse to update. Which camp are you in?\"" },
      { tag: "Solution", tagColor: "text-emerald-700", tagBg: "bg-emerald-100", text: "\"WorkChores comes pre-configured for B2B sales — Lead, Qualified, Proposal, Negotiation, Closed. Industry tracking, lead source, deal values — all ready. Your reps can start logging deals in literally 60 seconds.\"" },
      { tag: "Demo", tagColor: "text-amber-700", tagBg: "bg-amber-100", text: "\"Go to workchores.com, pick B2B Sales, and you'll see a full working CRM with sample data. Play with it — no signup.\"" },
      { tag: "Close", tagColor: "text-rose-700", tagBg: "bg-rose-100", text: "\"Free plan for small teams. Pro when you're ready. No per-seat pricing games. Want to set it up for your team?\"" },
    ],
    targets: ["B2B sales teams", "Account executives", "SDR/BDR teams", "Sales managers", "Startups with outbound sales"],
  },
  saas: {
    label: "SaaS",
    color: "text-violet-700",
    bg: "bg-violet-100",
    oneLiner: "WorkChores helps SaaS companies track trials, demos, and MRR in a CRM that's configured for software sales in 60 seconds.",
    pitch: "SaaS sales isn't like traditional B2B. You need to track MRR, active users, plan types, and trial-to-paid conversions. WorkChores comes pre-built with Awareness → Interest → Demo → Trial → Negotiation → Won pipeline and SaaS-specific fields. No more hacking HubSpot to fit your model.",
    usps: [
      { title: "SaaS Pipeline", desc: "Awareness → Interest → Demo → Trial → Negotiation → Won. Built for the SaaS funnel." },
      { title: "MRR Tracking", desc: "Track monthly recurring revenue per deal. See your pipeline in actual MRR terms." },
      { title: "Trial & User Metrics", desc: "Active users, plan type, signup source — track the metrics that matter for SaaS." },
      { title: "Churn Visibility", desc: "Separate Churned stage so you can see and recover at-risk accounts." },
    ],
    objections: [
      { q: "\"We use HubSpot for marketing too.\"", a: "Keep HubSpot for marketing. Use WorkChores for sales pipeline — it's faster, simpler, and your reps will actually update it." },
      { q: "\"We need product analytics integration.\"", a: "WorkChores focuses on the sales side. Track MRR and active users here, keep Mixpanel/Amplitude for product. One source of truth for pipeline." },
    ],
    script: [
      { tag: "Opening", tagColor: "text-blue-700", tagBg: "bg-blue-100", text: "\"Hey [Name], how's your team tracking the trial-to-paid pipeline right now?\"" },
      { tag: "Pain", tagColor: "text-purple-700", tagBg: "bg-purple-100", text: "\"Most SaaS teams I talk to have their pipeline in a spreadsheet or a CRM that wasn't built for SaaS. They're tracking MRR manually. Sound familiar?\"" },
      { tag: "Solution", tagColor: "text-emerald-700", tagBg: "bg-emerald-100", text: "\"WorkChores is pre-configured for SaaS — trial, demo, MRR, active users, plan type. Your pipeline stages match how SaaS actually works. Set up in 60 seconds.\"" },
      { tag: "Demo", tagColor: "text-amber-700", tagBg: "bg-amber-100", text: "\"Go to workchores.com, pick SaaS, and play with it live. No signup needed.\"" },
      { tag: "Close", tagColor: "text-rose-700", tagBg: "bg-rose-100", text: "\"Free to start. Pro when your pipeline grows. What do you think?\"" },
    ],
    targets: ["SaaS founders", "Sales teams at startups", "Revenue ops", "Customer success teams doing expansion"],
  },
  realestate: {
    label: "Real Estate",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
    oneLiner: "WorkChores gives real estate agents a CRM with Inquiry → Showing → Offer → Under Contract → Closed pipeline and property tracking — set up in 60 seconds.",
    pitch: "Real estate agents need to track properties, client types, and showings — not enterprise sales metrics. WorkChores comes pre-built with property address, type, bedrooms, square footage, and pre-approval status. Your pipeline matches how real estate actually works. No more forcing a generic CRM to fit.",
    usps: [
      { title: "Real Estate Pipeline", desc: "Inquiry → Showing → Offer → Under Contract → Closed. Matches how you actually sell." },
      { title: "Property Tracking", desc: "Address, property type, bedrooms, square feet — all built into each contact/deal." },
      { title: "Client Type Filtering", desc: "Buyer vs. seller at a glance. Filter your pipeline by client type." },
      { title: "Pre-Approval Status", desc: "Know instantly which clients are pre-approved and ready to move." },
    ],
    objections: [
      { q: "\"I use my brokerage's CRM.\"", a: "Most brokerage CRMs are clunky and generic. WorkChores is built specifically for how agents work — and you own your data. If you switch brokerages, your contacts come with you." },
      { q: "\"I just need to track listings.\"", a: "WorkChores does that — plus tracks buyer leads, showing schedules, and follow-ups. It's your whole pipeline, not just listings." },
    ],
    script: [
      { tag: "Opening", tagColor: "text-blue-700", tagBg: "bg-blue-100", text: "\"Hey [Name], how are you keeping track of all your buyer and seller leads right now?\"" },
      { tag: "Pain", tagColor: "text-purple-700", tagBg: "bg-purple-100", text: "\"Most agents I talk to are juggling a phone, a notebook, and maybe a spreadsheet. Leads slip through the cracks. Sound about right?\"" },
      { tag: "Solution", tagColor: "text-emerald-700", tagBg: "bg-emerald-100", text: "\"WorkChores is a CRM built for real estate. Property details, showing pipeline, pre-approval tracking — all configured when you sign up. Takes 60 seconds.\"" },
      { tag: "Demo", tagColor: "text-amber-700", tagBg: "bg-amber-100", text: "\"Go to workchores.com, pick Real Estate, and see it with sample properties and leads. No signup.\"" },
      { tag: "Close", tagColor: "text-rose-700", tagBg: "bg-rose-100", text: "\"Free plan for solo agents. Pro for teams. Your data, your pipeline — take it wherever you go.\"" },
    ],
    targets: ["Solo real estate agents", "Small brokerages", "Real estate teams", "New agents building a book"],
  },
  recruiting: {
    label: "Recruiting",
    color: "text-amber-700",
    bg: "bg-amber-100",
    oneLiner: "WorkChores gives recruiters an ATS-style CRM with Applied → Screen → Interview → Offer → Hired pipeline and candidate tracking in 60 seconds.",
    pitch: "Recruiting is a pipeline business but most ATS tools are overbuilt and expensive. WorkChores gives you Applied → Phone Screen → Interview → Final Round → Offer → Hired stages, plus fields for position, experience, salary expectations, and notice period. Track candidates like deals.",
    usps: [
      { title: "Recruiting Pipeline", desc: "Applied → Phone Screen → Interview → Final Round → Offer → Hired. Track every candidate." },
      { title: "Candidate Fields", desc: "Position, years of experience, salary expectation, location preference, notice period — all built in." },
      { title: "Activity Logging", desc: "Log screening calls, interviews, and emails. Full candidate timeline at a glance." },
      { title: "Affordable ATS Alternative", desc: "No per-seat or per-job pricing. One simple plan for your whole recruiting pipeline." },
    ],
    objections: [
      { q: "\"We already have an ATS.\"", a: "Most ATS tools cost $300+/month and are designed for HR departments. WorkChores is for recruiters who want speed, not compliance features." },
      { q: "\"Can it post to job boards?\"", a: "WorkChores focuses on pipeline management — tracking candidates, not posting jobs. Use it alongside your job board to never lose track of a candidate." },
    ],
    script: [
      { tag: "Opening", tagColor: "text-blue-700", tagBg: "bg-blue-100", text: "\"Hey [Name], how are you tracking candidates through your pipeline right now?\"" },
      { tag: "Pain", tagColor: "text-purple-700", tagBg: "bg-purple-100", text: "\"Most recruiters I talk to are juggling candidates across spreadsheets, LinkedIn tabs, and email threads. Candidates fall through the cracks.\"" },
      { tag: "Solution", tagColor: "text-emerald-700", tagBg: "bg-emerald-100", text: "\"WorkChores is set up for recruiting — screening, interview, offer, hired stages. Candidate details like salary expectations and notice period are built in. 60 seconds to set up.\"" },
      { tag: "Demo", tagColor: "text-amber-700", tagBg: "bg-amber-100", text: "\"Go to workchores.com, pick Recruiting, and you'll see a working pipeline with sample candidates.\"" },
      { tag: "Close", tagColor: "text-rose-700", tagBg: "bg-rose-100", text: "\"Free to start. Fraction of the cost of any ATS. Give it a try?\"" },
    ],
    targets: ["Agency recruiters", "Internal talent teams", "Solo headhunters", "Staffing firms"],
  },
  consulting: {
    label: "Consulting",
    color: "text-rose-700",
    bg: "bg-rose-100",
    oneLiner: "WorkChores helps consultants track engagements from Discovery → Scoping → Proposal → SOW → Engaged with day rates and team sizing in 60 seconds.",
    pitch: "Consulting is relationship-driven. You need to track project types, engagement length, day rates, and team sizes — not generic deal values. WorkChores comes pre-built with Discovery → Scoping → Proposal → SOW Review → Engaged pipeline and all the fields consultants actually care about.",
    usps: [
      { title: "Consulting Pipeline", desc: "Discovery → Scoping → Proposal → SOW Review → Engaged. Matches how engagements actually flow." },
      { title: "Engagement Tracking", desc: "Project type, engagement length, day rate, team size — track the economics of every deal." },
      { title: "Relationship Timeline", desc: "Log every call, meeting, and proposal. Full history of every client relationship." },
      { title: "Simple & Professional", desc: "No bloated features. A clean CRM that reflects how boutique firms actually work." },
    ],
    objections: [
      { q: "\"We just use a spreadsheet.\"", a: "That works until you have 20+ prospects in different stages. WorkChores gives you that spreadsheet feel but with pipeline views, activity tracking, and auto-saves." },
      { q: "\"We need project management too.\"", a: "WorkChores handles the sales pipeline. For project delivery, pair it with whatever PM tool you use. One tool per job, done well." },
    ],
    script: [
      { tag: "Opening", tagColor: "text-blue-700", tagBg: "bg-blue-100", text: "\"Hey [Name], how are you currently managing your consulting pipeline — from initial conversation to signed SOW?\"" },
      { tag: "Pain", tagColor: "text-purple-700", tagBg: "bg-purple-100", text: "\"Most consultants I talk to either have no system or are using tools built for product sales. Engagement length, day rates, SOW tracking — none of that fits a generic CRM.\"" },
      { tag: "Solution", tagColor: "text-emerald-700", tagBg: "bg-emerald-100", text: "\"WorkChores is pre-configured for consulting. Discovery to engagement pipeline, day rates, team sizing, project types — all ready in 60 seconds.\"" },
      { tag: "Demo", tagColor: "text-amber-700", tagBg: "bg-amber-100", text: "\"Check out workchores.com — pick Consulting and play with it. Sample engagements and everything.\"" },
      { tag: "Close", tagColor: "text-rose-700", tagBg: "bg-rose-100", text: "\"Free for solo consultants. Pro for firms. Clean, fast, and built for how you work.\"" },
    ],
    targets: ["Solo consultants", "Boutique firms", "Management consultants", "Freelance advisors"],
  },
  services: {
    label: "Home Services",
    color: "text-cyan-700",
    bg: "bg-cyan-100",
    oneLiner: "WorkChores helps contractors track jobs from New Lead → Estimate → Scheduled → In Progress → Completed with job details and urgency tracking.",
    pitch: "Home service businesses need to track job addresses, service types, urgency levels, and estimated hours — not enterprise deal stages. WorkChores comes pre-built with a contractor's pipeline and all the fields you need to manage jobs from first call to completion.",
    usps: [
      { title: "Contractor Pipeline", desc: "New Lead → Estimate Sent → Scheduled → In Progress → Completed. Track every job." },
      { title: "Job Details Built In", desc: "Service type, job address, property type, urgency, estimated hours — all on every contact." },
      { title: "Never Miss a Follow-Up", desc: "Task reminders and activity tracking so no estimate goes unfollowed." },
      { title: "Mobile Friendly", desc: "Works on your phone. Update job status from the field. No app to install." },
    ],
    objections: [
      { q: "\"I use ServiceTitan/Jobber.\"", a: "Those are great for scheduling and invoicing. WorkChores handles the sales pipeline — lead tracking, estimates, and follow-ups before the job is booked." },
      { q: "\"I don't need a CRM, I get referrals.\"", a: "Referrals are great — but are you following up on all of them? WorkChores makes sure no lead slips through the cracks, even referrals." },
    ],
    script: [
      { tag: "Opening", tagColor: "text-blue-700", tagBg: "bg-blue-100", text: "\"Hey [Name], how are you keeping track of all your leads and estimates right now?\"" },
      { tag: "Pain", tagColor: "text-purple-700", tagBg: "bg-purple-100", text: "\"Most contractors I talk to have leads in their text messages, estimates in their head, and follow-ups that never happen. Money left on the table.\"" },
      { tag: "Solution", tagColor: "text-emerald-700", tagBg: "bg-emerald-100", text: "\"WorkChores tracks your jobs from first call to completion. Service type, address, urgency — all organized. Takes 60 seconds to set up for home services.\"" },
      { tag: "Demo", tagColor: "text-amber-700", tagBg: "bg-amber-100", text: "\"Go to workchores.com, pick Home Services, and see a working pipeline with sample jobs.\"" },
      { tag: "Close", tagColor: "text-rose-700", tagBg: "bg-rose-100", text: "\"Free plan. Works on your phone. Start tracking leads today instead of losing them.\"" },
    ],
    targets: ["Plumbers", "Electricians", "HVAC contractors", "Landscapers", "General contractors", "Cleaning services"],
  },
};

const ind = salesData[salesIndustry] || salesData.general;

return (
<div className="p-4 sm:p-6 lg:p-8 max-w-5xl space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-bold text-gray-900">Sales Hub</h2>
      <p className="text-xs text-gray-500 mt-0.5">Sales materials by industry. Click a tag to switch context.</p>
    </div>
    <button
      onClick={() => {
        const el = document.getElementById("sales-hub-content");
        if (el) navigator.clipboard.writeText(el.innerText);
      }}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
    >
      <ClipboardCopy className="w-3.5 h-3.5" /> Copy All
    </button>
  </div>

  {/* Industry Tags */}
  <div className="flex flex-wrap gap-2">
    {Object.entries(salesData).map(([key, val]) => (
      <button
        key={key}
        onClick={() => setSalesIndustry(key)}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          salesIndustry === key
            ? `${val.bg} ${val.color} ring-2 ring-offset-1 ring-current`
            : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
        }`}
      >
        {val.label}
      </button>
    ))}
  </div>

  <div id="sales-hub-content" className="space-y-4">
    {/* One-Liner */}
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">One-Liner</div>
      <p className="text-sm font-medium text-gray-900 leading-relaxed">{ind.oneLiner}</p>
    </div>

    {/* Elevator Pitch */}
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Elevator Pitch</div>
      <p className="text-sm text-gray-700 leading-relaxed">{ind.pitch}</p>
    </div>

    {/* USPs */}
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Unique Selling Points</div>
      </div>
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ind.usps.map((usp) => (
          <div key={usp.title} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
            <div className="text-xs font-semibold text-gray-900 mb-1">{usp.title}</div>
            <div className="text-[11px] text-gray-500 leading-relaxed">{usp.desc}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Target Customers */}
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Target Customers</div>
      <div className="flex flex-wrap gap-2">
        {ind.targets.map((t) => (
          <span key={t} className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${ind.bg} ${ind.color}`}>{t}</span>
        ))}
      </div>
    </div>

    {/* Objection Handlers */}
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Objection Handlers</div>
      </div>
      <div className="p-5 space-y-3">
        {ind.objections.map((obj) => (
          <div key={obj.q} className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
            <div className="text-xs font-semibold text-gray-900 mb-1">{obj.q}</div>
            <div className="text-[11px] text-gray-600 leading-relaxed">{obj.a}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Sales Script */}
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Sales Script</div>
        <button
          onClick={() => {
            const el = document.getElementById("script-content");
            if (el) navigator.clipboard.writeText(el.innerText);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium text-gray-400 hover:text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ClipboardCopy className="w-3 h-3" /> Copy Script
        </button>
      </div>
      <div id="script-content" className="p-5 space-y-4">
        {ind.script.map((s) => (
          <div key={s.tag}>
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full ${s.tagBg} ${s.tagColor} text-[10px] font-semibold uppercase tracking-wider mb-1.5`}>{s.tag}</div>
            <p className="text-sm text-gray-700 leading-relaxed">{s.text}</p>
          </div>
        ))}
        <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Tips</div>
          <ul className="space-y-1 text-[11px] text-gray-500">
            <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> Always offer the live demo — it sells itself</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> Ask about their current pain before pitching features</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> Emphasize &quot;60-second setup&quot; — biggest differentiator</li>
            <li className="flex items-start gap-2"><span className="text-emerald-500">•</span> For skeptics: &quot;Try the demo right now, zero commitment&quot;</li>
          </ul>
        </div>
      </div>
    </div>

    {/* Quick Share */}
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Quick Share</div>
      <p className="text-[11px] text-gray-500 mb-2">Send this link to anyone selling WorkChores or prospects.</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 font-mono truncate">https://workchores.com</div>
        <button
          onClick={() => navigator.clipboard.writeText("https://workchores.com")}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ClipboardCopy className="w-3 h-3" /> Copy
        </button>
      </div>
    </div>
  </div>
</div>
);
}
