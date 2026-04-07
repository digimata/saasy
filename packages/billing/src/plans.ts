import { env } from "./env";

// ─── Catalog ──────────────────────────────────────────────

// ---------------------------------------------
// projects/saasy/packages/billing/src/plans.ts
//
// export type PaidPlan                      L29
// export type PlanVersion                   L30
// type PlanEntry                            L32
// name                                      L33
// priceId                                   L34
// legacyPriceIds                            L35
// type CatalogVersion                       L38
// plans                                     L39
// const CATALOG                             L48
// const CURRENT_VERSION                     L57
// export const PLANS                        L62
// export type ResolvedPrice                 L66
// plan                                      L67
// version                                   L68
// const priceIndex                          L75
// export function resolvePrice()            L94
// export function isBillingConfigured()    L100
// export function canCreateCheckout()      L104
// export function isWebhookConfigured()    L108
// ---------------------------------------------

export type PaidPlan = "pro" | "ultra";
export type PlanVersion = number;

type PlanEntry = {
  name: string;
  priceId: string | undefined;
  legacyPriceIds?: string[];
};

type CatalogVersion = {
  plans: Record<PaidPlan, PlanEntry>;
};

/**
 * Versioned plan catalog. Each version maps paid plans to their
 * Stripe price IDs. When prices change, add a new version and
 * move old price IDs to `legacyPriceIds` on the previous entry,
 * or keep them in the new version's legacy list.
 */
const CATALOG: Record<number, CatalogVersion> = {
  1: {
    plans: {
      pro: { name: "Pro", priceId: env.STRIPE_PRICE_PRO },
      ultra: { name: "Ultra", priceId: env.STRIPE_PRICE_ULTRA },
    },
  },
};

export const CURRENT_PLAN_VERSION: PlanVersion = 1;

// ─── Current checkout plans ───────────────────────────────

/** Active plans used by checkout and UI. */
export const PLANS = CATALOG[CURRENT_PLAN_VERSION]!.plans;

// ─── Price resolver ───────────────────────────────────────

export type ResolvedPrice = {
  plan: PaidPlan;
  version: PlanVersion;
};

/**
 * Build a lookup from every known Stripe price ID (current + legacy)
 * to its logical plan and catalog version.
 */
const priceIndex: Map<string, ResolvedPrice> = (() => {
  const index = new Map<string, ResolvedPrice>();
  for (const [versionStr, catalog] of Object.entries(CATALOG)) {
    const version = Number(versionStr);
    for (const [plan, entry] of Object.entries(catalog.plans) as [PaidPlan, PlanEntry][]) {
      if (entry.priceId) {
        index.set(entry.priceId, { plan, version });
      }
      for (const legacyId of entry.legacyPriceIds ?? []) {
        index.set(legacyId, { plan, version });
      }
    }
  }
  return index;
})();

/**
 * Resolve a Stripe price ID to its logical plan and catalog version.
 * Accepts both current and legacy prices. Returns null for unknown prices.
 */
export function resolvePrice(priceId: string): ResolvedPrice | null {
  return priceIndex.get(priceId) ?? null;
}

// ─── Readiness helpers ────────────────────────────────────

export function isBillingConfigured(): boolean {
  return !!env.STRIPE_SECRET_KEY;
}

export function canCreateCheckout(plan: PaidPlan): boolean {
  return isBillingConfigured() && !!PLANS[plan].priceId;
}

export function isWebhookConfigured(): boolean {
  return isBillingConfigured() && !!env.STRIPE_WEBHOOK_SECRET;
}
