"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, ArrowRight, Sparkles } from "lucide-react";

export default function NewsletterPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (typeof window !== "undefined" && sessionStorage.getItem("newsletter-dismissed")) {
      return;
    }
    const timer = setTimeout(() => setShow(true), 20000);
    return () => clearTimeout(timer);
  }, []);

  function handleDismiss() {
    setShow(false);
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("newsletter-dismissed", "1");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    try {
      await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "newsletter-popup" }),
      });
    } catch { /* non-blocking */ }
    setTimeout(() => {
      handleDismiss();
    }, 3000);
  }

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Top accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-accent via-blue-500 to-accent" />

              <div className="p-8">
                <AnimatePresence mode="wait">
                  {!submitted ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Icon */}
                      <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center mx-auto mb-5">
                        <Mail className="w-7 h-7 text-accent" />
                      </div>

                      <h3 className="text-xl font-bold text-foreground text-center mb-2">
                        Stay ahead of the curve
                      </h3>
                      <p className="text-sm text-muted text-center leading-relaxed mb-6">
                        Get CRM tips, product updates, and early access to new features.
                        Join 1,000+ sales professionals who read our weekly newsletter.
                      </p>

                      <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                          <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-gray-400"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-accent/20"
                        >
                          Subscribe
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>

                      <p className="text-[11px] text-gray-400 text-center mt-4">
                        No spam, ever. Unsubscribe anytime.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-center py-4"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                        <Sparkles className="w-7 h-7 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        You&apos;re in!
                      </h3>
                      <p className="text-sm text-muted">
                        Check your inbox for a welcome email. We&apos;ll keep it
                        short, useful, and worth your time.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
