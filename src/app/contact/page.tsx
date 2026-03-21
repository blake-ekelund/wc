"use client";

import { useState } from "react";
import { Mail, MapPin, MessageSquare, Clock } from "lucide-react";
import NavbarSimple from "@/components/navbar-simple";
import Footer from "@/components/footer";

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

      <main className="flex-1 max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold text-foreground mb-2">Contact Us</h1>
        <p className="text-sm text-muted mb-10">Have a question, feedback, or need help? We&apos;d love to hear from you.</p>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Contact info sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Mail className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-foreground">Email</h3>
              </div>
              <p className="text-sm text-muted">support@workchores.com</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-foreground">Location</h3>
              </div>
              <p className="text-sm text-muted">Gaithersburg, Maryland</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Clock className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-foreground">Response Time</h3>
              </div>
              <p className="text-sm text-muted">Usually within 24 hours</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <MessageSquare className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-foreground">Live Chat</h3>
              </div>
              <p className="text-sm text-muted">Available on every page via the chat button in the bottom-right corner.</p>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-semibold text-foreground mb-2">Other Inquiries</h3>
              <ul className="text-sm text-muted space-y-1">
                <li>Billing: billing@workchores.com</li>
                <li>Privacy: privacy@workchores.com</li>
                <li>Legal: legal@workchores.com</li>
              </ul>
            </div>
          </div>

          {/* Contact form */}
          <div className="md:col-span-2">
            {sent ? (
              <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-8 text-center">
                <div className="text-emerald-600 text-2xl mb-3">&#10003;</div>
                <h2 className="text-lg font-semibold text-foreground mb-2">Message Sent</h2>
                <p className="text-sm text-muted mb-4">
                  Thanks for reaching out. We&apos;ll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="text-sm text-accent hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
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
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors bg-white"
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
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="bg-accent text-white hover:bg-accent-dark rounded-lg px-6 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
