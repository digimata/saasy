import { describe, expect, it } from "vitest";

import { selectCurrentSubscription, toBillingState } from "../src/stripe";

describe("billing state selection", () => {
  it("prefers an active subscription over a newer canceled one", function stripe001() {
    const newerCanceled = {
      plan: "ultra",
      status: "canceled",
      currentPeriodEnd: new Date("2026-05-01T00:00:00.000Z"),
      cancelAtPeriodEnd: false,
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
    } as const;

    const olderActive = {
      plan: "pro",
      status: "active",
      currentPeriodEnd: new Date("2026-06-01T00:00:00.000Z"),
      cancelAtPeriodEnd: true,
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
    } as const;

    expect(selectCurrentSubscription([newerCanceled, olderActive])).toEqual(olderActive);
  });

  it("derives hobby from missing or inactive paid subscriptions", function stripe002() {
    expect(toBillingState(false, null)).toEqual({
      plan: "hobby",
      status: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      hasCustomer: false,
    });

    expect(
      toBillingState(true, {
        plan: "pro",
        status: "canceled",
        currentPeriodEnd: new Date("2026-05-01T00:00:00.000Z"),
        cancelAtPeriodEnd: true,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
      })
    ).toEqual({
      plan: "hobby",
      status: "canceled",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      hasCustomer: true,
    });
  });

  it("preserves paid billing state for active subscriptions", function stripe003() {
    expect(
      toBillingState(true, {
        plan: "ultra",
        status: "trialing",
        currentPeriodEnd: new Date("2026-07-01T00:00:00.000Z"),
        cancelAtPeriodEnd: false,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
      })
    ).toEqual({
      plan: "ultra",
      status: "trialing",
      currentPeriodEnd: new Date("2026-07-01T00:00:00.000Z"),
      cancelAtPeriodEnd: false,
      hasCustomer: true,
    });
  });
});
