---
path: projects/saasy/b2c-clerk-vite/docs/spec/invariants.md
outline: |
  • B2C System Invariants                             L30
    ◦ Summary                                         L36
    ◦ 1. Purpose and Scope                            L51
    ◦ 2. How to Use This Spec                         L64
    ◦ 3. ID Scheme                                    L86
    ◦ 4. Enforcement Layers                           L98
    ◦ 5. Auth Invariants                             L110
      ▪ INV-AUTH-001                                 L112
      ▪ INV-AUTH-002                                 L136
    ◦ 6. Session and Redirect Invariants             L160
      ▪ INV-SES-001                                  L162
      ▪ INV-SES-002                                  L185
      ▪ INV-SES-003                                  L209
    ◦ 7. Sync Invariants                             L234
      ▪ INV-SYNC-001                                 L236
      ▪ INV-SYNC-002                                 L260
      ▪ INV-SYNC-003                                 L283
      ▪ INV-SYNC-004                                 L307
      ▪ INV-SYNC-005                                 L332
    ◦ 8. Verification Strategy                       L356
      ▪ 8.1 - Web route and redirect tests           L360
      ▪ 8.2 - API auth tests                         L365
      ▪ 8.3 - Clerk webhook and lazy-sync tests      L370
      ▪ 8.4 - Manual checklist                       L375
---

# B2C System Invariants

Last updated: `2026.04.21`

> Stable correctness contracts for the Saasy B2C template. These invariants define the rules that must hold for Clerk-backed identity, protected-route behavior, post-auth redirects, and the local user mirror synced into Postgres.

## Summary

| ID | Invariant | Intended enforcement | Verification |
| -- | --------- | -------------------- | ------------ |
| [INV-AUTH-001](#inv-auth-001) | Canonical user emails are globally unique | `DB + App` | case-variant sync collision |
| [INV-AUTH-002](#inv-auth-002) | Protected API routes require a validated Clerk session | `Auth + App + Test` | invalid-token `/me` access |
| [INV-SES-001](#inv-ses-001) | Protected app routes never render for anonymous users | `Route + Test` | signed-out visit to `/projects` |
| [INV-SES-002](#inv-ses-002) | Post-auth redirects preserve intended same-app destinations | `Route + Test` | protected-route redirect round-trip |
| [INV-SES-003](#inv-ses-003) | Post-auth redirects fail closed for off-app or malformed targets | `Route + Test` | external `redirectTo` fallback |
| [INV-SYNC-001](#inv-sync-001) | Clerk webhooks require valid svix proof | `Auth + Route + Test` | missing/bad signature webhook |
| [INV-SYNC-002](#inv-sync-002) | User sync requires a resolvable email identity | `App + Test` | create/update event with no email |
| [INV-SYNC-003](#inv-sync-003) | Sync is idempotent under retries and duplicate delivery | `DB + App + Test` | repeated `user.updated` delivery |
| [INV-SYNC-004](#inv-sync-004) | Webhook sync and lazy sync converge on one local row per Clerk user | `DB + App + Test` | `/me` before webhook then webhook replay |
| [INV-SYNC-005](#inv-sync-005) | User deletion removes only the row addressed by the deleted Clerk user id | `App + Test` | repeated and foreign-id delete |

## 1. Purpose and Scope

This document is the target correctness contract for `b2c-clerk-vite`.

It is intentionally narrower than the B2B template's invariant set. The B2C template currently has:

- single-user accounts, not workspaces or memberships
- Clerk as the auth system of record
- a local `auth.users` mirror in Postgres
- a protected app shell and public auth entry surfaces

It does not currently need B2B-only invariant families such as workspace, membership, invitation, billing, or entitlements.

## 2. How to Use This Spec

For every invariant below, maintain this loop:

1. State the invariant here.
2. Identify the intended enforcement layer here.
3. Reference the invariant ID directly in tests.
4. Reference the invariant ID in code comments only where the enforcement point is subtle enough to need it.
5. Reconcile the current implementation against this spec in a separate report rather than weakening the invariant to match today's code.

Recommended test naming:

```ts
it("INV-SYNC-003 keeps Clerk sync idempotent under duplicate delivery", async () => {
```

Recommended code comment shape:

```ts
// INV-SES-003: redirect targets must stay app-relative and fail closed.
```

## 3. ID Scheme

Invariant IDs are domain-prefixed and stable.

| Prefix | Domain |
| ------ | ------ |
| `INV-AUTH-*` | Identity and authenticated API access |
| `INV-SES-*` | Protected-route and redirect semantics |
| `INV-SYNC-*` | Clerk webhook and lazy-sync behavior |

IDs should not be renumbered unless the invariant itself is removed or split.

## 4. Enforcement Layers

Each invariant should be enforced in at least one layer, and in more than one when the cost is reasonable.

| Layer | Meaning |
| ----- | ------- |
| `DB` | Database uniqueness, constraints, keys, and transaction behavior |
| `App` | Server-side application logic and validation |
| `Auth` | Clerk session validation and svix verification semantics |
| `Route` | Router, layout, and redirect behavior in the web app |
| `Test` | Explicit regression coverage proving the rule holds |

## 5. Auth Invariants

### INV-AUTH-001

Title: Canonical user emails are globally unique

Statement:
After canonicalization, one human email identity must map to at most one local `auth.users` row.

What breaks if violated:

- The same user can be mirrored into multiple local records.
- Downstream domain data can attach to different rows for the same person.
- Webhook sync and lazy sync can race into duplicate identities.

Intended enforcement:

- `DB`: unique canonical email representation.
- `App`: normalize email before writes and lookups.

Verification:

- Sync `User.Name@example.com`.
- Attempt a second sync with `user.name@example.com`.
- Assert the system resolves to one logical local user.

### INV-AUTH-002

Title: Protected API routes require a validated Clerk session

Statement:
Protected API handlers must derive user identity from Clerk-validated request context, not from caller-supplied user IDs, bearer-shaped strings, or client claims.

What breaks if violated:

- Anonymous callers can reach protected API surfaces.
- A caller can impersonate another user by forging identifiers.
- The local user mirror loses trust as a server-side source of identity.

Intended enforcement:

- `Auth`: Clerk middleware validates the request.
- `App`: handlers use validated auth context helpers only.
- `Test`: protected routes reject missing or invalid auth.

Verification:

- Call `/me` without a valid Clerk session and assert `401`.
- Call `/me` with a valid session and assert the returned row belongs to that Clerk user.

## 6. Session and Redirect Invariants

### INV-SES-001

Title: Protected app routes never render for anonymous users

Statement:
App-only routes must redirect anonymous users to an auth entry surface before protected chrome or page content renders.

What breaks if violated:

- Anonymous users can see protected layout state or content flashes.
- The app shell behaves inconsistently between routes.
- Protected links appear reachable when they are not.

Intended enforcement:

- `Route`: protected layouts gate their children on auth state.
- `Test`: signed-out route visits prove redirect behavior.

Verification:

- Visit `/projects`, `/inbox`, and `/settings` while signed out.
- Assert each route diverts to sign-in rather than rendering protected content.

### INV-SES-002

Title: Post-auth redirects preserve intended same-app destinations

Statement:
When auth is required to reach an in-app destination, the intended app-relative path and query string must survive through email-code sign-in, sign-up, and OAuth completion.

What breaks if violated:

- Users lose task context after authentication.
- Deep links into the product become unreliable.
- OAuth and email-code flows diverge in user-visible behavior.

Intended enforcement:

- `Route`: auth entry points preserve the encoded destination.
- `Test`: all sign-in paths complete back to the same in-app URL.

Verification:

- Start from a protected URL such as `/settings?tab=billing`.
- Authenticate.
- Assert the final location is the same app-relative destination.

### INV-SES-003

Title: Post-auth redirects fail closed for off-app or malformed targets

Statement:
Redirect targets accepted by auth entry surfaces must be constrained to app-relative destinations. Absolute external URLs, protocol-relative URLs, and malformed values must resolve to a safe default.

What breaks if violated:

- The app becomes an open redirect surface.
- Auth links can be abused for phishing.
- OAuth completion can navigate users away from the product unexpectedly.

Intended enforcement:

- `Route`: normalize and validate redirect targets before navigation.
- `Test`: malicious `redirectTo` values fall back to `/` or another safe default.

Verification:

- Attempt auth entry with `redirectTo=https://evil.example`.
- Attempt auth entry with `redirectTo=//evil.example`.
- Attempt auth entry with malformed values.
- Assert each case resolves to a safe in-app destination.

## 7. Sync Invariants

### INV-SYNC-001

Title: Clerk webhooks require valid svix proof

Statement:
The webhook endpoint must reject any request missing required svix headers or failing svix signature verification.

What breaks if violated:

- Any caller can forge user lifecycle events.
- Local user data can be created, mutated, or deleted without Clerk.
- The local mirror stops being trustworthy.

Intended enforcement:

- `Auth`: svix verification against the configured signing secret.
- `Route`: webhook handler rejects invalid requests before processing.
- `Test`: missing and invalid signatures fail closed.

Verification:

- Submit a webhook without svix headers and assert `400`.
- Submit a webhook with an invalid signature and assert `401`.

### INV-SYNC-002

Title: User sync requires a resolvable email identity

Statement:
For user create and update events, the system must not persist a local user row unless it can resolve an email identity from the Clerk payload or Clerk API response.

What breaks if violated:

- The local mirror can contain partial identities.
- Unique-user rules become impossible to enforce reliably.
- Downstream systems lose a stable human identifier.

Intended enforcement:

- `App`: fail closed when no email is available.
- `Test`: create and update payloads without a usable email do not write a row.

Verification:

- Deliver a create or update sync input with no resolvable email.
- Assert the request fails and no local user row is written.

### INV-SYNC-003

Title: Sync is idempotent under retries and duplicate delivery

Statement:
Repeated delivery of the same logical Clerk user state must converge on one local row and one final field set.

What breaks if violated:

- Webhook retries create duplicates or inconsistent state.
- Clerk's at-least-once delivery semantics become unsafe.
- Manual replay from the dashboard mutates state incorrectly.

Intended enforcement:

- `DB`: one stable row per Clerk user.
- `App`: create/update paths upsert deterministically.
- `Test`: repeated deliveries converge on one row.

Verification:

- Replay the same `user.updated` payload multiple times.
- Assert the local user table still contains one row for that Clerk user with the expected final fields.

### INV-SYNC-004

Title: Webhook sync and lazy sync converge on one local row per Clerk user

Statement:
Whether the first local write is triggered by Clerk webhook delivery or authenticated `/me` access, both sync paths must converge on the same local row keyed by Clerk user identity.

What breaks if violated:

- A user can be mirrored twice depending on which sync path wins the race.
- Local user state differs depending on whether webhooks were configured in time.
- Retry behavior becomes path-dependent and hard to reason about.

Intended enforcement:

- `DB`: stable key on Clerk user identity.
- `App`: webhook sync and lazy sync use the same logical upsert target.
- `Test`: cross-path ordering does not create duplicates.

Verification:

- Trigger `/me` for an authenticated user before webhook delivery.
- Replay the matching Clerk webhook afterward.
- Assert there is still exactly one local row for that Clerk user.

### INV-SYNC-005

Title: User deletion removes only the row addressed by the deleted Clerk user id

Statement:
Delete sync must remove the local row for the deleted Clerk user id and no other row. Repeated deletes must remain safe.

What breaks if violated:

- A delete event can remove the wrong local account.
- Duplicate delete delivery becomes destructive.
- The local mirror can diverge from Clerk in unrecoverable ways.

Intended enforcement:

- `App`: delete by Clerk user identity only.
- `Test`: repeated deletes and foreign IDs leave unrelated rows untouched.

Verification:

- Create two local users with different Clerk IDs.
- Deliver a delete for one Clerk ID twice.
- Assert only the matching row is removed.

## 8. Verification Strategy

These invariants should be covered in a small number of focused test layers.

### 8.1 - Web route and redirect tests

- Cover protected-route gating and redirect target normalization.
- Reference `INV-SES-*` directly in test names.

### 8.2 - API auth tests

- Cover `requireAuth`, `/me`, and any future protected API surfaces.
- Reference `INV-AUTH-*` directly in test names.

### 8.3 - Clerk webhook and lazy-sync tests

- Cover signature checks, missing-email failure, idempotent upsert, cross-path convergence, and delete safety.
- Reference `INV-SYNC-*` directly in test names.

### 8.4 - Manual checklist

The manual checklist in `docs/testing.md` remains useful for first-boot and live-provider smoke coverage, but it does not replace invariant tests.
