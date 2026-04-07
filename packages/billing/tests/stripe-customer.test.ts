import { afterEach, describe, expect, it, vi } from "vitest";

function makeSelectBuilder(result: unknown) {
  const builder = {
    from: vi.fn(() => builder),
    where: vi.fn(() => builder),
    limit: vi.fn(async () => result),
    orderBy: vi.fn(() => builder),
  };

  return builder;
}

function makeInsertBuilder(result: unknown) {
  const returning = vi.fn(async () => result);
  const onConflictDoNothing = vi.fn(() => ({ returning }));
  const values = vi.fn(() => ({ onConflictDoNothing }));

  return {
    values,
    returning,
    onConflictDoNothing,
  };
}

async function loadStripeModule(options: {
  selectResults: unknown[];
  insertResult: unknown;
  stripeCustomerId?: string;
}) {
  vi.resetModules();

  const selectCalls = [...options.selectResults];
  const insertBuilder = makeInsertBuilder(options.insertResult);
  const db = {
    select: vi.fn(() => makeSelectBuilder(selectCalls.shift() ?? [])),
    insert: vi.fn(() => insertBuilder),
  };

  const customersCreate = vi.fn(async () => ({ id: options.stripeCustomerId ?? "cus_test_123" }));
  const StripeCtor = vi.fn(function StripeMock() {
    return {
      customers: { create: customersCreate },
      checkout: { sessions: { create: vi.fn() } },
      billingPortal: { sessions: { create: vi.fn() } },
      webhooks: { constructEvent: vi.fn() },
    };
  });

  vi.doMock("@repo/db", () => ({ db }));
  vi.doMock("@repo/db/schema", () => ({
    customers: {
      id: Symbol("customers.id"),
      workspaceId: Symbol("customers.workspaceId"),
      provider: Symbol("customers.provider"),
      providerCustomerId: Symbol("customers.providerCustomerId"),
    },
    subscriptions: {
      workspaceId: Symbol("subscriptions.workspaceId"),
      createdAt: Symbol("subscriptions.createdAt"),
    },
  }));
  vi.doMock("drizzle-orm", () => ({
    eq: vi.fn(() => Symbol("eq")),
    and: vi.fn(() => Symbol("and")),
    desc: vi.fn(() => Symbol("desc")),
  }));
  vi.doMock("../src/env", () => ({
    env: {
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_PRICE_PRO: "price_pro_v1",
      STRIPE_PRICE_ULTRA: "price_ultra_v1",
    },
  }));
  vi.doMock("stripe", () => ({ default: StripeCtor }));

  const mod = await import("../src/stripe");

  return {
    mod,
    db,
    customersCreate,
    insertBuilder,
    StripeCtor,
  };
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("stripe customer creation", () => {
  it("reuses an existing local Stripe customer without hitting Stripe", async function stripeCustomer001() {
    const existing = {
      id: "customer-row-1",
      workspaceId: "workspace-1",
      provider: "stripe",
      providerCustomerId: "cus_existing",
    };

    const { mod, customersCreate } = await loadStripeModule({
      selectResults: [[existing]],
      insertResult: [],
    });

    await expect(
      mod.ensureStripeCustomer({
        id: "workspace-1",
        name: "Acme",
        slug: "acme",
      })
    ).resolves.toEqual(existing);

    expect(customersCreate).not.toHaveBeenCalled();
  });

  it("creates Stripe customers with a deterministic idempotency key", async function stripeCustomer002() {
    const inserted = {
      id: "customer-row-2",
      workspaceId: "workspace-2",
      provider: "stripe",
      providerCustomerId: "cus_created",
    };

    const { mod, customersCreate } = await loadStripeModule({
      selectResults: [[]],
      insertResult: [inserted],
      stripeCustomerId: "cus_created",
    });

    await expect(
      mod.ensureStripeCustomer({
        id: "workspace-2",
        name: "Beta",
        slug: "beta",
      })
    ).resolves.toEqual(inserted);

    expect(customersCreate).toHaveBeenCalledWith(
      {
        name: "Beta",
        metadata: {
          workspaceId: "workspace-2",
          slug: "beta",
        },
      },
      {
        idempotencyKey: "workspace:workspace-2:stripe-customer",
      }
    );
  });
});
