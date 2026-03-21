import Link from "next/link";
import NavbarSimple from "@/components/navbar-simple";
import Footer from "@/components/footer";
import { Clock, Pencil } from "lucide-react";

const upcomingPosts = [
  {
    title: "Why Small Teams Don't Need Salesforce",
    category: "Insights",
    status: "Writing",
  },
  {
    title: "Contact Management Beyond Spreadsheets",
    category: "Getting Started",
    status: "Writing",
  },
  {
    title: "How to Set Up Pipeline Stages for Your Industry",
    category: "Best Practices",
    status: "Drafting",
  },
  {
    title: "The Follow-Up Framework That Closes Deals",
    category: "Sales Tips",
    status: "Drafting",
  },
  {
    title: "CRM Data Hygiene: Keep Your Contacts Clean",
    category: "Best Practices",
    status: "Planned",
  },
  {
    title: "Setting Up Team Roles: Who Should See What?",
    category: "Team Management",
    status: "Planned",
  },
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)] flex flex-col">
      <NavbarSimple />

      <main className="flex-1 max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold text-foreground mb-2">Blog</h1>
        <p className="text-sm text-muted mb-12">Practical advice on CRM, sales, and growing a small business.</p>

        {/* Coming soon banner */}
        <div className="border border-border rounded-xl p-8 text-center mb-12 bg-surface">
          <div className="inline-flex items-center gap-2 bg-accent-light text-accent text-xs font-medium px-3 py-1 rounded-full mb-4">
            <Pencil className="w-3 h-3" />
            Coming Soon
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">We&apos;re writing our first posts</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            We&apos;re putting together guides, tips, and insights to help small teams get the most out of their CRM. Check back soon.
          </p>
        </div>

        {/* Upcoming posts */}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">What&apos;s in the pipeline</h3>
        <div className="divide-y divide-border">
          {upcomingPosts.map((post) => (
            <div key={post.title} className="py-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                <p className="text-xs text-muted mt-0.5">{post.category}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted shrink-0">
                <Clock className="w-3 h-3" />
                {post.status}
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-12 border border-border rounded-xl p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Get notified when we publish</h2>
          <p className="text-sm text-muted mb-5">Be the first to read new posts. No spam, unsubscribe anytime.</p>
          <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
            <input
              type="email"
              placeholder="you@company.com"
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
            />
            <button className="bg-accent text-white hover:bg-accent-dark rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
