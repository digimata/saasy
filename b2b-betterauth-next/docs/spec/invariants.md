---
path: projects/saasy/docs/spec/invariants.md
outline: |
  • System Invariants                         L66
    ◦ Summary                                 L72
    ◦ 1. Purpose and Scope                   L122
    ◦ 2. How to Use This Spec                L134
    ◦ 3. ID Scheme                           L157
    ◦ 4. Enforcement Layers                  L174
    ◦ 5. Auth Invariants                     L188
      ▪ INV-AUTH-001                         L190
      ▪ INV-AUTH-002                         L213
      ▪ INV-AUTH-003                         L239
      ▪ INV-AUTH-004                         L262
      ▪ INV-AUTH-005                         L284
      ▪ INV-AUTH-006                         L307
    ◦ 6. Workspace Invariants                L331
      ▪ INV-WS-001                           L333
      ▪ INV-WS-002                           L355
      ▪ INV-WS-003                           L377
      ▪ INV-WS-004                           L401
      ▪ INV-WS-005                           L421
    ◦ 7. Membership Invariants               L446
      ▪ INV-MEM-001                          L448
      ▪ INV-MEM-002                          L473
      ▪ INV-MEM-003                          L495
      ▪ INV-MEM-004                          L518
      ▪ INV-MEM-005                          L541
      ▪ INV-MEM-006                          L563
    ◦ 8. Session Invariants                  L587
      ▪ INV-SES-001                          L589
      ▪ INV-SES-002                          L610
      ▪ INV-SES-003                          L633
      ▪ INV-SES-004                          L656
      ▪ INV-SES-005                          L679
      ▪ INV-SES-006                          L702
      ▪ INV-SES-007                          L724
    ◦ 9. Invitation Invariants               L747
      ▪ INV-INV-001                          L749
      ▪ INV-INV-002                          L770
      ▪ INV-INV-003                          L794
      ▪ INV-INV-004                          L816
      ▪ INV-INV-005                          L838
      ▪ INV-INV-006                          L879
      ▪ INV-INV-007                          L901
      ▪ INV-INV-008                          L923
      ▪ INV-INV-009                          L946
      ▪ INV-INV-010                          L967
    ◦ 10. Billing Invariants                 L990
      ▪ INV-BIL-001                          L992
      ▪ INV-BIL-002                         L1015
      ▪ INV-BIL-003                         L1038
      ▪ INV-BIL-004                         L1061
      ▪ INV-BIL-005                         L1083
      ▪ INV-BIL-006                         L1105
      ▪ INV-BIL-007                         L1127
      ▪ INV-BIL-008                         L1149
      ▪ INV-BIL-009                         L1171
    ◦ 11. Entitlement Invariants           L1195
      ▪ INV-ENT-001                        L1197
      ▪ INV-ENT-002                        L1218
      ▪ INV-ENT-003                        L1240
      ▪ INV-ENT-004                        L1261
      ▪ INV-ENT-005                        L1284
      ▪ INV-ENT-006                        L1307
      ▪ INV-ENT-007                        L1329
    ◦ 12. Verification Strategy            L1353
      ▪ Database and transaction tests     L1357
      ▪ BetterAuth integration tests       L1366
      ▪ Route and policy tests             L1375
      ▪ Provider and webhook tests         L1384
      ▪ Entitlement tests                  L1393
---

# System Invariants

Last updated: `2026.04.07`

> Stable correctness contracts for the Saasy control plane. These invariants define the security boundaries, uniqueness rules, referential integrity guarantees, and state-machine rules that must hold for auth, workspaces, memberships, sessions, invitations, billing, and entitlements.

## Summary

| ID | Invariant | Enforcement | Verification |
| -- | --------- | ----------- | ------------ |
| [INV-AUTH-001](#inv-auth-001) | Canonical user emails are globally unique | `DB + App` | duplicate-email sign-up |
| [INV-AUTH-002](#inv-auth-002) | A provider account belongs to exactly one user | `DB + App` | duplicate account-link attempt |
| [INV-AUTH-003](#inv-auth-003) | Sign-up is idempotent under retries and double submit | `DB + App` | concurrent sign-up race |
| [INV-AUTH-004](#inv-auth-004) | Auth method boundaries are respected | `Auth + App` | cross-method sign-in checks |
| [INV-AUTH-005](#inv-auth-005) | Verification artifacts are single-use and expiry-enforced | `Auth + DB` | token replay and expiry |
| [INV-AUTH-006](#inv-auth-006) | Protected routes require a validated session, not just cookie-shaped input | `Route + App` | invalid-session protected access |
| [INV-WS-001](#inv-ws-001) | Workspace slugs are globally unique after canonicalization | `DB + App` | slug collision create/update |
| [INV-WS-002](#inv-ws-002) | Workspace creation leaves the workspace manageable | `App + Auth` | signup/bootstrap workspace check |
| [INV-WS-003](#inv-ws-003) | Only workspace members may read workspace-scoped surfaces | `App + Route` | cross-workspace read attempt |
| [INV-WS-004](#inv-ws-004) | Only admins may mutate workspace settings | `App` | non-admin workspace update |
| [INV-WS-005](#inv-ws-005) | A workspace must never end up with zero admins | `App` | last-admin removal/demotion |
| [INV-MEM-001](#inv-mem-001) | A user may have at most one membership per workspace | `DB` | duplicate membership race |
| [INV-MEM-002](#inv-mem-002) | Membership roles are restricted to known values | `DB + App` | invalid role write |
| [INV-MEM-003](#inv-mem-003) | Only admins may invite, remove, or change member roles | `App` | non-admin member mutation |
| [INV-MEM-004](#inv-mem-004) | Removed members lose access immediately on their next request | `Route + App` | post-removal access refresh |
| [INV-MEM-005](#inv-mem-005) | Membership reads and writes are workspace-scoped | `App` | cross-workspace member tampering |
| [INV-MEM-006](#inv-mem-006) | Users may not self-escalate their own role | `App` | self-role escalation attempt |
| [INV-SES-001](#inv-ses-001) | Session tokens are unique and identify one user | `DB` | one-token one-user check |
| [INV-SES-002](#inv-ses-002) | Expired sessions fail closed | `Auth + App` | expired-session access |
| [INV-SES-003](#inv-ses-003) | Sign-out invalidates the session server-side | `Auth + App` | replay old token after sign-out |
| [INV-SES-004](#inv-ses-004) | Active workspace must belong to the session user | `App + Route` | set foreign workspace active |
| [INV-SES-005](#inv-ses-005) | Losing membership invalidates stale active workspace context | `Route + App` | active workspace after removal |
| [INV-SES-006](#inv-ses-006) | Middleware uses negative evidence only | `Route + Test` | bogus-cookie auth entry |
| [INV-SES-007](#inv-ses-007) | Auth entry routes preserve intended post-auth destination | `Route` | invite-link redirect preservation |
| [INV-INV-001](#inv-inv-001) | Only workspace admins may create invitations for that workspace | `App` | non-admin invite attempt |
| [INV-INV-002](#inv-inv-002) | There is at most one pending invitation per workspace and canonical email | `DB + App` | duplicate pending invite |
| [INV-INV-003](#inv-inv-003) | Invitation acceptance requires identity match | `App` | wrong-user invite acceptance |
| [INV-INV-004](#inv-inv-004) | Expired invitations may not be accepted | `App + DB` | expired invite acceptance |
| [INV-INV-005](#inv-inv-005) | Invitation status follows a strict state machine | `DB + App` | invalid transition retry |
| [INV-INV-006](#inv-inv-006) | Invitation acceptance is atomic | `DB + App` | membership plus status commit |
| [INV-INV-007](#inv-inv-007) | Invitation acceptance is idempotent under retries and concurrency | `DB + App` | concurrent invite acceptance |
| [INV-INV-008](#inv-inv-008) | Existing members may not gain duplicate access through invitations | `DB + App` | accept invite as existing member |
| [INV-INV-009](#inv-inv-009) | Closed invitations stay closed | `App` | accept rejected/canceled invite |
| [INV-INV-010](#inv-inv-010) | Invitation lookup does not leak privileged workspace data to unrelated users | `App` | unrelated-user invite probe |
| [INV-BIL-001](#inv-bil-001) | A workspace has at most one billing customer per provider | `DB + App` | duplicate customer creation race |
| [INV-BIL-002](#inv-bil-002) | Billing state resolves to exactly one logical plan for a workspace at a time | `DB + App` | active-plus-canceled subscription mix |
| [INV-BIL-003](#inv-bil-003) | Stripe price IDs map to exactly one logical paid plan and plan version | `App + Test` | price rotation / legacy price replay |
| [INV-BIL-004](#inv-bil-004) | Hosted billing routes are workspace-scoped and member-only | `Route + App` | cross-workspace checkout / portal attempt |
| [INV-BIL-005](#inv-bil-005) | Client input may request checkout but may not set subscription truth | `Route + App` | forged plan/status mutation payload |
| [INV-BIL-006](#inv-bil-006) | Subscription state is derived from authenticated Stripe webhook data | `App + Test` | dashboard-only subscription write attempt |
| [INV-BIL-007](#inv-bil-007) | Webhook processing is idempotent under retries and duplicate delivery | `DB + App` | repeated event delivery |
| [INV-BIL-008](#inv-bil-008) | Billing degrades safely when Stripe is unconfigured | `App + Route` | missing Stripe env in development |
| [INV-BIL-009](#inv-bil-009) | Recognized legacy Stripe prices continue to resolve to the correct logical plan | `App + Test` | old subscriber after price change |
| [INV-ENT-001](#inv-ent-001) | Plan and plan version resolve to exactly one entitlement set | `App + Test` | same input same entitlements |
| [INV-ENT-002](#inv-ent-002) | A workspace resolves to exactly one effective entitlement set at a time | `App + Test` | hobby fallback vs active paid plan |
| [INV-ENT-003](#inv-ent-003) | Server-side entitlement enforcement is authoritative | `App + Route` | UI-only gate bypass attempt |
| [INV-ENT-004](#inv-ent-004) | Stock limits are enforced against canonical resource state | `App + DB` | over-limit create in same transaction |
| [INV-ENT-005](#inv-ent-005) | Quota resets follow billing period boundaries deterministically | `App + DB` | reset-at rollover and period update |
| [INV-ENT-006](#inv-ent-006) | Downgrades do not delete existing resources, but block further expansion past the new limit | `App + Test` | over-limit downgrade expansion attempt |
| [INV-ENT-007](#inv-ent-007) | Unknown entitlement inputs fail closed | `App + Test` | unknown plan version or entitlement ID |

---

## 1. Purpose and Scope

This document exists so correctness requirements do not get scattered across schema comments, route guards, BetterAuth config, and tests.

Each invariant in this spec is intended to be:

1. Stable enough to reference by ID in code review, tests, and incident notes.
2. Concrete enough to map to one or more enforcement layers.
3. Focused on production breakage, not purely theoretical threats.

---

## 2. How to Use This Spec

For every invariant below, maintain the following loop:

1. The invariant is stated here.
2. The enforcement layer is identified here.
3. Tests reference the invariant ID directly.
4. Code comments may reference the invariant ID where the rule is enforced.

Recommended test naming:

```ts
it("INV-WS-001 rejects colliding workspace slugs", async () => {
```

Recommended code comment shape:

```ts
// INV-SES-004: active workspace must belong to the session user.
```

---

## 3. ID Scheme

Invariant IDs are domain-prefixed and stable.

| Prefix | Domain |
| ------ | ------ |
| `INV-AUTH-*` | Auth and identity |
| `INV-WS-*` | Workspaces |
| `INV-MEM-*` | Memberships |
| `INV-SES-*` | Sessions |
| `INV-INV-*` | Invitations |
| `INV-BIL-*` | Billing |
| `INV-ENT-*` | Entitlements |

IDs should not be renumbered unless the invariant itself is removed or split.

---

## 4. Enforcement Layers

Every invariant should be enforced in at least one of these layers, and preferably in more than one when the cost is reasonable.

| Layer | Meaning |
| ----- | ------- |
| `DB` | Database constraints, FKs, unique indexes, check constraints, transactions |
| `App` | Server-side application logic, validation, and authorization checks |
| `Auth` | BetterAuth behavior and plugin semantics |
| `Route` | Middleware, layouts, route handlers, and redirect semantics |
| `Test` | Explicit regression coverage proving the rule holds |

---

## 5. Auth Invariants

### INV-AUTH-001

Title: Canonical user emails are globally unique

Statement:
After email canonicalization, a single human email identity must map to at most one `auth.users` row.

What breaks if violated:

- The same person can end up with split identities.
- Invitations may attach to one record while sign-in resolves to another.
- Workspace membership and billing ownership can fragment across duplicate users.

Enforcement:

- `DB`: unique constraint on the canonical email representation.
- `App`: normalize email before create and lookup.

Verification:

- Create `Alice@example.com`, then attempt to create `alice@example.com`.
- Assert the second operation fails and only one user row exists.

### INV-AUTH-002

Title: A provider account belongs to exactly one user

Statement:
The tuple `(
provider_id,
account_id
)` must identify exactly one canonical user.

What breaks if violated:

- One external identity can authenticate as multiple users.
- OAuth account linking becomes ambiguous and unsafe.

Enforcement:

- `DB`: unique index on `auth.accounts(provider_id, account_id)`.
- `App`: reject duplicate link attempts.

Verification:

- Attach `google / 123` to user A.
- Attempt to attach `google / 123` to user B.
- Assert failure and exactly one matching account row.

### INV-AUTH-003

Title: Sign-up is idempotent under retries and double submit

Statement:
A logically single sign-up attempt must create at most one user record and one primary login method.

What breaks if violated:

- Duplicate user rows.
- Orphan accounts or partial setup state.
- Flaky onboarding that only reproduces under latency or double-clicks.

Enforcement:

- `DB`: uniqueness on canonical identity keys.
- `App`: transactional create flow where possible.

Verification:

- Fire two concurrent sign-up requests for the same email.
- Assert one user row and one corresponding login method row exist.

### INV-AUTH-004

Title: Auth method boundaries are respected

Statement:
Only configured login methods for a user may authenticate that user.

What breaks if violated:

- OAuth-only accounts accidentally become password-loginable.
- Password accounts may bypass password verification.

Enforcement:

- `Auth`: BetterAuth provider separation.
- `App`: do not synthesize unsupported login paths.

Verification:

- Create a Google-only user and assert password sign-in fails.
- Create an email/password user and assert wrong password fails, correct password succeeds.

### INV-AUTH-005

Title: Verification artifacts are single-use and expiry-enforced

Statement:
OTP codes, magic links, and recovery tokens must be unusable after successful use or after expiry.

What breaks if violated:

- Recovery flows become replayable.
- Email ownership proofs can be reused after the fact.

Enforcement:

- `Auth`: BetterAuth verification semantics.
- `DB`: persisted expiry timestamps.

Verification:

- Use a verification token successfully once, then reuse it.
- Assert the second use fails.
- Repeat with an expired token and assert failure.

### INV-AUTH-006

Title: Protected routes require a validated session, not just cookie-shaped input

Statement:
Access to protected pages and protected mutations must require a valid server-recognized session.

What breaks if violated:

- Stale or forged cookie values may reach protected surfaces.
- Redirect loops and false-auth UX appear in production.

Enforcement:

- `Route`: validated session reads in layouts and pages.
- `App`: protected handlers re-check the session.

Verification:

- Request a protected page with no cookie, an invalid token, and a deleted-session token.
- Assert redirect or unauthorized in all cases.

---

## 6. Workspace Invariants

### INV-WS-001

Title: Workspace slugs are globally unique after canonicalization

Statement:
After slug normalization, each workspace slug must identify exactly one workspace.

What breaks if violated:

- Two workspaces can claim the same URL identity.
- Routing, links, and future billing/provider mappings become ambiguous.

Enforcement:

- `DB`: unique constraint on canonical slug value.
- `App`: normalize slug before insert and update.

Verification:

- Create slug `Acme`, then attempt `acme`.
- Assert the second create or update fails.

### INV-WS-002

Title: Workspace creation leaves the workspace manageable

Statement:
Creating a workspace must result in a workspace that has at least one admin membership and can be set active by the creator.

What breaks if violated:

- Orphan workspaces with no admin.
- Setup loops where the workspace exists but the user cannot enter it.

Enforcement:

- `App`: workspace creation and membership creation must be atomic.
- `Auth`: organization create flow must produce a creator membership.

Verification:

- Complete first-time signup/bootstrap.
- Assert one workspace exists, the creator is an admin member, and the session can set it active.

### INV-WS-003

Title: Only workspace members may read workspace-scoped surfaces

Statement:
Workspace settings, members, billing, and future workspace-scoped product data may only be read by members of that workspace.

What breaks if violated:

- Cross-tenant data leakage.
- Workspace metadata, member lists, or billing state becomes visible to unrelated users.

Enforcement:

- `App`: membership check on every workspace-scoped read.
- `Route`: active workspace must be validated against membership.

Verification:

- Create workspaces A and B.
- Sign in as a member of A.
- Request B's settings or members surface directly.
- Assert forbidden or not found.

### INV-WS-004

Title: Only admins may mutate workspace settings

Statement:
Workspace metadata such as name and slug may only be changed by an admin of that workspace.

What breaks if violated:

- Any member can rename the workspace or break workspace URLs.

Enforcement:

- `App`: admin authorization checks on update operations.

Verification:

- Sign in as a non-admin member and attempt to update workspace name or slug.
- Assert failure and unchanged persisted values.

### INV-WS-005

Title: A workspace must never end up with zero admins

Statement:
Every workspace must retain at least one admin membership.

What breaks if violated:

- The workspace becomes permanently unmanageable.
- No one can invite, update settings, or recover control through normal flows.

Enforcement:

- `App`: prevent removing or demoting the last admin.
- `DB`: optional check via transactional mutation logic if not expressible as a simple constraint.

Verification:

- Create a workspace with one admin.
- Attempt to remove or demote that admin before another admin exists.
- Assert failure.

---

## 7. Membership Invariants

### INV-MEM-001

Title: A user may have at most one membership per workspace

Statement:
The pair `(
user_id,
workspace_id
)` must be unique in `auth.memberships`.

What breaks if violated:

- Duplicate member rows.
- Ambiguous role resolution.
- Member UIs and analytics double-count users.

Enforcement:

- `DB`: unique index on `auth.memberships(user_id, workspace_id)`.

Verification:

- Accept the same invite twice or race two membership creates.
- Assert exactly one membership row exists.

### INV-MEM-002

Title: Membership roles are restricted to known values

Statement:
Membership role values must come from the supported role set for the system.

What breaks if violated:

- Permission checks may silently mis-handle unknown roles.
- Bad data can slip into authz logic and create unintended allow paths.

Enforcement:

- `DB`: check constraint or enum.
- `App`: validation before insert and update.

Verification:

- Attempt to create or update a membership with an invalid role.
- Assert validation failure and no persisted invalid row.

### INV-MEM-003

Title: Only admins may invite, remove, or change member roles

Statement:
Membership management operations are restricted to admins of the target workspace.

What breaks if violated:

- Members can escalate privileges.
- Members can remove legitimate admins.
- Outsiders can manipulate tenant access.

Enforcement:

- `App`: workspace admin checks on all membership mutations.

Verification:

- Sign in as a non-admin member.
- Attempt to invite a user, remove a user, or change a role.
- Assert forbidden.

### INV-MEM-004

Title: Removed members lose access immediately on their next request

Statement:
Once a membership is removed, the user must no longer be able to access that workspace on subsequent validated requests.

What breaks if violated:

- Former members retain access until logout.
- Stale sessions continue reading or mutating workspace data.

Enforcement:

- `Route`: validated workspace access checks.
- `App`: session context must not override current membership truth.

Verification:

- Remove a user from their active workspace.
- Refresh a protected page.
- Assert redirect to `/setup` or forbidden.

### INV-MEM-005

Title: Membership reads and writes are workspace-scoped

Statement:
An admin of workspace A may not list, inspect, remove, or modify memberships for workspace B.

What breaks if violated:

- Cross-tenant membership leakage.
- Admins in one tenant can manipulate another tenant's access control.

Enforcement:

- `App`: every membership operation must bind both actor and target to the same workspace.

Verification:

- Sign in as admin of A.
- Attempt to list or mutate members of B by tampering workspace IDs.
- Assert forbidden or not found.

### INV-MEM-006

Title: Users may not self-escalate their own role

Statement:
A user may not elevate their own membership role unless already authorized to perform that change.

What breaks if violated:

- Straightforward privilege escalation.
- Member becomes admin by editing their own membership payload.

Enforcement:

- `App`: explicit authorization rules for self-targeted mutations.

Verification:

- Sign in as a non-admin member.
- Attempt to change your own role to `admin`.
- Assert failure and unchanged role.

---

## 8. Session Invariants

### INV-SES-001

Title: Session tokens are unique and identify one user

Statement:
Each session token must resolve to exactly one user and one session record.

What breaks if violated:

- Session confusion or token aliasing.
- Audit trails and auth decisions become untrustworthy.

Enforcement:

- `DB`: unique constraint on `auth.sessions.token`.

Verification:

- Create sessions for two users.
- Assert distinct tokens and one-to-one resolution.

### INV-SES-002

Title: Expired sessions fail closed

Statement:
No protected route or mutation may succeed with an expired session.

What breaks if violated:

- Logged-out or expired users keep access.
- Session lifetime is not actually enforced.

Enforcement:

- `Auth`: BetterAuth session expiry.
- `App`: protected paths rely on validated session reads.

Verification:

- Backdate `expires_at` for a session.
- Hit a protected page or API with that token.
- Assert redirect or unauthorized.

### INV-SES-003

Title: Sign-out invalidates the session server-side

Statement:
Signing out must make the corresponding session unusable on the server, not merely clear client UI state.

What breaks if violated:

- Copied tokens or second tabs continue to work after sign-out.

Enforcement:

- `Auth`: BetterAuth sign-out deletes the session.
- `App`: protected routes do not trust stale client state.

Verification:

- Sign in and capture a valid session token.
- Sign out.
- Replay the token against a protected endpoint.
- Assert unauthorized.

### INV-SES-004

Title: Active workspace must belong to the session user

Statement:
`auth.sessions.active_workspace_id` must be null or reference a workspace the session user currently belongs to.

What breaks if violated:

- Users can pivot into other tenants by setting a foreign active workspace.
- Protected pages may render data for a workspace the user does not belong to.

Enforcement:

- `App`: set-active operations must verify membership.
- `Route`: active workspace use must be backed by current membership.

Verification:

- Sign in as a member of workspace A.
- Attempt to set active workspace to B.
- Assert failure and unchanged active workspace.

### INV-SES-005

Title: Losing membership invalidates stale active workspace context

Statement:
If a user loses membership in their active workspace, subsequent validated requests must not continue using that workspace context.

What breaks if violated:

- Removed members keep acting inside a workspace through stale session state.

Enforcement:

- `Route`: revalidate active workspace against current membership.
- `App`: clear or reject invalid active workspace state.

Verification:

- Set active workspace.
- Remove the user's membership.
- Request a protected route.
- Assert redirect to `/setup`, cleared context, or forbidden.

### INV-SES-006

Title: Middleware uses negative evidence only

Statement:
Middleware may conclude a request is anonymous if there is definitely no BetterAuth session cookie, but it may not conclude a request is authenticated merely because a cookie is present.

What breaks if violated:

- False-auth redirect loops such as `/sign-in -> /setup`.
- Stale or malformed cookies cause broken navigation.

Enforcement:

- `Route`: conservative middleware policy.
- `Test`: table-driven middleware policy tests.

Verification:

- Request `/sign-in` with a bogus or deleted session cookie.
- Assert middleware allows the request through and validated route logic treats the user as signed out.

### INV-SES-007

Title: Auth entry routes preserve intended post-auth destination

Statement:
When middleware redirects an anonymous user to sign-in, it must preserve the originally requested URL in `redirectTo`.

What breaks if violated:

- Invite links and deep links land in the wrong place after auth.
- Users get sent to a default page instead of the workflow they started from.

Enforcement:

- `Route`: middleware redirect construction.

Verification:

- Request `/accept-invitation?invitationId=...` anonymously.
- Assert redirect goes to `/sign-in?redirectTo=...original url...`.

---

## 9. Invitation Invariants

### INV-INV-001

Title: Only workspace admins may create invitations for that workspace

Statement:
Invitation creation is restricted to admins of the target workspace.

What breaks if violated:

- Outsiders or regular members can grant workspace access.

Enforcement:

- `App`: admin authorization on invite creation.

Verification:

- Sign in as a non-admin or non-member.
- Attempt to create an invite.
- Assert forbidden.

### INV-INV-002

Title: There is at most one pending invitation per workspace and canonical email

Statement:
At any given time, a workspace may have at most one pending invitation for a canonicalized email address.

What breaks if violated:

- Duplicate invite flows.
- Ambiguous accept/reject behavior.
- Duplicate membership races become easier to trigger.

Enforcement:

- `DB`: partial unique constraint if supported by the chosen model.
- `App`: canonicalize email and reject duplicate pending invites.

Verification:

- Invite `User@example.com`.
- Attempt to invite `user@example.com` to the same workspace while the first invite is pending.
- Assert failure or deterministic replacement, but never two pending invites.

### INV-INV-003

Title: Invitation acceptance requires identity match

Statement:
An invitation may only be accepted by a signed-in user whose canonical email matches the invitation email.

What breaks if violated:

- One user can claim another user's invite and join their workspace.

Enforcement:

- `App`: invite acceptance checks signed-in user email against invite email.

Verification:

- Invite `alice@example.com`.
- Sign in as `bob@example.com`.
- Attempt to accept the invitation.
- Assert failure and no membership created.

### INV-INV-004

Title: Expired invitations may not be accepted

Statement:
An invitation with `expires_at` in the past must never produce a membership.

What breaks if violated:

- Old emailed links stay valid indefinitely.

Enforcement:

- `App`: expiry check during invitation acceptance.
- `DB`: persisted expiry timestamp.

Verification:

- Create an invitation with past expiry.
- Attempt acceptance as the matching user.
- Assert failure and no membership.

### INV-INV-005

Title: Invitation status follows a strict state machine

Statement:
Invitation status must use only supported values and may only transition along allowed paths.

Allowed values:

- `pending`
- `accepted`
- `rejected`
- `canceled`

Allowed transitions:

- `pending -> accepted`
- `pending -> rejected`
- `pending -> canceled`

Terminal states:

- `accepted`
- `rejected`
- `canceled`

What breaks if violated:

- Accepted invites can be re-used.
- Invalid states create branching bugs in the UI and authz logic.

Enforcement:

- `DB`: check constraint or enum for allowed values.
- `App`: reject invalid transitions.

Verification:

- Accept an invite, then try to accept, reject, or cancel it again.
- Assert failure and unchanged final status.

### INV-INV-006

Title: Invitation acceptance is atomic

Statement:
Accepting an invitation must either produce both `membership created` and `invitation marked accepted`, or neither.

What breaks if violated:

- User joins a workspace while invite remains pending.
- Invite becomes accepted while no membership exists.

Enforcement:

- `DB`: transactional mutation.
- `App`: accept flow must commit as one unit.

Verification:

- Accept an invite.
- Assert exactly one new membership row exists and the invitation status is `accepted` in the same outcome.

### INV-INV-007

Title: Invitation acceptance is idempotent under retries and concurrency

Statement:
Retrying or racing invitation acceptance must not create duplicate memberships or inconsistent invitation state.

What breaks if violated:

- Double-clicks create duplicate memberships.
- Invitation state becomes nondeterministic.

Enforcement:

- `DB`: uniqueness on memberships.
- `App`: accept flow handles duplicate acceptance safely.

Verification:

- Fire two concurrent accept requests for the same invitation.
- Assert one membership row and one final accepted invitation.

### INV-INV-008

Title: Existing members may not gain duplicate access through invitations

Statement:
Accepting an invitation for a workspace the user already belongs to must not create a duplicate membership or silently rewrite authorization state.

What breaks if violated:

- Duplicate memberships.
- Role confusion if invite role and current membership role differ.

Enforcement:

- `DB`: unique membership constraint.
- `App`: accept flow handles existing membership explicitly.

Verification:

- Create membership first.
- Attempt to accept a new invite for the same workspace and email.
- Assert failure or no-op, but never a second membership row.

### INV-INV-009

Title: Closed invitations stay closed

Statement:
Rejected or canceled invitations must not later be accepted.

What breaks if violated:

- Users can revive closed access grants from old links.

Enforcement:

- `App`: terminal-state checks in accept flow.

Verification:

- Reject or cancel an invitation.
- Attempt to accept it later.
- Assert failure and no membership.

### INV-INV-010

Title: Invitation lookup does not leak privileged workspace data to unrelated users

Statement:
Viewing or probing an invitation may reveal only the minimum information required for the intended recipient flow.

What breaks if violated:

- Invitation ID enumeration leaks workspace names, slugs, or membership data to unrelated users.

Enforcement:

- `App`: invitation reads and accept flow expose only intended invitation metadata.

Verification:

- Sign in as an unrelated user.
- Open another user's invitation ID.
- Assert generic failure or minimally-scoped response, with no broader workspace/member data.

---

## 10. Billing Invariants

### INV-BIL-001

Title: A workspace has at most one billing customer per provider

Statement:
For a given workspace and billing provider, there must be at most one persisted customer linkage row.

What breaks if violated:

- Checkout and portal routing become ambiguous.
- Webhook events may attach to the wrong local billing principal.
- Duplicate remote customer creation becomes easier to trigger under retries or races.

Enforcement:

- `DB`: unique constraint on `(workspace_id, provider)`.
- `App`: customer-ensure flow must race safely.

Verification:

- Fire two concurrent customer-ensure operations for the same workspace.
- Assert one local customer row and deterministic winner selection.

### INV-BIL-002

Title: Billing state resolves to exactly one logical plan for a workspace at a time

Statement:
At any moment, a workspace must resolve to exactly one logical billing state: `hobby`, `pro`, or `ultra`.

What breaks if violated:

- Billing UI can show contradictory plan badges.
- Entitlement checks become nondeterministic.
- Canceled historical rows can override currently active paid state.

Enforcement:

- `DB`: subscription rows remain identifiable and queryable by workspace.
- `App`: billing-state derivation must prefer the current active paid subscription over inactive history.

Verification:

- Create a workspace with one active paid subscription and one newer canceled row.
- Assert derived billing state still resolves to the active paid plan.

### INV-BIL-003

Title: Stripe price IDs map to exactly one logical paid plan and plan version

Statement:
Every recognized Stripe `price_id` must resolve deterministically to one logical paid plan and one plan version.

What breaks if violated:

- Price rotations strand existing subscribers.
- Two different plans can accidentally share one provider artifact.
- Plan/entitlement history becomes impossible to reason about.

Enforcement:

- `App`: versioned plan catalog maps `price_id -> plan + version`.
- `Test`: package tests cover current and legacy price mappings.

Verification:

- Resolve a current `pro` price, a current `ultra` price, and one legacy recognized price.
- Assert each resolves to exactly one logical plan/version pair.

### INV-BIL-004

Title: Hosted billing routes are workspace-scoped and member-only

Statement:
Checkout and portal entrypoints may only operate on a workspace the signed-in user belongs to.

What breaks if violated:

- One workspace member can trigger billing flows for another workspace.
- Unrelated users may open portal or checkout sessions for foreign accounts.

Enforcement:

- `Route`: handlers require a validated session.
- `App`: handlers verify workspace membership before creating hosted sessions.

Verification:

- Attempt checkout and portal creation anonymously, as a non-member, and as a valid member.
- Assert only the valid member path succeeds.

### INV-BIL-005

Title: Client input may request checkout but may not set subscription truth

Statement:
Dashboard requests may choose from the allowed checkout plans, but may never directly set subscription `plan`, `status`, or billing period fields.

What breaks if violated:

- Users can forge paid status without Stripe.
- Local billing state stops being trustworthy.

Enforcement:

- `Route`: checkout handlers accept only an allowed paid plan selector.
- `App`: subscription writes originate only from trusted Stripe webhook processing.

Verification:

- Send a forged dashboard request attempting to write `status=active` or `plan=ultra` directly.
- Assert rejection and unchanged local subscription state.

### INV-BIL-006

Title: Subscription state is derived from authenticated Stripe webhook data

Statement:
Persisted paid subscription state must come from authenticated Stripe webhook payloads, not from redirect callbacks, browser state, or dashboard form input.

What breaks if violated:

- Redirect tampering can create fake upgrades.
- Local state can diverge from the provider of record.

Enforcement:

- `App`: webhook handler verifies Stripe signatures before sync.
- `Test`: route and package tests prove non-webhook surfaces cannot mutate subscription truth.

Verification:

- Attempt to mutate subscription state without a valid webhook signature.
- Assert failure and no paid state change.

### INV-BIL-007

Title: Webhook processing is idempotent under retries and duplicate delivery

Statement:
Replaying the same Stripe subscription event must not create duplicate local subscription rows or inconsistent final state.

What breaks if violated:

- Retry deliveries create duplicate subscriptions.
- Billing state becomes order-dependent and flaky.

Enforcement:

- `DB`: unique constraint on provider subscription identity.
- `App`: webhook sync uses deterministic upsert semantics.

Verification:

- Deliver the same `customer.subscription.updated` event twice.
- Assert one local subscription row and stable final values.

### INV-BIL-008

Title: Billing degrades safely when Stripe is unconfigured

Statement:
Missing Stripe configuration must disable billing functionality cleanly without breaking auth, workspace creation, or workspace settings access.

What breaks if violated:

- Local development and tests fail at startup.
- Workspace management becomes coupled to provider configuration.

Enforcement:

- `App`: billing UI and routes expose explicit unconfigured behavior.
- `Route`: non-billing flows do not depend on Stripe secrets being present.

Verification:

- Run the app without Stripe envs.
- Assert auth and workspace flows still work and billing surfaces render an unconfigured state instead of crashing.

### INV-BIL-009

Title: Recognized legacy Stripe prices continue to resolve to the correct logical plan

Statement:
After price changes, previously-issued Stripe price IDs that the template still recognizes must continue to resolve to the same logical plan family.

What breaks if violated:

- Grandfathered subscribers fall back to `hobby` incorrectly.
- Old paid subscribers disappear from local billing state after price rotations.

Enforcement:

- `App`: plan catalog retains recognized legacy price mappings.
- `Test`: billing package tests cover legacy-price resolution and webhook sync for old prices.

Verification:

- Replay a webhook for a legacy recognized `pro` or `ultra` price.
- Assert the workspace still resolves to the correct logical paid plan.

---

## 11. Entitlement Invariants

### INV-ENT-001

Title: Plan and plan version resolve to exactly one entitlement set

Statement:
For any recognized `(plan, plan_version)` pair, entitlement resolution must be deterministic and return exactly one entitlement set.

What breaks if violated:

- Feature access becomes nondeterministic.
- Limits may vary for the same subscriber without any billing change.

Enforcement:

- `App`: static entitlement matrix keyed by plan version and plan.
- `Test`: pure entitlement resolution tests.

Verification:

- Resolve entitlements for the same `(plan, version)` pair multiple times.
- Assert the resulting values are identical.

### INV-ENT-002

Title: A workspace resolves to exactly one effective entitlement set at a time

Statement:
At any moment, a workspace must resolve to exactly one effective entitlement set derived from its current logical billing state.

What breaks if violated:

- UI and API may disagree about available features.
- A workspace can appear to have contradictory limits.

Enforcement:

- `App`: workspace entitlement resolution uses one billing state result.
- `Test`: workspace entitlement tests cover hobby fallback and active paid plans.

Verification:

- Resolve entitlements for a hobby workspace, then for the same workspace with an active paid subscription.
- Assert each state produces one coherent entitlement set.

### INV-ENT-003

Title: Server-side entitlement enforcement is authoritative

Statement:
Client UI may hide or disable features, but only server-side entitlement checks may authorize protected actions.

What breaks if violated:

- Users can bypass UI gating and invoke restricted actions directly.

Enforcement:

- `App`: server handlers use `check()` or `consume()` before protected writes.
- `Route`: routes do not trust client-provided entitlement state.

Verification:

- Attempt a protected action through a direct request while the client would normally hide it.
- Assert the server still rejects it.

### INV-ENT-004

Title: Stock limits are enforced against canonical resource state

Statement:
Stock limits such as projects or members must be enforced against canonical resource tables, not against drift-prone shadow counters.

What breaks if violated:

- Entitlement usage can drift from the real owned resources.
- Valid creates can be blocked or invalid creates allowed.

Enforcement:

- `App`: stock-limit checks run inside the same transaction as the guarded write.
- `DB`: canonical resource tables remain the source of truth for current stock counts.

Verification:

- Simulate a create at the stock limit boundary.
- Assert the create is rejected based on canonical count, not a stale side counter.

### INV-ENT-005

Title: Quota resets follow billing period boundaries deterministically

Statement:
Quota-style entitlements must reset according to the billing period boundary and update when the billing period changes.

What breaks if violated:

- Quotas can stay exhausted after renewal.
- Upgrades or downgrades can leave reset windows inconsistent with the active subscription.

Enforcement:

- `App`: quota usage tracks `reset_at` from the billing period end.
- `DB`: quota rows store reset timestamps explicitly.

Verification:

- Advance a quota row past `reset_at` and assert lazy reset behavior.
- Change the billing period end and assert subsequent quota checks use the new boundary.

### INV-ENT-006

Title: Downgrades do not delete existing resources, but block further expansion past the new limit

Statement:
When a workspace downgrades below its current stock usage, existing resources remain, but any further expansion beyond the new cap must fail.

What breaks if violated:

- Downgrades become destructive.
- Over-limit downgraded workspaces can continue growing indefinitely.

Enforcement:

- `App`: stock limit checks compare future growth against the new cap.
- `Test`: pure and integration tests cover over-limit downgrade behavior.

Verification:

- Start with usage allowed on a higher plan.
- Downgrade to a lower plan below current usage.
- Assert existing usage remains represented, but another create is rejected.

### INV-ENT-007

Title: Unknown entitlement inputs fail closed

Statement:
Unknown entitlement IDs, unknown plans, or unknown plan versions must fail closed rather than silently returning permissive defaults.

What breaks if violated:

- Typos or catalog drift can accidentally grant access.
- Old and new code paths may disagree silently.

Enforcement:

- `App`: entitlement resolution throws for unknown identifiers.
- `Test`: package tests exercise unknown inputs explicitly.

Verification:

- Attempt to resolve an unknown plan version or entitlement ID.
- Assert an explicit failure rather than a permissive fallback.

---

## 12. Verification Strategy

These invariants should be covered in three layers.

### Database and transaction tests

Use these for:

- uniqueness
- referential integrity
- role and status value restrictions
- transaction atomicity

### BetterAuth integration tests

Use these for:

- sign-up and sign-in behavior
- session lifecycle
- active workspace behavior
- invitation acceptance

### Route and policy tests

Use these for:

- middleware semantics
- protected route redirects
- redirect preservation via `redirectTo`
- workspace bootstrap behavior

### Provider and webhook tests

Use these for:

- Stripe signature verification
- price-to-plan resolution
- webhook retry idempotency
- legacy-price compatibility

### Entitlement tests

Use these for:

- pure plan/version entitlement resolution
- fail-closed behavior for unknown IDs or versions
- downgrade expansion checks
- quota reset semantics

When an invariant is especially important, cover it in more than one layer.
