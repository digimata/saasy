import { CURRENT_PLAN_VERSION, type Plan, type PlanId, type PlanVersion } from "./plans";
import { getUserBillingState } from "./stripe";

export type EntitlementId = "max_projects" | "api_access";

export type Entitlement =
  | { kind: "flag"; value: boolean }
  | { kind: "limit"; value: number | null }; // null = unlimited

type EntitlementMatrix = Record<PlanVersion, Record<PlanId, Record<EntitlementId, Entitlement>>>;

// ─── Matrix ──────────────────────────────────────────────

const ENTITLEMENTS: EntitlementMatrix = {
  1: {
    free: {
      max_projects: { kind: "limit", value: 3 },
      api_access:   { kind: "flag",  value: false },
    },
    pro: {
      max_projects: { kind: "limit", value: null },
      api_access:   { kind: "flag",  value: true },
    },
  },
};

// ─── Error ───────────────────────────────────────────────

export class EntitlementError extends Error {
  readonly feature: EntitlementId;
  readonly plan: Plan;
  readonly limit: number | null;
  readonly currentUsage: number | null;

  constructor(
    feature: EntitlementId,
    plan: Plan,
    limit: number | null,
    currentUsage: number | null,
  ) {
    const msg = limit != null
      ? `Entitlement "${feature}" limit reached (${currentUsage}/${limit}) on plan "${plan.id}"`
      : `Entitlement "${feature}" not available on plan "${plan.id}"`;
    super(msg);
    this.name = "EntitlementError";
    this.feature = feature;
    this.plan = plan;
    this.limit = limit;
    this.currentUsage = currentUsage;
  }
}

// ─── Entitlements interface ──────────────────────────────

export interface ClientEntitlements {
  readonly plan: Plan;
  has(id: EntitlementId, count?: number): boolean;
  value(id: EntitlementId): number | null | boolean;
  check(id: EntitlementId, count?: number): void;
}

class Entitlements implements ClientEntitlements {
  readonly plan: Plan;

  constructor(plan: Plan) {
    this.plan = plan;
  }

  has(id: EntitlementId, count?: number): boolean {
    const e = resolve(this.plan, id);
    if (e.kind === "flag") return e.value;
    if (e.value === null) return true;
    if (count != null) return count < e.value;
    return e.value > 0;
  }

  value(id: EntitlementId): number | null | boolean {
    return resolve(this.plan, id).value;
  }

  check(id: EntitlementId, count?: number): void {
    const e = resolve(this.plan, id);
    if (e.kind === "flag") {
      if (!e.value) throw new EntitlementError(id, this.plan, null, null);
      return;
    }
    if (e.value === null) return;
    const used = count ?? 0;
    if (used >= e.value) throw new EntitlementError(id, this.plan, e.value, used);
  }
}

// ─── Factories ───────────────────────────────────────────

/** Entitlements from a known plan. No DB access. */
export function entitlementsFor(plan: Plan): ClientEntitlements {
  return new Entitlements(plan);
}

/** Resolve entitlements for a user by fetching billing state from DB. */
export async function getUserEntitlements(userId: string): Promise<ClientEntitlements> {
  const billing = await getUserBillingState(userId);
  return new Entitlements(billing.plan);
}

/** Entitlements for the default free plan (new user, no DB fetch). */
export function defaultFreeEntitlements(): ClientEntitlements {
  return new Entitlements({ id: "free", version: CURRENT_PLAN_VERSION });
}

// ─── Helpers ─────────────────────────────────────────────

function resolve(plan: Plan, id: EntitlementId): Entitlement {
  const v = ENTITLEMENTS[plan.version];
  if (!v) throw new Error(`Unknown plan version: ${plan.version}`);
  const p = v[plan.id];
  if (!p) throw new Error(`Unknown plan: ${plan.id}`);
  const e = p[id];
  if (!e) throw new Error(`Unknown entitlement: ${id}`);
  return e;
}
