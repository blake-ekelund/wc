"use client";

import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { products } from "@/lib/products";

const navLinks = [
  { label: "Demo", href: "/demo" },
  { label: "Blog", href: "/blog" },
  { label: "Docs", href: "/docs" },
];

export default function NavbarSuite() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScroll() {
      const currentY = window.scrollY;
      if (currentY < 50) {
        setVisible(true);
      } else if (currentY < lastScrollY.current) {
        setVisible(true);
      } else if (currentY > lastScrollY.current + 5) {
        setVisible(false);
        setMobileOpen(false);
        setProductsOpen(false);
      }
      lastScrollY.current = currentY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProductsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-foreground">
          WorkChores
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {/* Platform dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setProductsOpen(!productsOpen)}
              className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
            >
              Platform
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${productsOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {productsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-xl border border-border shadow-lg p-2"
                >
                  {products.map((product) => (
                    <Link
                      key={product.name}
                      href={product.href}
                      onClick={() => setProductsOpen(false)}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface transition-colors"
                    >
                      <div className={`mt-0.5 p-1.5 rounded-md ${product.bgLight} ${product.color}`}>
                        <product.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{product.name}</span>
                          {product.status === "live" && (
                            <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${product.bgLight} ${product.color}`}>
                              Live
                            </span>
                          )}
                          {product.status === "coming-soon" && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700">
                              Soon
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">{product.tagline}</p>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/signin"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
          >
            Get Started Free
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-muted hover:text-foreground"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-white border-b border-border"
          >
            <div className="px-6 py-4 flex flex-col gap-4">
              <div className="text-xs font-semibold text-muted uppercase tracking-wider">Platform</div>
              {products.map((product) => (
                <Link
                  key={product.name}
                  href={product.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors pl-2"
                >
                  <span className={product.color}><product.icon className="w-4 h-4" /></span>
                  {product.name}
                  {product.status === "coming-soon" && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700">
                      Soon
                    </span>
                  )}
                </Link>
              ))}
              <div className="border-t border-border my-1" />
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/signin"
                onClick={() => setMobileOpen(false)}
                className="text-sm text-muted hover:text-foreground font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
