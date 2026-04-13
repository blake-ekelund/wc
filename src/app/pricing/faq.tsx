"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "Is the free plan really free forever?", a: "Yes. The Starter plan has no time limit. You get up to 100 contacts, 3 users, all 6 industry templates, full pipeline tracking, and data import/export. No credit card required." },
  { q: "What happens if I go over 100 contacts on the free plan?", a: "You'll be prompted to upgrade to Business. Your existing data stays safe, and you can upgrade or export at any time." },
  { q: "How does per-seat pricing work?", a: "You pay $5/month for each user in your workspace. If you have 4 team members, that's $20/month. Add or remove users anytime." },
  { q: "Can I cancel anytime?", a: "Yes. No contracts, no cancellation fees. Downgrade to the free plan whenever you want and keep your data." },
  { q: "Do you offer annual billing?", a: "We currently offer monthly billing only. No long-term commitments required." },
  { q: "Is there a setup fee?", a: "No. Sign up, pick your industry template, and you're ready in 60 seconds. No onboarding calls, no implementation fees." },
  { q: "What payment methods do you accept?", a: "We accept all major credit cards via Stripe. Your payment information is never stored on our servers." },
  { q: "Can I switch plans later?", a: "Yes. Upgrade from Starter to Business anytime to unlock Gmail integration, unlimited users, custom fields, vendor management, and more. Downgrade back to Starter if you want." },
  { q: "Do you offer discounts for nonprofits or education?", a: "Not currently, but reach out to us at support@workchores.com and we're happy to discuss your needs." },
  { q: "What's included in priority support?", a: "Business plan users get faster response times and direct access to our team via the in-app chat. We typically respond within a few hours." },
];

export default function PricingFaq() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section className="max-w-2xl mx-auto px-6 pb-16">
      <h2 className="text-xl font-bold text-foreground text-center mb-8">Frequently asked questions</h2>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-surface/50 transition-colors"
            >
              <span className="text-sm font-medium text-foreground pr-4">{faq.q}</span>
              <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition-transform ${expanded === i ? "rotate-180" : ""}`} />
            </button>
            {expanded === i && (
              <div className="px-5 pb-4">
                <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
