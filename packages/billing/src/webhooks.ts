import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@repo/db";
import { customers, subscriptions } from "@repo/db/schema";
import { getStripe } from "./stripe";
import { resolvePrice } from "./plans";
import { env } from "./env";

export function constructWebhookEvent(body: string, signature: string): Stripe.Event {
  const s = getStripe();
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return s.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
}

export async function syncSubscriptionFromStripe(subscription: Stripe.Subscription) {
  const stripeCustomerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.providerCustomerId, stripeCustomerId))
    .limit(1);

  if (!customer) {
    console.warn(`Webhook: no local customer for Stripe customer ${stripeCustomerId}, skipping.`);
    return;
  }

  const item = subscription.items.data[0];
  if (!item) {
    console.warn(`Webhook: subscription ${subscription.id} has no items, skipping.`);
    return;
  }

  const priceId = item.price.id;
  const resolved = resolvePrice(priceId);
  if (!resolved) {
    console.warn(`Webhook: unknown price ID ${priceId}, skipping.`);
    return;
  }

  const now = new Date();
  const values = {
    workspaceId: customer.workspaceId,
    customerId: customer.id,
    provider: "stripe" as const,
    providerSubscriptionId: subscription.id,
    providerPriceId: priceId,
    plan: resolved.plan,
    planVersion: resolved.version,
    status: subscription.status,
    interval: item.price.recurring?.interval ?? null,
    currentPeriodStart: new Date(item.current_period_start * 1000),
    currentPeriodEnd: new Date(item.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: now,
  };

  await db
    .insert(subscriptions)
    .values({ ...values, createdAt: now })
    .onConflictDoUpdate({
      target: subscriptions.providerSubscriptionId,
      set: values,
    });
}
