import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

async function loadWebhookRoute(options?: {
  isWebhookConfigured?: boolean;
  constructWebhookEvent?: () => unknown;
}) {
  vi.resetModules();

  const syncStripeSubscription = vi.fn(async () => undefined);
  const constructWebhookEvent = vi.fn(() => {
    if (options?.constructWebhookEvent) {
      return options.constructWebhookEvent();
    }

    return {
      type: "customer.subscription.updated",
      data: {
        object: { id: "sub_123" },
      },
    };
  });

  vi.doMock("@repo/billing", () => ({
    isWebhookConfigured: vi.fn(() => options?.isWebhookConfigured ?? true),
    constructWebhookEvent,
    syncStripeSubscription,
    CUSTOMER_SUBSCRIPTION_CREATED: "customer.subscription.created",
    CUSTOMER_SUBSCRIPTION_UPDATED: "customer.subscription.updated",
    CUSTOMER_SUBSCRIPTION_DELETED: "customer.subscription.deleted",
    CUSTOMER_SUBSCRIPTION_PAUSED: "customer.subscription.paused",
    CUSTOMER_SUBSCRIPTION_RESUMED: "customer.subscription.resumed",
  }));

  const route = await import("../../app/api/webhooks/stripe/route");

    return {
      route,
      constructWebhookEvent,
      syncStripeSubscription,
    };
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("stripe webhook route", () => {
  it("returns 503 when Stripe webhook handling is not configured", async function webhookRoute001() {
    const { route, constructWebhookEvent, syncStripeSubscription } = await loadWebhookRoute({
      isWebhookConfigured: false,
    });

    const response = await route.POST(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({ id: "evt_123" }),
        headers: { "stripe-signature": "sig_123" },
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Stripe webhook is not configured",
    });
    expect(constructWebhookEvent).not.toHaveBeenCalled();
    expect(syncStripeSubscription).not.toHaveBeenCalled();
  });

  it("rejects webhook calls with a missing signature", async function webhookRoute002() {
    const { route, constructWebhookEvent, syncStripeSubscription } = await loadWebhookRoute();

    const response = await route.POST(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({ id: "evt_123" }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing stripe-signature",
    });
    expect(constructWebhookEvent).not.toHaveBeenCalled();
    expect(syncStripeSubscription).not.toHaveBeenCalled();
  });

  it("rejects invalid Stripe signatures", async function webhookRoute003() {
    const { route, syncStripeSubscription } = await loadWebhookRoute({
      constructWebhookEvent() {
        throw new Error("bad signature");
      },
    });

    const response = await route.POST(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({ id: "evt_123" }),
        headers: { "stripe-signature": "sig_123" },
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid signature" });
    expect(syncStripeSubscription).not.toHaveBeenCalled();
  });

  it.each([
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "customer.subscription.paused",
    "customer.subscription.resumed",
  ])("syncs trusted Stripe %s events", async function webhookRoute004(eventType) {
    const eventObject = { id: "sub_123", status: "active" };
    const { route, constructWebhookEvent, syncStripeSubscription } = await loadWebhookRoute({
      constructWebhookEvent() {
        return {
          type: eventType,
          data: { object: eventObject },
        };
      },
    });

    const response = await route.POST(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({ id: "evt_123" }),
        headers: { "stripe-signature": "sig_123" },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(constructWebhookEvent).toHaveBeenCalledWith('{"id":"evt_123"}', "sig_123");
    expect(syncStripeSubscription).toHaveBeenCalledWith(eventObject);
  });

  it.each([
    "invoice.payment_failed",
    "invoice.payment_action_required",
    "invoice.paid",
  ])("acknowledges TODO Stripe %s events without syncing subscriptions", async function webhookRoute005(eventType) {
    const { route, syncStripeSubscription } = await loadWebhookRoute({
      constructWebhookEvent() {
        return {
          type: eventType,
          data: { object: { id: "in_123" } },
        };
      },
    });

    const response = await route.POST(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({ id: "evt_123" }),
        headers: { "stripe-signature": "sig_123" },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(syncStripeSubscription).not.toHaveBeenCalled();
  });

  it("ignores unrelated Stripe event types without failing", async function webhookRoute006() {
    const { route, syncStripeSubscription } = await loadWebhookRoute({
      constructWebhookEvent() {
        return {
          type: "invoice.created",
          data: { object: { id: "in_123" } },
        };
      },
    });

    const response = await route.POST(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({ id: "evt_123" }),
        headers: { "stripe-signature": "sig_123" },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(syncStripeSubscription).not.toHaveBeenCalled();
  });
});
