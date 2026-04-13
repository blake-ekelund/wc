import type { Metadata } from "next";
import NavbarSimple from "@/components/navbar-simple";
import Footer from "@/components/footer";
import ProductSuiteBanner from "@/components/product-suite-banner";
import TaskTrackerContent from "./content";

export const metadata: Metadata = {
  title: "Task Tracker — WorkChores",
  description:
    "One task list across your CRM, vendors, and operations. Assign work, set deadlines, and track what's done — without a separate project management tool.",
  alternates: { canonical: "https://workchores.com/task-tracker" },
  openGraph: {
    title: "Task Tracker — WorkChores",
    description: "One task list across your CRM, vendors, and operations. No separate tool needed.",
    type: "website",
    url: "https://workchores.com/task-tracker",
  },
};

export default function TaskTrackerPage() {
  return (
    <>
      <NavbarSimple activeProduct="Task Tracker" />
      <main>
        <TaskTrackerContent />
      </main>
      <ProductSuiteBanner currentProduct="/task-tracker" />
      <Footer />
    </>
  );
}
