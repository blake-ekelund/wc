import type { Metadata } from "next";
import NavbarSimple from "@/components/navbar-simple";
import Pricing from "@/components/pricing";
import Footer from "@/components/footer";
import PageTracker from "@/components/page-tracker";
import PricingFaq from "./faq";

export const metadata: Metadata = {
  title: "Pricing — WorkChores CRM",
  description: "Simple, transparent pricing. Free starter plan for individuals. $9/seat/month for teams. No hidden fees, no contracts, cancel anytime.",
  keywords: "WorkChores pricing, CRM pricing, free CRM, affordable CRM, small business CRM cost",
  alternates: { canonical: "https://workchores.com/pricing" },
  openGraph: {
    title: "Pricing — WorkChores CRM",
    description: "Free starter plan. $9/seat/month for teams. No hidden fees, no contracts.",
    type: "website",
    url: "https://workchores.com/pricing",
  },
};

export default function PricingPage() {
  return (
    <>
      <PageTracker />
      <NavbarSimple />
      <main>
        {/* Pricing cards */}
        <Pricing />

        {/* Comparison table */}
        <section className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-xl font-bold text-foreground text-center mb-8">Compare plans</h2>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Feature</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Starter</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-accent uppercase tracking-wider">Business</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { feature: "Price", starter: "Free", business: "$9/seat/mo", enterprise: "Custom" },
                  { feature: "Contacts", starter: "100", business: "50,000", enterprise: "Unlimited" },
                  { feature: "Actions/month", starter: "1,000", business: "500,000", enterprise: "Unlimited" },
                  { feature: "Users", starter: "Unlimited", business: "Unlimited", enterprise: "Unlimited" },
                  { feature: "All features", starter: true, business: true, enterprise: true },
                  { feature: "All plugins (CRM, Vendors, Tasks)", starter: true, business: true, enterprise: true },
                  { feature: "Future plugins included", starter: true, business: true, enterprise: true },
                  { feature: "Industry templates", starter: true, business: true, enterprise: true },
                  { feature: "Pipeline, calendar, reports", starter: true, business: true, enterprise: true },
                  { feature: "Data import & export", starter: true, business: true, enterprise: true },
                  { feature: "Gmail integration", starter: true, business: true, enterprise: true },
                  { feature: "Priority support", starter: false, business: true, enterprise: true },
                  { feature: "Dedicated account manager", starter: false, business: false, enterprise: true },
                  { feature: "Custom onboarding", starter: false, business: false, enterprise: true },
                  { feature: "SLA & uptime guarantee", starter: false, business: false, enterprise: true },
                ].map((row) => (
                  <tr key={row.feature} className="hover:bg-surface/30 transition-colors">
                    <td className="px-5 py-2.5 text-foreground">{row.feature}</td>
                    {(["starter", "business", "enterprise"] as const).map((plan) => (
                      <td key={plan} className="px-5 py-2.5 text-center">
                        {typeof row[plan] === "boolean" ? (
                          row[plan] ? <span className="text-emerald-600 font-semibold">&#10003;</span> : <span className="text-gray-300">&mdash;</span>
                        ) : (
                          <span className={plan === "business" ? "font-medium text-foreground" : "text-muted"}>{row[plan]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <PricingFaq />

        {/* CTA */}
        <section className="py-16 px-6 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to get started?</h2>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">Set up your workspace in 60 seconds. No credit card required.</p>
          <div className="flex items-center justify-center gap-3">
            <a href="/signup" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors">
              Sign Up Free
            </a>
            <a href="/demo" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-foreground border border-border hover:bg-surface rounded-lg transition-colors">
              Try the Demo
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
