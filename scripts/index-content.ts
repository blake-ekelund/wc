/**
 * Content indexer — populates knowledge_chunks table from site content.
 *
 * Usage: npx tsx scripts/index-content.ts
 *
 * Reads content from hardcoded sources (docs, pricing, features, FAQs, etc.)
 * and inserts as searchable chunks into Supabase.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface Chunk {
  source: string;
  source_url: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

const chunks: Chunk[] = [
  // ============================================================
  // PRICING
  // ============================================================
  { source: "pricing", source_url: "/pricing", title: "WorkChores Pricing Overview", content: "WorkChores has three plans: Starter (Free), Business ($9/seat/month), and Enterprise (custom pricing). Every plan includes all features and all plugins. The only difference is usage limits: Starter gets 100 contacts and 1,000 actions/month. Business gets 50,000 contacts and 500,000 actions/month. Enterprise gets unlimited everything with dedicated support.", metadata: { category: "pricing" } },
  { source: "pricing", source_url: "/pricing", title: "Free Starter Plan", content: "The Starter plan is free forever. You get all features, all plugins (CRM, Vendor Management, Task Tracker, and any future plugins), up to 100 contacts, 1,000 actions per month, all 6 industry templates, pipeline tracking, calendar, reports, and data import/export. No credit card required.", metadata: { category: "pricing" } },
  { source: "pricing", source_url: "/pricing", title: "Business Plan", content: "The Business plan costs $9 per seat per month. It includes everything in Starter plus up to 50,000 contacts, 500,000 actions per month, unlimited users, Gmail integration and bulk email, and priority support. Per-seat pricing means you pay for each user in your workspace.", metadata: { category: "pricing" } },
  { source: "pricing", source_url: "/pricing", title: "Enterprise Plan", content: "The Enterprise plan has custom pricing. Contact sales for a quote. It includes everything in Business plus unlimited contacts, unlimited actions, a dedicated account manager, custom onboarding, and SLA with uptime guarantee.", metadata: { category: "pricing" } },
  { source: "pricing", source_url: "/pricing", title: "What counts as an action", content: "Actions are meaningful operations: creating or editing a contact, logging a touchpoint, creating or completing a task, sending an email, importing contacts, or exporting data. Browsing, searching, and viewing data are always free and unlimited — they don't count as actions.", metadata: { category: "pricing" } },
  { source: "pricing", source_url: "/pricing", title: "Cancellation policy", content: "You can cancel anytime. No contracts, no cancellation fees. Downgrade to the free plan whenever you want and keep your data. Your data is always yours.", metadata: { category: "pricing" } },
  { source: "pricing", source_url: "/pricing", title: "Per-seat pricing explained", content: "You pay $9/month for each user in your workspace. If you have 4 team members, that's $36/month. Add or remove users anytime. There is no per-contact charge.", metadata: { category: "pricing" } },

  // ============================================================
  // CRM FEATURES
  // ============================================================
  { source: "features", source_url: "/crm", title: "WorkChores CRM Overview", content: "WorkChores CRM is a lightweight CRM that adapts to your industry. It includes contact management with custom fields, a visual drag-and-drop pipeline, touchpoint logging for calls, emails, and meetings, task management, calendar view, email integration, reports with 20+ KPI metrics, and smart recommendations.", metadata: { category: "features" } },
  { source: "features", source_url: "/crm", title: "Contact Management", content: "Store, search, and organize your contacts with custom fields, tags, addresses, and activity history. Bulk actions let you archive, trash, change stages, or reassign contacts in bulk. Import contacts from CSV or Excel with our 4-step import wizard.", metadata: { category: "features" } },
  { source: "features", source_url: "/crm", title: "Deal Pipeline", content: "Visual drag-and-drop pipeline with stages customized for your industry. WorkChores comes with 6 pre-built industry templates: B2B Sales, SaaS, Real Estate, Recruiting, Consulting, and Home Services. Each template has custom pipeline stages, tracking fields, and sample data. You can customize stages in Settings.", metadata: { category: "features" } },
  { source: "features", source_url: "/crm", title: "Email Integration", content: "Connect your Gmail account on the Business plan to send emails directly from WorkChores. Use email templates with variables, send bulk emails to selected contacts (each sent individually), and track email conversations. Each email is sent individually — recipients cannot see other recipients.", metadata: { category: "features" } },
  { source: "features", source_url: "/crm", title: "Industry Templates", content: "WorkChores offers 6 pre-built industry templates: B2B Sales (Lead > Qualified > Proposal > Negotiation > Closed Won), SaaS (Lead > Trial > Demo > Negotiation > Customer), Real Estate (New Lead > Viewing > Offer Made > Under Contract > Closed), Recruiting (Sourced > Phone Screen > Interview > Offer > Hired), Consulting (Discovery > Proposal > SOW Review > Engaged > Completed), and Home Services (New Lead > Estimate Sent > Scheduled > In Progress > Completed).", metadata: { category: "features" } },
  { source: "features", source_url: "/crm", title: "Reports and Dashboard", content: "The dashboard shows 20+ KPI metrics including pipeline value, conversion rates, activity trends, and task completion. Choose which metrics to display. The reports view shows detailed breakdowns with charts for contacts, pipeline, activity, and tasks.", metadata: { category: "features" } },

  // ============================================================
  // VENDOR MANAGEMENT
  // ============================================================
  { source: "features", source_url: "/vendor-management", title: "Vendor Management Overview", content: "WorkChores Vendor Management lets you centralize every vendor relationship. Track who you pay, what you owe, and whether they're compliant. Features include vendor directory with categories and status, contract and cost tracking with auto-calculated annual spend, compliance management for W-9 and 1099, a self-service vendor portal, smart alerts for renewals, and notes with full audit trail.", metadata: { category: "features" } },
  { source: "features", source_url: "/vendor-management", title: "Vendor Portal", content: "Send vendors a magic link to upload their own W-9, certificate of insurance, and contracts. No back-and-forth emails. Documents land directly in the vendor record, ready for review. The vendor portal requires no login — vendors access it via a secure token-based link.", metadata: { category: "features" } },
  { source: "features", source_url: "/vendor-management", title: "Compliance Tracking", content: "Monitor W-9 status, 1099 requirements, and tax classifications for every vendor. Flag vendors with missing documents and track filing deadlines. Year-by-year tax record tracking ensures you're always audit-ready.", metadata: { category: "features" } },

  // ============================================================
  // TASK TRACKER
  // ============================================================
  { source: "features", source_url: "/task-tracker", title: "Task Tracker Overview", content: "WorkChores Task Tracker is a unified task list across your CRM, vendors, and standalone operations. Tasks are linked to contacts and vendors — not isolated in a separate app. Assign tasks to team members, set priorities (high, medium, low), set due dates, and filter by status, priority, owner, or source.", metadata: { category: "features" } },
  { source: "features", source_url: "/task-tracker", title: "Task Features", content: "Tasks can come from CRM deals, vendor follow-ups, or be created standalone. One-click completion with full audit trail (who completed it and when). Filter tasks by status (open/completed), priority, owner, or source. Multi-source tasks appear in one unified task list.", metadata: { category: "features" } },

  // ============================================================
  // GETTING STARTED
  // ============================================================
  { source: "docs", source_url: "/docs", title: "Getting Started with WorkChores", content: "Sign up for free at workchores.com/signup. Pick your industry template, name your workspace, and you're ready in 60 seconds. No credit card required. No training needed — click any field to edit, changes auto-save. If you can use a spreadsheet, you can use WorkChores.", metadata: { category: "getting-started" } },
  { source: "docs", source_url: "/docs", title: "Setting Up Your Workspace", content: "During onboarding, pick one of 6 industry templates (B2B Sales, SaaS, Real Estate, Recruiting, Consulting, Home Services). Each template configures your pipeline stages, custom fields, and sample data automatically. You can customize everything later in Settings.", metadata: { category: "getting-started" } },
  { source: "docs", source_url: "/docs", title: "Inviting Your Team", content: "Go to Settings > Team Members and invite by email. You can set roles: Admin (sees all data, manages settings), Manager (sees own data + direct reports), or Member (sees own data only). Each team member gets their own view of contacts and tasks.", metadata: { category: "getting-started" } },
  { source: "docs", source_url: "/demo", title: "Live Demo", content: "WorkChores offers a free interactive demo with sample data at workchores.com/demo. No signup required. Try the full CRM experience including pipeline, contacts, touchpoints, tasks, calendar, and reports. The demo includes sample contacts and deals so you can explore all features.", metadata: { category: "getting-started" } },

  // ============================================================
  // DATA & IMPORT/EXPORT
  // ============================================================
  { source: "docs", source_url: "/docs", title: "Importing Contacts", content: "Import contacts from CSV or Excel files using the 4-step import wizard. Upload your file, map columns to WorkChores fields, preview the data, and import. Supports bulk import of contacts with all fields including addresses, tags, custom fields, and stage.", metadata: { category: "data" } },
  { source: "docs", source_url: "/docs", title: "Exporting Data", content: "Export your contacts, tasks, and touchpoints to CSV or Excel anytime. Your data is always yours. Choose which fields to export and apply filters before exporting. No data lock-in.", metadata: { category: "data" } },

  // ============================================================
  // SECURITY & PRIVACY
  // ============================================================
  { source: "about", source_url: "/privacy", title: "Data Security", content: "WorkChores is built on enterprise-grade infrastructure using Supabase and PostgreSQL. All data is protected with row-level security, encrypted connections (HTTPS everywhere), and security headers including Content-Security-Policy, HSTS, and X-Frame-Options. Your data is stored on US-based servers.", metadata: { category: "security" } },
  { source: "about", source_url: "/privacy", title: "Privacy Policy", content: "WorkChores will never sell, rent, or share your personal information or business data. Your contacts and deals belong to you. You can export all your data anytime in CSV or Excel format. We believe your data is yours — period.", metadata: { category: "security" } },

  // ============================================================
  // ABOUT
  // ============================================================
  { source: "about", source_url: "/about", title: "About WorkChores", content: "WorkChores is an operations platform built for small teams of 1-25 people. Founded in 2025 and based in Gaithersburg, Maryland. The company believes powerful software shouldn't cost a fortune and is democratizing operations tools for small businesses. No enterprise bloat, no surprise pricing.", metadata: { category: "about" } },
  { source: "about", source_url: "/about", title: "WorkChores Values", content: "WorkChores values: Your data is yours (full import/export, no lock-in), Honest pricing (no per-feature upsells, no usage caps designed to push you into higher tiers, $9 per seat per month for everything), Built to be simple (no implementation team required, if you can use a spreadsheet you can use WorkChores), Real support (actual humans who respond within 24 hours).", metadata: { category: "about" } },

  // ============================================================
  // VENDOR MANAGEMENT DOCS
  // ============================================================
  { source: "docs", source_url: "/docs", title: "Vendor Directory", content: "The vendor directory is your single source of truth for every supplier, contractor, and service provider. Each vendor has a profile with name, category (IT, Marketing, Facilities, etc.), status (Active, Inactive, Pending), primary contact, phone, email, website, and notes. Add vendors one by one or browse the full list. Click any vendor to see their full detail page.", metadata: { category: "vendor-management" } },
  { source: "docs", source_url: "/docs", title: "Vendor Contracts & Costs", content: "Every vendor can have multiple contracts. Each contract tracks start date, end date, auto-renew toggle, payment frequency (monthly, quarterly, semi-annually, annually), and payment amount. WorkChores auto-calculates annual cost from frequency and amount. Contracts show days until expiration and flag expired contracts automatically.", metadata: { category: "vendor-management" } },
  { source: "docs", source_url: "/docs", title: "Vendor Compliance & Tax Records", content: "Track W-9 received status, 1099 type (NEC, MISC, etc.), and tax classification for every vendor. WorkChores flags vendors that require 1099s but haven't submitted a W-9. Year-by-year tax records track filed/pending status and amount reported. Build a complete audit trail for tax season.", metadata: { category: "vendor-management" } },
  { source: "docs", source_url: "/docs", title: "Vendor Portal", content: "The vendor portal gives each vendor a secure, token-based link to upload documents like W-9 forms, certificates of insurance, and contracts. No login required — vendors access it via a unique link. Send the link from the vendor detail page. Uploaded documents appear in the vendor's Notes & Files section for review.", metadata: { category: "vendor-management" } },
  { source: "docs", source_url: "/docs", title: "Vendor Notes & Files", content: "Every vendor has a notes section for tracking conversations, decisions, and history. Add timestamped notes from the vendor detail page. Upload contracts, insurance certificates, W-9 forms, and other documents directly to the vendor profile. Every note and file upload is logged with timestamp and user for a complete audit trail.", metadata: { category: "vendor-management" } },

  // ============================================================
  // TASK TRACKER DOCS
  // ============================================================
  { source: "docs", source_url: "/docs", title: "Task Tracker Overview", content: "Tasks in WorkChores are action items with a title, description, owner, priority (High, Medium, Low), and due date. Tasks can be linked to contacts, vendors, or stand alone. All tasks from every source appear in one unified task list. Task sources include CRM (linked to a contact or deal), Vendors (linked to a vendor), and Tasks (standalone).", metadata: { category: "task-tracker" } },
  { source: "docs", source_url: "/docs", title: "Creating Tasks", content: "Create tasks from three places: the main task list (click New Task), from a contact detail page (click Add Task — automatically linked to that contact), or from a vendor detail page (click Add Task — automatically linked to that vendor). Task fields include title, description, owner, priority, due date, and linked contact or vendor.", metadata: { category: "task-tracker" } },
  { source: "docs", source_url: "/docs", title: "Managing and Completing Tasks", content: "Click the circle icon next to any task to mark it complete. Completed tasks show who completed them and when. Click any task to open its detail view where you can edit title, description, owner, priority, or due date. Changes save automatically. Reassign tasks by changing the owner — the new owner sees it in their filtered view immediately.", metadata: { category: "task-tracker" } },
  { source: "docs", source_url: "/docs", title: "Task Filters and Views", content: "Filter tasks by status (Open or Completed), priority (High, Medium, Low), owner (any team member), or source (CRM, Vendors, or standalone Tasks). Combine multiple filters — for example, show only High priority + Overdue + CRM source to see critical deal follow-ups. Managers can filter by direct reports. Admins see all owners.", metadata: { category: "task-tracker" } },

  // ============================================================
  // COMPARISONS
  // ============================================================
  { source: "blog", source_url: "/blog/why-small-teams-dont-need-hubspot", title: "WorkChores vs HubSpot", content: "HubSpot starts free but gets expensive fast — $800+/month for basic features like custom reports and workflows. WorkChores is $9/seat/month with all features included. Setup takes 60 seconds vs weeks. WorkChores is built for small teams of 1-25, not enterprises. No consultants needed, no 30-day onboarding.", metadata: { category: "comparisons" } },
  { source: "blog", source_url: "/blog/contact-management-beyond-spreadsheets", title: "WorkChores vs Spreadsheets", content: "Spreadsheets break when your contact list grows. You lose pipeline views, activity history, team collaboration, and follow-up reminders. WorkChores feels like a spreadsheet but gives you drag-and-drop pipeline, touchpoint logging, email integration, calendar view, and auto-saves that spreadsheets can't.", metadata: { category: "comparisons" } },
  { source: "features", source_url: "/crm", title: "WorkChores vs Salesforce", content: "Salesforce is built for enterprises with hundreds of users and requires implementation teams. WorkChores is built for teams of 1-25. No consultants needed, no 30-day onboarding. Pick your industry template and start working in 60 seconds. $9/seat/month vs Salesforce's $25-300/user/month.", metadata: { category: "comparisons" } },

  // ============================================================
  // PLUGINS MODEL
  // ============================================================
  { source: "features", source_url: "/pricing", title: "Plugin Model", content: "WorkChores uses a plugin model. CRM, Vendor Management, and Task Tracker are plugins included with every seat. No per-module pricing. One seat gets you access to all plugins — past, present, and future. Admins can enable or disable plugins for their workspace in Settings > Plugins.", metadata: { category: "features" } },
  { source: "features", source_url: "/pricing", title: "Workspace Themes", content: "WorkChores supports workspace themes. Admins can choose from 8 preset color themes (Blue, Indigo, Purple, Rose, Orange, Forest Green, Teal, Slate) in Settings > Appearance. The theme applies to all team members in the workspace.", metadata: { category: "features" } },

  // ============================================================
  // ROLES & PERMISSIONS
  // ============================================================
  { source: "docs", source_url: "/docs", title: "Role-Based Access", content: "WorkChores has three roles: Admin (sees all data from all team members, manages settings, billing, and team), Manager (sees own data plus data from direct reports), and Member (sees only their own data). Admins can change roles in Settings > Team Members.", metadata: { category: "roles" } },

  // ============================================================
  // SUPPORT
  // ============================================================
  { source: "about", source_url: "/contact", title: "Contact and Support", content: "Reach WorkChores support at support@workchores.com. Response time is within 24 hours, usually much faster. Live chat is available on every page via the bottom-right chat button. Business plan users get priority support. WorkChores is based in Gaithersburg, Maryland.", metadata: { category: "support" } },
];

async function main() {
  console.log(`Indexing ${chunks.length} content chunks...`);

  // Clear existing chunks
  const { error: deleteError } = await supabase.from("knowledge_chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (deleteError) {
    console.error("Error clearing existing chunks:", deleteError.message);
    return;
  }
  console.log("Cleared existing chunks.");

  // Insert new chunks
  const { error: insertError } = await supabase.from("knowledge_chunks").insert(chunks);
  if (insertError) {
    console.error("Error inserting chunks:", insertError.message);
    return;
  }

  console.log(`Successfully indexed ${chunks.length} chunks.`);

  // Verify
  const { count } = await supabase.from("knowledge_chunks").select("id", { count: "exact", head: true });
  console.log(`Verification: ${count} chunks in database.`);
}

main().catch(console.error);
