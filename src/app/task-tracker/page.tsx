import type { Metadata } from "next";
import NavbarSimple from "@/components/navbar-simple";
import Footer from "@/components/footer";
import ProductSuiteBanner from "@/components/product-suite-banner";
import TaskTrackerContent from "./content";

export const metadata: Metadata = {
  title: "Task Tracker — WorkChores",
  description:
    "Assign tasks, track progress, and manage your team's work. Coming soon to WorkChores.",
  alternates: { canonical: "https://workchores.com/task-tracker" },
  openGraph: {
    title: "Task Tracker — WorkChores",
    description: "Assign tasks, track progress, and manage your team's work.",
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
