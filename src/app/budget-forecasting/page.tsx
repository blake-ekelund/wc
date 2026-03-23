import type { Metadata } from "next";
import NavbarSuite from "@/components/navbar-suite";
import Footer from "@/components/footer";
import ProductSuiteBanner from "@/components/product-suite-banner";
import BudgetForecastingContent from "./content";

export const metadata: Metadata = {
  title: "Budget & Forecasting — WorkChores",
  description:
    "Track departmental budgets, compare actuals to forecast, and manage spend. Coming soon to WorkChores.",
};

export default function BudgetForecastingPage() {
  return (
    <>
      <NavbarSuite />
      <main>
        <BudgetForecastingContent />
      </main>
      <ProductSuiteBanner currentProduct="/budget-forecasting" />
      <Footer />
    </>
  );
}
