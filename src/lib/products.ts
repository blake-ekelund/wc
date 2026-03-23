import { Users, Truck, FileText, CheckSquare, Calendar } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Product {
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  href: string;
  status: "live" | "coming-soon" | "beta";
  features: string[];
}

export const products: Product[] = [
  {
    name: "CRM",
    tagline: "Manage contacts, deals, and your pipeline",
    description:
      "A lightweight CRM that adapts to your industry — with custom pipelines, Gmail integration, built-in calendar, and everything you need to close more deals.",
    icon: Users,
    href: "/crm",
    status: "live",
    features: [
      "6 industry-specific templates",
      "Gmail integration & email templates",
      "Visual drag-and-drop pipeline",
      "Starting at $5/seat/month",
    ],
  },
  {
    name: "Vendor Management",
    tagline: "Track who you buy from",
    description:
      "Centralize your vendor relationships, monitor compliance, and keep tabs on what you order and from whom.",
    icon: Truck,
    href: "/vendor-management",
    status: "coming-soon",
    features: [
      "Vendor directory & profiles",
      "Compliance tracking & alerts",
      "Purchase order management",
      "Performance scorecards",
    ],
  },
  {
    name: "Estimates & Invoices",
    tagline: "Send quotes, get paid",
    description:
      "Create quick estimates, convert them to invoices, and track who's paid. No accounting degree required.",
    icon: FileText,
    href: "/estimates-invoices",
    status: "coming-soon",
    features: [
      "One-click estimates & invoices",
      "Send via email or link",
      "Payment tracking",
      "Export for your accountant",
    ],
  },
  {
    name: "Task Tracker",
    tagline: "Assign work, track progress",
    description:
      "A simple way to manage tasks across your team — who's doing what, where, and by when.",
    icon: CheckSquare,
    href: "/task-tracker",
    status: "coming-soon",
    features: [
      "Assign tasks to team members",
      "Due dates & priorities",
      "Status tracking & updates",
      "Works alongside your CRM",
    ],
  },
  {
    name: "Social Planner",
    tagline: "Plan and schedule your posts",
    description:
      "Draft social media content, organize your calendar, and keep track of what goes out and when.",
    icon: Calendar,
    href: "/social-planner",
    status: "coming-soon",
    features: [
      "Content calendar view",
      "Draft & schedule posts",
      "Multi-platform planning",
      "Team collaboration",
    ],
  },
];
