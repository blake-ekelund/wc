import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspace ID" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("plan")
      .eq("id", workspaceId)
      .single();

    return NextResponse.json({ plan: workspace?.plan || "free" });
  } catch (error) {
    console.error("Fetch plan error:", error);
    return NextResponse.json({ plan: "free" });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, userEmail, plan } = body;

    if (!workspaceId || !userEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://workchores.com";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if workspace already has a Stripe customer
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("stripe_customer_id, name")
      .eq("id", workspaceId)
      .single();

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
      line_items: [{ price: priceId, quantity: 1 }],
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
