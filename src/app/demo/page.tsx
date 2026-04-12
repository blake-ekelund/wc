import type { Metadata } from "next";
import DemoApp from "@/components/demo/demo-app";

export const metadata: Metadata = {
  title: "WorkChores CRM — Interactive Demo",
  description: "Try WorkChores CRM with sample data. Explore the pipeline, contacts, touchpoints, and tasks.",
  alternates: { canonical: "https://workchores.com/demo" },
  openGraph: {
    title: "WorkChores CRM — Interactive Demo",
    description: "Try WorkChores CRM with sample data. No signup required.",
    type: "website",
    url: "https://workchores.com/demo",
  },
};

export default function DemoPage() {
  return <DemoApp />;
}
