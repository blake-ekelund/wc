import type { Metadata } from "next";
import NavbarSimple from "@/components/navbar-simple";
import Footer from "@/components/footer";
import ProductSuiteBanner from "@/components/product-suite-banner";
import HrTrackerContent from "./content";

export const metadata: Metadata = {
  title: "HR Tracker — WorkChores",
  description:
    "Employee directory, PTO tracking, onboarding checklists, and headcount planning. Coming soon to WorkChores.",
  alternates: { canonical: "https://workchores.com/hr-tracker" },
  openGraph: {
    title: "HR Tracker — WorkChores",
    description: "Employee directory, PTO tracking, onboarding checklists, and headcount planning.",
    type: "website",
    url: "https://workchores.com/hr-tracker",
  },
};

export default function HrTrackerPage() {
  return (
    <>
      <NavbarSimple activeProduct="HR Tracker" />
      <main>
        <HrTrackerContent />
      </main>
      <ProductSuiteBanner currentProduct="/hr-tracker" />
      <Footer />
    </>
  );
}
