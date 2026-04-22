import { Hono } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";

import { APIError } from "@/lib/error";

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  },
}));

async function loadWebhookRoute(options?: {
  isWebhookConfigured?: boolean;
  validSignature?: boolean;
}) {
  vi.resetModules();

  const syncStripeSubscription = vi.fn(async () => undefined);
  const constructWebhookEvent = vi.fn(() => {
    if (options?.validSignature === false) {
      throw new Error("invalid signature");
    }

    return {
      type: "customer.subscription.updated",
      id: "evt_123",
      data: { object: { id: "sub_123", status: "active" } },
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

  const { default: webhooks } = await import("@/api/webhooks/stripe");
  const app = new Hono();
  app.onError((err, c) => {
    if (err instanceof APIError) {
      return c.json(err.json(), err.statusCode);
    }

    return c.json(
      {
        error: {
          code: "internal_server_error",
          message: "An unexpected error occurred",
        },
      },
      500,
    );
  });
  app.route("/", webhooks);

  return {
    app,
    constructWebhookEvent,
    syncStripeSubscription,
  };
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("billing webhook invariants", () => {
  it("returns 503 when Stripe webhook handling is not configured", async () => {
    const { app, constructWebhookEvent, syncStripeSubscription } = await loadWebhookRoute({
      isWebhookConfigured: false,
    });

    const response = await app.request("http://localhost/", {
      method: "POST",
      headers: { "stripe-signature": "sig_123" },
      body: JSON.stringify({ id: "evt_123" }),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "service_unavailable",
        message: "Stripe webhook is not configured",
      },
    });
    expect(constructWebhookEvent).not.toHaveBeenCalled();
    expect(syncStripeSubscription).not.toHaveBeenCalled();
  });

  it("rejects webhook calls with a missing signature", async () => {
    const { app, constructWebhookEvent, syncStripeSubscription } = await loadWebhookRoute();

    const response = await app.request("http://localhost/", {
      method: "POST",
      body: JSON.stringify({ id: "evt_123" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "validation_error",
        message: "missing stripe-signature header",
      },
    });
    expect(constructWebhookEvent).not.toHaveBeenCalled();
    expect(syncStripeSubscription).not.toHaveBeenCalled();
  });

  it("rejects invalid Stripe signatures", async () => {
    const { app, syncStripeSubscription } = await loadWebhookRoute({
      validSignature: false,
    });

    const response = await app.request("http://localhost/", {
      method: "POST",
      headers: { "stripe-signature": "sig_123" },
      body: JSON.stringify({ id: "evt_123" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "unauthorized",
        message: "invalid signature",
      },
    });
    expect(syncStripeSubscription).not.toHaveBeenCalled();
  });

  it("accepts subscription truth only from a valid webhook", async () => {
    const { app, constructWebhookEvent, syncStripeSubscription } = await loadWebhookRoute();

    const response = await app.request("http://localhost/", {
      method: "POST",
      headers: { "stripe-signature": "sig_123" },
      body: JSON.stringify({ id: "evt_123" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(constructWebhookEvent).toHaveBeenCalledWith('{"id":"evt_123"}', "sig_123");
    expect(syncStripeSubscription).toHaveBeenCalledWith({ id: "sub_123", status: "active" });
  });
});
