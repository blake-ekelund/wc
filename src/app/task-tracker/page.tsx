import type { Metadata } from "next";
import NavbarSuite from "@/components/navbar-suite";
import Footer from "@/components/footer";
import ProductSuiteBanner from "@/components/product-suite-banner";
import TaskTrackerContent from "./content";

export const metadata: Metadata = {
  title: "Task Tracker — WorkChores",
  description:
    "Assign tasks, track progress, and manage your team's work. Coming soon to WorkChores.",
};

export default function TaskTrackerPage() {
  return (
    <>
      <NavbarSuite />
      <main>
        <TaskTrackerContent />
      </main>
      <ProductSuiteBanner currentProduct="/task-tracker" />
      <Footer />
    </>
  );
}
