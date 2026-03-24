import type { Metadata } from "next";
import NavbarSimple from "@/components/navbar-simple";
import Footer from "@/components/footer";
import ProductSuiteBanner from "@/components/product-suite-banner";
import VendorManagementContent from "./content";

export const metadata: Metadata = {
  title: "Vendor Management — WorkChores",
  description:
    "Centralize vendor relationships, track compliance, and manage contracts. Part of the WorkChores operations platform.",
};

export default function VendorManagementPage() {
  return (
    <>
      <NavbarSimple activeProduct="Vendor Mgmt" />
      <main>
        <VendorManagementContent />
      </main>
      <ProductSuiteBanner currentProduct="/vendor-management" />
      <Footer />
    </>
  );
}
