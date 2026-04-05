---
id: I-0006
title: "Removing a member leaves stale active workspace context in their session"
status: reported
severity: degraded
labels: [sessions, workspaces, invariants]
---

## Symptom

When an admin removes a user from a workspace, the removed user's session can continue to carry that workspace as `activeOrganizationId`.

## Invariant

- `INV-SES-005` — Losing membership invalidates stale active workspace context.

## Expected behavior

After membership removal, the removed user's next validated session lookup should not retain the removed workspace as active context.

Expected outcomes:

- `activeOrganizationId` is cleared to `null`, or
- the session is otherwise forced out of that workspace context.

## Actual behavior

After admin-driven member removal, `auth.api.getSession({ disableCookieCache: true })` still returns the removed workspace as `activeOrganizationId` for the removed user.

## Evidence

- Failing invariant test: `apps/web/tests/invariants/sessions.test.ts`
- Test case: `INV-SES-005 clears stale active workspace context after membership removal`

Observed assertion failure:

```text
expected activeOrganizationId to be null
received: <removed workspace id>
```

## Likely cause

BetterAuth's organization plugin clears `activeOrganizationId` only when a user removes themselves.

In the upstream route implementation:

- `crud-members.mjs` clears active organization only when `session.user.id === toBeRemovedMember.userId`

That means admin-driven removal of another user does not clear the removed user's session state.

## Production risk

- Removed users can retain stale tenant context in session state.
- Route guards or downstream logic that trust `activeOrganizationId` too early can misbehave.
- This is a cross-tenant safety footgun even if subsequent membership checks block some actions.

## Reproduction

1. Create workspace A as user 1.
2. Invite user 2 and accept the invitation.
3. Confirm user 2 has workspace A as active organization.
4. As user 1, remove user 2 from workspace A.
5. Read user 2's session via validated lookup.
6. Observe that `activeOrganizationId` is still workspace A.
