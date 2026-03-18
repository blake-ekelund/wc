import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import NewsletterPopup from "@/components/newsletter-popup";
import SocialProof from "@/components/social-proof";
import Features from "@/components/features";
import Industries from "@/components/industries";
import HowItWorks from "@/components/how-it-works";
import WhyThisCrm from "@/components/why-this-crm";
import Pricing from "@/components/pricing";
import FinalCta from "@/components/final-cta";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
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
      <Footer />
      <NewsletterPopup />
    </>
  );
}
