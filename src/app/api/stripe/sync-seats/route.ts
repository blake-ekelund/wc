import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Syncs the Stripe subscription quantity with the actual number of active seats.
 * Called when a team member is added or removed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspace ID" }, { status: 400 });
    }

    // Verify the user is authenticated and belongs to this workspace
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
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get workspace subscription info
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("plan, stripe_subscription_id")
      .eq("id", workspaceId)
      .single();

    // Only sync if on a paid plan with an active subscription
    if (!workspace?.stripe_subscription_id || workspace.plan !== "business") {
      return NextResponse.json({ synced: false, reason: "No active subscription" });
    }

    // Count active members
    const { count } = await supabase
      .from("workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "active");

    const activeSeats = Math.max(1, count || 1);

    // Get the subscription and update quantity
    const subscription = await stripe.subscriptions.retrieve(workspace.stripe_subscription_id);

    if (!subscription || subscription.status === "canceled") {
      return NextResponse.json({ synced: false, reason: "Subscription not active" });
    }

    const subscriptionItem = subscription.items.data[0];
    if (!subscriptionItem) {
      return NextResponse.json({ synced: false, reason: "No subscription item found" });
    }

    // Only update if quantity changed
    if (subscriptionItem.quantity === activeSeats) {
      return NextResponse.json({ synced: true, seats: activeSeats, changed: false });
    }

    // Update the subscription quantity (Stripe auto-prorates)
    await stripe.subscriptions.update(workspace.stripe_subscription_id, {
      items: [
        {
          id: subscriptionItem.id,
          quantity: activeSeats,
        },
      ],
      proration_behavior: "create_prorations",
    });

    console.log(`Workspace ${workspaceId}: updated Stripe seats from ${subscriptionItem.quantity} to ${activeSeats}`);

    return NextResponse.json({ synced: true, seats: activeSeats, changed: true });
  } catch (error) {
    console.error("Sync seats error:", error);
    return NextResponse.json({ error: "Failed to sync seats" }, { status: 500 });
  }
}
