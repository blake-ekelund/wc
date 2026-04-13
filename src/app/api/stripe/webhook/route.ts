import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const workspaceId = session.metadata?.workspace_id;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.toString();

      if (workspaceId) {
        await supabase
          .from("workspaces")
          .update({
            plan: "business",
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.toString(),
            plan_updated_at: new Date().toISOString(),
          })
          .eq("id", workspaceId);

        // Workspace upgraded to business
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const workspaceId = subscription.metadata?.workspace_id;

      if (workspaceId) {
        const status = subscription.status;
        const plan = status === "active" || status === "trialing" ? "business" : "free";

        await supabase
          .from("workspaces")
          .update({
            plan,
            plan_updated_at: new Date().toISOString(),
          })
          .eq("id", workspaceId);

        // Subscription updated
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const workspaceId = subscription.metadata?.workspace_id;

      if (workspaceId) {
        await supabase
          .from("workspaces")
          .update({
            plan: "free",
            stripe_subscription_id: null,
            plan_updated_at: new Date().toISOString(),
          })
          .eq("id", workspaceId);

        // Downgraded to free
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as { subscription?: string | { id: string } | null };
      const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : (invoice.subscription as { id: string } | null)?.id;

      if (subscriptionId) {
        // Find workspace by subscription
        const { data: workspace } = await supabase
          .from("workspaces")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (workspace) {
          // Payment failed — could send notification
          // Could send email notification here
        }
      }
      break;
    }

    default:
      // Unhandled event type
      break;
  }

  return NextResponse.json({ received: true });
}
