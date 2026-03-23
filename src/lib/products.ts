import { Users, Truck, UserCircle, TrendingUp, CheckSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Product {
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  href: string;
  status: "live" | "coming-soon" | "beta";
  features: string[];
  targetDate?: string; // e.g. "March 2026"
}

export const products: Product[] = [
  {
    name: "CRM",
    tagline: "Revenue data, pipeline, and customers",
    description:
      "Track every deal, contact, and touchpoint in one place. Know where your revenue stands without asking anyone.",
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
    tagline: "Vendor spend, contracts, and compliance",
    description:
      "Centralize every vendor relationship. Track who you pay, what you owe, and whether they're compliant.",
    icon: Truck,
    href: "/vendor-management",
    status: "coming-soon",
    targetDate: "March 2026",
    features: [
      "Vendor directory & profiles",
      "Compliance tracking & alerts",
      "Purchase order management",
      "Performance scorecards",
    ],
  },
  {
    name: "Task Tracker",
    tagline: "Cross-functional tasks and accountability",
    description:
      "Assign work across teams, set deadlines, and track what's done. The ops leader's to-do list.",
    icon: CheckSquare,
    href: "/task-tracker",
    status: "coming-soon",
    targetDate: "March 2026",
    features: [
      "Assign tasks to team members",
      "Due dates & priorities",
      "Status tracking & updates",
      "Works alongside your CRM",
    ],
  },
  {
    name: "Budget & Forecasting",
    tagline: "Departmental budgets and actuals vs. plan",
    description:
      "Track spend by department, compare actuals to forecast, and stop getting blindsided at quarter-end.",
    icon: TrendingUp,
    href: "/budget-forecasting",
    status: "coming-soon",
    targetDate: "April 2026",
    features: [
      "Departmental budget tracking",
      "Actuals vs. forecast views",
      "Spend categorization",
      "Export-ready reports",
    ],
  },
  {
    name: "HR Tracker",
    tagline: "People data, time off, and headcount",
    description:
      "Employee directory, onboarding checklists, PTO tracking, and headcount planning — without the enterprise HR platform.",
    icon: UserCircle,
    href: "/hr-tracker",
    status: "coming-soon",
    targetDate: "May 2026",
    features: [
      "Employee directory & profiles",
      "PTO & time-off tracking",
      "Onboarding checklists",
      "Headcount & org planning",
    ],
  },
];
