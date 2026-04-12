import type { Metadata } from "next";
import NavbarSimple from "@/components/navbar-simple";
import Footer from "@/components/footer";
import ProductSuiteBanner from "@/components/product-suite-banner";
import BudgetForecastingContent from "./content";

export const metadata: Metadata = {
  title: "Budget & Forecasting — WorkChores",
  description:
    "Track departmental budgets, compare actuals to forecast, and manage spend. Coming soon to WorkChores.",
  alternates: { canonical: "https://workchores.com/budget-forecasting" },
  openGraph: {
    title: "Budget & Forecasting — WorkChores",
    description: "Track departmental budgets, compare actuals to forecast, and manage spend.",
    type: "website",
    url: "https://workchores.com/budget-forecasting",
  },
};

export default function BudgetForecastingPage() {
  return (
    <>
      <NavbarSimple activeProduct="Budget & Forecasting" />
      <main>
        <BudgetForecastingContent />
      </main>
      <ProductSuiteBanner currentProduct="/budget-forecasting" />
      <Footer />
    </>
  );
}
