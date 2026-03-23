import type { Metadata } from "next";
import NavbarSuite from "@/components/navbar-suite";
import Footer from "@/components/footer";
import VendorManagementContent from "./content";

export const metadata: Metadata = {
  title: "Vendor Management — WorkChores",
  description:
    "Centralize vendor relationships, track compliance, and streamline procurement. Coming soon to WorkChores.",
};

export default function VendorManagementPage() {
  return (
    <>
      <NavbarSuite />
      <main>
        <VendorManagementContent />
      </main>
      <Footer />
    </>
  );
}
