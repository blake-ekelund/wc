export type Stage = string;

export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  phone: string;
  avatar: string;
  avatarColor: string;
  stage: Stage;
  value: number;
  owner: string;
  lastContact: string;
  created: string;
  tags: string[];
  archived?: boolean;
  trashedAt?: string; // ISO date string — null/undefined = not trashed
  stageChangedAt?: string; // ISO date — when the stage was last changed
  // Address fields
  billingAddress?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  shippingAddress?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  shippingSameAsBilling?: boolean;
  // Additional fields
  website?: string;
  source?: string;
  notes?: string;
}

export interface Touchpoint {
  id: string;
  contactId: string;
  type: "call" | "email" | "meeting" | "note";
  title: string;
  description: string;
  date: string;
  owner: string;
}

export interface Task {
  id: string;
  contactId: string;
  title: string;
  description?: string;
  due: string;
  owner: string;
  completed: boolean;
  completedAt?: string; // ISO date — when the task was completed
  priority: "high" | "medium" | "low";
}

export interface StageDefinition {
  label: string;
  color: string;
  bgColor: string;
}

export const stages: StageDefinition[] = [
  { label: "Lead", color: "text-blue-700", bgColor: "bg-blue-100" },
  { label: "Qualified", color: "text-purple-700", bgColor: "bg-purple-100" },
  { label: "Proposal", color: "text-amber-700", bgColor: "bg-amber-100" },
  { label: "Negotiation", color: "text-orange-700", bgColor: "bg-orange-100" },
  { label: "Closed Won", color: "text-emerald-700", bgColor: "bg-emerald-100" },
  { label: "Closed Lost", color: "text-red-700", bgColor: "bg-red-100" },
];

export const contacts: Contact[] = [
  {
    id: "1",
    name: "Sarah Chen",
    email: "sarah@voltalabs.com",
    company: "Volta Labs",
    role: "Head of Operations",
    phone: "(415) 555-0142",
    avatar: "SC",
    avatarColor: "bg-blue-500",
    stage: "Proposal",
    value: 12400,
    owner: "You",
    lastContact: "Today",
    created: "Feb 3, 2026",
    tags: ["Enterprise", "Q2 Target"],
  },
  {
    id: "2",
    name: "Marcus Rivera",
    email: "marcus@kineticsupply.com",
    company: "Kinetic Supply",
    role: "CEO",
    phone: "(312) 555-0198",
    avatar: "MR",
    avatarColor: "bg-emerald-500",
    stage: "Qualified",
    value: 8200,
    owner: "Lisa",
    lastContact: "Yesterday",
    created: "Jan 18, 2026",
    tags: ["SMB"],
  },
  {
    id: "3",
    name: "Jamie Liu",
    email: "jamie@nomadfreight.com",
    company: "Nomad Freight",
    role: "VP Sales",
    phone: "(646) 555-0167",
    avatar: "JL",
    avatarColor: "bg-violet-500",
    stage: "Lead",
    value: 5600,
    owner: "You",
    lastContact: "Mar 12",
    created: "Mar 10, 2026",
    tags: ["Logistics"],
  },
  {
    id: "4",
    name: "Anika Patel",
    email: "anika@greenfield.co",
    company: "Greenfield Co",
    role: "Founder",
    phone: "(512) 555-0134",
    avatar: "AP",
    avatarColor: "bg-rose-500",
    stage: "Closed Won",
    value: 22000,
    owner: "You",
    lastContact: "Mar 14",
    created: "Dec 5, 2025",
    tags: ["Enterprise", "Referral"],
  },
  {
    id: "5",
    name: "David Kim",
    email: "david@peakdigital.io",
    company: "Peak Digital",
    role: "Director of Sales",
    phone: "(213) 555-0156",
    avatar: "DK",
    avatarColor: "bg-cyan-500",
    stage: "Negotiation",
    value: 18500,
    owner: "Tom",
    lastContact: "Today",
    created: "Jan 28, 2026",
    tags: ["Agency", "Priority"],
  },
  {
    id: "6",
    name: "Rachel Torres",
    email: "rachel@brightsidehq.com",
    company: "Brightside HQ",
    role: "COO",
    phone: "(305) 555-0189",
    avatar: "RT",
    avatarColor: "bg-amber-500",
    stage: "Lead",
    value: 6800,
    owner: "Sarah N.",
    lastContact: "Mar 15",
    created: "Mar 14, 2026",
    tags: ["SMB", "Inbound"],
  },
  {
    id: "7",
    name: "Nathan Brooks",
    email: "nathan@ironclad.dev",
    company: "Ironclad Dev",
    role: "CTO",
    phone: "(503) 555-0145",
    avatar: "NB",
    avatarColor: "bg-indigo-500",
    stage: "Qualified",
    value: 14200,
    owner: "You",
    lastContact: "Mar 13",
    created: "Feb 20, 2026",
    tags: ["Tech", "Enterprise"],
  },
  {
    id: "8",
    name: "Elena Vasquez",
    email: "elena@suncrestfoods.com",
    company: "Suncrest Foods",
    role: "Purchasing Manager",
    phone: "(602) 555-0178",
    avatar: "EV",
    avatarColor: "bg-teal-500",
    stage: "Proposal",
    value: 9800,
    owner: "Tom",
    lastContact: "Mar 11",
    created: "Feb 12, 2026",
    tags: ["F&B"],
  },
  {
    id: "9",
    name: "Chris Adeyemi",
    email: "chris@mapleconsulting.com",
    company: "Maple Consulting",
    role: "Managing Partner",
    phone: "(416) 555-0123",
    avatar: "CA",
    avatarColor: "bg-lime-600",
    stage: "Lead",
    value: 4500,
    owner: "James",
    lastContact: "Mar 16",
    created: "Mar 15, 2026",
    tags: ["Consulting", "Inbound"],
  },
  {
    id: "10",
    name: "Priya Sharma",
    email: "priya@canvasarch.com",
    company: "Canvas Architecture",
    role: "Principal",
    phone: "(917) 555-0191",
    avatar: "PS",
    avatarColor: "bg-pink-500",
    stage: "Closed Lost",
    value: 15000,
    owner: "You",
    lastContact: "Mar 8",
    created: "Jan 5, 2026",
    tags: ["Architecture"],
  },
  {
    id: "11",
    name: "Omar Farah",
    email: "omar@nextsteplogistics.com",
    company: "NextStep Logistics",
    role: "Operations Lead",
    phone: "(612) 555-0167",
    avatar: "OF",
    avatarColor: "bg-sky-500",
    stage: "Lead",
    value: 7200,
    owner: "Sarah N.",
    lastContact: "Mar 16",
    created: "Mar 16, 2026",
    tags: ["Logistics", "Referral"],
  },
  {
    id: "12",
    name: "Megan Hall",
    email: "megan@firebrandmedia.com",
    company: "Firebrand Media",
    role: "Account Director",
    phone: "(310) 555-0134",
    avatar: "MH",
    avatarColor: "bg-fuchsia-500",
    stage: "Negotiation",
    value: 11000,
    owner: "Lisa",
    lastContact: "Today",
    created: "Feb 8, 2026",
    tags: ["Agency", "Q2 Target"],
  },
];

export const touchpoints: Touchpoint[] = [
  { id: "t1", contactId: "1", type: "call", title: "Pricing discussion", description: "Discussed Q2 rollout pricing and volume discount. Sarah wants to loop in CFO next week.", date: "Today, 2:30 PM", owner: "You" },
  { id: "t2", contactId: "5", type: "meeting", title: "Contract review", description: "Walked through contract terms. David requested a custom SLA addendum. Following up Friday.", date: "Today, 11:00 AM", owner: "Tom" },
  { id: "t3", contactId: "12", type: "email", title: "Proposal follow-up", description: "Sent revised proposal with adjusted scope. Megan will review with her team by EOW.", date: "Today, 9:15 AM", owner: "Lisa" },
  { id: "t4", contactId: "2", type: "email", title: "Product comparison", description: "Sent comparison sheet vs. competitors. Marcus is evaluating two other options.", date: "Yesterday, 4:45 PM", owner: "Lisa" },
  { id: "t5", contactId: "4", type: "meeting", title: "Contract sign-off", description: "Final contract review and signature. Anika confirmed annual commitment. Deal closed.", date: "Mar 14, 3:00 PM", owner: "You" },
  { id: "t6", contactId: "7", type: "call", title: "Technical requirements", description: "Nathan outlined their API integration needs. Confirmed we can support their stack.", date: "Mar 13, 10:30 AM", owner: "You" },
  { id: "t7", contactId: "3", type: "call", title: "Discovery call", description: "Initial call with Jamie. Interested in team plan for 8 reps. Wants a demo next week.", date: "Mar 12, 1:00 PM", owner: "You" },
  { id: "t8", contactId: "8", type: "email", title: "Proposal sent", description: "Sent formal proposal for 15-seat deployment with customization scope.", date: "Mar 11, 2:00 PM", owner: "Tom" },
  { id: "t9", contactId: "10", type: "call", title: "Budget constraints", description: "Priya informed us the project has been deprioritized due to budget cuts. Revisit in Q3.", date: "Mar 8, 11:00 AM", owner: "You" },
  { id: "t10", contactId: "6", type: "note", title: "Inbound lead research", description: "Rachel filled out the contact form. Company has 25 employees, growing. Good fit for Team plan.", date: "Mar 15, 9:00 AM", owner: "Lisa" },
];

export const tasks: Task[] = [
  { id: "k1", contactId: "1", title: "Send updated proposal to Sarah", description: "Include revised Q2 pricing with volume discount tiers. She wants to present to CFO by end of week.", due: "2026-03-17", owner: "You", completed: false, priority: "high" },
  { id: "k2", contactId: "5", title: "Draft custom SLA for Peak Digital", description: "David requested a custom SLA addendum covering 99.9% uptime and 4-hour response time for critical issues.", due: "2026-03-18", owner: "Tom", completed: false, priority: "high" },
  { id: "k3", contactId: "4", title: "Send onboarding docs to Anika", description: "Share the welcome kit, implementation timeline, and access credentials for the sandbox environment.", due: "2026-03-18", owner: "You", completed: false, priority: "medium" },
  { id: "k4", contactId: "3", title: "Schedule demo for Jamie Liu", description: "Jamie wants to see the team plan features for 8 reps. Coordinate with SE team for a live walkthrough.", due: "2026-03-20", owner: "You", completed: false, priority: "medium" },
  { id: "k5", contactId: "7", title: "Share API documentation with Nathan", description: "Send the REST API docs and webhook integration guide. He needs to verify compatibility with their Node.js stack.", due: "2026-03-19", owner: "You", completed: false, priority: "medium" },
  { id: "k6", contactId: "12", title: "Follow up on revised proposal", description: "Megan's team is reviewing the adjusted scope. Check if they have questions before their internal meeting Friday.", due: "2026-03-21", owner: "Lisa", completed: false, priority: "medium" },
  { id: "k7", contactId: "6", title: "Send intro email to Rachel", description: "Warm intro email with overview of Team plan. She has 25 employees and is growing — good fit for mid-market.", due: "2026-03-14", owner: "Lisa", completed: false, priority: "low" },
  { id: "k8", contactId: "2", title: "Check in with Marcus on evaluation", description: "Marcus is comparing us against two competitors. Touch base to see where they are in the decision process.", due: "2026-03-22", owner: "Lisa", completed: false, priority: "low" },
  { id: "k9", contactId: "9", title: "Qualify inbound from Chris", description: "Chris filled out the contact form. Research Maple Consulting and assess fit before scheduling a discovery call.", due: "2026-03-13", owner: "Lisa", completed: false, priority: "low" },
  { id: "k10", contactId: "11", title: "Discovery call with Omar", description: "Initial call to understand NextStep Logistics' needs. They were referred by an existing customer.", due: "2026-03-19", owner: "Tom", completed: false, priority: "medium" },
  { id: "k11", contactId: "8", title: "Prepare demo environment for Suncrest", description: "Set up a 15-seat sandbox with sample data matching their food distribution workflow.", due: "2026-03-15", owner: "Tom", completed: true, priority: "medium" },
  { id: "k12", contactId: "1", title: "Research Volta Labs competitors", description: "Pull together intel on what tools Volta Labs is currently using and who else they might be evaluating.", due: "2026-03-10", owner: "You", completed: true, priority: "low" },
  { id: "k13", contactId: "2", title: "Prep competitive analysis for Marcus", description: "Build a side-by-side comparison highlighting our advantages in integrations and pricing vs. the two competitors.", due: "2026-03-12", owner: "Lisa", completed: false, priority: "high" },
  { id: "k14", contactId: "5", title: "Send case study to David", description: "Share the FinServ case study showing how a similar company reduced onboarding time by 40%.", due: "2026-03-15", owner: "Tom", completed: false, priority: "medium" },
  { id: "k15", contactId: "8", title: "Schedule follow-up call with Elena", description: "Check in after the proposal review. Discuss any customization needs and timeline for implementation.", due: "2026-03-24", owner: "Tom", completed: false, priority: "low" },
  { id: "k16", contactId: "12", title: "Draft SOW for Firebrand Media", description: "Create statement of work based on the revised proposal scope. Include deliverables, timeline, and payment terms.", due: "2026-03-25", owner: "Lisa", completed: false, priority: "high" },
];

export function getTaskStatus(due: string, completed: boolean): "completed" | "overdue" | "today" | "upcoming" | "later" {
  if (completed) return "completed";
  if (!due) return "later";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(due + "T00:00:00");
  if (isNaN(dueDate.getTime())) return "later";
  const diffMs = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 3) return "upcoming";
  return "later";
}

export function formatDueDate(due: string): string {
  if (!due) return "No date";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(due + "T00:00:00");
  if (isNaN(dueDate.getTime())) return "No date";
  const diffMs = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < -1) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays <= 7) return `In ${diffDays} days`;
  return dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const teamMembers = ["You", "Lisa", "Tom", "Sarah N.", "James"];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);
}

// ── Vendor Management ──

export interface Vendor {
  id: string;
  name: string;
  category: string;
  status: "active" | "inactive" | "pending";
  website?: string;
  phone?: string;
  email?: string;
  notes?: string;
  owner: string;
  created: string;
  // Contract
  contractStart?: string;
  contractEnd?: string;
  contractTerm?: string;
  autoRenew?: boolean;
  // Cost
  payFrequency?: string;
  payAmount?: number;
  annualAmount?: number;
  // Tax
  taxClassification?: string;
  // Trash
  trashedAt?: string;
}

export interface VendorContact {
  id: string;
  vendorId: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  isPrimary: boolean;
}

export interface VendorNote {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  date: string;
  owner: string;
}

export const vendors: Vendor[] = [
  {
    id: "v1",
    name: "Apex Office Solutions",
    category: "Office Supplies",
    status: "active",
    website: "https://apexoffice.com",
    phone: "(800) 555-0100",
    email: "accounts@apexoffice.com",
    notes: "Primary office supply vendor. Net-30 terms. 15% volume discount on orders over $500.",
    owner: "You",
    created: "Jan 10, 2026",
    contractStart: "2026-01-01",
    contractEnd: "2026-12-31",
    contractTerm: "Annual",
    autoRenew: true,
    payFrequency: "Monthly",
    payAmount: 450,
    annualAmount: 5400,
    taxClassification: "1099-NEC",
  },
  {
    id: "v2",
    name: "CloudStack Pro",
    category: "Software",
    status: "active",
    website: "https://cloudstackpro.io",
    phone: "(415) 555-0222",
    email: "billing@cloudstackpro.io",
    notes: "Hosting and infrastructure. Annual contract renews in September.",
    owner: "You",
    created: "Nov 15, 2025",
    contractStart: "2025-09-01",
    contractEnd: "2026-09-01",
    contractTerm: "Annual",
    autoRenew: true,
    payFrequency: "Annual",
    payAmount: 8400,
    annualAmount: 8400,
    taxClassification: "W-9",
  },
  {
    id: "v3",
    name: "Martinez & Associates",
    category: "Professional Services",
    status: "active",
    website: "https://martinezlaw.com",
    phone: "(312) 555-0188",
    email: "info@martinezlaw.com",
    notes: "Outside counsel for contract review and compliance. Hourly rate with monthly retainer.",
    owner: "Lisa",
    created: "Dec 1, 2025",
    contractStart: "2025-12-01",
    contractTerm: "Monthly",
    autoRenew: false,
    payFrequency: "Monthly",
    payAmount: 2500,
    annualAmount: 30000,
    taxClassification: "1099-NEC",
  },
  {
    id: "v4",
    name: "GreenLeaf Maintenance",
    category: "Contractor",
    status: "inactive",
    phone: "(602) 555-0145",
    email: "service@greenleaf.co",
    notes: "Previously handled office cleaning. Contract ended Feb 2026.",
    owner: "Tom",
    created: "Jun 20, 2025",
    contractStart: "2025-06-01",
    contractEnd: "2026-02-28",
    contractTerm: "Annual",
    autoRenew: false,
    payFrequency: "Monthly",
    payAmount: 800,
    annualAmount: 9600,
    taxClassification: "1099-NEC",
  },
  {
    id: "v5",
    name: "TechHire Staffing",
    category: "Professional Services",
    status: "pending",
    website: "https://techhire.io",
    phone: "(646) 555-0199",
    email: "partnerships@techhire.io",
    notes: "Evaluating for contract engineering support. Awaiting proposal.",
    owner: "You",
    created: "Mar 10, 2026",
    taxClassification: "1099-NEC",
  },
  {
    id: "v6",
    name: "Pinnacle Insurance Group",
    category: "Insurance",
    status: "active",
    website: "https://pinnacleins.com",
    phone: "(800) 555-0333",
    email: "commercial@pinnacleins.com",
    notes: "Business liability and workers comp. Policy renews annually in July.",
    owner: "Lisa",
    created: "Jul 1, 2025",
    contractStart: "2025-07-01",
    contractEnd: "2026-07-01",
    contractTerm: "Annual",
    autoRenew: true,
    payFrequency: "Annual",
    payAmount: 12000,
    annualAmount: 12000,
    taxClassification: "W-9",
  },
];

export const vendorContacts: VendorContact[] = [
  { id: "vc1", vendorId: "v1", name: "Dana Wells", email: "dana@apexoffice.com", phone: "(800) 555-0101", role: "Account Manager", isPrimary: true },
  { id: "vc2", vendorId: "v1", name: "Mike Torres", email: "mike.t@apexoffice.com", phone: "(800) 555-0102", role: "Billing", isPrimary: false },
  { id: "vc3", vendorId: "v2", name: "Raj Patel", email: "raj@cloudstackpro.io", phone: "(415) 555-0223", role: "Account Executive", isPrimary: true },
  { id: "vc4", vendorId: "v2", name: "Support Team", email: "support@cloudstackpro.io", role: "Technical Support", isPrimary: false },
  { id: "vc5", vendorId: "v3", name: "Carlos Martinez", email: "carlos@martinezlaw.com", phone: "(312) 555-0189", role: "Partner", isPrimary: true },
  { id: "vc6", vendorId: "v4", name: "Jenny Green", email: "jenny@greenleaf.co", phone: "(602) 555-0146", role: "Owner", isPrimary: true },
  { id: "vc7", vendorId: "v5", name: "Alex Kim", email: "alex.k@techhire.io", phone: "(646) 555-0200", role: "Account Manager", isPrimary: true },
  { id: "vc8", vendorId: "v6", name: "Patricia Moore", email: "pmoore@pinnacleins.com", phone: "(800) 555-0334", role: "Agent", isPrimary: true },
];

export const vendorNotes: VendorNote[] = [
  { id: "vn1", vendorId: "v1", title: "Negotiated volume discount", description: "Secured 15% discount on orders over $500. Previous rate was 10%. New rate effective immediately.", date: "Mar 1, 2026", owner: "You" },
  { id: "vn2", vendorId: "v2", title: "Annual review meeting", description: "Reviewed infrastructure usage. We're at 60% capacity. No need to upgrade until Q4. Discussed backup strategy.", date: "Feb 15, 2026", owner: "You" },
  { id: "vn3", vendorId: "v3", title: "Contract review completed", description: "Carlos reviewed the new client contract template. Minor changes to liability clause. Final version approved.", date: "Mar 10, 2026", owner: "Lisa" },
  { id: "vn4", vendorId: "v4", title: "Service terminated", description: "Contract ended. Switching to in-house cleaning. Final invoice paid.", date: "Feb 28, 2026", owner: "Tom" },
  { id: "vn5", vendorId: "v5", title: "Initial meeting", description: "Met with Alex to discuss contract engineering needs. They specialize in React/Node. Waiting on rate card and availability.", date: "Mar 12, 2026", owner: "You" },
  { id: "vn6", vendorId: "v6", title: "Policy renewal reminder", description: "Patricia confirmed renewal is due July 1. Need to review coverage limits before then. She'll send updated quote in June.", date: "Mar 5, 2026", owner: "Lisa" },
];

// ── Vendor Contracts ──

export interface VendorContract {
  id: string;
  vendorId: string;
  title: string;
  type: "original" | "amendment" | "renewal" | "cancellation";
  status: "active" | "expired" | "pending";
  startDate?: string;
  endDate?: string;
  value?: number;
  autoRenew?: boolean;
  reminderDays?: number;
  notes?: string;
  created: string;
}

export const vendorContracts: VendorContract[] = [
  { id: "vct1", vendorId: "v1", title: "Annual Supply Agreement", type: "original", status: "active", startDate: "2026-01-01", endDate: "2026-12-31", value: 5400, autoRenew: true, notes: "15% volume discount on orders over $500.", created: "Jan 1, 2026" },
  { id: "vct2", vendorId: "v2", title: "Infrastructure Hosting Agreement", type: "original", status: "active", startDate: "2025-09-01", endDate: "2026-09-01", value: 8400, autoRenew: true, created: "Sep 1, 2025" },
  { id: "vct3", vendorId: "v2", title: "Backup Storage Addendum", type: "amendment", status: "active", startDate: "2026-02-01", value: 1200, notes: "Added offsite backup tier. $100/mo increase.", created: "Feb 1, 2026" },
  { id: "vct4", vendorId: "v3", title: "Legal Retainer Agreement", type: "original", status: "active", startDate: "2025-12-01", value: 30000, autoRenew: false, notes: "$2,500/mo retainer for on-call legal support.", created: "Dec 1, 2025" },
  { id: "vct5", vendorId: "v4", title: "Cleaning Services Contract", type: "original", status: "expired", startDate: "2025-06-01", endDate: "2026-02-28", value: 9600, autoRenew: false, created: "Jun 1, 2025" },
  { id: "vct6", vendorId: "v4", title: "Contract Cancellation Notice", type: "cancellation", status: "active", startDate: "2026-02-15", notes: "30-day notice provided. Final service Feb 28.", created: "Feb 15, 2026" },
  { id: "vct7", vendorId: "v6", title: "Commercial Insurance Policy", type: "original", status: "active", startDate: "2025-07-01", endDate: "2026-07-01", value: 12000, autoRenew: true, created: "Jul 1, 2025" },
  { id: "vct8", vendorId: "v6", title: "Policy Renewal - 2026", type: "renewal", status: "pending", startDate: "2026-07-01", endDate: "2027-07-01", value: 12600, notes: "5% premium increase. Reviewing coverage limits.", created: "Mar 5, 2026" },
];

// ── Vendor Tax Records ──

export interface VendorTax {
  id: string;
  vendorId: string;
  w9Status: "on-file" | "requested" | "na";
  needs1099: boolean;
  type1099?: "1099-NEC" | "1099-MISC" | "1099-INT" | "1099-DIV";
  yearRecords: { year: number; status: "sent" | "not-sent"; totalPaid: number }[];
}

export const vendorTaxRecords: VendorTax[] = [
  { id: "vt1", vendorId: "v1", w9Status: "on-file", needs1099: true, type1099: "1099-NEC", yearRecords: [{ year: 2025, status: "sent", totalPaid: 4800 }, { year: 2026, status: "not-sent", totalPaid: 1350 }] },
  { id: "vt2", vendorId: "v2", w9Status: "on-file", needs1099: false, yearRecords: [{ year: 2025, status: "not-sent", totalPaid: 8400 }, { year: 2026, status: "not-sent", totalPaid: 4200 }] },
  { id: "vt3", vendorId: "v3", w9Status: "on-file", needs1099: true, type1099: "1099-NEC", yearRecords: [{ year: 2025, status: "sent", totalPaid: 2500 }, { year: 2026, status: "not-sent", totalPaid: 7500 }] },
  { id: "vt4", vendorId: "v4", w9Status: "on-file", needs1099: true, type1099: "1099-NEC", yearRecords: [{ year: 2025, status: "sent", totalPaid: 9600 }] },
  { id: "vt5", vendorId: "v5", w9Status: "requested", needs1099: true, type1099: "1099-NEC", yearRecords: [] },
  { id: "vt6", vendorId: "v6", w9Status: "on-file", needs1099: false, yearRecords: [{ year: 2025, status: "not-sent", totalPaid: 12000 }, { year: 2026, status: "not-sent", totalPaid: 6000 }] },
];
