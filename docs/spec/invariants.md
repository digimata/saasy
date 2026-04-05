---
path: projects/saasy/docs/spec/invariants.md
outline: |
  • System Invariants                        L55
    ◦ Summary                                L61
    ◦ 1. Purpose and Scope                  L102
    ◦ 2. How to Use This Spec               L114
    ◦ 3. ID Scheme                          L137
    ◦ 4. Enforcement Layers                 L153
    ◦ 5. Auth Invariants                    L167
      ▪ INV-AUTH-001                        L169
      ▪ INV-AUTH-002                        L192
      ▪ INV-AUTH-003                        L218
      ▪ INV-AUTH-004                        L241
      ▪ INV-AUTH-005                        L263
      ▪ INV-AUTH-006                        L286
    ◦ 6. Workspace Invariants               L310
      ▪ INV-WS-001                          L312
      ▪ INV-WS-002                          L334
      ▪ INV-WS-003                          L356
      ▪ INV-WS-004                          L380
      ▪ INV-WS-005                          L400
    ◦ 7. Membership Invariants              L425
      ▪ INV-MEM-001                         L427
      ▪ INV-MEM-002                         L452
      ▪ INV-MEM-003                         L474
      ▪ INV-MEM-004                         L497
      ▪ INV-MEM-005                         L520
      ▪ INV-MEM-006                         L542
    ◦ 8. Session Invariants                 L566
      ▪ INV-SES-001                         L568
      ▪ INV-SES-002                         L589
      ▪ INV-SES-003                         L612
      ▪ INV-SES-004                         L635
      ▪ INV-SES-005                         L658
      ▪ INV-SES-006                         L681
      ▪ INV-SES-007                         L703
    ◦ 9. Invitation Invariants              L726
      ▪ INV-INV-001                         L728
      ▪ INV-INV-002                         L749
      ▪ INV-INV-003                         L773
      ▪ INV-INV-004                         L795
      ▪ INV-INV-005                         L817
      ▪ INV-INV-006                         L858
      ▪ INV-INV-007                         L880
      ▪ INV-INV-008                         L902
      ▪ INV-INV-009                         L925
      ▪ INV-INV-010                         L946
    ◦ 10. Verification Strategy             L969
      ▪ Database and transaction tests      L973
      ▪ BetterAuth integration tests        L982
      ▪ Route and policy tests              L991
---

# System Invariants

Last updated: `2026.04.04`

> Stable correctness contracts for the Saasy control plane. These invariants define the security boundaries, uniqueness rules, referential integrity guarantees, and state-machine rules that must hold for auth, workspaces, memberships, sessions, and invitations.

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

## 10. Verification Strategy

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

When an invariant is especially important, cover it in more than one layer.
