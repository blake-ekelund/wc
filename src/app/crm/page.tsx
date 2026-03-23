import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import NewsletterPopup from "@/components/newsletter-popup";
import PageTracker from "@/components/page-tracker";
import SocialProof from "@/components/social-proof";
import Features from "@/components/features";
import Industries from "@/components/industries";
import HowItWorks from "@/components/how-it-works";
import WhyThisCrm from "@/components/why-this-crm";
import Pricing from "@/components/pricing";
import FinalCta from "@/components/final-cta";
import ProductSuiteBanner from "@/components/product-suite-banner";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "WorkChores CRM — Built for Small Teams",
  description:
    "Track prospects, customers, touchpoints, and your sales funnel in one clean workspace. Built for small teams that move fast.",
};

export default function CrmPage() {
  return (
    <>
      <PageTracker />
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <Industries />
        <HowItWorks />
        <WhyThisCrm />
        <Pricing />
        <FinalCta />
      </main>
      <ProductSuiteBanner currentProduct="/crm" />
      <Footer />
      <NewsletterPopup />
    </>
  );
}
