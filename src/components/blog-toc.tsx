"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  label: string;
}

interface BlogTOCProps {
  items: TocItem[];
}

export default function BlogTOC({ items }: BlogTOCProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting entry (topmost visible heading)
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );

    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    headings.forEach((el) => observer.observe(el));

    return () => {
      headings.forEach((el) => observer.unobserve(el));
    };
  }, [items]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile: collapsible dropdown at top of article */}
      <div className="lg:hidden mb-8">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center justify-between w-full text-left text-sm font-semibold text-slate-700 bg-slate-50 rounded-lg px-4 py-3 border border-slate-200"
        >
          <span>On this page</span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {mobileOpen && (
          <nav className="mt-2 bg-slate-50 rounded-lg border border-slate-200 px-4 py-3">
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleClick(item.id)}
                    className={`text-sm text-left w-full transition-colors ${
                      activeId === item.id
                        ? "text-blue-500 font-medium"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block w-48 shrink-0">
        <nav className="sticky top-24">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            On this page
          </p>
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleClick(item.id)}
                  className={`text-left w-full text-[13px] leading-snug py-1.5 pl-3 border-l-2 transition-colors ${
                    activeId === item.id
                      ? "border-blue-500 text-blue-500 font-medium"
                      : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
