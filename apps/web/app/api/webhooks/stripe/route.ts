import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  isWebhookConfigured,
  constructWebhookEvent,
  syncStripeSubscription,
  CUSTOMER_SUBSCRIPTION_CREATED,
  CUSTOMER_SUBSCRIPTION_UPDATED,
  CUSTOMER_SUBSCRIPTION_DELETED,
  CUSTOMER_SUBSCRIPTION_PAUSED,
  CUSTOMER_SUBSCRIPTION_RESUMED,
} from "@repo/billing";

// -----------------------------------
// projects/saasy/apps/web/app/api/webhooks/stripe/route.ts
//
// export async function POST()    L21
// -----------------------------------

export async function POST(req: NextRequest) {
  if (!isWebhookConfigured()) {
    return NextResponse.json({ error: "Stripe webhook is not configured" }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case CUSTOMER_SUBSCRIPTION_CREATED:
    case CUSTOMER_SUBSCRIPTION_UPDATED:
    case CUSTOMER_SUBSCRIPTION_DELETED:
    case CUSTOMER_SUBSCRIPTION_PAUSED:
    case CUSTOMER_SUBSCRIPTION_RESUMED:
      await syncStripeSubscription(event.data.object as Stripe.Subscription);
      break;
    // TODO(billing): handle invoice-level payment signals for comms/recovery
    // without making invoice events the source of subscription truth.
    case "invoice.payment_failed":
    case "invoice.payment_action_required":
    case "invoice.paid":
      break;
  }

  return NextResponse.json({ received: true });
}
