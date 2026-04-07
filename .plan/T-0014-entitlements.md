---
title: "Feature entitlement matrix"
date: 2026-04-07
status: draft
affects: "@repo/billing, @repo/db"
---

## Context

The billing package has a versioned plan catalog (`plans.ts`) and subscription tracking via Stripe webhooks. `getWorkspaceBillingState()` resolves a workspace to its current plan. What's missing: a typed system mapping plan tiers to feature access/limits, with usage tracking for metered features.

Design is captured in ADR-004 (`docs/decisions/004-entitlements.md`).

## Changes

1. **Add `billing.usage` table** to `@repo/db/src/schema.ts`
   - Composite PK on `(workspace_id, feature)`
   - `count` integer, `reset_at` nullable timestamp
   - Generate migration via `drizzle-kit generate`

2. **Create `@repo/billing/src/entitlements.ts`** — the core module:
   - Types: `Plan`, `Feature`, `Entitlement`, `EntitlementDef`
   - Static `ENTITLEMENTS` matrix keyed by `(version, plan, feature)`
   - `EntitlementError` class with feature/plan/limit/usage fields
   - `Entitlements` class with sync query methods (`has`, `limit`, `check`) and async mutation methods (`consume`, `release`, `usage`)
   - `entitlementsFor(plan, version)` — pure factory (client-safe)
   - `getWorkspaceEntitlements(workspaceId)` — async factory (fetches billing state + usage from DB)

3. **Export from `@repo/billing/src/index.ts`**
   - Re-export public API: `getWorkspaceEntitlements`, `entitlementsFor`, `EntitlementError`, types

4. **Example feature set** for the template — `max_projects`, `max_members`, `api_access`, `custom_domains`. Template consumers replace these.

## Files touched

```
┌───────────────────────────────────┬────────────────────────────────────┐
│              File                 │              Action                │
├───────────────────────────────────┼────────────────────────────────────┤
│ packages/db/src/schema.ts         │ Edit (add billing.usage table)     │
│ packages/billing/src/entitlements.ts │ Create                          │
│ packages/billing/src/index.ts     │ Edit (add entitlement exports)     │
└───────────────────────────────────┴────────────────────────────────────┘
```

## Verification

- `pnpm check-types` passes across workspace
- `pnpm --filter @repo/billing test` passes
- `drizzle-kit generate` produces a clean migration for the usage table
- Unit tests for: matrix lookup, `has`/`limit`/`check` pure methods, `EntitlementError` shape
