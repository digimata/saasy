---
path: projects/saasy/docs/decisions/005-billing-control-plane.md
outline: |
  • ADR-005 :: Workspace-scoped Stripe billing control plane      L11
    ◦ 1. Decision                                                 L19
    ◦ 2. Rationale                                                L30
    ◦ 3. Design Implications                                      L39
    ◦ 4. When to Revisit                                          L55
---

# ADR-005 :: Workspace-scoped Stripe billing control plane

Last updated: `2026.04.07`

> Billing is a control-plane concern owned by the workspace. Stripe is the provider of record for checkout, portal, and subscription events, while the local database is the application control plane for billing state, plan identity, and entitlement resolution.

---

## 1. Decision

- The workspace is the billing principal. Customers, subscriptions, usage, and entitlements attach to a workspace, not to an individual user.
- Stripe is the only billing provider in the template.
- The app persists billing state locally in `billing.*` tables and does not rely on live Stripe reads for routine product decisions.
- `hobby` is a derived free tier, represented by the absence of an active paid subscription. It is not persisted as a synthetic subscription row.
- Hosted checkout and hosted billing portal are the only template billing mutation surfaces. The app does not build custom card-entry or custom subscription-management flows.
- Stripe webhook data is the source of truth for paid subscription state. Redirect callbacks, browser state, and dashboard requests may initiate flows, but may not set subscription truth.
- Logical plan identity is versioned and distinct from Stripe `price_id`. The app resolves provider price IDs to `(plan, planVersion)` before applying billing state.
- Billing must fail safely when Stripe is unconfigured: auth, workspace creation, and workspace settings remain usable, while billing surfaces show explicit unconfigured behavior.

## 2. Rationale

- Workspace-scoped billing matches the template's ownership model: workspaces already own members, settings, and future credentials.
- Persisting billing state locally keeps gating, entitlements, and UI deterministic and fast. Product code should not depend on a live provider round-trip to decide what a workspace can do.
- Hosted Stripe flows cover the reusable SaaS template path without forcing the template to own sensitive payment UX or provider-specific lifecycle edge cases.
- Separating logical plans from Stripe price IDs avoids the common trap where price rotations break grandfathered subscribers or entitlements.
- Treating `hobby` as derived keeps the free tier simple and avoids fake billing artifacts in the DB.
- Safe degradation matters because local development, tests, and non-billing work should not require Stripe secrets.

## 3. Design Implications

- Billing state lives in `billing.customers`, `billing.subscriptions`, and `billing.usage`.
- The `@repo/billing` package owns:
  - Stripe client access
  - versioned plan catalog and price resolution
  - customer ensure logic
  - checkout and portal session creation
  - webhook event construction and subscription sync
  - workspace billing-state resolution
  - entitlement resolution
- Workspace creation may eagerly attempt Stripe customer creation, but workspace creation must not fail if Stripe customer creation fails.
- Billing routes must validate a real session and workspace membership. They may not trust `activeOrganizationId` without membership checks.
- Billing UI reads local billing state and local entitlement state, then links out to Stripe-hosted flows for mutations.
- Live Stripe smoke coverage is required in addition to mocked tests because the provider boundary is part of the control plane.

## 4. When to Revisit

- If the template needs multiple billing providers.
- If the template needs seat billing, metered billing, taxes, invoicing, or a richer pricing catalog as first-class template concerns.
- If the app needs custom payment collection UX instead of hosted Stripe flows.
- If Stripe webhook semantics or local synchronization prove too brittle and a different provider model becomes preferable.
