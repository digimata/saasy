import { env } from "./env";

// ─── Catalog ──────────────────────────────────────────────

export type PlanId = "free" | "pro";
export type PlanVersion = number;
export type Plan = { id: PlanId; version: PlanVersion };

type PaidPlanId = Exclude<PlanId, "free">;

interface PlanEntry {
  name: string;
  priceId: string | undefined;
  legacyPriceIds?: string[];
}

interface CatalogVersion {
  plans: Record<PaidPlanId, PlanEntry>;
}

/**
 * Versioned plan catalog. When prices change, add a new version and
 * move old price IDs to `legacyPriceIds` on the previous entry, or keep
 * them in the new version's legacy list so webhook events for old subs
 * still resolve to a known plan.
 */
const CATALOG: Record<number, CatalogVersion> = {
  1: {
    plans: {
      pro: { name: "Pro", priceId: env.STRIPE_PRICE_PRO },
    },
  },
};

export const CURRENT_PLAN_VERSION: PlanVersion = 1;

export const PLANS = CATALOG[CURRENT_PLAN_VERSION]!.plans;

export type ResolvedPrice = Plan;

const priceIndex: Map<string, ResolvedPrice> = (() => {
  const index = new Map<string, ResolvedPrice>();
  for (const [ver, catalog] of Object.entries(CATALOG)) {
    const version = Number(ver);
    for (const [id, entry] of Object.entries(catalog.plans) as [PaidPlanId, PlanEntry][]) {
      if (entry.priceId) index.set(entry.priceId, { id, version });
      for (const legacyId of entry.legacyPriceIds ?? []) {
        index.set(legacyId, { id, version });
      }
    }
  }
  return index;
})();

export function resolvePrice(priceId: string): ResolvedPrice | null {
  return priceIndex.get(priceId) ?? null;
}

// ─── Readiness helpers ────────────────────────────────────

export function isBillingConfigured(): boolean {
  return !!env.STRIPE_SECRET_KEY;
}

export function canCreateCheckout(plan: PaidPlanId): boolean {
  return isBillingConfigured() && !!PLANS[plan].priceId;
}

export function isWebhookConfigured(): boolean {
  return isBillingConfigured() && !!env.STRIPE_WEBHOOK_SECRET;
}
