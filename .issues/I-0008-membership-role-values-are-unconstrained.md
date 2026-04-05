---
id: I-0008
title: "Membership role values are unconstrained"
status: reported
severity: degraded
labels: [memberships, authz, invariants]
---

## Symptom

Membership roles can be updated to arbitrary string values such as `superadmin`.

## Invariant

- `INV-MEM-002` — Membership roles are restricted to known values.

## Expected behavior

Membership role writes should accept only supported roles for the system.

For the current template surface, that should at minimum be a bounded set such as:

- `admin`
- `member`
- `owner` only if intentionally supported

Unknown roles should be rejected at validation or storage boundaries.

## Actual behavior

`organization.updateMemberRole` successfully persists arbitrary role strings.

Observed example:

```text
role: superadmin
```

## Evidence

- Failing invariant test: `apps/web/tests/invariants/memberships.test.ts`
- Test case: `INV-MEM-002 rejects invalid membership role values`

Observed result:

```text
updateMemberRole(...) resolved successfully
persisted role: superadmin
```

## Likely cause

The current schema stores `auth.memberships.role` as unconstrained `text`, and the app/plugin path does not currently validate role values against a closed set.

## Production risk

- Authorization checks can drift or fail open for unknown roles.
- UI and policy code may make assumptions that no longer hold once arbitrary roles exist in the database.
- This is a latent privilege-escalation and policy-consistency problem.

## Reproduction

1. Create a workspace with an admin and a normal member.
2. As the admin, call `organization.updateMemberRole` for the member with role `superadmin`.
3. Observe that the update succeeds.
4. Inspect `auth.memberships.role` and see `superadmin` persisted.
