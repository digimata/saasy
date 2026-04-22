import { afterEach, describe, expect, it, vi } from "vitest";

// -------------------------------------------
// projects/saasy/packages/billing/tests/webhooks.test.ts
//
// function makeSubscription()             L27
// id                                      L28
// customer                                L29
// priceId                                 L30
// status                                  L31
// cancelAtPeriodEnd                       L32
// interval                                L33
// currentPeriodStart                      L34
// currentPeriodEnd                        L35
// function makeSelectBuilder()            L57
// async function loadWebhooksModule()     L67
// customerRows                            L68
// id                                      L69
// priceResolver                           L69
// version                                 L69
// id                                      L95
// version                                 L95
// id                                     L405
// version                                L405
// -------------------------------------------

function makeSubscription(options: {
  id?: string;
  customer?: string;
  priceId: string;
  status?: string;
  cancelAtPeriodEnd?: boolean;
  interval?: "month" | "year";
  currentPeriodStart?: number;
  currentPeriodEnd?: number;
}) {
  return {
    id: options.id ?? "sub_123",
    customer: options.customer ?? "cus_123",
    items: {
      data: [
        {
          price: {
            id: options.priceId,
            recurring: { interval: options.interval ?? "month" },
          },
          current_period_start: options.currentPeriodStart ?? 1711929600,
          current_period_end: options.currentPeriodEnd ?? 1714521600,
        },
      ],
    },
    status: options.status ?? "active",
    cancel_at_period_end: options.cancelAtPeriodEnd ?? false,
  };
}

function makeSelectBuilder(result: unknown) {
  const builder = {
    from: vi.fn(() => builder),
    where: vi.fn(() => builder),
    limit: vi.fn(async () => result),
  };

  return builder;
}

async function loadWebhooksModule(options: {
  customerRows: unknown[];
  priceResolver?: (priceId: string) => { id: string; version: number } | null;
}) {
  vi.resetModules();

  const upsert = vi.fn(async () => undefined);
  const values = vi.fn(() => ({ onConflictDoUpdate: upsert }));
  const db = {
    select: vi.fn(() => makeSelectBuilder(options.customerRows)),
    insert: vi.fn(() => ({ values })),
  };

  const constructEvent = vi.fn(() => ({ id: "evt_123" }));

  vi.doMock("@repo/db", () => ({ db }));
  vi.doMock("@repo/db/schema", () => ({
    customers: {
      providerCustomerId: Symbol("customers.providerCustomerId"),
    },
    subscriptions: {
      providerSubscriptionId: Symbol("subscriptions.providerSubscriptionId"),
    },
  }));
  vi.doMock("drizzle-orm", () => ({
    eq: vi.fn(() => Symbol("eq")),
  }));
  const defaultResolver = (priceId: string) => {
    const map: Record<string, { id: string; version: number }> = {
      price_pro_v1: { id: "pro", version: 1 },
      price_ultra_v1: { id: "ultra", version: 1 },
    };
    return map[priceId] ?? null;
  };
  vi.doMock("../src/plans", () => ({
    resolvePrice: options.priceResolver ?? defaultResolver,
  }));
  vi.doMock("../src/env", () => ({
    env: {
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
    },
  }));
  vi.doMock("../src/stripe", () => ({
    getStripe: () => ({
      webhooks: {
        constructEvent,
      },
    }),
  }));

  const mod = await import("../src/webhooks");

  return {
    mod,
    db,
    values,
    upsert,
    constructEvent,
  };
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("billing webhooks", () => {
  it("constructs Stripe webhook events with the configured signing secret", async function webhooks001() {
    const { mod, constructEvent } = await loadWebhooksModule({ customerRows: [] });

    expect(mod.constructWebhookEvent("{}", "sig_123")).toEqual({ id: "evt_123" });
    expect(constructEvent).toHaveBeenCalledWith("{}", "sig_123", "whsec_123");
  });

  it("skips sync when no local customer matches the Stripe customer", async function webhooks002() {
    const { mod, db } = await loadWebhooksModule({ customerRows: [] });

    await mod.syncStripeSubscription({
      id: "sub_123",
      customer: "cus_missing",
      items: {
        data: [
          {
            price: {
              id: "price_pro_v1",
              recurring: { interval: "month" },
            },
            current_period_start: 1711929600,
            current_period_end: 1714521600,
          },
        ],
      },
      status: "active",
      cancel_at_period_end: false,
    } as never);

    expect(db.insert).not.toHaveBeenCalled();
  });

  it("upserts trusted subscription state from Stripe payloads", async function webhooks003() {
    const customer = {
      id: "customer-row-1",
      workspaceId: "workspace-1",
      providerCustomerId: "cus_123",
    };

    const { mod, values, upsert } = await loadWebhooksModule({
      customerRows: [customer],
    });

    await mod.syncStripeSubscription({
      id: "sub_123",
      customer: "cus_123",
      items: {
        data: [
          {
            price: {
              id: "price_ultra_v1",
              recurring: { interval: "month" },
            },
            current_period_start: 1711929600,
            current_period_end: 1714521600,
          },
        ],
      },
      status: "trialing",
      cancel_at_period_end: true,
    } as never);

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace-1",
        customerId: "customer-row-1",
        provider: "stripe",
        providerSubscriptionId: "sub_123",
        providerPriceId: "price_ultra_v1",
        plan: "ultra",
        planVersion: 1,
        status: "trialing",
        interval: "month",
        cancelAtPeriodEnd: true,
      })
    );
    expect(upsert).toHaveBeenCalled();
  });

  it("records a Pro to Ultra upgrade on the same Stripe subscription", async function webhooks004() {
    const customer = {
      id: "customer-row-1",
      workspaceId: "workspace-1",
      providerCustomerId: "cus_123",
    };

    const { mod, values } = await loadWebhooksModule({
      customerRows: [customer],
    });

    await mod.syncStripeSubscription(
      makeSubscription({
        id: "sub_upgrade",
        priceId: "price_pro_v1",
        status: "active",
      }) as never
    );

    await mod.syncStripeSubscription(
      makeSubscription({
        id: "sub_upgrade",
        priceId: "price_ultra_v1",
        status: "active",
      }) as never
    );

    expect(values).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        providerSubscriptionId: "sub_upgrade",
        providerPriceId: "price_ultra_v1",
        plan: "ultra",
        status: "active",
        cancelAtPeriodEnd: false,
      })
    );
  });

  it("records an Ultra to Pro downgrade after Stripe applies the changed price", async function webhooks005() {
    const customer = {
      id: "customer-row-1",
      workspaceId: "workspace-1",
      providerCustomerId: "cus_123",
    };

    const { mod, values } = await loadWebhooksModule({
      customerRows: [customer],
    });

    await mod.syncStripeSubscription(
      makeSubscription({
        id: "sub_downgrade",
        priceId: "price_ultra_v1",
        status: "active",
      }) as never
    );

    await mod.syncStripeSubscription(
      makeSubscription({
        id: "sub_downgrade",
        priceId: "price_pro_v1",
        status: "active",
      }) as never
    );

    expect(values).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        providerSubscriptionId: "sub_downgrade",
        providerPriceId: "price_pro_v1",
        plan: "pro",
        status: "active",
        cancelAtPeriodEnd: false,
      })
    );
  });

  it("preserves the paid plan while marking cancel-at-period-end", async function webhooks006() {
    const customer = {
      id: "customer-row-1",
      workspaceId: "workspace-1",
      providerCustomerId: "cus_123",
    };

    const { mod, values } = await loadWebhooksModule({
      customerRows: [customer],
    });

    await mod.syncStripeSubscription(
      makeSubscription({
        id: "sub_canceling",
        priceId: "price_pro_v1",
        status: "active",
        cancelAtPeriodEnd: true,
      }) as never
    );

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        providerSubscriptionId: "sub_canceling",
        providerPriceId: "price_pro_v1",
        plan: "pro",
        status: "active",
        cancelAtPeriodEnd: true,
      })
    );
  });

  it("records the final canceled state when Stripe sends subscription deletion semantics", async function webhooks007() {
    const customer = {
      id: "customer-row-1",
      workspaceId: "workspace-1",
      providerCustomerId: "cus_123",
    };

    const { mod, values } = await loadWebhooksModule({
      customerRows: [customer],
    });

    await mod.syncStripeSubscription(
      makeSubscription({
        id: "sub_deleted",
        priceId: "price_ultra_v1",
        status: "canceled",
        cancelAtPeriodEnd: false,
      }) as never
    );

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        providerSubscriptionId: "sub_deleted",
        providerPriceId: "price_ultra_v1",
        plan: "ultra",
        status: "canceled",
        cancelAtPeriodEnd: false,
      })
    );
  });

  it("applies duplicate delivery idempotently for the same subscription event payload", async function webhooks008() {
    const customer = {
      id: "customer-row-1",
      workspaceId: "workspace-1",
      providerCustomerId: "cus_123",
    };

    const { mod, values, upsert } = await loadWebhooksModule({
      customerRows: [customer],
    });

    const eventPayload = makeSubscription({
      id: "sub_idempotent",
      priceId: "price_pro_v1",
      status: "active",
      cancelAtPeriodEnd: false,
    });

    await mod.syncStripeSubscription(eventPayload as never);
    await mod.syncStripeSubscription(eventPayload as never);

    expect(values).toHaveBeenCalledTimes(2);
    expect(values).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        providerSubscriptionId: "sub_idempotent",
        providerPriceId: "price_pro_v1",
        plan: "pro",
        status: "active",
      })
    );
    expect(values).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        providerSubscriptionId: "sub_idempotent",
        providerPriceId: "price_pro_v1",
        plan: "pro",
        status: "active",
      })
    );
    expect(upsert).toHaveBeenCalledTimes(2);
  });

  it("resolves legacy price IDs to the same logical plan at an older version", async function webhooks009() {
    const customer = {
      id: "customer-row-1",
      workspaceId: "workspace-1",
      providerCustomerId: "cus_123",
    };

    const legacyResolver = (priceId: string) => {
      const map: Record<string, { id: string; version: number }> = {
        price_pro_v2: { id: "pro", version: 2 },
        price_pro_v1: { id: "pro", version: 1 },
      };
      return map[priceId] ?? null;
    };

    const { mod, values } = await loadWebhooksModule({
      customerRows: [customer],
      priceResolver: legacyResolver,
    });

    await mod.syncStripeSubscription(
      makeSubscription({
        id: "sub_legacy",
        priceId: "price_pro_v1",
        status: "active",
      }) as never
    );

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        providerSubscriptionId: "sub_legacy",
        providerPriceId: "price_pro_v1",
        plan: "pro",
        planVersion: 1,
      })
    );
  });
});
