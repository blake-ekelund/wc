const footerLinks = [
  {
    title: "Products",
    links: [
      { label: "CRM", href: "/crm" },
      { label: "Vendor Management", href: "/vendor-management" },
      { label: "HR Tracker", href: "/hr-tracker" },
      { label: "Budget & Forecasting", href: "/budget-forecasting" },
      { label: "Task Tracker", href: "/task-tracker" },
      { label: "Live Demo", href: "/demo" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Legal & Support",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer id="contact" className="py-14 px-6 border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <a href="/" className="flex items-center gap-2 font-semibold text-lg text-foreground">
              WorkChores
            </a>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              The operations platform for G&A leaders. CRM, vendors, HR, budgets,
              and tasks — all in one place.
            </p>
          </div>
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                {group.title}
              </h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-border text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} WorkChores. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
