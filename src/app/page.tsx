import NavbarSimple from "@/components/navbar-simple";
import SuiteHero from "@/components/suite-hero";
import SuiteProducts from "@/components/suite-products";
import SuiteValueProp from "@/components/suite-value-prop";
import SuiteCta from "@/components/suite-cta";
import Footer from "@/components/footer";
import NewsletterPopup from "@/components/newsletter-popup";
import PageTracker from "@/components/page-tracker";

export default function Home() {
  return (
    <>
      <PageTracker />
      <NavbarSimple />
      <main>
        <SuiteHero />
        <SuiteProducts />
        <SuiteValueProp />
        <SuiteCta />
      </main>
      <Footer />
      <NewsletterPopup />
    </>
  );
}
