import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createRateLimiter } from "@/lib/rate-limit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 10 checkout attempts per minute per IP
const limiter = createRateLimiter({ max: 10, id: "stripe-checkout" });

export async function GET(request: NextRequest) {
  try {
    const blocked = limiter(request);
    if (blocked) return blocked;
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspace ID" }, { status: 400 });
    }

    // Verify user is authenticated
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Verify user belongs to this workspace
    const { data: membership } = await supabaseAuth
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("plan, stripe_customer_id, stripe_subscription_id")
      .eq("id", workspaceId)
      .single();

    const dbPlan = workspace?.plan || "free";

    // Self-healing: If workspace has a Stripe customer, verify plan against Stripe
    // This catches missed webhooks (wrong URL, secret mismatch, deploy downtime, etc.)
    if (workspace?.stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: workspace.stripe_customer_id,
          status: "active",
          limit: 1,
        });

        const hasActiveSub = subscriptions.data.length > 0;
        const stripePlan = hasActiveSub ? "business" : "free";

        if (stripePlan !== dbPlan) {
          // DB is out of sync with Stripe — fix it
          const updateData: Record<string, string | null> = {
            plan: stripePlan,
            plan_updated_at: new Date().toISOString(),
          };
          if (hasActiveSub) {
            updateData.stripe_subscription_id = subscriptions.data[0].id;
          } else {
            updateData.stripe_subscription_id = null;
          }

          await supabase
            .from("workspaces")
            .update(updateData)
            .eq("id", workspaceId);

          console.log(`Self-healed workspace ${workspaceId} plan: ${dbPlan} → ${stripePlan}`);
          return NextResponse.json({ plan: stripePlan });
        }
      } catch (stripeErr) {
        // Stripe API call failed — fall back to DB value
        console.error("Stripe verification failed, using DB plan:", stripeErr);
      }
    }

    return NextResponse.json({ plan: dbPlan });
  } catch (error) {
    console.error("Fetch plan error:", error);
    return NextResponse.json({ plan: "free" });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, userEmail: providedEmail, plan, seats } = body;

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

    // Check if workspace already has a Stripe customer
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("stripe_customer_id, name, created_by")
      .eq("id", workspaceId)
      .single();

    // Use authenticated user's email
    const userEmail = providedEmail || user.email || "";

    let customerId = workspace?.stripe_customer_id;

    // Create Stripe customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          workspace_id: workspaceId,
          workspace_name: workspace?.name || "",
        },
      });
      customerId = customer.id;

      // Save customer ID to workspace
      await supabase
        .from("workspaces")
        .update({ stripe_customer_id: customerId })
        .eq("id", workspaceId);
    }

    if (plan === "free") {
      // Downgrade to free — cancel subscription if exists
      const { data: ws } = await supabase
        .from("workspaces")
        .select("stripe_subscription_id")
        .eq("id", workspaceId)
        .single();

      if (ws?.stripe_subscription_id) {
        await stripe.subscriptions.cancel(ws.stripe_subscription_id);
        await supabase
          .from("workspaces")
          .update({
            plan: "free",
            stripe_subscription_id: null,
            plan_updated_at: new Date().toISOString(),
          })
          .eq("id", workspaceId);
      }

      return NextResponse.json({ url: `${siteUrl}/app?plan=free` });
    }

    // Create Stripe Checkout session for Business plan
    const priceId = process.env.STRIPE_BUSINESS_PRICE_ID!;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: Math.max(1, seats || 1) }],
      success_url: `${siteUrl}/app?plan=business&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/app?plan=cancelled`,
      metadata: {
        workspace_id: workspaceId,
      },
      subscription_data: {
        metadata: {
          workspace_id: workspaceId,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
