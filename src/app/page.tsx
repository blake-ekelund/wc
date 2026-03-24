import NavbarSimple from "@/components/navbar-simple";
import SuiteHero from "@/components/suite-hero";
import SuitePlatform from "@/components/suite-platform";
import SuiteProducts from "@/components/suite-products";
import SuiteValueProp from "@/components/suite-value-prop";
import SuiteCta from "@/components/suite-cta";
import Footer from "@/components/footer";
import NewsletterPopup from "@/components/newsletter-popup";
import PageTracker from "@/components/page-tracker";

export default function Home() {
  return (
    <div className="min-h-screen font-sans flex flex-col">
      <PageTracker />
      <NavbarSimple />
      <main className="flex-1">
        <SuiteHero />
        <SuitePlatform />
        <SuiteProducts />
        <SuiteValueProp />
        <SuiteCta />
      </main>
      <Footer />
      <NewsletterPopup />
    </div>
  );
}
