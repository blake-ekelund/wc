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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(due + "T00:00:00");
  const diffMs = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 3) return "upcoming";
  return "later";
}

export function formatDueDate(due: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(due + "T00:00:00");
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
