import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

type BillingWorkspaceContext = {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  userId: string;
};

async function loadCheckoutRoute(options?: {
  workspaceContext?: BillingWorkspaceContext | NextResponse;
  canCreateCheckout?: boolean;
}) {
  vi.resetModules();

  const resolveBillingWorkspace = vi.fn(async () => {
    return (
      options?.workspaceContext ?? {
        workspace: { id: "ws_123", name: "Acme", slug: "acme" },
        userId: "user_123",
      }
    );
  });
  const createCheckoutSession = vi.fn(async () => "https://checkout.stripe.test/session");

  vi.doMock("@repo/billing", () => ({
    canCreateCheckout: vi.fn(() => options?.canCreateCheckout ?? true),
    createCheckoutSession,
  }));
  vi.doMock("../../app/api/billing/workspace", () => ({ resolveBillingWorkspace }));

  const route = await import("../../app/api/billing/checkout/route");

  return { route, createCheckoutSession };
}

async function loadStateRoute(isBillingConfigured: boolean) {
  vi.resetModules();

  const resolveBillingWorkspace = vi.fn(async () => ({
    workspace: { id: "ws_123", name: "Acme", slug: "acme" },
    userId: "user_123",
  }));
  const getWorkspaceBillingState = vi.fn(async () => ({
    plan: { id: "pro", version: 1 },
    status: "active",
    currentPeriodEnd: new Date("2026-06-01T00:00:00.000Z"),
    cancelAtPeriodEnd: false,
    hasCustomer: true,
  }));

  vi.doMock("@repo/billing", () => ({
    isBillingConfigured: vi.fn(() => isBillingConfigured),
    canCreateCheckout: vi.fn(() => isBillingConfigured),
    getWorkspaceBillingState,
  }));
  vi.doMock("../../app/api/billing/workspace", () => ({ resolveBillingWorkspace }));

  const route = await import("../../app/api/billing/state/route");

  return { route, getWorkspaceBillingState };
}

async function loadWebhookRoute(options?: {
  isWebhookConfigured?: boolean;
  validSignature?: boolean;
}) {
  vi.resetModules();

  const syncSubscriptionFromStripe = vi.fn(async () => undefined);
  const constructWebhookEvent = vi.fn(() => {
    if (options?.validSignature === false) {
      throw new Error("invalid signature");
    }

    return {
      type: "customer.subscription.updated",
      data: { object: { id: "sub_123" } },
    };
  });

  vi.doMock("@repo/billing", () => ({
    isWebhookConfigured: vi.fn(() => options?.isWebhookConfigured ?? true),
    constructWebhookEvent,
    syncSubscriptionFromStripe,
    CUSTOMER_SUBSCRIPTION_CREATED: "customer.subscription.created",
    CUSTOMER_SUBSCRIPTION_UPDATED: "customer.subscription.updated",
    CUSTOMER_SUBSCRIPTION_DELETED: "customer.subscription.deleted",
  }));

  const route = await import("../../app/api/webhooks/stripe/route");

  return { route, syncSubscriptionFromStripe };
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("billing invariants", () => {
  it("INV-BIL-004 rejects checkout for an inaccessible active workspace", async function bil004() {
    const { route, createCheckoutSession } = await loadCheckoutRoute({
      workspaceContext: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    });

    const response = await route.POST(
      new NextRequest("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      })
    );

    expect(response.status).toBe(403);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("INV-BIL-005 rejects forged subscription fields in checkout requests", async function bil005() {
    const { route, createCheckoutSession } = await loadCheckoutRoute();

    const response = await route.POST(
      new NextRequest("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          plan: "pro",
          status: "active",
          currentPeriodEnd: "2099-01-01T00:00:00.000Z",
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("INV-BIL-006 accepts subscription truth only from a valid webhook", async function bil006() {
    const { route, syncSubscriptionFromStripe } = await loadWebhookRoute({ validSignature: false });

    const response = await route.POST(
      new NextRequest("http://localhost/api/webhooks/stripe", {
        method: "POST",
        body: JSON.stringify({ id: "evt_123" }),
        headers: { "stripe-signature": "sig_123" },
      })
    );

    expect(response.status).toBe(400);
    expect(syncSubscriptionFromStripe).not.toHaveBeenCalled();
  });

  it("INV-BIL-008 degrades to an explicit unconfigured state without touching billing reads", async function bil008() {
    const { route, getWorkspaceBillingState } = await loadStateRoute(false);

    const response = await route.GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      configured: false,
      checkoutPlans: { pro: false, ultra: false },
    });
    expect(getWorkspaceBillingState).not.toHaveBeenCalled();
  });
});
