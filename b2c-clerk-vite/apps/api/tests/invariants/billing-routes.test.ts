import { Hono } from "hono";
import { afterEach, describe, expect, it, vi } from "vitest";

import { APIError } from "@/lib/error";

type BillingUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

async function loadBillingRoute(options?: {
  isBillingConfigured?: boolean;
  canCreateCheckout?: boolean;
  user?: BillingUser;
  billingState?: {
    plan: { id: "free" | "pro"; version: number };
    status: string | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    hasCustomer: boolean;
  };
  invoicesPage?: {
    invoices: Array<{
      id: string;
      date: number;
      description: string | null;
      status: string | null;
      amountDue: number;
      currency: string;
      hostedInvoiceUrl: string | null;
    }>;
    hasMore: boolean;
  };
}) {
  vi.resetModules();

  const requireAuth = vi.fn(async (_c: unknown, next: () => Promise<unknown>) => {
    await next();
  });
  const currentUserId = vi.fn(() => "clerk_user_123");
  const ensureLocalUser = vi.fn(async () => {
    return (
      options?.user ?? {
        id: "user_123",
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
      }
    );
  });
  const createCheckoutSession = vi.fn(async () => "https://checkout.stripe.test/session");
  const createPortalSession = vi.fn(async () => "https://billing.stripe.test/portal");
  const getUserBillingState = vi.fn(async () => {
    return (
      options?.billingState ?? {
        plan: { id: "pro" as const, version: 1 },
        status: "active",
        currentPeriodEnd: new Date("2026-06-01T00:00:00.000Z"),
        cancelAtPeriodEnd: false,
        hasCustomer: true,
      }
    );
  });
  const getUserInvoices = vi.fn(async () => {
    return (
      options?.invoicesPage ?? {
        invoices: [
          {
            id: "in_123",
            date: 1711929600,
            description: "April",
            status: "paid",
            amountDue: 2000,
            currency: "usd",
            hostedInvoiceUrl: "https://stripe.test/invoices/in_123",
          },
        ],
        hasMore: false,
      }
    );
  });

  vi.doMock("@/lib/auth", () => ({ requireAuth, currentUserId }));
  vi.doMock("@/lib/user", () => ({ ensureLocalUser }));
  vi.doMock("@repo/billing", () => ({
    canCreateCheckout: vi.fn(() => options?.canCreateCheckout ?? true),
    createCheckoutSession,
    createPortalSession,
    getUserBillingState,
    getUserInvoices,
    isBillingConfigured: vi.fn(() => options?.isBillingConfigured ?? true),
  }));

  const { default: billing } = await import("@/api/billing");
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
  app.route("/", billing);

  return {
    app,
    currentUserId,
    ensureLocalUser,
    createCheckoutSession,
    createPortalSession,
    getUserBillingState,
    getUserInvoices,
  };
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("billing route invariants", () => {
  it("returns a safe unconfigured billing state without touching Stripe-backed reads", async () => {
    const { app, getUserBillingState } = await loadBillingRoute({
      isBillingConfigured: false,
    });

    const response = await app.request("http://localhost/state");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      configured: false,
      checkoutPlans: { pro: false },
    });
    expect(getUserBillingState).not.toHaveBeenCalled();
  });

  it("creates checkout sessions with the billing tab return url", async () => {
    const { app, createCheckoutSession, ensureLocalUser } = await loadBillingRoute();

    const response = await app.request("http://localhost/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: "pro" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://checkout.stripe.test/session",
    });
    expect(ensureLocalUser).toHaveBeenCalledWith(expect.anything(), "clerk_user_123");
    expect(createCheckoutSession).toHaveBeenCalledWith(
      {
        id: "user_123",
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
      },
      "pro",
      "http://localhost:5173/settings?tab=billing",
    );
  });

  it("returns 503 when checkout is unavailable for the requested plan", async () => {
    const { app, createCheckoutSession } = await loadBillingRoute({
      canCreateCheckout: false,
    });

    const response = await app.request("http://localhost/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan: "pro" }),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "service_unavailable",
        message: "Billing is not configured for pro",
      },
    });
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("rejects forged subscription fields in checkout requests", async () => {
    const { app, createCheckoutSession } = await loadBillingRoute();

    const response = await app.request("http://localhost/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        plan: "pro",
        status: "active",
        currentPeriodEnd: "2099-01-01T00:00:00.000Z",
      }),
    });

    expect(response.status).toBe(400);
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("creates portal sessions with the billing tab return url", async () => {
    const { app, createPortalSession } = await loadBillingRoute();

    const response = await app.request("http://localhost/portal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://billing.stripe.test/portal",
    });
    expect(createPortalSession).toHaveBeenCalledWith(
      {
        id: "user_123",
        email: "user@example.com",
        firstName: "Test",
        lastName: "User",
      },
      "http://localhost:5173/settings?tab=billing",
    );
  });

  it("returns 503 when billing is disabled for portal access", async () => {
    const { app, createPortalSession } = await loadBillingRoute({
      isBillingConfigured: false,
    });

    const response = await app.request("http://localhost/portal", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "service_unavailable",
        message: "Billing is not configured",
      },
    });
    expect(createPortalSession).not.toHaveBeenCalled();
  });

  it("passes the invoice cursor through to billing reads", async () => {
    const { app, getUserInvoices } = await loadBillingRoute();

    const response = await app.request("http://localhost/invoices?cursor=in_123");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      invoices: [
        {
          id: "in_123",
          date: 1711929600,
          description: "April",
          status: "paid",
          amountDue: 2000,
          currency: "usd",
          hostedInvoiceUrl: "https://stripe.test/invoices/in_123",
        },
      ],
      hasMore: false,
    });
    expect(getUserInvoices).toHaveBeenCalledWith("user_123", "in_123");
  });
});
