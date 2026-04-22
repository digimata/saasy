import { Hono } from "hono";
import type Stripe from "stripe";

import {
  isWebhookConfigured,
  constructWebhookEvent,
  getUserByStripeCustomerId,
  syncStripeSubscription,
  CUSTOMER_SUBSCRIPTION_CREATED,
  CUSTOMER_SUBSCRIPTION_UPDATED,
  CUSTOMER_SUBSCRIPTION_DELETED,
  CUSTOMER_SUBSCRIPTION_PAUSED,
  CUSTOMER_SUBSCRIPTION_RESUMED,
} from "@repo/billing";
import { sendEmail, ReceiptEmailTemplate } from "@repo/email";

import { ServiceUnavailableError, UnauthorizedError, ValidationError } from "@/lib/error";
import { handleError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";

const webhooks = new Hono();

webhooks.onError(handleError);

/**
 * POST /webhooks/stripe
 *
 * Stripe webhook endpoint. Verifies the Stripe signature against the raw
 * body and dispatches subscription lifecycle events to the billing sync.
 */
webhooks.post("/", async (c) => {
  if (!isWebhookConfigured()) {
    throw new ServiceUnavailableError("Stripe webhook is not configured");
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

    case "invoice.paid":
      await sendReceipt(event.data.object as Stripe.Invoice);
      break;

    // TODO: handle failure-mode invoice signals for comms/recovery
    case "invoice.payment_failed":
    case "invoice.payment_action_required":
      break;
  }

  return c.json({ received: true });
});

async function sendReceipt(invoice: Stripe.Invoice) {
  const stripeCustomerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!stripeCustomerId) return;

  const user = await getUserByStripeCustomerId(stripeCustomerId);
  if (!user) {
    logger.warn({ stripeCustomerId, invoiceId: invoice.id }, "stripe.receipt.no_user");
    return;
  }

  const amountFormatted = formatAmount(invoice.amount_paid, invoice.currency);
  const periodLabel = formatPeriod(invoice);

  try {
    await sendEmail(user.email, ReceiptEmailTemplate, {
      firstName: user.firstName ?? null,
      amountFormatted,
      periodLabel,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? undefined,
    });
  } catch (err) {
    logger.error({ err, invoiceId: invoice.id }, "email.receipt.failed");
  }
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatPeriod(invoice: Stripe.Invoice): string | undefined {
  const line = invoice.lines?.data[0];
  const start = line?.period?.start;
  const end = line?.period?.end;
  if (!start || !end) return undefined;
  const fmt = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default webhooks;
