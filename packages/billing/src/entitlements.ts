import { eq, and, sql } from "drizzle-orm";

import { db } from "@repo/db";
import { usage } from "@repo/db/schema";

import { CURRENT_PLAN_VERSION, type Plan, type PlanId, type PlanVersion } from "./plans";
import { getWorkspaceBillingState } from "./stripe";

// ─── Types ───────────────────────────────────────────────

// --------------------------------------------------------
// projects/saasy/packages/billing/src/entitlements.ts
//
// export type EntitlementId                            L48
// export type Entitlement                              L50
// kind                                                 L51
// value                                                L51
// kind                                                 L52
// value                                                L52
// type EntitlementMatrix                               L54
// const ENTITLEMENTS                                   L58
// export class EntitlementError                        L83
//   constructor()                                      L84
// export interface Entitlements                       L100
//   readonly plan                                     L101
//   has()                                             L108
//   value()                                           L111
//   check()                                           L117
//   usage()                                           L120
//   consume()                                         L123
//   release()                                         L126
// export type ClientEntitlements                      L130
// class PureEntitlements                              L134
//   constructor()                                     L135
//   has()                                             L137
//   value()                                           L145
//   check()                                           L149
// class ServerEntitlements                            L165
//   constructor()                                     L166
//   async usage()                                     L173
//   async consume()                                   L182
//   async release()                                   L212
// export function entitlementsFor()                   L223
// export async function getWorkspaceEntitlements()    L228
// function resolve()                                  L235
// --------------------------------------------------------

export type EntitlementId = "max_projects" | "max_members" | "api_access" | "custom_domains";

export type Entitlement =
  | { kind: "flag"; value: boolean }
  | { kind: "limit"; value: number | null }; // null = unlimited

type EntitlementMatrix = Record<PlanVersion, Record<PlanId, Record<EntitlementId, Entitlement>>>;

// ─── Matrix ──────────────────────────────────────────────

const ENTITLEMENTS: EntitlementMatrix = {
  1: {
    hobby: {
      max_projects:   { kind: "limit", value: 3 },
      max_members:    { kind: "limit", value: 2 },
      api_access:     { kind: "flag",  value: false },
      custom_domains: { kind: "flag",  value: false },
    },
    pro: {
      max_projects:   { kind: "limit", value: 20 },
      max_members:    { kind: "limit", value: 10 },
      api_access:     { kind: "flag",  value: true },
      custom_domains: { kind: "flag",  value: false },
    },
    ultra: {
      max_projects:   { kind: "limit", value: null },
      max_members:    { kind: "limit", value: null },
      api_access:     { kind: "flag",  value: true },
      custom_domains: { kind: "flag",  value: true },
    },
  },
};

// ─── Error ───────────────────────────────────────────────

export class EntitlementError extends Error {
  constructor(
    public readonly feature: EntitlementId,
    public readonly plan: Plan,
    public readonly limit: number | null,
    public readonly currentUsage: number | null,
  ) {
    const msg = limit != null
      ? `Entitlement "${feature}" limit reached (${currentUsage}/${limit}) on plan "${plan.id}"`
      : `Entitlement "${feature}" not available on plan "${plan.id}"`;
    super(msg);
    this.name = "EntitlementError";
  }
}

// ─── Entitlements interface ──────────────────────────────

export interface Entitlements {
  readonly plan: Plan;

  /**
   * Check availability. For flags: returns whether enabled.
   * For limits: without count, returns true if limit > 0 or unlimited.
   * With count, returns whether one more unit is allowed (count < limit).
   */
  has(id: EntitlementId, count?: number): boolean;

  /** Get the configured cap. Returns null for unlimited, number for capped, boolean for flags. */
  value(id: EntitlementId): number | null | boolean;

  /**
   * Guard. Throws EntitlementError if not entitled.
   * For flags: throws if disabled. For limits: throws if count >= limit.
   */
  check(id: EntitlementId, count?: number): void;

  /** Get current tracked usage from DB (quota-style entitlements). */
  usage(id: EntitlementId): Promise<number>;

  /** Atomically increment tracked usage by n (default 1). Throws if at limit. */
  consume(id: EntitlementId, n?: number): Promise<void>;

  /** Atomically decrement tracked usage by n (default 1). Floors at 0. */
  release(id: EntitlementId, n?: number): Promise<void>;
}

/** Client-safe subset — no DB methods. */
export type ClientEntitlements = Pick<Entitlements, "plan" | "has" | "value" | "check">;

// ─── Pure entitlements (client-safe) ─────────────────────

class PureEntitlements implements ClientEntitlements {
  constructor(public readonly plan: Plan) {}

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
    if (used >= e.value) {
      throw new EntitlementError(id, this.plan, e.value, used);
    }
  }
}

// ─── Full entitlements (server-side, with DB) ────────────

class ServerEntitlements extends PureEntitlements implements Entitlements {
  constructor(
    plan: Plan,
    private readonly workspaceId: string,
  ) {
    super(plan);
  }

  async usage(id: EntitlementId): Promise<number> {
    const [row] = await db
      .select({ val: usage.val })
      .from(usage)
      .where(and(eq(usage.workspaceId, this.workspaceId), eq(usage.feature, id)))
      .limit(1);
    return row?.val ?? 0;
  }

  async consume(id: EntitlementId, n = 1): Promise<void> {
    const e = resolve(this.plan, id);
    if (e.kind !== "limit") throw new Error(`Entitlement "${id}" is a flag, not a limit`);

    if (e.value === null) {
      await db
        .insert(usage)
        .values({ workspaceId: this.workspaceId, feature: id, val: n })
        .onConflictDoUpdate({
          target: [usage.workspaceId, usage.feature],
          set: { val: sql`${usage.val} + ${n}` },
        });
      return;
    }

    const result = await db.execute(sql`
      INSERT INTO billing.usage (workspace_id, feature, val)
      VALUES (${this.workspaceId}, ${id}, ${n})
      ON CONFLICT (workspace_id, feature)
      DO UPDATE SET val = billing.usage.val + ${n}
      WHERE billing.usage.val + ${n} <= ${e.value}
      RETURNING val
    `);

    if (result.length === 0) {
      const current = await this.usage(id);
      throw new EntitlementError(id, this.plan, e.value, current);
    }
  }

  async release(id: EntitlementId, n = 1): Promise<void> {
    await db
      .update(usage)
      .set({ val: sql`GREATEST(${usage.val} - ${n}, 0)` })
      .where(and(eq(usage.workspaceId, this.workspaceId), eq(usage.feature, id)));
  }
}

// ─── Factories ───────────────────────────────────────────

/** Pure entitlements from known plan state. No DB access. Client-safe. */
export function entitlementsFor(plan: Plan): ClientEntitlements {
  return new PureEntitlements(plan);
}

/** Resolve full entitlements for a workspace. Fetches billing state from DB. */
export async function getWorkspaceEntitlements(workspaceId: string): Promise<Entitlements> {
  const billing = await getWorkspaceBillingState(workspaceId);
  return new ServerEntitlements(billing.plan, workspaceId);
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
