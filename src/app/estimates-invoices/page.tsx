import type { Metadata } from "next";
import NavbarSuite from "@/components/navbar-suite";
import Footer from "@/components/footer";
import ProductSuiteBanner from "@/components/product-suite-banner";
import EstimatesInvoicesContent from "./content";

export const metadata: Metadata = {
  title: "Estimates & Invoices — WorkChores",
  description:
    "Create quick estimates, convert them to invoices, and track payments. Coming soon to WorkChores.",
};

export default function EstimatesInvoicesPage() {
  return (
    <>
      <NavbarSuite />
      <main>
        <EstimatesInvoicesContent />
      </main>
      <ProductSuiteBanner currentProduct="/estimates-invoices" />
      <Footer />
    </>
  );
}
