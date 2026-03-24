import { createClient } from "@supabase/supabase-js";
import BlogPageClient from "./blog-page-client";

const slugIconMap: Record<string, string> = {
  "contact-management-beyond-spreadsheets": "BookOpen",
  "why-small-teams-dont-need-hubspot": "TrendingUp",
};

// Hardcoded fallback data in case Supabase fetch fails
const fallbackPosts = [
  {
    title: "Contact Management Beyond Spreadsheets",
    description: "Spreadsheets weren't built to manage relationships. Here's what breaks when your contact list outgrows a tab.",
    tags: ["CRM", "Productivity", "Small Business"],
    published_at: "2026-03-24T00:00:00Z",
    read_time: "9 min read",
    href: "/blog/contact-management-beyond-spreadsheets",
    slug: "contact-management-beyond-spreadsheets",
    views: 0,
    iconName: "BookOpen",
  },
  {
    title: "Why Small Teams Don't Need HubSpot",
    description: "HubSpot starts free but doesn't stay that way. Here's why growing teams are choosing leaner CRM tools.",
    tags: ["CRM", "Operations", "Opinion"],
    published_at: "2026-03-23T00:00:00Z",
    read_time: "8 min read",
    href: "/blog/why-small-teams-dont-need-hubspot",
    slug: "why-small-teams-dont-need-hubspot",
    views: 0,
    iconName: "TrendingUp",
  },
];

// Hardcoded upcoming/draft posts (these stay hardcoded since they're not published yet)
const upcomingPosts = [
  {
    title: "How to Set Up Pipeline Stages for Your Industry",
    category: "Best Practices",
    status: "Drafting",
    iconName: "Settings",
  },
  {
    title: "The Follow-Up Framework That Closes Deals",
    category: "Sales Tips",
    status: "Drafting",
    iconName: "TrendingUp",
  },
  {
    title: "CRM Data Hygiene: Keep Your Contacts Clean",
    category: "Best Practices",
    status: "Planned",
    iconName: "Settings",
  },
  {
    title: "Setting Up Team Roles: Who Should See What?",
    category: "Team Management",
    status: "Planned",
    iconName: "Users",
  },
];

export type BlogPost = {
  title: string;
  description: string;
  tags: string[];
  published_at: string;
  read_time: string;
  href: string;
  slug: string;
  views: number;
  iconName: string;
};

export type UpcomingPost = {
  title: string;
  category: string;
  status: string;
  iconName: string;
};

async function fetchPublishedPosts(): Promise<BlogPost[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials not configured, using fallback blog data");
      return fallbackPosts;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("blog_posts")
      .select("slug, title, description, tags, published_at, read_time, views")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn("Failed to fetch blog posts from Supabase, using fallback data:", error?.message);
      return fallbackPosts;
    }

    return data.map((post) => ({
      title: post.title,
      description: post.description,
      tags: post.tags || [],
      published_at: post.published_at,
      read_time: post.read_time || "5 min read",
      href: `/blog/${post.slug}`,
      slug: post.slug,
      views: post.views || 0,
      iconName: slugIconMap[post.slug] || "BookOpen",
    }));
  } catch (err) {
    console.warn("Error fetching blog posts, using fallback data:", err);
    return fallbackPosts;
  }
}

export default async function Blog() {
  const posts = await fetchPublishedPosts();

  return (
    <BlogPageClient
      posts={posts}
      upcomingPosts={upcomingPosts}
    />
  );
}
