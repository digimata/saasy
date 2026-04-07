import { afterEach, describe, expect, it, vi } from "vitest";

type BillingEnv = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_PRO?: string;
  STRIPE_PRICE_ULTRA?: string;
  STRIPE_PORTAL_CONFIGURATION_ID?: string;
};

async function loadPlans(env: BillingEnv) {
  vi.resetModules();
  vi.doMock("../src/env", () => ({ env }));
  return import("../src/plans");
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("billing plans", () => {
  it("resolves configured Stripe prices to logical paid plans", async function plans001() {
    const mod = await loadPlans({
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_PRICE_PRO: "price_pro_v1",
      STRIPE_PRICE_ULTRA: "price_ultra_v1",
    });

    expect(mod.resolvePrice("price_pro_v1")).toEqual({ plan: "pro", version: 1 });
    expect(mod.resolvePrice("price_ultra_v1")).toEqual({ plan: "ultra", version: 1 });
  });

  it("returns null for unknown or missing price IDs", async function plans002() {
    const mod = await loadPlans({
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_PRICE_PRO: "price_pro_v1",
    });

    expect(mod.resolvePrice("price_pro_v1")).toEqual({ plan: "pro", version: 1 });
    expect(mod.resolvePrice("price_unknown")).toBeNull();
  });

  it("treats billing as configured only when a Stripe secret is present", async function plans003() {
    const unconfigured = await loadPlans({
      STRIPE_PRICE_PRO: "price_pro_v1",
    });
    expect(unconfigured.isBillingConfigured()).toBe(false);

    const configured = await loadPlans({
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_PRICE_PRO: "price_pro_v1",
    });
    expect(configured.isBillingConfigured()).toBe(true);
  });

  it("requires both a Stripe secret and a plan price to start checkout", async function plans004() {
    const missingSecret = await loadPlans({
      STRIPE_PRICE_PRO: "price_pro_v1",
    });
    expect(missingSecret.canCreateCheckout("pro")).toBe(false);

    const missingPrice = await loadPlans({
      STRIPE_SECRET_KEY: "sk_test_123",
    });
    expect(missingPrice.canCreateCheckout("pro")).toBe(false);

    const configured = await loadPlans({
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_PRICE_PRO: "price_pro_v1",
    });
    expect(configured.canCreateCheckout("pro")).toBe(true);
  });

  it("requires a webhook secret in addition to the Stripe secret", async function plans005() {
    const missingWebhookSecret = await loadPlans({
      STRIPE_SECRET_KEY: "sk_test_123",
    });
    expect(missingWebhookSecret.isWebhookConfigured()).toBe(false);

    const configured = await loadPlans({
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
    });
    expect(configured.isWebhookConfigured()).toBe(true);
  });
});
