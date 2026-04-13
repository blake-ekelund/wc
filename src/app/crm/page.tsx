import type { Metadata } from "next";
import NavbarSimple from "@/components/navbar-simple";
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
  alternates: { canonical: "https://workchores.com/crm" },
  openGraph: {
    title: "WorkChores CRM — Built for Small Teams",
    description: "Track prospects, customers, touchpoints, and your sales funnel in one clean workspace.",
    type: "website",
    url: "https://workchores.com/crm",
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "WorkChores CRM",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://workchores.com/crm",
  description: "Track prospects, customers, touchpoints, and your sales funnel in one clean workspace. Built for small teams that move fast.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free plan available. Business plan at $9/seat/month.",
  },
  featureList: [
    "Contact Management",
    "Deal Pipeline",
    "Task & Activity Tracking",
    "Industry Templates",
    "Role-Based Access",
    "Email Integration",
    "CSV/Excel Import & Export",
    "Custom Fields",
  ],
};

export default function CrmPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <PageTracker />
      <NavbarSimple activeProduct="CRM" />
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
