import Link from "next/link";

const posts = [
  {
    slug: "why-small-teams-dont-need-salesforce",
    title: "Why Small Teams Don't Need Salesforce",
    excerpt: "Enterprise CRMs weren't built for you. Here's what to look for in a CRM when your team is under 25 people — and why simpler is almost always better.",
    category: "Insights",
    date: "March 20, 2026",
    readTime: "5 min read",
  },
  {
    slug: "contact-management-beyond-spreadsheets",
    title: "Contact Management Beyond Spreadsheets",
    excerpt: "Spreadsheets are great — until they're not. Learn when it's time to move your contacts into a real system and how to make the switch without losing anything.",
    category: "Getting Started",
    date: "March 18, 2026",
    readTime: "4 min read",
  },
  {
    slug: "pipeline-stages-by-industry",
    title: "How to Set Up Pipeline Stages for Your Industry",
    excerpt: "A real estate pipeline looks nothing like a consulting pipeline. We break down the ideal deal stages for six common industries and how to customize them.",
    category: "Best Practices",
    date: "March 15, 2026",
    readTime: "6 min read",
  },
  {
    slug: "follow-up-framework",
    title: "The Follow-Up Framework That Closes Deals",
    excerpt: "80% of sales require at least 5 follow-ups, but most people stop after 1. Here's a practical system for staying top-of-mind without being annoying.",
    category: "Sales Tips",
    date: "March 12, 2026",
    readTime: "4 min read",
  },
  {
    slug: "crm-data-hygiene",
    title: "CRM Data Hygiene: Keep Your Contacts Clean",
    excerpt: "Duplicate contacts, missing fields, and stale records quietly kill your sales process. Here's a monthly routine to keep your CRM data sharp.",
    category: "Best Practices",
    date: "March 8, 2026",
    readTime: "3 min read",
  },
  {
    slug: "team-roles-access-control",
    title: "Setting Up Team Roles: Who Should See What?",
    excerpt: "Role-based access isn't just a security feature — it's a productivity feature. Learn how to structure permissions so your team focuses on what matters.",
    category: "Team Management",
    date: "March 5, 2026",
    readTime: "4 min read",
  },
];

const categories = ["All", "Insights", "Getting Started", "Best Practices", "Sales Tips", "Team Management"];

export default function Blog() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-semibold text-lg text-foreground">
            WorkChores
          </Link>
          <Link href="/signup" className="text-sm text-accent hover:underline font-medium">
            Sign Up
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-foreground mb-2">Blog</h1>
        <p className="text-sm text-muted mb-8">Practical advice on CRM, sales, and growing a small business.</p>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                i === 0
                  ? "bg-foreground text-white border-foreground"
                  : "bg-white text-muted border-border hover:border-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-0 divide-y divide-border">
          {posts.map((post) => (
            <article key={post.slug} className="py-8 first:pt-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-accent">{post.category}</span>
                <span className="text-[10px] text-muted">{post.date}</span>
                <span className="text-[10px] text-muted">&middot;</span>
                <span className="text-[10px] text-muted">{post.readTime}</span>
              </div>
              <h2 className="text-base font-semibold text-foreground mb-2 hover:text-accent transition-colors cursor-pointer">
                {post.title}
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                {post.excerpt}
              </p>
            </article>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-12 bg-surface border border-border rounded-xl p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Stay in the loop</h2>
          <p className="text-sm text-muted mb-5">Get new posts delivered to your inbox. No spam, unsubscribe anytime.</p>
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

        <div className="mt-16 pt-8 border-t border-border flex items-center justify-between text-xs text-muted">
          <span>&copy; {new Date().getFullYear()} WorkChores, LLC. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/about" className="text-accent hover:underline">About</Link>
            <Link href="/contact" className="text-accent hover:underline">Contact</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
