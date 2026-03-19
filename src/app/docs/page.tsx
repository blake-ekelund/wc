"use client";

import { useState, useEffect } from "react";
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
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
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
  Archive,
  Tag,
  Phone,
  Pencil,
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
  | "industries";

const sections: { id: DocSection; label: string; icon: typeof LayoutDashboard; group: string }[] = [
  { id: "getting-started", label: "Getting Started", icon: Zap, group: "Basics" },
  { id: "industries", label: "Industry Templates", icon: Building2, group: "Basics" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Core Features" },
  { id: "contacts", label: "Contacts", icon: Users, group: "Core Features" },
  { id: "pipeline", label: "Pipeline", icon: GitBranch, group: "Core Features" },
  { id: "tasks", label: "Tasks", icon: CheckSquare, group: "Core Features" },
  { id: "calendar", label: "Calendar", icon: Calendar, group: "Core Features" },
  { id: "activity", label: "Activity Feed", icon: MessageSquare, group: "Core Features" },
  { id: "recommendations", label: "For You", icon: Lightbulb, group: "Core Features" },
  { id: "reports", label: "Reports", icon: BarChart3, group: "Core Features" },
  { id: "search", label: "Global Search", icon: Search, group: "Tools" },
  { id: "import", label: "Import Data", icon: Upload, group: "Tools" },
  { id: "export", label: "Export Data", icon: Download, group: "Tools" },
  { id: "email", label: "Email Integration", icon: Mail, group: "Tools" },
  { id: "settings", label: "Settings", icon: Settings, group: "Admin" },
  { id: "roles", label: "Roles & Permissions", icon: Shield, group: "Admin" },
];

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
            Email us at <a href="mailto:support@workchores.com" className="text-accent hover:underline">support@workchores.com</a> or use the help icon inside the app. We typically respond within 5 minutes during business hours (Mon–Fri, 9am–6pm ET).
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
              <FeatureCard icon={Users} title="1. Add your first contact" description="Click the + button in the top-right header → 'New Contact'. Fill in their name, email, company, and deal value. Hit Save. They appear in your contact list and pipeline instantly." />
              <FeatureCard icon={CheckSquare} title="2. Create a follow-up task" description="Click + → 'New Task'. Give it a title like 'Follow up with Jane', link it to the contact you just created, set a due date, and choose a priority. It shows up in your Tasks view and on the Calendar." />
              <FeatureCard icon={UserPlus} title="3. Invite a teammate" description="Go to Settings → Team Members. Enter their email and choose a role (Admin, Manager, or Member). They'll receive an email invite and can join your workspace immediately." />
              <FeatureCard icon={Upload} title="4. Import your contacts" description="If you have existing contacts in a spreadsheet, go to Import in the sidebar. Download our template, paste your data, and upload. We handle the rest — mapping columns, validating data, and creating contacts." />
              <FeatureCard icon={Mail} title="5. Connect your Gmail" description="Go to Settings → Email Templates → 'Connect Gmail'. Authorize WorkChores to send on your behalf. Now you can email contacts directly from the CRM — and every email is auto-logged on the contact's timeline." />
            </div>
            <Tip>The sidebar is draggable — grab the right edge and resize it to your preference. You can collapse it to icon-only mode for more screen space.</Tip>
          </SubSection>

          <SubSection title="Navigating the App">
            <Description>
              The app has three main areas:
            </Description>
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Layers} title="Sidebar (left)" description="Your main navigation. Access Dashboard, For You, Contacts, Pipeline, Tasks, Calendar, Activity, Reports, Import, Export, and Settings. Drag the edge to resize, or collapse to icons." />
              <FeatureCard icon={Search} title="Header (top)" description="Global search bar to find any contact or task. The + button for quick-adding contacts, tasks, or activities. Notification bell for alerts. Help icon for support." />
              <FeatureCard icon={LayoutDashboard} title="Main Content (center)" description="The active view — whatever page you've navigated to. Click a contact to drill into their detail page. Click Back to return." />
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
              The four stat cards at the top of your dashboard automatically adapt to your industry template. Each card shows a key metric with a trend indicator comparing to last month&apos;s performance.
            </Description>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <FeatureCard icon={Target} title="B2B Sales" description="Pipeline Value, Won This Month, Active Deals, Open Tasks" />
              <FeatureCard icon={Layers} title="SaaS" description="Pipeline ARR, Active MRR, Active Trials, Demos Scheduled" />
              <FeatureCard icon={Building2} title="Real Estate" description="Active Listings, Under Contract, Closed Volume, Avg. Deal Size" />
              <FeatureCard icon={Users} title="Recruiting" description="Active Candidates, In Interviews, Pending Offers, Hires This Month" />
            </div>
            <Tip>KPIs are computed from your live data in real-time. As you add contacts, close deals, and complete tasks, the numbers update automatically — no manual reporting needed.</Tip>
          </SubSection>

          <SubSection title="Pipeline Overview">
            <Description>
              Below the KPIs, a horizontal bar chart visualizes your pipeline by stage. Each bar shows the number of deals and total dollar value in that stage. Only stages with active contacts appear.
            </Description>
            <Instructions title="How to Use">
              <Step n={1}>Scan the bars to see where your deals are concentrated. A healthy pipeline has deals distributed across multiple stages.</Step>
              <Step n={2}>Click <strong>&quot;View Pipeline&quot;</strong> in the top-right to jump to the full Pipeline view with filtering and sorting.</Step>
              <Step n={3}>If a stage has too many deals stacking up, consider reassigning or following up — use the <strong>For You</strong> page for smart recommendations.</Step>
            </Instructions>
          </SubSection>

          <SubSection title="Upcoming Tasks">
            <Description>
              Your next 5 incomplete tasks, sorted by due date. Each task shows a color-coded badge so you can immediately see what needs attention:
            </Description>
            <div className="grid sm:grid-cols-3 gap-2 text-sm mb-4">
              <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> <span className="text-red-700 font-medium">Overdue</span></div>
              <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> <span className="text-amber-700 font-medium">Due Today</span></div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> <span className="text-blue-700 font-medium">Upcoming</span></div>
            </div>
            <Description>Click any task to open its detail view where you can edit, complete, or reassign it.</Description>
          </SubSection>

          <SubSection title="Recent Activity">
            <Description>
              The last 5 touchpoints logged across your workspace — calls, emails, meetings, and notes. Each entry shows the activity type, linked contact, and date. Click any activity to navigate directly to that contact&apos;s detail page and see the full relationship history.
            </Description>
            <Tip>If the Recent Activity section looks empty, start logging touchpoints from any contact&apos;s detail page. Every call, email, and meeting you record appears here automatically.</Tip>
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
              <Step n={3}>The contact detail page opens in edit mode. Fill in the name, email, phone, company, role, and deal value.</Step>
              <Step n={4}>Choose a <strong>pipeline stage</strong> and <strong>owner</strong> from the dropdowns.</Step>
              <Step n={5}>Click <strong>Save Changes</strong>. The contact is now in your database.</Step>
            </Instructions>
            <Instructions title="Method 2: Import from Spreadsheet">
              <Step n={1}>Go to <strong>Import</strong> in the sidebar.</Step>
              <Step n={2}>Follow the 4-step wizard: configure fields → download template → fill in data → upload. See the <button className="text-accent hover:underline font-medium">Import Data</button> section for full details.</Step>
            </Instructions>
            <Tip>When you save a contact, WorkChores automatically checks for duplicates. If someone with a similar name, matching email, or phone number already exists, you&apos;ll see a warning with a match confidence score before creating a duplicate.</Tip>
          </SubSection>

          <SubSection title="Contact List View">
            <Description>
              The main Contacts page shows a sortable table of all active contacts. Each row displays the avatar, name, company, pipeline stage (color pill), deal value, owner, and last contact date.
            </Description>
            <Instructions title="Filtering & Searching">
              <Step n={1}><strong>Stage Filter Pills</strong> — Click any pipeline stage at the top to show only contacts in that stage. An &quot;Unassigned&quot; filter highlights contacts with no owner.</Step>
              <Step n={2}><strong>Global Search</strong> — Type in the search bar to find contacts by name, email, phone number, company, role, tags, or stage. Phone searches are normalized (you can type any format).</Step>
              <Step n={3}><strong>Archive &amp; Trash Icons</strong> — The icons at the top-right of the contacts page let you toggle between active contacts, archived contacts, and trashed contacts.</Step>
            </Instructions>
          </SubSection>

          <SubSection title="Bulk Actions">
            <Description>
              Need to update multiple contacts at once? Select them using the checkboxes on each row (or &quot;Select All&quot;), and an action bar appears with powerful bulk operations.
            </Description>
            <Instructions title="Available Bulk Actions">
              <Step n={1}><strong>Change Stage</strong> — Move all selected contacts to a different pipeline stage in one click.</Step>
              <Step n={2}><strong>Reassign Owner</strong> — Transfer selected contacts to another team member.</Step>
              <Step n={3}><strong>Send Bulk Email</strong> — Compose a single email and send it individually to each selected contact (they don&apos;t see each other). Requires a connected Gmail account.</Step>
              <Step n={4}><strong>Archive</strong> — Hide selected contacts from the active view. They&apos;re preserved and can be restored anytime.</Step>
              <Step n={5}><strong>Move to Trash</strong> — Soft-delete selected contacts. They go to the trash and can be restored or permanently deleted.</Step>
            </Instructions>
            <Tip>Bulk email sends individually to each contact — recipients never see each other&apos;s email addresses. Gmail daily limits: 250 emails (personal Gmail) or 2,000 emails (Google Workspace). The send modal shows your remaining quota.</Tip>
          </SubSection>

          <SubSection title="Contact Detail Page">
            <Description>
              Click any contact to open their full profile. This is where you see everything about a relationship in one place — info, interactions, tasks, custom fields, and notes.
            </Description>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <FeatureCard icon={Pencil} title="Inline Editing" description="Click the pencil icon to edit name, email, phone, company, role, deal value, stage, and owner directly on the page." />
              <FeatureCard icon={Tag} title="Tags" description="Add tags to categorize contacts (e.g., 'VIP', 'Referral', 'Cold Lead'). Type a tag name and press Enter." />
              <FeatureCard icon={Layers} title="Custom Fields" description="View and edit custom field values. Admins can create new text, number, date, or dropdown fields right from the contact page." />
              <FeatureCard icon={Mail} title="Send Email" description="Click the email icon to compose and send an email. Choose from templates or write freeform. Emails are sent via your connected Gmail." />
              <FeatureCard icon={Phone} title="Touchpoints" description="Log calls, emails, meetings, and notes. Each touchpoint has a title, description, date, and type. View a complete timeline of all interactions." />
              <FeatureCard icon={CheckSquare} title="Tasks" description="Create tasks linked to this contact — follow-ups, proposals, demos. Set due dates, priorities, and owners." />
              <FeatureCard icon={Sparkles} title="Duplicate Detection" description="When saving, the system checks for potential duplicates using fuzzy name matching, email, phone, and company. Shows confidence scores." />
              <FeatureCard icon={Archive} title="Archive & Delete" description="Use the ··· menu to archive (hide) or trash (soft-delete). Both are recoverable from the Contacts page." />
            </div>
          </SubSection>

          <SubSection title="Archive & Trash">
            <Description>
              WorkChores uses a two-tier system for removing contacts, similar to how email works:
            </Description>
            <Instructions>
              <Step n={1}><strong>Archive</strong> — Hides a contact from your active list but preserves all their data. Use this for contacts you&apos;re done working with but might need later. Click the archive icon on the Contacts page to view and restore archived contacts.</Step>
              <Step n={2}><strong>Trash</strong> — Soft-deletes a contact. They move to the trash where they can be restored individually or permanently deleted. Click the trash icon on the Contacts page to manage trashed contacts.</Step>
              <Step n={3}><strong>Empty Trash</strong> — Permanently deletes all trashed contacts. This action cannot be undone. A confirmation dialog prevents accidental deletion.</Step>
            </Instructions>
            <Tip>Archived contacts can be moved directly to trash without restoring first. From the archive view, click the trash icon on any contact to move it to trash.</Tip>
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
              The Pipeline view gives you a bird&apos;s-eye view of every deal in your funnel. At a glance, you can see how much revenue is in each stage, where deals are stacking up, and which deals need attention. It&apos;s the view most sales teams live in day-to-day.
            </Description>
          </SubSection>

          <SubSection title="Funnel Summary">
            <Description>
              Color-coded cards at the top show each pipeline stage with the number of deals and total dollar value. These cards are interactive — click any card to filter the table below to just that stage.
            </Description>
            <Instructions title="Reading the Funnel">
              <Step n={1}>Scan the cards left to right — they follow your pipeline order (Lead → Qualified → Proposal → etc.).</Step>
              <Step n={2}>Look for <strong>bottlenecks</strong> — if one stage has significantly more deals than the next, contacts may be getting stuck there.</Step>
              <Step n={3}>Click a stage card to focus the deal table below on just those contacts. Click it again (or &quot;Clear Filters&quot;) to reset.</Step>
            </Instructions>
          </SubSection>

          <SubSection title="Deal Table">
            <Description>
              Below the funnel cards, a sortable table lists every deal with: contact name and company (with avatar), pipeline stage (color pill), deal value, owner, last contact date, and tags.
            </Description>
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Search} title="Search Deals" description="Type in the search bar to find deals by contact name, company, or email. Results filter instantly as you type." />
              <FeatureCard icon={Users} title="Filter by Owner" description="Use the owner dropdown to view only deals belonging to a specific team member. Great for managers reviewing their team's pipeline." />
              <FeatureCard icon={Layers} title="Sort Columns" description="Click any column header (Name, Value, Owner) to sort ascending or descending. Find your highest-value deals or most recent contacts quickly." />
            </div>
            <Tip>Click any deal row to jump directly to that contact&apos;s detail page, where you can edit their info, log a touchpoint, or send an email.</Tip>
          </SubSection>

          <SubSection title="Customizing Your Pipeline">
            <Description>
              Your pipeline stages are fully customizable. Every team has a different sales process, and your CRM should reflect yours.
            </Description>
            <Instructions title="How to Customize">
              <Step n={1}>Go to <strong>Settings → Pipeline</strong>.</Step>
              <Step n={2}><strong>Rename</strong> — Click any stage name to edit it inline.</Step>
              <Step n={3}><strong>Recolor</strong> — Click the color dot next to a stage name. Choose from 10 color options.</Step>
              <Step n={4}><strong>Reorder</strong> — Drag stages up and down using the grip handle to change their order in the funnel.</Step>
              <Step n={5}><strong>Add</strong> — Click &quot;Add Stage&quot; at the bottom to create a new stage.</Step>
              <Step n={6}><strong>Remove</strong> — Click the trash icon on any stage. If contacts exist in that stage, you&apos;ll be asked to reassign them to another stage before removal.</Step>
            </Instructions>
            <Tip>Changes to your pipeline are reflected everywhere instantly — the Pipeline view, contact stage dropdowns, dashboard KPIs, and reports all update automatically.</Tip>
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
              Tasks are how you ensure nothing falls through the cracks. Every follow-up call, proposal deadline, demo meeting, and to-do item lives here. Tasks can be linked to contacts, assigned to team members, and organized by priority and due date.
            </Description>
          </SubSection>

          <SubSection title="Task Dashboard">
            <Description>
              The Tasks page opens with five status cards that give you an instant overview of your workload:
            </Description>
            <div className="grid grid-cols-5 gap-2 text-xs mb-4">
              <div className="p-2 bg-red-50 rounded-lg text-center"><span className="font-bold text-red-700">Overdue</span></div>
              <div className="p-2 bg-amber-50 rounded-lg text-center"><span className="font-bold text-amber-700">Today</span></div>
              <div className="p-2 bg-blue-50 rounded-lg text-center"><span className="font-bold text-blue-700">Upcoming</span></div>
              <div className="p-2 bg-gray-50 rounded-lg text-center"><span className="font-bold text-gray-600">Later</span></div>
              <div className="p-2 bg-emerald-50 rounded-lg text-center"><span className="font-bold text-emerald-700">Done</span></div>
            </div>
            <Description>Click any status card to filter the list. A progress bar below shows your overall completion rate — red for overdue, accent for completed, gray for remaining.</Description>
          </SubSection>

          <SubSection title="Creating a Task">
            <Instructions>
              <Step n={1}>Click <strong>Add Task</strong> at the top of the Tasks page, or use the <strong>+ button</strong> in the header and select &quot;New Task.&quot;</Step>
              <Step n={2}>Enter a descriptive <strong>title</strong> (e.g., &quot;Follow up with Jane about proposal&quot;).</Step>
              <Step n={3}>Add optional <strong>notes/description</strong> — meeting prep, talking points, context for whoever picks up the task.</Step>
              <Step n={4}>Set the <strong>due date</strong> using the date picker.</Step>
              <Step n={5}>Choose a <strong>priority</strong>: High (red), Medium (amber), or Low (gray).</Step>
              <Step n={6}>Assign an <strong>owner</strong> — yourself or any team member.</Step>
              <Step n={7}>Optionally <strong>link to a contact</strong> using the searchable dropdown. This makes the task appear on the contact&apos;s detail page too.</Step>
              <Step n={8}>Click <strong>Save</strong>. The task is created and immediately visible in your task list, calendar, and notifications.</Step>
            </Instructions>
            <Tip>Tasks linked to contacts create a powerful relationship trail. When you open a contact&apos;s page, you see all their tasks alongside touchpoints — giving you complete context before every interaction.</Tip>
          </SubSection>

          <SubSection title="Managing Tasks">
            <Description>Day-to-day task management is fast and intuitive:</Description>
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={CheckSquare} title="Complete a Task" description="Click the circle icon next to any task in the list to mark it done. Click again to reopen it. Completed tasks move to the 'Done' section." />
              <FeatureCard icon={Pencil} title="Edit a Task" description="Click any task to open its detail view. Edit the title, notes, due date, priority, owner, or linked contact. Changes save when you click Save." />
              <FeatureCard icon={Trash2} title="Delete a Task" description="Open a task's detail view and click Delete. A confirmation dialog prevents accidental deletion. This action is permanent." />
            </div>
            <Tip>Tasks automatically appear in three places: the Tasks list, the Calendar (on their due date), and the linked contact&apos;s detail page. Update a task in any location and it syncs everywhere.</Tip>
          </SubSection>

          <SubSection title="Filters">
            <Description>
              Beyond the status cards, you can filter by <strong>Priority</strong> (High, Medium, Low) and <strong>Owner</strong> (any team member). Combine filters to narrow down exactly what you need — for example, show only high-priority overdue tasks assigned to you.
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
              The Calendar gives you a visual timeline of everything happening across your pipeline. Tasks and touchpoints are plotted on a monthly grid so you can see at a glance what&apos;s coming up, what happened last week, and where gaps exist in your outreach.
            </Description>
          </SubSection>

          <SubSection title="Using the Calendar">
            <Instructions>
              <Step n={1}><strong>Navigate months</strong> — Use the left/right arrows to move between months. Click &quot;Today&quot; to jump back to the current month.</Step>
              <Step n={2}><strong>Scan the grid</strong> — Each day shows small color-coded pills. Task pills use priority colors (red/amber/gray). Touchpoint pills use type colors (blue for calls/emails, violet for meetings).</Step>
              <Step n={3}><strong>Click any day</strong> — A detail panel opens showing every task and touchpoint on that date with full details: titles, descriptions, linked contacts, priorities, and completion status.</Step>
              <Step n={4}><strong>Navigate from the calendar</strong> — Click a task in the day panel to open the task detail. Click a touchpoint to jump to the linked contact&apos;s page.</Step>
            </Instructions>
          </SubSection>

          <SubSection title="Color Legend">
            <Description>Each pill on the calendar is color-coded so you can scan quickly:</Description>
            <div className="grid sm:grid-cols-2 gap-2 text-sm mb-4">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><span className="w-3 h-3 rounded-full bg-red-500" /> High priority task</div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><span className="w-3 h-3 rounded-full bg-amber-500" /> Medium priority task</div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><span className="w-3 h-3 rounded-full bg-gray-400" /> Low priority task</div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Completed task</div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><span className="w-3 h-3 rounded-full bg-blue-500" /> Call / Email touchpoint</div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded"><span className="w-3 h-3 rounded-full bg-violet-500" /> Meeting touchpoint</div>
            </div>
            <Tip>Look for days with no pills — those are gaps in your outreach. If a contact hasn&apos;t been touched in weeks, the &quot;For You&quot; page will also flag them as stale.</Tip>
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
              The Activity Feed is your workspace&apos;s complete interaction history. Every call, email, meeting, and note logged anywhere in the CRM shows up here in chronological order. It&apos;s the place to go when you need to see the big picture of what your team has been doing.
            </Description>
          </SubSection>

          <SubSection title="Activity Types">
            <Description>WorkChores supports four types of activities (touchpoints):</Description>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <FeatureCard icon={Phone} title="Calls" description="Phone calls with contacts. Log the outcome, duration, and any follow-up notes." />
              <FeatureCard icon={Mail} title="Emails" description="Email exchanges. Emails sent from the CRM are auto-logged here. You can also manually log emails sent outside the CRM." />
              <FeatureCard icon={Calendar} title="Meetings" description="In-person or virtual meetings. Record attendees, agenda, and key discussion points." />
              <FeatureCard icon={FileText} title="Notes" description="Internal notes about a contact or deal — strategy thoughts, reminders, research. Not shared with the contact." />
            </div>
          </SubSection>

          <SubSection title="Logging Activity">
            <Description>There are three ways to log an activity:</Description>
            <Instructions>
              <Step n={1}><strong>Quick Add</strong> — Click the <strong>+ button</strong> in the header → &quot;Log Activity.&quot; This creates a note-type touchpoint and navigates to the Activity view.</Step>
              <Step n={2}><strong>From a Contact</strong> — Open any contact&apos;s detail page → go to the Touchpoints tab → click &quot;+ Add.&quot; Choose the type, enter a title and description, and save.</Step>
              <Step n={3}><strong>Automatic</strong> — When you send an email from the CRM using a connected Gmail account, it&apos;s automatically logged as an email touchpoint on the contact&apos;s timeline.</Step>
            </Instructions>
            <Tip>Consistent activity logging is the key to a useful CRM. Spend 30 seconds after every call or meeting to log it — your future self (and your team) will thank you.</Tip>
          </SubSection>

          <SubSection title="Filtering">
            <Description>
              Use the filter pills at the top of the Activity page to show only specific types: All, Calls, Emails, Meetings, or Notes. Each activity card shows the type icon, title, linked contact (with avatar), description, date, and owner. Click any activity to navigate directly to the linked contact&apos;s detail page.
            </Description>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "recommendations":
      return (
        <div>
          <SectionHeader icon={Lightbulb} title="For You (Recommendations)" description="AI-powered daily briefing with smart, actionable suggestions to move your deals forward." />

          <SubSection title="How It Works">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              The &quot;For You&quot; page analyzes your contacts, tasks, and activity to surface the most important things that need your attention right now. It updates in real-time as your data changes.
            </p>
          </SubSection>

          <SubSection title="Recommendation Types">
            <div className="grid gap-3">
              <FeatureCard icon={Trash2} title="Overdue Tasks" description="Tasks past their due date that need immediate attention." />
              <FeatureCard icon={Users} title="Stale Contacts" description="Contacts with no recent touchpoints who may need a follow-up." />
              <FeatureCard icon={Target} title="High-Value Opportunities" description="Deals in early stages with high value that could be pushed forward." />
              <FeatureCard icon={Sparkles} title="Negotiation Deals" description="Contacts in the negotiation stage that need action to close." />
              <FeatureCard icon={Bell} title="At-Risk Proposals" description="Proposals with limited engagement that might go cold." />
              <FeatureCard icon={CheckSquare} title="Tasks Due Today" description="Today's to-do list so nothing falls through the cracks." />
            </div>
          </SubSection>

          <SubSection title="Configuration">
            <Description>
              Customize which recommendation types appear and their sensitivity thresholds in <strong>Settings → Alerts</strong>.
            </Description>
            <Instructions title="How to Configure">
              <Step n={1}>Go to <strong>Settings → Alerts</strong>.</Step>
              <Step n={2}>Toggle each alert type on or off: overdue tasks, due today, negotiation deals, stale contacts, at-risk proposals.</Step>
              <Step n={3}>Adjust thresholds: <strong>Stale Days</strong> (how many days without a touchpoint before flagging), <strong>At-Risk Touchpoints</strong> (minimum touchpoints before a proposal is considered at-risk), <strong>High-Value Threshold</strong> (dollar amount that triggers high-value deal alerts).</Step>
              <Step n={4}>Click <strong>Save Changes</strong>. Recommendations update immediately.</Step>
            </Instructions>
            <Tip>Start with all recommendations turned on. After a week, turn off any types that aren&apos;t useful for your workflow. The goal is a &quot;For You&quot; page that always shows things worth acting on.</Tip>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "reports":
      return (
        <div>
          <SectionHeader icon={BarChart3} title="Reports" description="Key metrics and performance data to understand how your team and pipeline are performing." />

          <SubSection title="Overview">
            <Description>
              The Reports page gives you a data-driven view of your business. Pipeline KPIs, task completion rates, activity breakdowns, and team performance — all computed from your live data. No setup required. No manual data entry.
            </Description>
          </SubSection>

          <SubSection title="Pipeline KPIs">
            <Description>
              Four top-level metrics that tell you how your pipeline is performing:
            </Description>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <FeatureCard icon={Target} title="Pipeline Value" description="Total dollar value of all active deals (excluding won and lost)." />
              <FeatureCard icon={CheckSquare} title="Revenue Won" description="Total value of deals in 'Closed Won' or equivalent stage." />
              <FeatureCard icon={BarChart3} title="Win Rate" description="Percentage of deals that closed won vs. total closed (won + lost). A key health metric." />
              <FeatureCard icon={Users} title="Avg. Deal Size" description="Average value across all active deals. Useful for forecasting." />
            </div>
          </SubSection>

          <SubSection title="Task & Activity Metrics">
            <Description>
              Additional cards show operational health: open task count (with overdue count highlighted in red), task completion rate, total activities logged in the last 30 days, and average touchpoints per contact. Low touchpoints-per-contact often correlates with lower win rates — use this metric to encourage consistent outreach.
            </Description>
          </SubSection>

          <SubSection title="Visualizations">
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={GitBranch} title="Pipeline by Stage" description="Horizontal bar chart showing deal count and value per stage. Spot bottlenecks instantly — if one stage has 10x the deals of the next, contacts are getting stuck." />
              <FeatureCard icon={MessageSquare} title="Activity Breakdown" description="Bar chart showing the distribution of calls, emails, meetings, and notes with percentage breakdowns. See if your team is over-indexing on one channel." />
              <FeatureCard icon={Users} title="Team Performance" description="Table showing per-member: contact count, total pipeline value, task count, and task completion rate. Only appears when you have multiple team members. Great for 1-on-1 coaching." />
            </div>
            <Tip>Reports are based on live data and respect role-based visibility. Admins see all data. Managers see their team&apos;s data. Members see only their own.</Tip>
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
              Already have contacts in a spreadsheet, another CRM, or a CSV file? The Import wizard walks you through getting them into WorkChores in four simple steps. The template we generate includes dropdown validations so your data matches your pipeline stages and custom fields perfectly.
            </Description>
          </SubSection>

          <SubSection title="How to Import">
            <Instructions title="4-Step Import Process">
              <Step n={1}>
                <strong>Configure your fields.</strong> Toggle which fields you want to include in the import. Name is always required. Optionally include email, company, role, phone, pipeline stage, deal value, tags, owner, and any custom fields you&apos;ve created.
              </Step>
              <Step n={2}>
                <strong>Download the template.</strong> Click &quot;Download Template&quot; to get an Excel (.xlsx) file with your selected columns. The template includes sample data so you know the expected format, plus dropdown validations for pipeline stages and custom select fields.
              </Step>
              <Step n={3}>
                <strong>Fill in your data.</strong> Open the template in Excel or Google Sheets. Replace the sample data with your contacts. Use the dropdowns for stage and custom fields. Save the file.
              </Step>
              <Step n={4}>
                <strong>Upload and confirm.</strong> Upload your filled-out file (Excel or CSV). A preview table shows how your data will be imported. Review it, then click &quot;Import Contacts&quot; to create all contacts at once.
              </Step>
            </Instructions>
            <Tip>The template includes a &quot;Valid Options&quot; reference sheet listing all accepted values for dropdown fields. If you&apos;re using Google Sheets, the dropdowns may not appear — use the reference sheet to ensure correct values.</Tip>
            <Tip>Emails that auto-hyperlink in Excel are handled automatically — we strip hyperlinks during import so you get clean email addresses.</Tip>
            <Tip>Custom fields you&apos;ve created in Settings appear as additional columns in the template. This means you can import custom data in bulk.</Tip>
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
              Need to share data with your team, create a report, or back up your CRM? The Export wizard lets you download your contacts, tasks, and activity as Excel or CSV files. Admin users can export everything; non-admin users export only data they have access to.
            </Description>
          </SubSection>

          <SubSection title="What You Can Export">
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Users} title="Contacts" description="All contact fields including custom fields, tags, stage, value, and owner. Includes archived/deleted if toggled." />
              <FeatureCard icon={CheckSquare} title="Tasks" description="Task title, description, due date, priority, completion status, owner, and the linked contact name." />
              <FeatureCard icon={MessageSquare} title="Activity" description="All touchpoints — calls, emails, meetings, and notes with their dates, descriptions, and linked contacts." />
            </div>
          </SubSection>

          <SubSection title="How to Export">
            <Instructions>
              <Step n={1}><strong>Select data types</strong> — Toggle one or more: Contacts, Tasks, Activity. You can export them all together or individually.</Step>
              <Step n={2}><strong>Apply filters</strong> — Optionally filter by owner (admin only) and/or pipeline stage. Toggle &quot;Include archived/deleted&quot; to include those records.</Step>
              <Step n={3}><strong>Choose format</strong> — <strong>Excel (.xlsx)</strong> creates a multi-sheet workbook (one sheet per data type). <strong>CSV (.csv)</strong> creates separate files per data type.</Step>
              <Step n={4}><strong>Click Export</strong> — The file downloads to your computer. The summary shows how many records were exported.</Step>
            </Instructions>
            <Tip>Managers and members can only export data they have access to. If you need a full workspace export, ask an admin to run it.</Tip>
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
              Settings is your workspace control center. Only <strong>Admin</strong> users can access Settings. It has six tabs covering everything from company info to email integration.
            </Description>
          </SubSection>

          <SubSection title="Company Info">
            <Description>
              Edit your company name and timezone. This tab also contains the <strong>Clear Sample Data</strong> button — use this when you&apos;re ready to remove all demo contacts, tasks, and touchpoints and start fresh with your own data. Your pipeline stages, custom fields, and team members are preserved.
            </Description>
          </SubSection>

          <SubSection title="Team Members">
            <Description>Manage your team, send invites, set roles, and configure who reports to whom.</Description>
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={UserPlus} title="Invite Members" description="Enter an email and choose a role. We send an invite email with a link to join your workspace. If email rate limits are hit, a shareable signup link is provided instead." />
              <FeatureCard icon={Users} title="Manage Team" description="Search and filter members by name or role. Members are grouped by role (Admin/Manager/Member) in collapsible sections. Each row shows name, email, role badge, and status." />
              <FeatureCard icon={GripVertical} title="Reporting Structure" description="Set 'reports to' relationships to define your team hierarchy. This directly controls data visibility — managers see their direct reports' data." />
              <FeatureCard icon={Trash2} title="Remove Members" description="When removing a member, a modal asks you to reassign their contacts, tasks, and activity to another team member. Nothing is lost." />
            </div>
            <Tip>The &quot;Data Visibility&quot; accordion at the bottom of the Team tab shows exactly what each team member can see based on their role and reporting structure. Use this to verify your setup is correct.</Tip>
          </SubSection>

          <SubSection title="Pipeline">
            <Description>Fully customize your sales pipeline stages.</Description>
            <Instructions>
              <Step n={1}><strong>Rename</strong> — Click any stage name to edit it inline.</Step>
              <Step n={2}><strong>Recolor</strong> — Click the color dot. Choose from 10 color options.</Step>
              <Step n={3}><strong>Reorder</strong> — Drag stages up and down using the grip handle on the left.</Step>
              <Step n={4}><strong>Add</strong> — Click &quot;Add Stage&quot; at the bottom.</Step>
              <Step n={5}><strong>Remove</strong> — Click the trash icon. If contacts exist in that stage, you&apos;ll choose where to reassign them.</Step>
              <Step n={6}><strong>Save</strong> — Click &quot;Save Changes&quot; to apply. Changes reflect everywhere instantly.</Step>
            </Instructions>
          </SubSection>

          <SubSection title="Alerts">
            <Description>
              Control which alerts appear in your notification bell and &quot;For You&quot; page. Toggle each type independently and set custom thresholds: stale days (how long before a contact is flagged), at-risk touchpoint count, and high-value deal threshold.
            </Description>
          </SubSection>

          <SubSection title="Email Templates">
            <Description>
              Create reusable email templates for follow-ups, introductions, proposals, thank-yous, and check-ins. Each template has a name, category, subject line, and body. Templates support variables that auto-fill when sending: <code className="bg-gray-100 px-1 rounded text-xs">{"{{firstName}}"}</code>, <code className="bg-gray-100 px-1 rounded text-xs">{"{{company}}"}</code>, <code className="bg-gray-100 px-1 rounded text-xs">{"{{senderName}}"}</code>.
            </Description>
            <Description>
              This tab is also where you <strong>connect your Gmail</strong> for sending emails directly from the CRM. See the <strong>Email Integration</strong> section for details.
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
                <p className="text-xs text-red-700 leading-relaxed">Full access to all data across the entire workspace. Can see every contact, task, and touchpoint regardless of owner. Can manage settings, team members, pipeline, and billing.</p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">Manager</span>
                </div>
                <p className="text-xs text-amber-700 leading-relaxed">Sees their own data plus data belonging to team members who report to them. Cannot access settings or manage the team.</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-800">Member</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">Sees only their own contacts, tasks, and touchpoints. Cannot access settings, team management, or other members' data.</p>
              </div>
            </div>
          </SubSection>

          <SubSection title="Data Visibility">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Data visibility is determined by the <strong>owner</strong> field on each contact, task, and touchpoint, combined with the team hierarchy (&quot;reports to&quot; relationships).
            </p>
            <Step n={1}><strong>Admin:</strong> Sees all data. No filtering applied.</Step>
            <Step n={2}><strong>Manager:</strong> Sees data owned by themselves + anyone who reports to them.</Step>
            <Step n={3}><strong>Member:</strong> Sees only data they own.</Step>
            <Tip>Set up &quot;reports to&quot; relationships in Settings → Team Members. A manager named Lisa with two reports (Tom, Sarah) sees her own data plus Tom&apos;s and Sarah&apos;s.</Tip>
          </SubSection>

          <SubSection title="Admin-Only Features">
            <Description>
              The following features are restricted to Admin users only:
            </Description>
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Settings} title="Settings Page" description="Full access to company info, billing, team management, pipeline customization, alert configuration, and email templates." />
              <FeatureCard icon={Layers} title="Custom Fields" description="Creating, editing, and deleting custom field definitions on contacts. Non-admins can fill in values but not create new fields." />
              <FeatureCard icon={UserPlus} title="Team Management" description="Inviting, removing, and changing roles of team members. Setting reporting structure." />
              <FeatureCard icon={GitBranch} title="Pipeline Customization" description="Adding, removing, renaming, recoloring, and reordering pipeline stages." />
              <FeatureCard icon={Bell} title="Alert Configuration" description="Toggling alert types and adjusting thresholds for notifications and recommendations." />
            </div>
            <Tip>In the demo, use the role switcher at the bottom of the sidebar to preview exactly how each role sees the CRM. Switch to &quot;Member&quot; to see the restricted experience.</Tip>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "email":
      return (
        <div>
          <SectionHeader icon={Mail} title="Email Integration" description="Connect your Gmail to send emails directly from WorkChores without leaving the CRM." />

          <SubSection title="Connecting Gmail">
            <Step n={1}>Go to <strong>Settings → Email Templates</strong>.</Step>
            <Step n={2}>Click <strong>Connect Gmail</strong>. You&apos;ll be redirected to Google to authorize WorkChores.</Step>
            <Step n={3}>Grant permission to send emails on your behalf. WorkChores only requests send permission — we cannot read your inbox.</Step>
            <Step n={4}>You&apos;re connected! A green badge shows your connected email address.</Step>
            <Tip>Emails are sent from YOUR Gmail account, so they appear in your Sent folder and replies come back to your inbox. WorkChores never touches your inbox — we only send.</Tip>
          </SubSection>

          <SubSection title="Sending Emails">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">Two ways to send emails from the CRM:</p>
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Users} title="From Contact Detail" description="Open any contact with an email address and click the email icon. Compose your message, optionally use a template, and send." />
              <FeatureCard icon={Layers} title="Bulk Email" description="Select multiple contacts on the Contacts page, then click the email icon in the bulk actions bar. Compose once, send individually to each contact." />
            </div>
          </SubSection>

          <SubSection title="Email Templates">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Create reusable templates in Settings → Email Templates. Templates support three variables that auto-fill when sending:
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono space-y-1 mb-4">
              <div><code className="text-accent">{"{{firstName}}"}</code> — Contact&apos;s first name</div>
              <div><code className="text-accent">{"{{company}}"}</code> — Contact&apos;s company</div>
              <div><code className="text-accent">{"{{senderName}}"}</code> — Your name</div>
            </div>
          </SubSection>

          <SubSection title="Rate Limits">
            <Description>
              Google enforces daily sending limits to prevent spam. These limits apply to emails sent via the Gmail API (which is what WorkChores uses):
            </Description>
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
            <Description>The bulk email modal shows your remaining quota and warns you if the send would exceed your limit. Limits reset every 24 hours on a rolling basis.</Description>
          </SubSection>

          <SupportBox />
        </div>
      );

    case "search":
      return (
        <div>
          <SectionHeader icon={Search} title="Global Search" description="Find any contact or task instantly from anywhere in the app." />

          <SubSection title="How to Search">
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Click the search bar in the top-right header (or press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs font-mono">/</kbd>) and start typing. Results appear instantly in a dropdown as you type.
            </p>
          </SubSection>

          <SubSection title="What You Can Search">
            <div className="grid gap-3 mb-4">
              <FeatureCard icon={Users} title="Contacts" description="Search by name, company, email, phone, role, tags, or pipeline stage." />
              <FeatureCard icon={CheckSquare} title="Tasks" description="Search by task title or description." />
            </div>
          </SubSection>

          <SubSection title="Smart Features">
            <div className="grid gap-3">
              <FeatureCard icon={Phone} title="Phone Normalization" description="Type any format — (555) 123-4567, 555-123-4567, or 5551234567 — and it matches. Numbers are normalized to digits-only for comparison." />
              <FeatureCard icon={Mail} title="Contextual Subtitles" description="Search results show the most relevant detail: phone number if you searched by phone, email if you searched by email, or company and stage by default." />
            </div>
            <Tip>Phone search requires at least 3 digits to avoid false positives. This means searching &quot;55&quot; won&apos;t match phone numbers, but &quot;555&quot; will.</Tip>
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
              <FeatureCard icon={Target} title="B2B Sales" description="Lead → Qualified → Proposal → Negotiation → Closed Won/Lost. Classic enterprise sales pipeline." />
              <FeatureCard icon={Layers} title="SaaS" description="Trial → Demo → Evaluation → Negotiation → Subscribed/Churned. Software subscription flow." />
              <FeatureCard icon={Building2} title="Real Estate" description="Inquiry → Showing → Offer → Under Contract → Closed/Lost. Property transaction tracking." />
              <FeatureCard icon={Users} title="Recruiting" description="Applied → Phone Screen → Interview → Offer → Hired/Rejected. Candidate pipeline." />
              <FeatureCard icon={Sparkles} title="Consulting" description="Discovery → Proposal → SOW Review → Engaged → Completed/Lost. Professional services pipeline." />
              <FeatureCard icon={Settings} title="Home Services" description="Inquiry → Estimate → Scheduled → In Progress → Completed/Cancelled. Service job tracking." />
            </div>
          </SubSection>

          <SubSection title="What Each Template Includes">
            <Step n={1}><strong>Pipeline stages</strong> — 5-6 stages with industry-appropriate names and colors.</Step>
            <Step n={2}><strong>Dashboard KPIs</strong> — Four metrics tailored to your industry (e.g., ARR for SaaS, Active Listings for Real Estate).</Step>
            <Step n={3}><strong>Sample contacts</strong> — 10-16 realistic contacts pre-populated with data so you can explore immediately.</Step>
            <Step n={4}><strong>Sample tasks</strong> — Industry-relevant tasks linked to sample contacts with descriptions.</Step>
            <Step n={5}><strong>Sample touchpoints</strong> — Recent activity pre-filled to show how the timeline works.</Step>
            <Tip>You can always customize everything after choosing a template. Change stage names, colors, order — or add entirely new stages in Settings → Pipeline. The template is a starting point, not a constraint.</Tip>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // 16rem = 256px
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const groups = Array.from(new Set(sections.map((s) => s.group)));

  // Sidebar drag resize
  useEffect(() => {
    if (!isDragging) return;
    function handleMouseMove(e: MouseEvent) {
      const newWidth = Math.min(Math.max(e.clientX, 48), 400);
      if (newWidth <= 64) {
        setSidebarCollapsed(true);
        setSidebarWidth(48);
      } else {
        setSidebarCollapsed(false);
        setSidebarWidth(newWidth);
      }
    }
    function handleMouseUp() {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-20 top-0 bottom-0 left-0 bg-white border-r border-gray-200 flex flex-col relative ${
          isDragging ? "" : "transition-[width] duration-200"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ width: sidebarWidth }}
      >
        {/* Sidebar header */}
        <div className={`flex items-center h-14 border-b border-gray-200 shrink-0 ${sidebarCollapsed ? "justify-center px-2" : "px-4"} gap-2`}>
          {sidebarCollapsed ? (
            <button
              onClick={() => { setSidebarCollapsed(false); setSidebarWidth(256); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          ) : (
            <>
              <Link href="/" className="flex items-center gap-2 text-gray-900 hover:text-accent transition-colors min-w-0">
                <span className="font-semibold text-sm truncate">WorkChores</span>
                <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
              </Link>
              <button
                onClick={() => { setSidebarCollapsed(true); setSidebarWidth(48); }}
                className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors hidden lg:flex"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {!sidebarCollapsed ? (
            groups.map((group) => (
              <div key={group}>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2 px-2">
                  {group}
                </div>
                <div className="space-y-0.5">
                  {sections
                    .filter((s) => s.group === group)
                    .map((s) => {
                      const Icon = s.icon;
                      const isActive = activeSection === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => { setActiveSection(s.id); setSidebarOpen(false); window.scrollTo(0, 0); }}
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
              </div>
            ))
          ) : (
            /* Collapsed: icons only */
            sections.map((s) => {
              const Icon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => { setActiveSection(s.id); setSidebarOpen(false); window.scrollTo(0, 0); }}
                  className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                  title={s.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })
          )}
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
          className="hidden lg:block absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-accent/30 active:bg-accent/50 transition-colors z-10"
        />
      </aside>

      {/* Drag overlay */}
      {isDragging && <div className="fixed inset-0 z-30 cursor-col-resize" />}

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar — aligned with content */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-8 lg:px-12 h-14 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
          <h1 className="text-sm font-semibold text-gray-900">Documentation</h1>
          <div className="flex-1" />
          <Link href="/demo" className="text-xs font-medium text-accent hover:text-accent/80 transition-colors">
            Try Demo →
          </Link>
          <Link href="/signup" className="hidden sm:inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors">
            Get Started Free
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-8 lg:px-12 py-8 max-w-3xl">
          <DocContent section={activeSection} />

          {/* Bottom navigation */}
          <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between">
            {(() => {
              const idx = sections.findIndex((s) => s.id === activeSection);
              const prev = idx > 0 ? sections[idx - 1] : null;
              const next = idx < sections.length - 1 ? sections[idx + 1] : null;
              return (
                <>
                  {prev ? (
                    <button
                      onClick={() => { setActiveSection(prev.id); window.scrollTo(0, 0); }}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-accent transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      {prev.label}
                    </button>
                  ) : <div />}
                  {next ? (
                    <button
                      onClick={() => { setActiveSection(next.id); window.scrollTo(0, 0); }}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-accent transition-colors"
                    >
                      {next.label}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : <div />}
                </>
              );
            })()}
          </div>
        </main>
      </div>
    </div>
  );
}
