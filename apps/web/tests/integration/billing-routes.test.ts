import { describe, expect, it, vi, afterEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

type BillingWorkspaceContext = {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  userId: string;
};

async function loadBillingRoutes(options?: {
  workspaceContext?: BillingWorkspaceContext | NextResponse;
  canCreateCheckout?: boolean;
  isBillingConfigured?: boolean;
  billingState?: {
    plan: { id: "hobby" | "pro" | "ultra"; version: number };
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

  const resolveBillingWorkspace = vi.fn(async () => {
    return (
      options?.workspaceContext ?? {
        workspace: { id: "ws_123", name: "Acme", slug: "acme" },
        userId: "user_123",
      }
    );
  });

  const createCheckoutSession = vi.fn(async () => "https://checkout.stripe.test/session");
  const createPortalSession = vi.fn(async () => "https://billing.stripe.test/portal");
  const getWorkspaceBillingState = vi.fn(async () => {
    return (
      options?.billingState ?? {
        plan: { id: "pro", version: 1 },
        status: "active",
        currentPeriodEnd: new Date("2026-06-01T00:00:00.000Z"),
        cancelAtPeriodEnd: false,
        hasCustomer: true,
      }
    );
  });
  const getWorkspaceInvoices = vi.fn(async () => {
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

  vi.doMock("@repo/billing", () => ({
    canCreateCheckout: vi.fn((plan: "pro" | "ultra") => {
      if (options?.canCreateCheckout !== undefined) {
        return options.canCreateCheckout;
      }
      return plan === "pro" || plan === "ultra";
    }),
    isBillingConfigured: vi.fn(() => options?.isBillingConfigured ?? true),
    createCheckoutSession,
    createPortalSession,
    getWorkspaceBillingState,
    getWorkspaceInvoices,
  }));
  vi.doMock("../../app/api/billing/workspace", () => ({
    resolveBillingWorkspace,
  }));

  const checkout = await import("../../app/api/billing/checkout/route");
  const portal = await import("../../app/api/billing/portal/route");
  const state = await import("../../app/api/billing/state/route");
  const invoices = await import("../../app/api/billing/invoices/route");

  return {
    checkout,
    portal,
    state,
    invoices,
    resolveBillingWorkspace,
    createCheckoutSession,
    createPortalSession,
    getWorkspaceBillingState,
    getWorkspaceInvoices,
  };
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("billing routes", () => {
  it("rejects checkout when the active workspace is unavailable to the user", async function bilRoute001() {
    const { checkout, createCheckoutSession } = await loadBillingRoutes({
      workspaceContext: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    });

    const response = await checkout.POST(
      new NextRequest("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("rejects checkout when the requested plan is not configured", async function bilRoute002() {
    const { checkout, createCheckoutSession } = await loadBillingRoutes({
      canCreateCheckout: false,
    });

    const response = await checkout.POST(
      new NextRequest("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: "ultra" }),
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Billing is not configured for ultra",
    });
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("creates checkout sessions for accessible workspaces", async function bilRoute003() {
    const { checkout, createCheckoutSession } = await loadBillingRoutes();

    const response = await checkout.POST(
      new NextRequest("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: "https://checkout.stripe.test/session",
    });
    expect(createCheckoutSession).toHaveBeenCalledWith(
      { id: "ws_123", name: "Acme", slug: "acme" },
      "pro",
      "http://localhost/settings?tab=billing"
    );
  });

  it("keeps portal member-only and returns a Stripe portal url", async function bilRoute004() {
    const denied = await loadBillingRoutes({
      workspaceContext: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    });

    const deniedResponse = await denied.portal.POST(
      new NextRequest("http://localhost/api/billing/portal", { method: "POST" })
    );

    expect(deniedResponse.status).toBe(403);

    const allowed = await loadBillingRoutes();
    const allowedResponse = await allowed.portal.POST(
      new NextRequest("http://localhost/api/billing/portal", { method: "POST" })
    );

    expect(allowedResponse.status).toBe(200);
    await expect(allowedResponse.json()).resolves.toEqual({
      url: "https://billing.stripe.test/portal",
    });
    expect(allowed.createPortalSession).toHaveBeenCalledWith(
      { id: "ws_123", name: "Acme", slug: "acme" },
      "http://localhost/settings?tab=billing"
    );
  });

  it("returns explicit billing state and checkout availability", async function bilRoute005() {
    const { state, getWorkspaceBillingState } = await loadBillingRoutes({
      billingState: {
        plan: { id: "ultra", version: 1 },
        status: "trialing",
        currentPeriodEnd: new Date("2026-07-01T00:00:00.000Z"),
        cancelAtPeriodEnd: true,
        hasCustomer: true,
      },
    });

    const response = await state.GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      configured: true,
      checkoutPlans: { pro: true, ultra: true },
      plan: { id: "ultra", version: 1 },
      status: "trialing",
      currentPeriodEnd: "2026-07-01T00:00:00.000Z",
      cancelAtPeriodEnd: true,
      hasCustomer: true,
    });
    expect(getWorkspaceBillingState).toHaveBeenCalledWith("ws_123");
  });

  it("returns a safe unconfigured state without hitting Stripe-backed reads", async function bilRoute006() {
    const { state, getWorkspaceBillingState } = await loadBillingRoutes({
      isBillingConfigured: false,
    });

    const response = await state.GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      configured: false,
      checkoutPlans: { pro: false, ultra: false },
    });
    expect(getWorkspaceBillingState).not.toHaveBeenCalled();
  });

  it("passes the invoice cursor through to billing reads", async function bilRoute007() {
    const { invoices, getWorkspaceInvoices } = await loadBillingRoutes();

    const response = await invoices.GET(
      new NextRequest("http://localhost/api/billing/invoices?cursor=in_123")
    );

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
    expect(getWorkspaceInvoices).toHaveBeenCalledWith("ws_123", "in_123");
  });
});
