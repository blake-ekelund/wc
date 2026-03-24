import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const supabase = getSupabase();

    // Try to increment; if table doesn't exist, return gracefully
    const { error } = await supabase.rpc("increment_blog_views", { post_slug: slug });

    if (error) {
      // Fallback: try upsert directly
      const { data: existing } = await supabase
        .from("blog_views")
        .select("views")
        .eq("slug", slug)
        .single();

      if (existing) {
        await supabase
          .from("blog_views")
          .update({ views: (existing.views || 0) + 1 })
          .eq("slug", slug);
      } else {
        await supabase
          .from("blog_views")
          .insert({ slug, views: 1 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    // If table doesn't exist or any error, fail silently
    return NextResponse.json({ success: true });
  }
}

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    const supabase = getSupabase();

    if (slug) {
      const { data } = await supabase
        .from("blog_views")
        .select("slug, views")
        .eq("slug", slug)
        .single();

      return NextResponse.json({ views: data?.views || 0 });
    }

    const { data } = await supabase
      .from("blog_views")
      .select("slug, views");

    const viewMap: Record<string, number> = {};
    (data || []).forEach((row: { slug: string; views: number }) => {
      viewMap[row.slug] = row.views;
    });

    return NextResponse.json({ views: viewMap });
  } catch {
    return NextResponse.json({ views: {} });
  }
}
