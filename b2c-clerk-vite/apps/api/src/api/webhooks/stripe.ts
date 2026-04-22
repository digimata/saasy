import { Hono } from "hono";
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

import { NotFoundError, UnauthorizedError, ValidationError } from "@/lib/error";
import { logger } from "@/lib/logger";

const webhooks = new Hono();

/**
 * POST /webhooks/stripe
 *
 * Stripe webhook endpoint. Verifies the Stripe signature against the raw
 * body and dispatches subscription lifecycle events to the billing sync.
 */
webhooks.post("/", async (c) => {
  if (!isWebhookConfigured()) {
    throw new NotFoundError("Stripe webhook is not configured");
  }

  const signature = c.req.header("stripe-signature");
  if (!signature) throw new ValidationError("missing stripe-signature header");

  const body = await c.req.text();

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch {
    throw new UnauthorizedError("invalid signature");
  }

  switch (event.type) {
    case CUSTOMER_SUBSCRIPTION_CREATED:
    case CUSTOMER_SUBSCRIPTION_UPDATED:
    case CUSTOMER_SUBSCRIPTION_DELETED:
    case CUSTOMER_SUBSCRIPTION_PAUSED:
    case CUSTOMER_SUBSCRIPTION_RESUMED:
      await syncStripeSubscription(event.data.object as Stripe.Subscription);
      logger.info({ type: event.type, id: event.id }, "stripe.subscription.synced");
      break;
    // TODO: handle invoice-level payment signals for comms/recovery
    case "invoice.payment_failed":
    case "invoice.payment_action_required":
    case "invoice.paid":
      break;
  }

  return c.json({ received: true });
});

export default webhooks;
