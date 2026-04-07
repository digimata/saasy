---
path: projects/saasy/docs/decisions/004-entitlements.md
outline: |
  • ADR-004 :: Feature entitlements                        L21
    ◦ 1. Decision                                          L29
    ◦ 2. Entitlement model                                 L39
    ◦ 3. Entitlement matrix                                L59
    ◦ 4. Usage tracking                                    L89
    ◦ 5. API surface                                      L121
      ▪ Resolve                                           L123
      ▪ Query methods (pure, sync)                        L133
      ▪ Guard method (sync, throws EntitlementError)      L140
      ▪ Mutation methods (async, hit DB)                  L146
      ▪ Read usage (async)                                L155
    ◦ 6. Client-side access                               L163
    ◦ 7. EntitlementError                                 L180
    ◦ 8. Schema: billing.usage                            L203
    ◦ 9. When to revisit                                  L224
---

# ADR-004 :: Feature entitlements

Last updated: `2026.04.07`

> A typed entitlement system maps plan tiers to feature access and numeric limits. Entitlements are defined statically in code alongside the versioned plan catalog. Tracked usage for quota-style features is DB-backed; stock limits remain anchored to canonical application data.

---

## 1. Decision

- Entitlements are defined as a static matrix in `@repo/billing`, keyed by plan version and plan tier.
- Two entitlement types: **flags** (boolean access) and **limits** (numeric caps, `null` = unlimited).
- Quota-style limit entitlements are tracked in a `billing.usage` table with atomic consume/release operations.
- Stock limits are enforced against canonical resource state and must be checked in the same transaction as the guarded write.
- The primary API is an `Entitlements` object resolved per-workspace, exposing a unified entitlement-ID surface: `has`, `value`, `check`, `consume`, `release`, and `usage`.
- The matrix is the source of truth for what each plan gets. No DB-backed entitlement definitions — overrides can be added later if sales needs them.

---

## 2. Entitlement model

There is one canonical `EntitlementId` namespace. Each entitlement ID has a definition that says whether it is a flag or a limit, and the helper methods dispatch internally by that definition.

Two types of entitlements:

| Type | Definition | Example |
|---|---|---|
| **Flag** | `{ type: "flag", value: boolean }` | `api_access`, `custom_domains` |
| **Limit** | `{ type: "limit", value: number | null }` | `max_projects`, `max_members` |

For limits, `null` means unlimited (no cap enforced).

Two kinds of limits by lifecycle:

| Kind | Example | Behavior |
|---|---|---|
| **Stock** | `max_projects`, `max_members` | Count is derived from canonical resource state. Enforce inside the same transaction as create/delete. Never auto-resets. |
| **Quota** | `api_requests`, `ai_tokens` | Resets each billing period. `reset_at` = period end. |

---

## 3. Entitlement matrix

Defined statically in `@repo/billing` alongside the plan catalog. Keyed by `(version, plan, entitlementId)`:

```typescript
type Plan = "hobby" | PaidPlan;  // "hobby" | "pro" | "ultra"
type EntitlementId = "max_projects" | "max_members" | "api_access" | ...;
type Entitlement =
  | { type: "flag"; value: boolean }
  | { type: "limit"; value: number | null };

const ENTITLEMENTS: Record<PlanVersion, Record<Plan, Record<EntitlementId, Entitlement>>> = {
  1: {
    hobby: {
      max_projects:  { type: "limit", value: 3 },
      max_members:   { type: "limit", value: 2 },
      api_access:    { type: "flag",  value: false },
    },
    pro: { ... },
    ultra: { ... },
  },
};
```

TypeScript enforces completeness — adding an entitlement ID to the union requires defining it for every plan×version.

The matrix is versioned in lockstep with the plan catalog. A workspace on v1 Pro gets v1 entitlements, even after v2 ships.

---

## 4. Usage tracking

Tracked counters live in `billing.usage`. This table is required for quota-style entitlements and optional for any stock entitlement that cannot be derived cheaply.

Canonical stock resources like projects or members do not use `billing.usage` as their source of truth. Their current count comes from the owning tables, and the entitlement check must run in the same DB transaction as the guarded create/delete operation.

`billing.usage`:

```sql
CREATE TABLE billing.usage (
  workspace_id   uuid        NOT NULL REFERENCES auth.workspaces(id) ON DELETE CASCADE,
  feature        text        NOT NULL,
  count          integer     NOT NULL DEFAULT 0,
  reset_at       timestamptz,  -- null = stock (never resets), set = quota (resets at this time)
  PRIMARY KEY (workspace_id, feature)
);
```

For tracked counters, `consume` uses an atomic check-and-increment:

```sql
UPDATE billing.usage
SET count = count + $increment
WHERE workspace_id = $1
  AND feature = $2
  AND (count + $increment) <= $limit
RETURNING count;
-- 0 rows affected → at limit → throw EntitlementError
```

For unlimited entitlements (`value = null`), the cap check is skipped — usage may still be tracked, but it is never blocked by a numeric ceiling.

For tracked counters, `release` decrements atomically, floored at 0.

Quota lifecycle rules:

1. `reset_at` is derived from the active subscription's `current_period_end`.
2. When Stripe webhook sync changes the billing period end, quota rows for that workspace must update to the new `reset_at`.
3. Quota rows are lazily reset to `0` on read or mutate when `now >= reset_at`.
4. Plan or plan-version changes apply immediately after webhook sync.
5. If a downgrade lowers a quota below current usage, the existing usage remains recorded, but further `consume` calls are blocked until usage drops or the next reset occurs.

For stock entitlements, the normal pattern is:

1. read current count from the canonical resource table,
2. run the entitlement check,
3. perform the create/delete,
4. commit in one transaction.

This avoids drift between entitlement enforcement state and the actual resources owned by the workspace.

---

## 5. API surface

### Resolve

```typescript
// Server-side: fetches billing state + usage from DB
const e = await getWorkspaceEntitlements(workspaceId);

// Client-side: pure, from known billing state
const e = entitlementsFor(plan, planVersion);
```

### Query methods (pure, sync)

```typescript
e.has("api_access")                    // → boolean — is this flag enabled?
e.has("max_projects", { used: 2 })     // → boolean — is another project allowed?
e.value("max_projects")                // → number | null — what's the configured cap?
```

### Guard method (sync, throws EntitlementError)

```typescript
e.check("api_access")                   // throws if disabled
e.check("max_projects", { used: 20 })   // throws if another project is not allowed
```

### Mutation methods (async, hit DB)

```typescript
await e.consume("api_requests")                 // increment by 1, throw if at limit
await e.consume("api_requests", { amount: 5 }) // increment by N
await e.release("api_requests")                 // decrement by 1
await e.release("api_requests", { amount: 5 }) // decrement by N
```

### Read usage (async)

```typescript
await e.usage("api_requests")   // → number — current tracked usage
```

---

## 6. Client-side access

The pure `entitlementsFor(plan, planVersion)` function is exported from `@repo/billing` with no DB dependencies. It returns the same `Entitlements` interface minus the async methods (`consume`, `release`, `usage`). Callers still use entitlement IDs; only the implementation knows which IDs are flags vs limits.

```typescript
const { plan, planVersion } = useBillingState();
const e = entitlementsFor(plan, planVersion);

if (!e.has("api_access")) {
  // show upgrade prompt
}
```

No separate client package — the pure functions have no server-side imports.

---

## 7. EntitlementError

Guards and mutations throw `EntitlementError` with structured data for API responses:

```typescript
class EntitlementError extends Error {
  feature: EntitlementId;
  plan: Plan;
  limit: number | null;      // null for flags
  currentUsage: number | null;
}
```

API routes catch this and return a structured 403:

```json
{ "error": "entitlement", "feature": "max_projects", "limit": 20, "plan": "pro" }
```

The client can use this to render contextual upgrade prompts without the route needing to know anything about billing.

---

## 8. Schema: billing.usage

Lives in the `billing` PG schema (per ADR-003). Drizzle definition:

```typescript
export const usage = billingSchema.table("usage", {
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  feature: text("feature").notNull(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at", { withTimezone: true }),
}, (table) => ({
  pk: primaryKey({ columns: [table.workspaceId, table.feature] }),
}));
```

Quota features set `reset_at` to the subscription's `current_period_end` and lazy-reset on read when expired. Stock entitlements do not require a `billing.usage` row by default; if one is used for a tracked stock counter, it keeps `reset_at = null`.

---

## 9. When to revisit

- **DB-backed overrides**: If sales needs per-workspace exceptions ("give workspace X 100 projects on Pro"), add an `entitlement_overrides` table that the resolver checks before falling back to the static matrix.
- **Metered billing**: If quotas need to feed back into Stripe usage-based billing, `consume` will need to report to Stripe's metered billing API.
- **Feature flag service**: If entitlements need runtime toggling without deploys (gradual rollout, kill switches), consider integrating with an external feature flag system. The static matrix would become the default, with overrides from the flag service.
- **Formal invariants**: Once the first entitlement enforcement surfaces land, add `INV-ENT-*` invariants covering deterministic plan/version resolution, server-authoritative enforcement, stock-limit consistency, and quota reset behavior.
