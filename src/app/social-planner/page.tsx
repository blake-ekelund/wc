import type { Metadata } from "next";
import NavbarSuite from "@/components/navbar-suite";
import Footer from "@/components/footer";
import ProductSuiteBanner from "@/components/product-suite-banner";
import SocialPlannerContent from "./content";

export const metadata: Metadata = {
  title: "Social Planner — WorkChores",
  description:
    "Plan, draft, and schedule social media posts across platforms. Coming soon to WorkChores.",
};

export default function SocialPlannerPage() {
  return (
    <>
      <NavbarSuite />
      <main>
        <SocialPlannerContent />
      </main>
      <ProductSuiteBanner currentProduct="/social-planner" />
      <Footer />
    </>
  );
}
