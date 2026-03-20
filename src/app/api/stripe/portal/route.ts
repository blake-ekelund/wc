import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createRateLimiter } from "@/lib/rate-limit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 10 portal requests per minute per IP
const limiter = createRateLimiter({ max: 10, id: "stripe-portal" });

export async function POST(request: NextRequest) {
  try {
    const blocked = limiter(request);
    if (blocked) return blocked;
    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspace ID" }, { status: 400 });
    }

    // Verify the user is authenticated and is an owner/admin of this workspace
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: membership } = await supabaseAuth
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .in("role", ["owner", "admin"])
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://workchores.com";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get Stripe customer ID
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("stripe_customer_id")
      .eq("id", workspaceId)
      .single();

    if (!workspace?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found" }, { status: 400 });
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: workspace.stripe_customer_id,
      return_url: `${siteUrl}/app`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
