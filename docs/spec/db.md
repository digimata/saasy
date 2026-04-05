---
path: projects/saasy/docs/spec/db.md
outline: |
  • Database Specification                  L25
    ◦ 1. Scope and Principles               L33
    ◦ 2. Schema Layout                      L44
    ◦ 3. Auth Ontology                      L58
      ▪ 3.1 — User                          L60
      ▪ 3.2 — Account                       L84
      ▪ 3.3 — Workspace                    L116
      ▪ 3.4 — Membership                   L140
      ▪ 3.5 — Session                      L163
      ▪ 3.6 — Invitation                   L186
      ▪ 3.7 — Verification                 L208
    ◦ 4. Billing Ontology                  L234
      ▪ 4.1 — Customer                     L236
      ▪ 4.2 — Subscription                 L255
    ◦ 5. Relationships and Invariants      L283
    ◦ 6. BetterAuth Compatibility          L306
    ◦ 7. Out of Scope                      L350
    ◦ 8. Open Questions                    L364
    ◦ Related Docs                         L373
---

# Database Specification

Last updated: `2026.04.04`

> Canonical database ontology for the Saasy control plane. This defines the concepts, relationships, and schema boundaries for identity, workspaces, and the billing stub so implementation does not drift around BetterAuth defaults.

---

## 1. Scope and Principles

1. **The app owns the schema.** BetterAuth is an auth engine and session layer, not the source of truth for our identity model.
2. **Workspace is the ownership principal.** Billing, entitlements, and future machine credentials all attach to a workspace.
3. **Users and login methods are different concepts.** A user is the canonical identity; an account is a login method linked to that user.
4. **Control plane and app data stay separate.** `auth.*` and `billing.*` are control-plane schemas. Product data belongs elsewhere.
5. **The base template should stay generic.** Credit ledgers, API keys, rate limiting, and app-specific data models are not part of the core Saasy schema.
6. **Compatibility beats purity for framework-owned tables.** For BetterAuth core models (`user`, `account`, `session`, `verification`), prefer physical column shapes that stay close to BetterAuth defaults. Save most naming divergence for the workspace/plugin boundary, where explicit field mapping exists.

---

## 2. Schema Layout

The template uses PostgreSQL with separate logical schemas for different concerns.

| Schema | Purpose |
|---|---|
| `auth.*` | Canonical identity, sessions, workspaces, memberships |
| `billing.*` | Billing-provider linkage and subscription state |
| `public.*` or app-specific schema | Product-specific application data |

This is a single control-plane database, not a microservice split. The important boundary is logical isolation, not separate infrastructure.

---

## 3. Auth Ontology

### 3.1 — User

A `user` is the canonical application identity.

- It represents a person or operator in the system.
- It is not tied to any one login method.
- It can belong to one or more workspaces.

Recommended table: `auth.users`

Recommended logical fields:

| Field | Notes |
|---|---|
| `id` | Primary key |
| `name` | Display name |
| `email` | Email address; wallet-first nullability is an explicit open question |
| `email_verified` | Verification status |
| `image` | Optional avatar |
| `created_at` | Audit timestamp |
| `updated_at` | Audit timestamp |

Important note: conceptually a user is not defined by email. Physically, we should stay as close as possible to BetterAuth's core user shape unless wallet-first support forces an adapter or nullable email strategy.

### 3.2 — Account

An `account` is an external authentication method linked to a user.

Examples:

- email/password
- Google OAuth
- GitHub OAuth
- EVM wallet
- Solana wallet

Recommended table: `auth.accounts`

Recommended logical fields:

| Field | Notes |
|---|---|
| `id` | Primary key |
| `user_id` | FK -> `auth.users.id` |
| `provider_id` | `email`, `google`, `github`, `wallet_evm`, `wallet_solana` |
| `account_id` | Provider-unique identity |
| `access_token` | Optional provider token |
| `refresh_token` | Optional provider token |
| `id_token` | Optional provider token |
| `scope` | Optional OAuth scope |
| `password` | Optional password hash for email/password |
| `created_at` | Audit timestamp |
| `updated_at` | Audit timestamp |

Important rule: `(provider_id, account_id)` must be unique.

### 3.3 — Workspace

A `workspace` is the organizational and billing principal.

- Users access the product through workspaces.
- Billing and subscription state attach to workspaces.
- Future machine credentials or API keys would also belong to workspaces.

Recommended table: `auth.workspaces`

Recommended fields:

| Field | Notes |
|---|---|
| `id` | Primary key |
| `name` | Display name |
| `slug` | URL-safe unique identifier |
| `logo` | Optional branding field |
| `metadata` | Optional JSON for future extension |
| `created_at` | Audit timestamp |
| `updated_at` | Audit timestamp |

Important rule: billing-specific fields do **not** live on `auth.workspaces`.

### 3.4 — Membership

A `membership` links a user to a workspace.

- This is the canonical join model between identity and organization.
- The canonical table name is `auth.memberships`.
- BetterAuth's internal `member` model should map to this table.

Recommended fields:

| Field | Notes |
|---|---|
| `id` | Primary key |
| `user_id` | FK -> `auth.users.id` |
| `workspace_id` | FK -> `auth.workspaces.id` |
| `role` | `admin` for MVP |
| `created_at` | Audit timestamp |

Important rules:

- `(user_id, workspace_id)` must be unique.
- Every workspace must have at least one admin membership.

### 3.5 — Session

A `session` is a dashboard/browser auth session.

- Sessions belong to users, not directly to workspaces.
- The current workspace context is stored on the session.

Recommended table: `auth.sessions`

Recommended fields:

| Field | Notes |
|---|---|
| `id` | Primary key |
| `user_id` | FK -> `auth.users.id` |
| `token` | Session token |
| `expires_at` | Expiry timestamp |
| `active_workspace_id` | Nullable current workspace context |
| `ip_address` | Optional audit field |
| `user_agent` | Optional audit field |
| `created_at` | Audit timestamp |
| `updated_at` | Audit timestamp |

### 3.6 — Invitation

An `invitation` is a pending request for a user to join a workspace.

- The MVP UI can hide invites.
- The schema should still exist if we want BetterAuth's organization plugin to map cleanly.

Recommended table: `auth.invitations`

Recommended fields:

| Field | Notes |
|---|---|
| `id` | Primary key |
| `workspace_id` | FK -> `auth.workspaces.id` |
| `email` | Invitee email |
| `role` | Role to assign on acceptance |
| `status` | `pending`, `accepted`, `rejected`, `canceled` |
| `inviter_user_id` | FK -> `auth.users.id` |
| `expires_at` | Expiry timestamp |
| `created_at` | Audit timestamp |

### 3.7 — Verification

A `verification` is an auth-framework token or code.

Examples:

- email verification
- password reset
- magic link
- possibly wallet nonce storage if we choose to reuse this primitive

Recommended table: `auth.verifications`

Recommended fields:

| Field | Notes |
|---|---|
| `id` | Primary key |
| `identifier` | Email or other identity target |
| `value` | Verification secret or token |
| `expires_at` | Expiry timestamp |
| `created_at` | Audit timestamp |
| `updated_at` | Audit timestamp |

---

## 4. Billing Ontology

### 4.1 — Customer

A `customer` links a workspace to an external billing provider account.

Recommended table: `billing.customers`

Recommended fields:

| Field | Notes |
|---|---|
| `id` | Primary key |
| `workspace_id` | FK -> `auth.workspaces.id` |
| `provider` | `stripe` for the template MVP |
| `provider_customer_id` | External billing-system customer ID |
| `created_at` | Audit timestamp |
| `updated_at` | Audit timestamp |

Important rule: a workspace should have at most one customer record per provider.

### 4.2 — Subscription

A `subscription` is the billing-backed entitlement state for a workspace.

Recommended table: `billing.subscriptions`

Recommended fields:

| Field | Notes |
|---|---|
| `id` | Primary key |
| `workspace_id` | FK -> `auth.workspaces.id` |
| `customer_id` | FK -> `billing.customers.id` |
| `provider` | `stripe` for template MVP |
| `provider_subscription_id` | External subscription ID |
| `plan` | `pro`, `ultra`, etc. |
| `status` | `trialing`, `active`, `past_due`, `canceled`, etc. |
| `interval` | `monthly`, `annual` |
| `current_period_start` | Current billing period start |
| `current_period_end` | Current billing period end |
| `cancel_at_period_end` | Boolean |
| `created_at` | Audit timestamp |
| `updated_at` | Audit timestamp |

Recommended rule: treat `free` as the absence of an active paid subscription, not as a special billing row.

---

## 5. Relationships and Invariants

Core relationships:

- `auth.users` 1:N `auth.accounts`
- `auth.users` 1:N `auth.sessions`
- `auth.users` N:M `auth.workspaces` through `auth.memberships`
- `auth.workspaces` 1:N `auth.memberships`
- `auth.workspaces` 1:N `auth.invitations`
- `auth.workspaces` 1:N `billing.customers`
- `auth.workspaces` 1:N `billing.subscriptions` over time

Core invariants:

1. Every login method resolves to exactly one canonical user.
2. Every billing-backed action resolves to exactly one workspace.
3. A workspace may have many members, but a membership row must be unique per `(user_id, workspace_id)`.
4. A provider identity must be unique per `(provider_id, account_id)`.
5. Session state may track the active workspace, but data access decisions should not depend on dashboard sessions.
6. Billing state belongs in `billing.*`, not on `auth.workspaces`.

---

## 6. BetterAuth Compatibility

BetterAuth should map onto the canonical schema, not define it.

Compatibility strategy:

1. **Keep core BetterAuth tables close to BetterAuth defaults.** `auth.users`, `auth.accounts`, `auth.sessions`, and `auth.verifications` should use field names and nullability that BetterAuth already expects unless there is a strong reason to diverge.
2. **Use explicit mapping at the organization boundary.** `auth.workspaces`, `auth.memberships`, and `auth.invitations` are where we intentionally diverge from BetterAuth naming.
3. **Treat the adapter contract as part of the schema.** If the BetterAuth config needs `modelName` or `fields` remapping, that mapping belongs in code and in this spec.
4. **Prove it with integration tests, not hope.** Compatibility is established by exercising BetterAuth flows against the real schema.

Recommended model mapping:

| BetterAuth model | Canonical table |
|---|---|
| `user` | `auth.users` |
| `account` | `auth.accounts` |
| `session` | `auth.sessions` |
| `verification` | `auth.verifications` |
| `organization` | `auth.workspaces` |
| `member` | `auth.memberships` |
| `invitation` | `auth.invitations` |

Recommended field mapping for the organization plugin:

| BetterAuth field | Canonical field |
|---|---|
| `activeOrganizationId` | `active_workspace_id` |
| `organizationId` | `workspace_id` |
| `inviterId` | `inviter_user_id` |

Validation checklist:

1. `pnpm check-types` passes in the monorepo.
2. A blank Postgres database can run the migrations successfully.
3. Email signup and login work against the real schema.
4. OAuth account linking resolves to the same canonical user.
5. Workspace creation, switching active workspace, and membership reads work with the organization plugin mapping.
6. Invitation create/list/accept flows work if the plugin remains enabled.

If BetterAuth's organization plugin cannot map cleanly to this model, the fallback is to bypass that plugin and manage workspaces directly with Drizzle.

---

## 7. Out of Scope

This base schema does **not** include:

- API keys or machine credentials
- per-request usage metering
- credit ledgers
- rate limiting or quota counters
- app-specific data tables

Those belong in product-specific extensions, not the shared template ontology.

---

## 8. Open Questions

1. Can BetterAuth support wallet-first users cleanly if `primary_email` is nullable, or do we need an adapter/bridge?
2. Do we want Solana wallet support in the base template, or EVM-first only?
3. Should wallet challenge nonces live in `auth.verifications` or a dedicated table?
4. Should `billing.subscriptions` represent only paid plans, or should we persist a derived `free` row for convenience?

---

## Related Docs

- [ARCHITECTURE.md](../ARCHITECTURE.md) — System overview
- [decisions/001-betterauth.md](../decisions/001-betterauth.md) — BetterAuth decision record
- [decisions/002-drizzle.md](../decisions/002-drizzle.md) — Drizzle decision record
- [decisions/003-pg-schema.md](../decisions/003-pg-schema.md) — PG schema strategy
