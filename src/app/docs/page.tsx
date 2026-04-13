"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  CheckSquare,
  Calendar,
  MessageSquare,
  Lightbulb,
  BarChart3,
  Upload,
  Download,
  Settings,
  Shield,
  Mail,
  Search,
  Plus,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Zap,
  Building2,
  UserPlus,
  FileText,
  Bell,
  Target,
  Layers,
  GripVertical,
  Sparkles,
  Trash2,
  Tag,
  Phone,
  Pencil,
  Menu,
  X,
  ShieldCheck,
  Link2,
  Paperclip,
  ListChecks,
  Filter,
  Truck,
} from "lucide-react";

type DocSection =
  | "getting-started"
  | "dashboard"
  | "contacts"
  | "pipeline"
  | "tasks"
  | "calendar"
  | "activity"
  | "recommendations"
  | "reports"
  | "import"
  | "export"
  | "settings"
  | "roles"
  | "email"
  | "search"
  | "industries"
  | "vendor-directory"
  | "vendor-contracts"
  | "vendor-compliance"
  | "vendor-portal"
  | "vendor-notes"
  | "task-overview"
  | "task-creating"
  | "task-managing"
  | "task-filters";

const sections: { id: DocSection; label: string; icon: typeof LayoutDashboard; group: string }[] = [
  { id: "getting-started", label: "Getting Started", icon: Zap, group: "Getting Started" },
  { id: "industries", label: "Industry Templates", icon: Building2, group: "Getting Started" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "CRM" },
  { id: "contacts", label: "Contacts", icon: Users, group: "CRM" },
  { id: "pipeline", label: "Pipeline", icon: GitBranch, group: "CRM" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, group: "CRM" },
  { id: "calendar", label: "Calendar", icon: Calendar, group: "CRM" },
  { id: "activity", label: "Activity Feed", icon: MessageSquare, group: "CRM" },
  { id: "recommendations", label: "For You", icon: Lightbulb, group: "CRM" },
  { id: "reports", label: "Reports", icon: BarChart3, group: "CRM" },
  { id: "vendor-directory", label: "Vendor Directory", icon: Users, group: "Vendor Management" },
  { id: "vendor-contracts", label: "Contracts & Costs", icon: FileText, group: "Vendor Management" },
  { id: "vendor-compliance", label: "Compliance", icon: ShieldCheck, group: "Vendor Management" },
  { id: "vendor-portal", label: "Vendor Portal", icon: Link2, group: "Vendor Management" },
  { id: "vendor-notes", label: "Notes & Files", icon: Paperclip, group: "Vendor Management" },
  { id: "task-overview", label: "Task Overview", icon: CheckSquare, group: "Task Tracker" },
  { id: "task-creating", label: "Creating Tasks", icon: Plus, group: "Task Tracker" },
  { id: "task-managing", label: "Managing Tasks", icon: ListChecks, group: "Task Tracker" },
  { id: "task-filters", label: "Filters & Views", icon: Filter, group: "Task Tracker" },
  { id: "search", label: "Global Search", icon: Search, group: "Tools" },
  { id: "import", label: "Import Data", icon: Upload, group: "Tools" },
  { id: "export", label: "Export Data", icon: Download, group: "Tools" },
  { id: "email", label: "Email Integration", icon: Mail, group: "Tools" },
  { id: "settings", label: "Settings", icon: Settings, group: "Admin" },
  { id: "roles", label: "Roles & Permissions", icon: Shield, group: "Admin" },
];

// Search index: map section IDs to searchable text + subsection titles
const searchIndex: { id: DocSection; label: string; subsections: string[]; keywords: string }[] = [
  { id: "getting-started", label: "Getting Started", subsections: ["What is WorkChores?", "Creating Your Account", "Your First 5 Minutes", "Navigating the App"], keywords: "signup account onboarding setup install configure workspace industry template demo" },
  { id: "industries", label: "Industry Templates", subsections: ["Available Templates", "What Each Template Includes"], keywords: "b2b saas real estate recruiting consulting home services pipeline stages template" },
  { id: "dashboard", label: "Dashboard", subsections: ["Overview", "KPI Cards", "Pipeline Overview", "Upcoming Tasks", "Recent Activity"], keywords: "kpi metrics stats overview pipeline chart tasks activity customize" },
  { id: "contacts", label: "Contacts", subsections: ["Overview", "Adding a Contact", "Contact List View", "Bulk Actions", "Contact Detail Page", "Archive & Trash"], keywords: "add create import contact detail edit delete archive trash bulk email tags custom fields duplicate timeline touchpoints files" },
  { id: "pipeline", label: "Pipeline", subsections: ["Overview", "Funnel Summary", "Deal Table", "Customizing Your Pipeline"], keywords: "deals stages funnel sales drag drop sort filter customize colors rename reorder" },
  { id: "tasks", label: "Tasks", subsections: ["Overview", "Task Dashboard", "Creating a Task", "Managing Tasks", "Filters"], keywords: "todo follow-up due date priority assign complete overdue today upcoming" },
  { id: "calendar", label: "Calendar", subsections: ["Overview", "Using the Calendar", "Color Legend"], keywords: "month schedule touchpoints color pills navigate date" },
  { id: "activity", label: "Activity Feed", subsections: ["Overview", "Activity Types", "Logging Activity", "Filtering"], keywords: "calls emails meetings notes touchpoints log interactions timeline" },
  { id: "recommendations", label: "For You", subsections: ["How It Works", "Recommendation Types", "Configuration"], keywords: "ai suggestions stale contacts overdue tasks high-value deals alerts thresholds" },
  { id: "reports", label: "Reports", subsections: ["Overview", "Pipeline KPIs", "Task & Activity Metrics", "Visualizations"], keywords: "analytics metrics win rate revenue value charts team performance" },
  { id: "search", label: "Global Search", subsections: ["How to Search", "What You Can Search", "Smart Features"], keywords: "find lookup phone email contact task keyboard shortcut" },
  { id: "import", label: "Import Data", subsections: ["Overview", "How to Import"], keywords: "csv excel spreadsheet upload template wizard bulk contacts" },
  { id: "export", label: "Export Data", subsections: ["Overview", "What You Can Export", "How to Export"], keywords: "download csv excel backup data contacts tasks activity" },
  { id: "email", label: "Email Integration", subsections: ["Connecting Gmail", "Sending Emails", "Email Templates", "Rate Limits"], keywords: "gmail connect send template variables bulk email rate limit quota" },
  { id: "settings", label: "Settings", subsections: ["Overview", "Company Info", "Team Members", "Pipeline", "Alerts", "Email Templates"], keywords: "configure workspace company team invite members pipeline stages alerts notifications email templates billing" },
  { id: "roles", label: "Roles & Permissions", subsections: ["Role Levels", "Data Visibility", "Admin-Only Features"], keywords: "admin manager member permissions access control visibility reporting hierarchy" },
  { id: "vendor-directory", label: "Vendor Directory", subsections: ["Overview", "Adding a Vendor", "Vendor List", "Categories & Status"], keywords: "vendor supplier directory add create list category status active inactive pending" },
  { id: "vendor-contracts", label: "Contracts & Costs", subsections: ["Overview", "Adding a Contract", "Renewal Tracking", "Cost Calculations"], keywords: "contract renewal cost spend payment frequency annual auto-renew" },
  { id: "vendor-compliance", label: "Compliance", subsections: ["Overview", "W-9 Tracking", "1099 Requirements", "Year-by-Year Records"], keywords: "compliance w9 1099 tax classification filing audit ready" },
  { id: "vendor-portal", label: "Vendor Portal", subsections: ["Overview", "Sending a Portal Link", "What Vendors See", "Document Review"], keywords: "portal magic link self-service upload document w9 insurance certificate" },
  { id: "vendor-notes", label: "Notes & Files", subsections: ["Overview", "Adding Notes", "Attaching Files", "Audit Trail"], keywords: "notes files attachments documents audit trail history vendor" },
  { id: "task-overview", label: "Task Overview", subsections: ["What are Tasks?", "Task Sources", "Task List"], keywords: "task overview list crm vendor standalone unified" },
  { id: "task-creating", label: "Creating Tasks", subsections: ["From the Task List", "From a Contact", "From a Vendor", "Task Fields"], keywords: "create new task assign owner priority due date description" },
  { id: "task-managing", label: "Managing Tasks", subsections: ["Completing Tasks", "Editing Tasks", "Task Detail View"], keywords: "complete done edit update detail view audit trail" },
  { id: "task-filters", label: "Filters & Views", subsections: ["Status Filter", "Priority Filter", "Owner Filter", "Source Filter"], keywords: "filter status open completed priority high medium low owner source crm vendor" },
];

// Related sections map
const relatedSections: Record<DocSection, DocSection[]> = {
  "getting-started": ["industries", "dashboard", "contacts"],
  industries: ["getting-started", "pipeline", "settings"],
  dashboard: ["reports", "tasks", "pipeline"],
  contacts: ["pipeline", "email", "import"],
  pipeline: ["contacts", "dashboard", "settings"],
  tasks: ["calendar", "contacts", "recommendations"],
  calendar: ["tasks", "activity"],
  activity: ["contacts", "email", "calendar"],
  recommendations: ["tasks", "contacts", "reports"],
  reports: ["dashboard", "pipeline", "recommendations"],
  search: ["contacts", "tasks"],
  import: ["contacts", "export"],
  export: ["import", "contacts", "reports"],
  email: ["contacts", "settings", "activity"],
  settings: ["roles", "pipeline", "email"],
  roles: ["settings", "contacts"],
  "vendor-directory": ["vendor-contracts", "vendor-compliance", "contacts"],
  "vendor-contracts": ["vendor-directory", "vendor-compliance", "vendor-portal"],
  "vendor-compliance": ["vendor-contracts", "vendor-directory", "vendor-notes"],
  "vendor-portal": ["vendor-directory", "vendor-contracts", "vendor-compliance"],
  "vendor-notes": ["vendor-directory", "vendor-contracts", "vendor-compliance"],
  "task-overview": ["task-creating", "task-managing", "task-filters"],
  "task-creating": ["task-overview", "task-managing", "contacts"],
  "task-managing": ["task-overview", "task-creating", "task-filters"],
  "task-filters": ["task-overview", "task-managing", "reports"],
};

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 mb-5">
      <div className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
        {n}
      </div>
      <div className="flex-1 text-sm text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-semibold text-blue-700 mb-0.5">Pro Tip</div>
          <div className="text-sm text-blue-800 leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SupportBox() {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-8">
      <div className="flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-semibold text-gray-700 mb-0.5">Need Help?</div>
          <div className="text-sm text-gray-600 leading-relaxed">
            Email us at <a href="mailto:support@workchores.com" className="text-accent hover:underline">support@workchores.com</a> or use the help icon inside the app.
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }: { icon: typeof LayoutDashboard; title: string; description: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      <p className="text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">{title}</h2>
      {children}
    </div>
  );
}

function Description({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm text-gray-700 leading-relaxed mb-4">{children}</div>
  );
}

function Instructions({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 my-4">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title || "Step-by-Step"}</div>
      {children}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: typeof LayoutDashboard; title: string; description: string }) {
  return (
    <div className="flex gap-3 p-4 bg-gray-50 rounded-lg">
      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</div>
      </div>
    </div>
  );
}

function DocContent({ section }: { section: DocSection }) {
  switch (section) {
    case "getting-started":
      return (
        <div>
          <SectionHeader icon={Zap} title="Getting Started" description="Get your WorkChores CRM up and running in under 60 seconds." />

          <SubSection title="What is WorkChores?">
            <Description>
              WorkChores is a lightweight CRM built for small teams who need a simple, powerful way to manage contacts, track deals, and never miss a follow-up. It comes pre-configured for your industry so you can start closing deals immediately — no setup guides, no consultants, no training sessions.
            </Description>
          </SubSection>

          <SubSection title="Creating Your Account">
            <Description>
              Signing up takes about 30 seconds. You&apos;ll create an account, choose an industry template, and land in a fully configured workspace.
            </Description>
            <Instructions>
              <Step n={1}>
                Go to <Link href="/signup" className="text-accent hover:underline font-medium">workchores.com/signup</Link> and enter your full name, email address, and a password (minimum 8 characters).
              </Step>
              <Step n={2}>
                Check your email inbox for a confirmation link from WorkChores. Click it to verify your account. If you don&apos;t see it within a minute, check your spam folder.
              </Step>
              <Step n={3}>
                After confirming, you&apos;ll be asked to <strong>choose your industry</strong>. Pick from: B2B Sales, SaaS, Real Estate, Recruiting, Consulting, or Home Services. This pre-loads your pipeline stages, dashboard metrics, and sample data tailored to your workflow.
              </Step>
              <Step n={4}>
                Enter your <strong>company name</strong>. This becomes your workspace name — visible to you and any team members you invite later.
              </Step>
              <Step n={5}>
                You&apos;re in! Your CRM is ready with sample contacts, tasks, and activity so you can explore every feature right away. When you&apos;re ready to use real data, clear the samples from Settings → Company Info → Clear Sample Data.
              </Step>
            </Instructions>
            <Tip>Not ready to sign up? Try the <Link href="/demo" className="text-accent hover:underline">live interactive demo</Link> first — no account needed. You get the full CRM experience with sample data, and you can switch between Admin, Manager, and Member roles to preview how permissions work.</Tip>
          </SubSection>

          <SubSection title="Your First 5 Minutes">
            <Description>
              Once you&apos;re inside the CRM, here are the five things most new users do first. Each one takes under a minute.
            </Description>
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Users} title="1. Add your first contact" description="Click the + button in the top-right header → 'New Contact'. Fill in their name, email, company, and deal value. Hit Save." />
              <FeatureCard icon={CheckSquare} title="2. Create a follow-up task" description="Click + → 'New Task'. Give it a title, link it to a contact, set a due date, and choose a priority." />
              <FeatureCard icon={UserPlus} title="3. Invite a teammate" description="Go to Settings → Team Members. Enter their email and choose a role (Admin, Manager, or Member)." />
              <FeatureCard icon={Upload} title="4. Import your contacts" description="Go to Import in the sidebar. Download our template, paste your data, and upload." />
              <FeatureCard icon={Mail} title="5. Connect your Gmail" description="Go to Settings → Email Templates → 'Connect Gmail'. Now you can email contacts directly from the CRM." />
            </div>
          </SubSection>

          <SubSection title="Navigating the App">
            <Description>
              The app has three main areas:
            </Description>
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Layers} title="Sidebar (left)" description="Core pages (Dashboard, Contacts, Pipeline, Tasks) are always visible. Click 'More' for Calendar, Activity, For You, and Reports." />
              <FeatureCard icon={Search} title="Header (top)" description="Global search bar, the + button for quick-adding, notification bell, and help icon." />
              <FeatureCard icon={LayoutDashboard} title="Main Content (center)" description="The active view — whatever page you've navigated to. Click a contact to drill into their detail page." />
            </div>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "dashboard":
      return (
        <div>
          <SectionHeader icon={LayoutDashboard} title="Dashboard" description="Your command center — a real-time snapshot of your pipeline, tasks, and recent activity." />

          <SubSection title="Overview">
            <Description>
              The Dashboard is the first thing you see when you open WorkChores. It gives you a real-time pulse on your business: how much is in your pipeline, what needs attention today, and what happened recently. Everything on the dashboard is clickable — tap any metric, task, or activity to drill deeper.
            </Description>
          </SubSection>

          <SubSection title="KPI Cards">
            <Description>
              The four stat cards at the top of your dashboard are fully customizable. Your industry template sets smart defaults, but you can swap in any metrics that matter to you.
            </Description>
            <Instructions title="Customizing Your KPIs">
              <Step n={1}>Click the <strong>Customize</strong> button (pencil icon) at the top-right of the KPI cards section.</Step>
              <Step n={2}>Browse metrics by category: Pipeline, Tasks, Activity, and industry-specific options.</Step>
              <Step n={3}>Toggle metrics on or off — you can display up to 4 at a time. Drag to reorder them.</Step>
              <Step n={4}>Click <strong>Done</strong> to save. Your selection persists across sessions.</Step>
            </Instructions>
            <Tip>KPIs are computed from your live data in real-time. In live mode, metrics compare the last 30 days to the previous 30-day period for trend indicators.</Tip>
          </SubSection>

          <SubSection title="Pipeline Overview">
            <Description>
              Below the KPIs, a horizontal bar chart visualizes your pipeline by stage. Each bar shows the number of deals and total dollar value in that stage.
            </Description>
            <Instructions title="How to Use">
              <Step n={1}>Scan the bars to see where your deals are concentrated.</Step>
              <Step n={2}>Click <strong>&quot;View Pipeline&quot;</strong> to jump to the full Pipeline view.</Step>
              <Step n={3}>If a stage has too many deals stacking up, check the <strong>For You</strong> page for recommendations.</Step>
            </Instructions>
          </SubSection>

          <SubSection title="Upcoming Tasks">
            <Description>
              Your next 5 incomplete tasks, sorted by due date. Each task shows a color-coded badge:
            </Description>
            <div className="grid sm:grid-cols-3 gap-2 text-sm mb-4">
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> <span className="text-red-700 font-medium">Overdue</span></div>
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> <span className="text-amber-700 font-medium">Due Today</span></div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> <span className="text-blue-700 font-medium">Upcoming</span></div>
            </div>
          </SubSection>

          <SubSection title="Recent Activity">
            <Description>
              The last 5 touchpoints logged across your workspace — calls, emails, meetings, and notes. Click any activity to navigate to the linked contact&apos;s detail page.
            </Description>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "contacts":
      return (
        <div>
          <SectionHeader icon={Users} title="Contacts" description="Your complete contact database with inline editing, custom fields, bulk actions, and full relationship context." />

          <SubSection title="Overview">
            <Description>
              Contacts are the core of your CRM. Every person you interact with — leads, prospects, customers, partners — lives here. Each contact has a full profile with their info, deal value, pipeline stage, tags, custom fields, and a complete history of every interaction.
            </Description>
          </SubSection>

          <SubSection title="Adding a Contact">
            <Description>
              There are three ways to add contacts to your CRM:
            </Description>
            <Instructions title="Method 1: Quick Add">
              <Step n={1}>Click the <strong>+ button</strong> in the top-right header.</Step>
              <Step n={2}>Select <strong>&quot;New Contact&quot;</strong> from the dropdown.</Step>
              <Step n={3}>Fill in the name, email, phone, company, role, and deal value.</Step>
              <Step n={4}>Choose a <strong>pipeline stage</strong> and <strong>owner</strong>.</Step>
              <Step n={5}>Click <strong>Save Changes</strong>.</Step>
            </Instructions>
            <Instructions title="Method 2: Import from Spreadsheet">
              <Step n={1}>Go to <strong>Import</strong> in the sidebar.</Step>
              <Step n={2}>Follow the 4-step wizard. See the Import Data section for full details.</Step>
            </Instructions>
            <Tip>WorkChores automatically checks for duplicates when saving. If someone with a similar name, matching email, or phone already exists, you&apos;ll see a warning with a confidence score.</Tip>
          </SubSection>

          <SubSection title="Contact List View">
            <Description>
              The main Contacts page shows a sortable table of all active contacts with avatar, name, company, stage, deal value, owner, and last contact date.
            </Description>
            <Instructions title="Filtering & Searching">
              <Step n={1}><strong>Stage Filter Pills</strong> — Click any pipeline stage at the top to filter.</Step>
              <Step n={2}><strong>Global Search</strong> — Search by name, email, phone, company, role, tags, or stage.</Step>
              <Step n={3}><strong>Archive & Trash Icons</strong> — Toggle between active, archived, and trashed contacts.</Step>
            </Instructions>
          </SubSection>

          <SubSection title="Bulk Actions">
            <Description>
              Select multiple contacts using checkboxes and an action bar appears:
            </Description>
            <Instructions title="Available Bulk Actions">
              <Step n={1}><strong>Change Stage</strong> — Move all selected contacts to a different pipeline stage.</Step>
              <Step n={2}><strong>Reassign Owner</strong> — Transfer contacts to another team member.</Step>
              <Step n={3}><strong>Send Bulk Email</strong> — Send individually to each selected contact.</Step>
              <Step n={4}><strong>Archive</strong> — Hide from the active view. Can be restored anytime.</Step>
              <Step n={5}><strong>Move to Trash</strong> — Soft-delete. Can be restored or permanently deleted.</Step>
            </Instructions>
          </SubSection>

          <SubSection title="Contact Detail Page">
            <Description>
              Click any contact to open their full profile. Three buttons at the top-right organize actions:
            </Description>
            <Instructions title="Header Buttons">
              <Step n={1}><strong>Actions</strong> (blue) — Send Email, Log Call, Log Meeting, Add Note, Add Task.</Step>
              <Step n={2}><strong>Manage</strong> (gray) — Archive or Delete Contact.</Step>
              <Step n={3}><strong>Edit</strong> (green) — Inline editing for all contact fields.</Step>
            </Instructions>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <FeatureCard icon={Target} title="Last Contacted" description="Color-coded indicator: green (7 days), amber (8-14), red (15+), gray (never)." />
              <FeatureCard icon={Users} title="Related Contacts" description="Others at the same company appear automatically." />
              <FeatureCard icon={Tag} title="Tags" description="Categorize contacts (VIP, Referral, Cold Lead). Type and press Enter." />
              <FeatureCard icon={Layers} title="Custom Fields" description="Text, number, date, or dropdown fields. Admins create, everyone fills in." />
              <FeatureCard icon={Sparkles} title="Duplicate Detection" description="Fuzzy name matching, email, phone, and company checks with confidence scores." />
              <FeatureCard icon={FileText} title="File Attachments" description="Upload documents, proposals, or images directly to a contact." />
            </div>
            <Description>
              Four tabs below the profile: <strong>Timeline</strong> (unified chronological view), <strong>Touchpoints</strong> (calls, emails, meetings, notes), <strong>Tasks</strong> (linked tasks), and <strong>Files</strong> (attachments).
            </Description>
          </SubSection>

          <SubSection title="Archive & Trash">
            <Instructions>
              <Step n={1}><strong>Archive</strong> — Hides from active list, preserves all data. Restore anytime.</Step>
              <Step n={2}><strong>Trash</strong> — Soft-deletes. Can be restored or permanently deleted.</Step>
              <Step n={3}><strong>Empty Trash</strong> — Permanent deletion. Cannot be undone.</Step>
            </Instructions>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "pipeline":
      return (
        <div>
          <SectionHeader icon={GitBranch} title="Pipeline" description="Visualize your deals flowing through each stage of your sales process." />

          <SubSection title="Overview">
            <Description>
              The Pipeline view gives you a bird&apos;s-eye view of every deal in your funnel. See revenue by stage, spot bottlenecks, and manage your sales process day-to-day.
            </Description>
          </SubSection>

          <SubSection title="Funnel Summary">
            <Description>
              Color-coded cards at the top show each pipeline stage with deal count and total dollar value.
            </Description>
            <Instructions title="Reading the Funnel">
              <Step n={1}>Scan left to right — they follow your pipeline order.</Step>
              <Step n={2}>Look for <strong>bottlenecks</strong> — if one stage has significantly more deals than the next.</Step>
              <Step n={3}>Click a stage card to filter the table below. Click again to reset.</Step>
            </Instructions>
          </SubSection>

          <SubSection title="Deal Table">
            <Description>
              A sortable table with contact name, stage, deal value, owner, last contact date, and tags.
            </Description>
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Search} title="Search Deals" description="Find deals by contact name, company, or email. Results filter instantly." />
              <FeatureCard icon={Users} title="Filter by Owner" description="View only deals belonging to a specific team member." />
              <FeatureCard icon={Layers} title="Sort Columns" description="Click any column header to sort ascending or descending." />
            </div>
          </SubSection>

          <SubSection title="Customizing Your Pipeline">
            <Instructions title="How to Customize">
              <Step n={1}>Go to <strong>Settings → Pipeline</strong>.</Step>
              <Step n={2}><strong>Rename</strong> — Click any stage name to edit.</Step>
              <Step n={3}><strong>Recolor</strong> — Click the color dot. Choose from 10 options.</Step>
              <Step n={4}><strong>Reorder</strong> — Drag stages using the grip handle.</Step>
              <Step n={5}><strong>Add/Remove</strong> — Add new stages or remove existing ones.</Step>
            </Instructions>
            <Tip>Changes reflect everywhere instantly — Pipeline view, contact dropdowns, dashboard KPIs, and reports.</Tip>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "tasks":
      return (
        <div>
          <SectionHeader icon={CheckSquare} title="Tasks" description="Track every follow-up, to-do, and action item across your entire pipeline." />

          <SubSection title="Overview">
            <Description>
              Tasks ensure nothing falls through the cracks. Every follow-up call, proposal deadline, and to-do item lives here. Tasks can be linked to contacts, assigned to team members, and organized by priority and due date.
            </Description>
          </SubSection>

          <SubSection title="Task Dashboard">
            <Description>Five status cards give you an instant overview:</Description>
            <div className="grid grid-cols-5 gap-2 text-xs mb-4">
              <div className="p-2 bg-red-50 rounded-lg text-center"><span className="font-bold text-red-700">Overdue</span></div>
              <div className="p-2 bg-amber-50 rounded-lg text-center"><span className="font-bold text-amber-700">Today</span></div>
              <div className="p-2 bg-blue-50 rounded-lg text-center"><span className="font-bold text-blue-700">Upcoming</span></div>
              <div className="p-2 bg-gray-50 rounded-lg text-center"><span className="font-bold text-gray-600">Later</span></div>
              <div className="p-2 bg-emerald-50 rounded-lg text-center"><span className="font-bold text-emerald-700">Done</span></div>
            </div>
            <Description>Click any card to filter. A progress bar shows your completion rate.</Description>
          </SubSection>

          <SubSection title="Creating a Task">
            <Instructions>
              <Step n={1}>Click <strong>Add Task</strong> or use the <strong>+ button</strong> → &quot;New Task.&quot;</Step>
              <Step n={2}>Enter a descriptive <strong>title</strong>.</Step>
              <Step n={3}>Add optional <strong>notes/description</strong>.</Step>
              <Step n={4}>Set the <strong>due date</strong>, <strong>priority</strong>, and <strong>owner</strong>.</Step>
              <Step n={5}>Optionally <strong>link to a contact</strong>.</Step>
              <Step n={6}>Click <strong>Save</strong>.</Step>
            </Instructions>
            <Tip>Tasks linked to contacts appear on the contact&apos;s detail page — giving you complete context before every interaction.</Tip>
          </SubSection>

          <SubSection title="Managing Tasks">
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={CheckSquare} title="Complete" description="Click the circle icon to mark done. Click again to reopen." />
              <FeatureCard icon={Pencil} title="Edit" description="Click any task to edit title, notes, due date, priority, owner, or linked contact." />
              <FeatureCard icon={Trash2} title="Delete" description="Open detail view and click Delete. Permanent after confirmation." />
            </div>
          </SubSection>

          <SubSection title="Filters">
            <Description>
              Filter by <strong>Priority</strong> (High, Medium, Low) and <strong>Owner</strong>. Combine filters to narrow down exactly what you need.
            </Description>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "calendar":
      return (
        <div>
          <SectionHeader icon={Calendar} title="Calendar" description="See your tasks and touchpoints laid out on a monthly calendar." />

          <SubSection title="Overview">
            <Description>
              The Calendar gives you a visual timeline of everything happening across your pipeline. Tasks and touchpoints are plotted on a monthly grid so you can spot gaps and plan ahead.
            </Description>
          </SubSection>

          <SubSection title="Using the Calendar">
            <Instructions>
              <Step n={1}><strong>Navigate months</strong> — Use arrows or click &quot;Today&quot; to jump back.</Step>
              <Step n={2}><strong>Scan the grid</strong> — Color-coded pills show tasks and touchpoints.</Step>
              <Step n={3}><strong>Click any day</strong> — A detail panel shows all items on that date.</Step>
              <Step n={4}><strong>Navigate</strong> — Click a task or touchpoint to open its detail.</Step>
            </Instructions>
          </SubSection>

          <SubSection title="Color Legend">
            <div className="grid sm:grid-cols-2 gap-2 text-sm mb-4">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><span className="w-3 h-3 rounded-full bg-red-500" /> High priority task</div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><span className="w-3 h-3 rounded-full bg-amber-500" /> Medium priority task</div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><span className="w-3 h-3 rounded-full bg-gray-400" /> Low priority task</div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Completed task</div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><span className="w-3 h-3 rounded-full bg-blue-500" /> Call / Email</div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><span className="w-3 h-3 rounded-full bg-violet-500" /> Meeting</div>
            </div>
            <Tip>Look for days with no pills — those are gaps in your outreach. The For You page also flags stale contacts.</Tip>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "activity":
      return (
        <div>
          <SectionHeader icon={MessageSquare} title="Activity Feed" description="A chronological log of every interaction across your workspace." />

          <SubSection title="Overview">
            <Description>
              The Activity Feed is your workspace&apos;s complete interaction history. Every call, email, meeting, and note logged anywhere shows up here in chronological order.
            </Description>
          </SubSection>

          <SubSection title="Activity Types">
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <FeatureCard icon={Phone} title="Calls" description="Phone calls — log outcome, duration, and follow-up notes." />
              <FeatureCard icon={Mail} title="Emails" description="Auto-logged from CRM sends, or manually log external emails." />
              <FeatureCard icon={Calendar} title="Meetings" description="Record attendees, agenda, and key discussion points." />
              <FeatureCard icon={FileText} title="Notes" description="Internal notes — strategy, reminders, research. Not shared with contacts." />
            </div>
          </SubSection>

          <SubSection title="Logging Activity">
            <Instructions>
              <Step n={1}><strong>Quick Add</strong> — Click <strong>+</strong> → &quot;Log Activity.&quot;</Step>
              <Step n={2}><strong>From a Contact</strong> — Open contact → Touchpoints tab → &quot;+ Add.&quot;</Step>
              <Step n={3}><strong>Automatic</strong> — Emails sent from connected Gmail are auto-logged.</Step>
            </Instructions>
            <Tip>Spend 30 seconds after every call or meeting to log it — your future self (and your team) will thank you.</Tip>
          </SubSection>

          <SubSection title="Filtering">
            <Description>
              Filter by type: All, Calls, Emails, Meetings, or Notes. Click any activity to navigate to the linked contact.
            </Description>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "recommendations":
      return (
        <div>
          <SectionHeader icon={Lightbulb} title="For You" description="Smart, actionable suggestions to move your deals forward." />

          <SubSection title="How It Works">
            <Description>
              The For You page analyzes your contacts, tasks, and activity to surface what needs your attention right now. It updates in real-time as your data changes.
            </Description>
          </SubSection>

          <SubSection title="Recommendation Types">
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Trash2} title="Overdue Tasks" description="Tasks past their due date that need immediate attention." />
              <FeatureCard icon={Users} title="Stale Contacts" description="Contacts with no recent touchpoints who need a follow-up." />
              <FeatureCard icon={Target} title="High-Value Opportunities" description="Deals in early stages with high value that could be pushed forward." />
              <FeatureCard icon={Sparkles} title="Negotiation Deals" description="Contacts in negotiation that need action to close." />
              <FeatureCard icon={Bell} title="At-Risk Proposals" description="Proposals with limited engagement that might go cold." />
              <FeatureCard icon={CheckSquare} title="Tasks Due Today" description="Today's to-do list so nothing falls through the cracks." />
            </div>
          </SubSection>

          <SubSection title="Configuration">
            <Instructions title="How to Configure">
              <Step n={1}>Go to <strong>Settings → Alerts</strong>.</Step>
              <Step n={2}>Toggle each alert type on or off.</Step>
              <Step n={3}>Adjust thresholds: <strong>Stale Days</strong>, <strong>At-Risk Touchpoints</strong>, <strong>High-Value Threshold</strong>.</Step>
              <Step n={4}>Click <strong>Save Changes</strong>. Recommendations update immediately.</Step>
            </Instructions>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "reports":
      return (
        <div>
          <SectionHeader icon={BarChart3} title="Reports" description="Key metrics and performance data for your team and pipeline." />

          <SubSection title="Overview">
            <Description>
              Pipeline KPIs, task completion rates, activity breakdowns, and team performance — all computed from your live data. No setup required.
            </Description>
          </SubSection>

          <SubSection title="Pipeline KPIs">
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <FeatureCard icon={Target} title="Pipeline Value" description="Total dollar value of all active deals." />
              <FeatureCard icon={CheckSquare} title="Revenue Won" description="Total value of closed-won deals." />
              <FeatureCard icon={BarChart3} title="Win Rate" description="Closed won vs total closed. A key health metric." />
              <FeatureCard icon={Users} title="Avg. Deal Size" description="Average value across active deals." />
            </div>
          </SubSection>

          <SubSection title="Task & Activity Metrics">
            <Description>
              Open task count, overdue count, task completion rate, total activities in the last 30 days, and average touchpoints per contact.
            </Description>
          </SubSection>

          <SubSection title="Visualizations">
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={GitBranch} title="Pipeline by Stage" description="Horizontal bar chart showing deal count and value per stage." />
              <FeatureCard icon={MessageSquare} title="Activity Breakdown" description="Distribution of calls, emails, meetings, and notes with percentages." />
              <FeatureCard icon={Users} title="Team Performance" description="Per-member contact count, pipeline value, task count, and completion rate." />
            </div>
            <Tip>Reports respect role-based visibility. Admins see all data, managers see their team, members see only their own.</Tip>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "import":
      return (
        <div>
          <SectionHeader icon={Upload} title="Import Data" description="Bring your existing contacts into WorkChores with our guided import wizard." />

          <SubSection title="Overview">
            <Description>
              Already have contacts in a spreadsheet or another CRM? The Import wizard walks you through getting them into WorkChores in four simple steps.
            </Description>
          </SubSection>

          <SubSection title="How to Import">
            <Instructions title="4-Step Import Process">
              <Step n={1}><strong>Configure your fields.</strong> Toggle which fields to include. Name is always required.</Step>
              <Step n={2}><strong>Download the template.</strong> Get an Excel file with your selected columns and dropdown validations.</Step>
              <Step n={3}><strong>Fill in your data.</strong> Replace sample data with your contacts. Use dropdowns for stages and custom fields.</Step>
              <Step n={4}><strong>Upload and confirm.</strong> Preview your data, then click &quot;Import Contacts.&quot;</Step>
            </Instructions>
            <Tip>Custom fields appear as additional columns in the template, so you can import custom data in bulk.</Tip>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "export":
      return (
        <div>
          <SectionHeader icon={Download} title="Export Data" description="Export your contacts, tasks, and activity data as Excel or CSV files." />

          <SubSection title="Overview">
            <Description>
              Download your contacts, tasks, and activity as Excel or CSV files. Admin users can export everything; non-admin users export only data they have access to.
            </Description>
          </SubSection>

          <SubSection title="What You Can Export">
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Users} title="Contacts" description="All contact fields including custom fields, tags, stage, value, and owner." />
              <FeatureCard icon={CheckSquare} title="Tasks" description="Title, description, due date, priority, status, owner, and linked contact." />
              <FeatureCard icon={MessageSquare} title="Activity" description="All touchpoints with dates, descriptions, and linked contacts." />
            </div>
          </SubSection>

          <SubSection title="How to Export">
            <Instructions>
              <Step n={1}><strong>Select data types</strong> — Toggle Contacts, Tasks, and/or Activity.</Step>
              <Step n={2}><strong>Apply filters</strong> — Filter by owner, stage, or include archived/deleted.</Step>
              <Step n={3}><strong>Choose format</strong> — Excel (.xlsx) or CSV (.csv).</Step>
              <Step n={4}><strong>Click Export</strong> — File downloads to your computer.</Step>
            </Instructions>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "settings":
      return (
        <div>
          <SectionHeader icon={Settings} title="Settings" description="Configure your workspace, team, pipeline, alerts, and email templates." />

          <SubSection title="Overview">
            <Description>
              Settings is your workspace control center. Only <strong>Admin</strong> users can access it via the avatar menu → Settings. Six tabs cover everything from company info to email integration.
            </Description>
          </SubSection>

          <SubSection title="Company Info">
            <Description>
              Edit your company name and timezone. Also contains <strong>Clear Sample Data</strong> — removes all demo data while preserving your pipeline stages, custom fields, and team members.
            </Description>
          </SubSection>

          <SubSection title="Team Members">
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={UserPlus} title="Invite Members" description="Enter an email and choose a role. We send an invite or shareable signup link." />
              <FeatureCard icon={Users} title="Manage Team" description="Search and filter members by name or role. Grouped by role in collapsible sections." />
              <FeatureCard icon={GripVertical} title="Reporting Structure" description="Set 'reports to' relationships to define hierarchy and data visibility." />
              <FeatureCard icon={Trash2} title="Remove Members" description="Reassign their contacts, tasks, and activity to another team member. Nothing is lost." />
            </div>
          </SubSection>

          <SubSection title="Pipeline">
            <Description>
              Rename, recolor, reorder, add, and remove pipeline stages. Changes reflect everywhere instantly.
            </Description>
          </SubSection>

          <SubSection title="Alerts">
            <Description>
              Toggle alert types and set thresholds for stale days, at-risk touchpoint count, and high-value deal threshold.
            </Description>
          </SubSection>

          <SubSection title="Email Templates">
            <Description>
              Create reusable templates with variables: <code className="bg-gray-100 px-1 rounded text-xs">{"{{firstName}}"}</code>, <code className="bg-gray-100 px-1 rounded text-xs">{"{{company}}"}</code>, <code className="bg-gray-100 px-1 rounded text-xs">{"{{senderName}}"}</code>. This tab is also where you connect Gmail.
            </Description>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "roles":
      return (
        <div>
          <SectionHeader icon={Shield} title="Roles & Permissions" description="Control who sees what with three permission levels and a team hierarchy." />

          <SubSection title="Role Levels">
            <div className="grid gap-3 mb-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-800">Admin</span>
                </div>
                <p className="text-xs text-red-700 leading-relaxed">Full access to all data. Can manage settings, team, pipeline, and billing.</p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">Manager</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">Sees own data plus data from direct reports. Cannot access settings.</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-800">Member</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">Sees only own contacts, tasks, and touchpoints.</p>
              </div>
            </div>
          </SubSection>

          <SubSection title="Data Visibility">
            <Step n={1}><strong>Admin:</strong> Sees all data. No filtering applied.</Step>
            <Step n={2}><strong>Manager:</strong> Sees own data + anyone who reports to them.</Step>
            <Step n={3}><strong>Member:</strong> Sees only data they own.</Step>
            <Tip>Set up reporting in Settings → Team Members. A manager with two reports sees her own data plus theirs.</Tip>
          </SubSection>

          <SubSection title="Admin-Only Features">
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Settings} title="Settings Page" description="Company info, billing, team management, pipeline, alerts, and email templates." />
              <FeatureCard icon={Layers} title="Custom Fields" description="Creating and editing custom field definitions on contacts." />
              <FeatureCard icon={UserPlus} title="Team Management" description="Inviting, removing, and changing roles. Setting reporting structure." />
              <FeatureCard icon={GitBranch} title="Pipeline Customization" description="Adding, removing, renaming, recoloring, and reordering stages." />
              <FeatureCard icon={Bell} title="Alert Configuration" description="Toggling alert types and adjusting thresholds." />
            </div>
            <Tip>In the demo, use the role switcher to preview exactly how each role sees the CRM.</Tip>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "email":
      return (
        <div>
          <SectionHeader icon={Mail} title="Email Integration" description="Connect Gmail to send emails directly from WorkChores." />

          <SubSection title="Connecting Gmail">
            <Instructions>
              <Step n={1}>Go to <strong>Settings → Email Templates</strong>.</Step>
              <Step n={2}>Click <strong>Connect Gmail</strong>. Authorize WorkChores.</Step>
              <Step n={3}>We only request send permission — we cannot read your inbox.</Step>
              <Step n={4}>A green badge confirms your connected email.</Step>
            </Instructions>
            <Tip>Emails are sent from YOUR Gmail, so they appear in your Sent folder and replies come back to your inbox.</Tip>
          </SubSection>

          <SubSection title="Sending Emails">
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Users} title="From Contact Detail" description="Open any contact with an email → click email icon → compose and send." />
              <FeatureCard icon={Layers} title="Bulk Email" description="Select multiple contacts → click email icon → compose once, send individually to each." />
            </div>
          </SubSection>

          <SubSection title="Email Templates">
            <Description>
              Create reusable templates with three variables:
            </Description>
            <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono space-y-1 mb-4">
              <div><code className="text-accent">{"{{firstName}}"}</code> — Contact&apos;s first name</div>
              <div><code className="text-accent">{"{{company}}"}</code> — Contact&apos;s company</div>
              <div><code className="text-accent">{"{{senderName}}"}</code> — Your name</div>
            </div>
          </SubSection>

          <SubSection title="Rate Limits">
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="text-lg font-bold text-gray-900">250</div>
                <div className="text-xs text-gray-500">emails/day — Personal Gmail</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="text-lg font-bold text-gray-900">2,000</div>
                <div className="text-xs text-gray-500">emails/day — Google Workspace</div>
              </div>
            </div>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "search":
      return (
        <div>
          <SectionHeader icon={Search} title="Global Search" description="Find any contact or task instantly from anywhere in the app." />

          <SubSection title="How to Search">
            <Description>
              Click the search bar in the header (or press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">/</kbd>) and start typing. Results appear instantly.
            </Description>
          </SubSection>

          <SubSection title="What You Can Search">
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Users} title="Contacts" description="Search by name, company, email, phone, role, tags, or pipeline stage." />
              <FeatureCard icon={CheckSquare} title="Tasks" description="Search by task title or description." />
            </div>
          </SubSection>

          <SubSection title="Smart Features">
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Phone} title="Phone Normalization" description="Type any format — (555) 123-4567, 555-123-4567, or 5551234567 — and it matches." />
              <FeatureCard icon={Mail} title="Contextual Subtitles" description="Results show the most relevant detail based on your search: phone, email, or company." />
            </div>
            <Tip>Phone search requires at least 3 digits to avoid false positives.</Tip>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "industries":
      return (
        <div>
          <SectionHeader icon={Building2} title="Industry Templates" description="Pre-configured pipeline stages, dashboards, and sample data tailored to your industry." />

          <SubSection title="Available Templates">
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Target} title="B2B Sales" description="Lead → Qualified → Proposal → Negotiation → Closed Won/Lost." />
              <FeatureCard icon={Layers} title="SaaS" description="Trial → Demo → Evaluation → Negotiation → Subscribed/Churned." />
              <FeatureCard icon={Building2} title="Real Estate" description="Inquiry → Showing → Offer → Under Contract → Closed/Lost." />
              <FeatureCard icon={Users} title="Recruiting" description="Applied → Phone Screen → Interview → Offer → Hired/Rejected." />
              <FeatureCard icon={Sparkles} title="Consulting" description="Discovery → Proposal → SOW Review → Engaged → Completed/Lost." />
              <FeatureCard icon={Settings} title="Home Services" description="Inquiry → Estimate → Scheduled → In Progress → Completed/Cancelled." />
            </div>
          </SubSection>

          <SubSection title="What Each Template Includes">
            <Step n={1}><strong>Pipeline stages</strong> — 5-6 stages with industry-appropriate names and colors.</Step>
            <Step n={2}><strong>Dashboard KPIs</strong> — Four metrics tailored to your industry.</Step>
            <Step n={3}><strong>Sample contacts</strong> — 10-16 realistic contacts to explore immediately.</Step>
            <Step n={4}><strong>Sample tasks</strong> — Industry-relevant tasks linked to sample contacts.</Step>
            <Step n={5}><strong>Sample touchpoints</strong> — Recent activity to show how the timeline works.</Step>
            <Tip>You can customize everything after choosing a template. The template is a starting point, not a constraint.</Tip>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "vendor-directory":
      return (
        <div>
          <SectionHeader icon={Users} title="Vendor Directory" description="One place for every vendor your business works with." />

          <SubSection title="Overview">
            <Description>
              Your vendor directory is the single source of truth for every supplier, contractor, and service provider. Each vendor has a profile with contact info, category, status, contracts, and compliance data.
            </Description>
          </SubSection>

          <SubSection title="Adding a Vendor">
            <Instructions>
              <Step n={1}>Go to <strong>Vendors</strong> in the sidebar.</Step>
              <Step n={2}>Click <strong>&quot;Add Vendor&quot;</strong>.</Step>
              <Step n={3}>Fill in name, category, status, and contact info.</Step>
              <Step n={4}>Click <strong>Save</strong>.</Step>
            </Instructions>
            <Tip>Set category (e.g. IT, Marketing, Facilities) and status (Active, Inactive, Pending) to keep your directory organized.</Tip>
          </SubSection>

          <SubSection title="Vendor List">
            <Description>
              The vendor list shows all vendors with name, category, status, and primary contact. Click any vendor to see their full profile. Use the search bar to find vendors by name.
            </Description>
          </SubSection>

          <SubSection title="Categories & Status">
            <Description>
              Vendors can be categorized by type and filtered by status. Active = currently working with, Inactive = relationship paused, Pending = onboarding.
            </Description>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "vendor-contracts":
      return (
        <div>
          <SectionHeader icon={FileText} title="Contracts & Costs" description="Track every contract, renewal date, and payment obligation." />

          <SubSection title="Overview">
            <Description>
              Every vendor can have multiple contracts with terms, dates, and payment details. WorkChores auto-calculates annual costs from payment frequency and amount.
            </Description>
          </SubSection>

          <SubSection title="Adding a Contract">
            <Instructions>
              <Step n={1}>Open a vendor detail page.</Step>
              <Step n={2}>Click <strong>&quot;Add Contract&quot;</strong> in the contracts section.</Step>
              <Step n={3}>Fill in start date, end date, auto-renew, payment frequency, and amount.</Step>
            </Instructions>
            <Tip>Set auto-renew and WorkChores will alert you before renewal dates.</Tip>
          </SubSection>

          <SubSection title="Renewal Tracking">
            <Description>
              Contracts with end dates show days until expiration. Set reminder days to get notified in advance. Expired contracts are flagged automatically.
            </Description>
          </SubSection>

          <SubSection title="Cost Calculations">
            <Description>
              WorkChores calculates annual cost based on payment frequency: Monthly x 12, Quarterly x 4, Semi-annually x 2, Annually x 1. View total spend across all vendor contracts.
            </Description>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "vendor-compliance":
      return (
        <div>
          <SectionHeader icon={ShieldCheck} title="Compliance" description="W-9, 1099, and tax record management for every vendor." />

          <SubSection title="Overview">
            <Description>
              Track W-9 status, 1099 type, tax classification, and filing records for every vendor. Stay audit-ready year-round.
            </Description>
          </SubSection>

          <SubSection title="W-9 Tracking">
            <Description>
              Each vendor profile shows W-9 received status. Mark as received when you have the form. Flag vendors with missing W-9s.
            </Description>
          </SubSection>

          <SubSection title="1099 Requirements">
            <Description>
              Set whether a vendor needs a 1099 and which type (NEC, MISC, etc.). WorkChores flags vendors that require 1099s but haven&apos;t submitted a W-9.
            </Description>
          </SubSection>

          <SubSection title="Year-by-Year Records">
            <Description>
              Track 1099 filing status by year. Each tax year shows: filed/pending status, amount reported. Build a complete audit trail.
            </Description>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "vendor-portal":
      return (
        <div>
          <SectionHeader icon={Link2} title="Vendor Portal" description="Let vendors submit their own documents — no email back-and-forth." />

          <SubSection title="Overview">
            <Description>
              The vendor portal gives each vendor a secure, token-based link to upload documents. No login required. Documents land in the vendor&apos;s profile.
            </Description>
          </SubSection>

          <SubSection title="Sending a Portal Link">
            <Instructions>
              <Step n={1}>Open a vendor detail page.</Step>
              <Step n={2}>Click <strong>&quot;Request Documents&quot;</strong> or <strong>&quot;Send Portal Link&quot;</strong>.</Step>
              <Step n={3}>Choose which documents to request.</Step>
            </Instructions>
            <Tip>The link is unique to each vendor and doesn&apos;t expire.</Tip>
          </SubSection>

          <SubSection title="What Vendors See">
            <Description>
              Vendors see a clean page with your company name and a list of requested documents. They upload files directly. No account needed.
            </Description>
          </SubSection>

          <SubSection title="Document Review">
            <Description>
              Uploaded documents appear in the vendor&apos;s Notes &amp; Files section. Review, approve, or request resubmission.
            </Description>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "vendor-notes":
      return (
        <div>
          <SectionHeader icon={Paperclip} title="Notes & Files" description="Keep a full audit trail for every vendor relationship." />

          <SubSection title="Overview">
            <Description>
              Every vendor has a notes section for tracking conversations, decisions, and important details. Files and documents attach directly to the vendor profile.
            </Description>
          </SubSection>

          <SubSection title="Adding Notes">
            <Description>
              Click &quot;Add Note&quot; on any vendor detail page. Notes are timestamped and attributed to the user who created them. Use notes for meeting summaries, phone call records, or decisions.
            </Description>
          </SubSection>

          <SubSection title="Attaching Files">
            <Description>
              Upload contracts, insurance certificates, W-9 forms, and other documents directly to the vendor profile. Supported formats: PDF, DOCX, XLSX, images.
            </Description>
          </SubSection>

          <SubSection title="Audit Trail">
            <Description>
              Every note and file upload is logged with timestamp and user. This creates a complete history of your vendor relationship.
            </Description>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "task-overview":
      return (
        <div>
          <SectionHeader icon={CheckSquare} title="Task Overview" description="One task list across your CRM, vendors, and standalone work." />

          <SubSection title="What are Tasks?">
            <Description>
              Tasks are action items with a title, description, owner, priority, and due date. They can be linked to contacts, vendors, or stand alone. All tasks appear in one unified list.
            </Description>
          </SubSection>

          <SubSection title="Task Sources">
            <Description>
              Tasks have a source that tells you where they came from. Sources: CRM (linked to a contact/deal), Vendors (linked to a vendor), Tasks (standalone). The source badge shows next to each task.
            </Description>
            <Tip>You can create tasks from the main task list, from a contact detail page, or from a vendor detail page. They all end up in the same unified list.</Tip>
          </SubSection>

          <SubSection title="Task List">
            <Description>
              The task list shows all tasks with title, owner, priority, due date, and status. Click any task to see its detail view. Overdue tasks are highlighted automatically.
            </Description>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "task-creating":
      return (
        <div>
          <SectionHeader icon={Plus} title="Creating Tasks" description="Add tasks from anywhere — task list, contacts, or vendors." />

          <SubSection title="From the Task List">
            <Instructions>
              <Step n={1}>Go to <strong>Tasks</strong> in the sidebar.</Step>
              <Step n={2}>Click <strong>&quot;New Task&quot;</strong>.</Step>
              <Step n={3}>Fill in title, owner, priority, due date, and description.</Step>
            </Instructions>
          </SubSection>

          <SubSection title="From a Contact">
            <Instructions>
              <Step n={1}>Open a contact detail page.</Step>
              <Step n={2}>Click <strong>&quot;Add Task&quot;</strong> in the tasks section. The task is automatically linked to that contact.</Step>
            </Instructions>
          </SubSection>

          <SubSection title="From a Vendor">
            <Instructions>
              <Step n={1}>Open a vendor detail page.</Step>
              <Step n={2}>Click <strong>&quot;Add Task&quot;</strong>. The task is automatically linked to that vendor.</Step>
            </Instructions>
          </SubSection>

          <SubSection title="Task Fields">
            <Description>
              Title (required), Description (optional), Owner (who&apos;s responsible), Priority (High/Medium/Low), Due Date, Linked Contact or Vendor.
            </Description>
            <Tip>Set a due date on every task. Tasks without due dates are easy to forget.</Tip>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "task-managing":
      return (
        <div>
          <SectionHeader icon={ListChecks} title="Managing Tasks" description="Complete, edit, and track tasks with a full audit trail." />

          <SubSection title="Completing Tasks">
            <Description>
              Click the circle icon next to any task to mark it complete. Completed tasks show who completed them and when. Toggle between active and completed views.
            </Description>
          </SubSection>

          <SubSection title="Editing Tasks">
            <Description>
              Click any task to open its detail view. Edit title, description, owner, priority, or due date. Changes save automatically.
            </Description>
          </SubSection>

          <SubSection title="Task Detail View">
            <Description>
              The task detail shows all fields plus linked contact/vendor (clickable), completion status, and timestamps. You can also delete tasks from the detail view.
            </Description>
            <Tip>Reassign tasks by changing the owner. The new owner sees it in their filtered view immediately.</Tip>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "task-filters":
      return (
        <div>
          <SectionHeader icon={Filter} title="Filters & Views" description="Find the right tasks in two clicks." />

          <SubSection title="Status Filter">
            <Description>
              Filter by Open (active tasks) or Completed (done tasks). Default view shows open tasks.
            </Description>
          </SubSection>

          <SubSection title="Priority Filter">
            <Description>
              Filter by High, Medium, or Low priority. Or show all priorities.
            </Description>
          </SubSection>

          <SubSection title="Owner Filter">
            <Description>
              Filter by task owner to see what each team member is working on. Managers can filter by their direct reports. Admins see all owners.
            </Description>
          </SubSection>

          <SubSection title="Source Filter">
            <Description>
              Filter by source: CRM (contact-linked), Vendors (vendor-linked), or Tasks (standalone). Useful for focusing on one area of your operation.
            </Description>
            <Tip>Combine filters — for example, show only High priority + Overdue + CRM source to see your most critical deal follow-ups.</Tip>
          </SubSection>

          <SupportBox />
        </div>
      );

    default:
      return null;
  }
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<DocSection>("getting-started");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  const groups = Array.from(new Set(sections.map((s) => s.group)));

  // Get current section data
  const currentSection = sections.find(s => s.id === activeSection)!;
  const currentSearchEntry = searchIndex.find(s => s.id === activeSection);
  const related = relatedSections[activeSection] || [];

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return searchIndex
      .filter(entry =>
        entry.label.toLowerCase().includes(q) ||
        entry.keywords.toLowerCase().includes(q) ||
        entry.subsections.some(sub => sub.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [searchQuery]);

  // Keyboard shortcut for search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearchQuery("");
        setSearchFocused(false);
        searchRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  function toggleGroup(group: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  function navigateTo(id: DocSection) {
    setActiveSection(id);
    setMobileOpen(false);
    setSearchQuery("");
    setSearchFocused(false);
    window.scrollTo(0, 0);
  }

  // Prev/next for bottom nav
  const currentIdx = sections.findIndex(s => s.id === activeSection);
  const prev = currentIdx > 0 ? sections[currentIdx - 1] : null;
  const next = currentIdx < sections.length - 1 ? sections[currentIdx + 1] : null;

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="flex items-center h-14 px-4 lg:px-6 gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-1.5 text-gray-500 hover:text-gray-900"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link href="/" className="font-semibold text-foreground text-sm shrink-0">
            WorkChores
          </Link>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <span className="text-xs text-gray-500 hidden sm:inline">Docs</span>

          {/* Search */}
          <div className="relative flex-1 max-w-lg ml-auto sm:ml-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Search docs..."
              className="w-full pl-9 pr-10 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all bg-gray-50 focus:bg-white"
            />
            {!searchQuery && (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono hidden sm:inline">/</kbd>
            )}

            {/* Search results dropdown */}
            {searchFocused && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden z-50">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">
                    No results for &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  searchResults.map((result) => {
                    const Icon = sections.find(s => s.id === result.id)!.icon;
                    return (
                      <button
                        key={result.id}
                        onMouseDown={() => navigateTo(result.id)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                      >
                        <Icon className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900">{result.label}</div>
                          <div className="text-xs text-gray-400 truncate">
                            {result.subsections.join(" · ")}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/20 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Left sidebar */}
        <aside
          className={`fixed lg:sticky top-14 z-20 w-64 h-[calc(100vh-3.5rem)] bg-white border-r border-gray-200 overflow-y-auto transition-transform lg:translate-x-0 shrink-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="p-3 space-y-1">
            {groups.map((group) => {
              const collapsed = collapsedGroups.has(group);
              const groupSections = sections.filter(s => s.group === group);
              return (
                <div key={group} className="mb-1">
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {group}
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {!collapsed && (
                    <div className="space-y-0.5 mt-0.5">
                      {groupSections.map((s) => {
                        const Icon = s.icon;
                        const isActive = activeSection === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => navigateTo(s.id)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                              isActive
                                ? "bg-accent/10 text-accent font-medium"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 lg:px-12 py-8 max-w-4xl">
          <DocContent section={activeSection} />

          {/* Bottom navigation */}
          <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between">
            {prev ? (
              <button
                onClick={() => navigateTo(prev.id)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-accent transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                {prev.label}
              </button>
            ) : <div />}
            {next ? (
              <button
                onClick={() => navigateTo(next.id)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-accent transition-colors"
              >
                {next.label}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : <div />}
          </div>
        </main>

        {/* Right sidebar — On This Page + Related */}
        <aside className="hidden xl:block w-56 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-l border-gray-200 py-8 px-5">
          {/* On this page */}
          {currentSearchEntry && currentSearchEntry.subsections.length > 0 && (
            <div className="mb-8">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">On This Page</div>
              <ul className="space-y-1.5">
                {currentSearchEntry.subsections.map((sub) => (
                  <li key={sub}>
                    <span className="text-xs text-gray-500 hover:text-foreground transition-colors cursor-default">
                      {sub}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related topics */}
          {related.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Related</div>
              <ul className="space-y-1">
                {related.map((relId) => {
                  const rel = sections.find(s => s.id === relId)!;
                  const Icon = rel.icon;
                  return (
                    <li key={relId}>
                      <button
                        onClick={() => navigateTo(relId)}
                        className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-accent transition-colors py-1"
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        {rel.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Quick links */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Quick Links</div>
            <ul className="space-y-1.5">
              <li><Link href="/demo" className="text-xs text-accent hover:underline">Try the Demo</Link></li>
              <li><Link href="/signup" className="text-xs text-accent hover:underline">Get Started Free</Link></li>
              <li><Link href="/contact" className="text-xs text-accent hover:underline">Contact Support</Link></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
