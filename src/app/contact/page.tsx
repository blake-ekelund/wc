"use client";

import { useState } from "react";
import { Mail, MapPin, MessageSquare, Clock, ArrowRight, Send } from "lucide-react";
import NavbarSimple from "@/components/navbar-simple";
import Footer from "@/components/footer";
import { FadeIn, FadeInStagger, FadeInItem } from "@/components/animated";

const contactCards = [
  { icon: Mail, title: "Email", detail: "support@workchores.com", sub: "General inquiries and help" },
  { icon: MapPin, title: "Location", detail: "Gaithersburg, Maryland", sub: "United States" },
  { icon: Clock, title: "Response Time", detail: "Within 24 hours", sub: "Usually much faster" },
  { icon: MessageSquare, title: "Live Chat", detail: "On every page", sub: "Bottom-right chat button" },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/support-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: `[${form.subject || "General"}] ${form.message}`,
          page: "/contact",
        }),
      });
      if (res.ok) {
        setSent(true);
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        setError("Something went wrong. Please try again or email us directly.");
      }
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] flex flex-col">
      <NavbarSimple />

      {/* Hero */}
      <section className="bg-surface border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-4">Contact</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight max-w-2xl">
              We&apos;d love to hear from you.
            </h1>
            <p className="text-muted mt-4 max-w-xl text-lg leading-relaxed">
              Have a question, feedback, or need help getting started? Reach out and a real person will get back to you.
            </p>
          </FadeIn>
        </div>
      </section>

      <main className="flex-1">
        {/* Contact cards */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <FadeInStagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {contactCards.map((card) => (
              <FadeInItem key={card.title}>
                <div className="bg-white border border-border rounded-xl p-6 hover:shadow-lg hover:shadow-gray-200/40 transition-shadow h-full">
                  <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center mb-4">
                    <card.icon className="w-4.5 h-4.5 text-accent" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-0.5">{card.title}</h3>
                  <p className="text-sm text-foreground">{card.detail}</p>
                  <p className="text-xs text-muted mt-0.5">{card.sub}</p>
                </div>
              </FadeInItem>
            ))}
          </FadeInStagger>
        </section>

        {/* Form section */}
        <section className="bg-surface border-y border-border">
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="grid md:grid-cols-5 gap-16">
              {/* Left column */}
              <div className="md:col-span-2">
                <FadeIn>
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">Send a Message</p>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">Get in touch.</h2>
                  <p className="text-sm text-muted leading-relaxed mb-6">
                    Fill out the form and we&apos;ll get back to you within 24 hours. For urgent matters, use the live chat on any page.
                  </p>
                  <div className="border-t border-border pt-6 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Other Inquiries</p>
                    {[
                      { label: "Billing", email: "billing@workchores.com" },
                      { label: "Privacy", email: "privacy@workchores.com" },
                      { label: "Legal", email: "legal@workchores.com" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-sm">
                        <span className="text-muted">{item.label}</span>
                        <span className="text-foreground font-medium">{item.email}</span>
                      </div>
                    ))}
                  </div>
                </FadeIn>
              </div>

              {/* Form */}
              <div className="md:col-span-3">
                <FadeIn delay={0.15}>
                  {sent ? (
                    <div className="bg-white border border-emerald-200 rounded-2xl p-10 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                        <Send className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground mb-2">Message Sent</h2>
                      <p className="text-sm text-muted mb-6">
                        Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                      </p>
                      <button
                        onClick={() => setSent(false)}
                        className="text-sm text-accent hover:underline font-medium"
                      >
                        Send another message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-8 space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1.5">
                            Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                            placeholder="Your name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground mb-1.5">
                            Email <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
                            placeholder="you@company.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">Subject</label>
                        <select
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all bg-white"
                        >
                          <option value="">Select a topic...</option>
                          <option value="General Question">General Question</option>
                          <option value="Feature Request">Feature Request</option>
                          <option value="Bug Report">Bug Report</option>
                          <option value="Billing">Billing</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                          Message <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          rows={5}
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all resize-none"
                          placeholder="Tell us how we can help..."
                        />
                      </div>

                      {error && (
                        <p className="text-sm text-red-500">{error}</p>
                      )}

                      <button
                        type="submit"
                        disabled={sending}
                        className="bg-accent text-white hover:bg-accent-dark rounded-lg px-6 py-3 text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        {sending ? "Sending..." : <>Send Message <ArrowRight className="w-4 h-4" /></>}
                      </button>
                    </form>
                  )}
                </FadeIn>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
