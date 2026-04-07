---
title: "T-0005 Stripe billing stub"
date: 2026-04-07
status: draft
affects: "billing, workspaces, settings"
path: projects/saasy/.plan/T-0005-stripe-billing-stub.md
outline: |
    ◦ Context              L17
    ◦ Scope                L36
      ▪ In scope           L38
      ▪ Out of scope       L49
    ◦ Changes              L59
    ◦ Files touched       L166
    ◦ Verification        L195
---

## Context

`saasy` already treats the workspace as the organizational and billing principal:

- `docs/spec/db.md` defines the intended `billing.customers` and `billing.subscriptions` ontology.
- `packages/db/src/schema.ts` does not yet implement those tables.
- `apps/web/app/(dash)/settings/billing.tsx` is only a placeholder.
- Workspace creation currently happens during manual onboarding or via the workspace switcher, both through BetterAuth organization flows.

The template should ship a reusable Stripe control-plane skeleton, not a product-specific billing system. That means the template should own the standard plumbing:

- workspace-to-Stripe customer linkage
- hosted checkout entrypoint
- hosted billing portal entrypoint
- webhook-driven subscription sync into the local DB
- a simple billing settings surface that reads local state

The template should not own app-specific pricing strategy, seat accounting, or entitlement semantics beyond a tiny example.

## Scope

### In scope

- Stripe as the only billing provider for the template MVP
- Workspace-scoped customer creation and lookup
- Fixed template plan catalog: `hobby`, `pro`, `ultra`
- `hobby` is the free/default tier and is derived from the absence of an active paid subscription
- Hosted checkout entrypoints for the configured paid plans (`pro`, `ultra`)
- One hosted portal entrypoint for self-service billing management
- Webhook sync for subscription lifecycle events into `billing.*`
- Billing tab that shows derived tier/status from local DB state
- Developer-safe behavior when Stripe env is missing: billing UI explains configuration is missing instead of breaking app startup

### Out of scope

- Seat-based billing
- Usage metering
- Trials, coupons, discounts, taxes, invoices UI
- Multiple providers
- Dynamic plan catalogs or product-specific feature-entitlement matrices
- Persisting `free` as a billing row
- Blocking workspace creation on Stripe outages

## Changes

1. Billing contract and runtime behavior
   - Treat the workspace as the only billing owner.
   - Treat `hobby` as a derived state: no active paid subscription row means hobby/free.
   - Persist only paid subscriptions locally; do not create a synthetic free row.
   - Distinguish logical plan identity (`hobby`, `pro`, `ultra`) from Stripe price identity.
   - Treat Stripe `price_id` as a versioned provider artifact, not as the canonical plan key.
   - Gate billing on explicit Stripe env configuration.
   - If Stripe is configured, attempt eager customer creation when a workspace is created.
   - Do not hard-fail workspace creation on Stripe failure; instead, billing actions explicitly call `ensureStripeCustomer()` so the linkage can self-heal later. This is deliberate billing behavior, not a generic fallback helper.

2. Database schema in `billing.*`
   - Add `billingSchema = pgSchema("billing")`.
   - Add `billing.customers`:
     - `id`
     - `workspaceId`
     - `provider` (`stripe`)
     - `providerCustomerId`
     - `createdAt`
     - `updatedAt`
   - Add a unique constraint on `(workspaceId, provider)` and uniqueness on `providerCustomerId`.
   - Add `billing.subscriptions`:
     - `id`
     - `workspaceId`
     - `customerId`
      - `provider` (`stripe`)
      - `providerSubscriptionId`
      - `providerPriceId`
      - `plan` (`pro` or `ultra` for MVP)
      - `planVersion`
      - `status`
      - `interval`
      - `currentPeriodStart`
      - `currentPeriodEnd`
      - `cancelAtPeriodEnd`
      - `createdAt`
      - `updatedAt`
   - Store one row per Stripe subscription and update it in place from webhooks.

3. Stripe package boundary
   - Create `@repo/billing` as the server-side Stripe integration package.
   - Keep it provider-specific and minimal; do not introduce a fake generic billing abstraction.
   - Package responsibilities:
      - `isBillingConfigured()`
      - `ensureStripeCustomer(workspace)`
      - `createCheckoutSession(workspace, plan)`
      - `createPortalSession(workspace)`
      - `resolvePlanByPriceId(priceId)`
      - `syncSubscriptionFromStripe(event)`
      - `getWorkspaceBillingState(workspaceId)`
   - Centralize Stripe env reads in this package so app routes and auth hooks stay thin.
   - Expose a fixed versioned template plan map inside the billing package rather than a DB-backed product catalog.

4. Workspace creation integration
   - Edit `packages/auth/src/index.ts` to call `ensureStripeCustomer()` from `organizationHooks.afterCreateOrganization`.
   - This covers both onboarding-created workspaces and later workspaces created from the switcher.
   - Keep slug/session logic untouched; billing is an additive side effect at the workspace boundary.

5. Billing routes in the web app
   - Add `POST /api/billing/checkout`:
      - validate session server-side
      - resolve the active workspace
      - verify the user is a workspace member
      - ensure the Stripe customer exists
      - accept a requested paid plan (`pro` or `ultra`)
      - map that plan to the configured Stripe price ID
      - create a Stripe Checkout session for that price
      - return the hosted URL
   - Add `POST /api/billing/portal`:
     - same auth and workspace checks
     - ensure the Stripe customer exists
     - create a Stripe Customer Portal session
     - return the hosted URL
   - Add `POST /api/billing/webhook`:
     - verify Stripe signature
     - handle `customer.subscription.created`
     - handle `customer.subscription.updated`
     - handle `customer.subscription.deleted`
     - handle `checkout.session.completed` only where needed to reconcile missing linkage
     - make webhook processing idempotent by upserting on provider IDs

6. Billing settings UX
   - Replace the billing placeholder with a real `BillingTab`.
   - Read local billing state, not Stripe live, on page render.
   - Show:
      - current plan (`hobby`, `pro`, or `ultra`)
      - subscription status (`active`, `trialing`, `past_due`, `canceled`, etc.)
      - current period end when present
   - Actions:
      - hobby workspace: show plan choices for `Pro` and `Ultra`
      - paid workspace or existing customer: `Manage billing`
   - If Stripe is not configured, show a clear template-dev message instead of dead buttons or runtime errors.

7. Config and docs
   - Add Stripe envs to `apps/web/.env.example`:
     - `STRIPE_SECRET_KEY`
     - `STRIPE_WEBHOOK_SECRET`
     - `STRIPE_PRICE_PRO`
     - `STRIPE_PRICE_ULTRA`
     - optional `STRIPE_PORTAL_CONFIGURATION_ID`
   - Update `README.md` and `docs/ARCHITECTURE.md` billing sections to match the delivered scope.
   - Update `docs/spec/db.md` only if the implemented table fields differ from the current ontology.

8. Tests and invariants
   - Add a deliberately heavy billing test stack. Billing is control-plane code and should be tested more like auth than like cosmetic UI.
   - Layer 1: pure package tests in `@repo/billing`
     - catalog resolution for current prices
     - catalog resolution for legacy prices
     - `price_id -> plan`
     - `price_id -> interval`
     - `price_id -> planVersion`
     - derived billing state (`hobby` when no active paid subscription exists)
     - unconfigured-billing behavior
   - Layer 2: route and integration tests in `apps/web/tests/integration`
     - customer creation on workspace creation when billing is configured
     - workspace creation still succeeds when Stripe customer creation fails
     - checkout route rejects anonymous callers
     - checkout route rejects users without a valid active workspace
     - checkout route rejects non-members of the target workspace
     - checkout route rejects unknown or unpaid-only plan values
     - checkout route creates sessions for `pro` and `ultra`
     - portal route rejects anonymous callers
     - portal route rejects non-members
     - portal route creates a customer on demand if missing
   - Layer 3: webhook tests
     - signature verification rejects invalid payloads
     - `customer.subscription.created` inserts subscription state
     - `customer.subscription.updated` updates the existing row in place
     - `customer.subscription.deleted` transitions local state correctly
     - `checkout.session.completed` reconciles missing customer/subscription linkage only where needed
     - repeated delivery of the same event is idempotent
     - out-of-order-but-valid updates fail closed or reconcile deterministically
     - unknown `price_id` is rejected or flagged rather than silently mapped
   - Layer 4: invariant tests in `apps/web/tests/invariants/billing.test.ts`
     - Tests must reference invariant IDs directly in the test names, matching the existing spec pattern.
     - Use named test callbacks where it improves stack traces.
   - Proposed billing invariants for `docs/spec/invariants.md`:
     - `INV-BIL-001`: A workspace has at most one billing customer per provider.
     - `INV-BIL-002`: Billing state resolves to exactly one logical plan for a workspace at a time (`hobby`, `pro`, or `ultra`).
     - `INV-BIL-003`: Stripe price IDs map to exactly one logical paid plan and plan version.
     - `INV-BIL-004`: Hosted billing routes are workspace-scoped and member-only.
     - `INV-BIL-005`: Client input may request checkout, but may not directly set subscription plan or status.
     - `INV-BIL-006`: Subscription state is derived from authenticated Stripe webhook data, not from dashboard requests.
     - `INV-BIL-007`: Webhook processing is idempotent under retries and duplicate delivery.
     - `INV-BIL-008`: Billing degrades safely when Stripe is unconfigured; auth and workspace creation continue to function.
     - `INV-BIL-009`: Legacy recognized Stripe price IDs continue to resolve to the correct logical plan after price changes.
   - Add a manual Stripe smoke path in test mode:
     - workspace creation
     - upgrade to `pro`
     - upgrade to `ultra`
     - portal open
     - cancel or downgrade
     - local DB state reconciliation after each webhook

## Files touched

```
┌──────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────┐
│ File                                                 │ Action                                                       │
├──────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ .plan/T-0005-stripe-billing-stub.md                  │ Create(billing implementation plan)                          │
│ .tasks/T-0005.md                                     │ Edit(mark in progress / link plan if desired)                │
│ packages/db/src/schema.ts                            │ Edit(add billing schema, customers, subscriptions)           │
│ packages/db/drizzle/*.sql                            │ Create(add billing migration)                                │
│ packages/db/drizzle/meta/*.json                      │ Edit(update drizzle snapshots/journal)                       │
│ packages/billing/package.json                        │ Create(add Stripe billing package)                           │
│ packages/billing/index.ts                            │ Create(export Stripe billing helpers)                        │
│ packages/billing/index.test.ts                       │ Create(add pure billing package coverage)                    │
│ packages/auth/package.json                           │ Edit(add @repo/billing dependency)                           │
│ packages/auth/src/index.ts                           │ Edit(ensure customer after workspace creation)               │
│ apps/web/package.json                                │ Edit(add @repo/billing dependency if routes import it)       │
│ apps/web/.env.example                                │ Edit(add Stripe env configuration)                           │
│ apps/web/app/api/billing/checkout/route.ts           │ Create(hosted checkout session endpoint)                     │
│ apps/web/app/api/billing/portal/route.ts             │ Create(customer portal session endpoint)                     │
│ apps/web/app/api/billing/webhook/route.ts            │ Create(Stripe webhook endpoint)                              │
│ apps/web/app/(dash)/settings/billing.tsx             │ Edit(replace placeholder with billing UI)                    │
│ apps/web/tests/integration/billing-routes.test.ts    │ Create(add checkout/portal integration coverage)             │
│ apps/web/tests/integration/billing-webhooks.test.ts  │ Create(add webhook reconciliation coverage)                  │
│ docs/spec/invariants.md                              │ Edit(add `INV-BIL-*` contracts and summary rows)             │
│ apps/web/tests/invariants/billing.test.ts            │ Create(add billing invariant coverage)                       │
│ apps/web/tests/flows/billing.yaml                     │ Create(add billing manual/agent flow coverage if desired)    │
│ README.md                                            │ Edit(document Stripe setup and billing stub behavior)        │
│ docs/ARCHITECTURE.md                                 │ Edit(match billing-delivery scope)                           │
└──────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────┘
```

## Verification

- Run `pnpm --filter @repo/db check-types`
- Run `pnpm --filter @repo/billing check-types` if the package adds a typecheck script
- Run `pnpm --filter @repo/auth check-types`
- Run `pnpm --filter web check-types`
- Run `pnpm --filter web test`
- Run a local Stripe webhook forwarder against `POST /api/billing/webhook`
- Manual checks:
  - create a workspace with Stripe configured and confirm a `billing.customers` row is created
  - open Settings -> Billing for a hobby workspace and confirm `hobby` state renders cleanly
  - click `Upgrade to Pro` and confirm a Checkout URL is returned
  - click `Upgrade to Ultra` and confirm a Checkout URL is returned
  - complete a Stripe test checkout and confirm webhook sync creates/updates `billing.subscriptions`
  - replay the same webhook event and confirm no duplicate customer/subscription rows are created
  - simulate a legacy recognized `price_id` and confirm it resolves to the correct logical plan/version
  - reopen Settings -> Billing and confirm plan/status/period end reflect local DB state
  - click `Manage billing` and confirm a Customer Portal URL is returned
  - cancel or downgrade through Stripe test mode and confirm local subscription state follows the webhook
  - run the app without Stripe envs and confirm billing shows a clear unconfigured state without breaking auth or workspace creation
