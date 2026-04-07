import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  isWebhookConfigured,
  constructWebhookEvent,
  syncSubscriptionFromStripe,
  CUSTOMER_SUBSCRIPTION_CREATED,
  CUSTOMER_SUBSCRIPTION_UPDATED,
  CUSTOMER_SUBSCRIPTION_DELETED,
} from "@repo/billing";

// -----------------------------------
// projects/saasy/apps/web/app/api/billing/webhook/route.ts
//
// export async function POST()    L18
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
      await syncSubscriptionFromStripe(event.data.object as Stripe.Subscription);
      break;
  }

  return NextResponse.json({ received: true });
}
