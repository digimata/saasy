---
id: I-0007
title: "Workspace slug uniqueness is not canonicalized"
status: reported
severity: degraded
labels: [workspaces, integrity, invariants]
---

## Symptom

The system allows two workspaces whose slugs differ only by case.

Examples that can coexist today:

- `Acme-1234`
- `acme-1234`

## Invariant

- `INV-WS-001` — Workspace slugs are globally unique after canonicalization.

## Expected behavior

After slug normalization, a workspace slug should identify exactly one workspace.

Creating or updating a workspace to a slug that collides case-insensitively with an existing slug should fail.

## Actual behavior

Workspace creation succeeds for mixed-case collisions because uniqueness is enforced on raw `text`, not on a canonicalized slug value.

## Evidence

- Failing invariant test: `apps/web/tests/invariants/workspaces.test.ts`
- Test case: `INV-WS-001 rejects slug collisions after canonicalization`

Observed behavior:

```text
first workspace created with slug: Acme-<suffix>
second workspace created with slug: acme-<suffix>
```

## Likely cause

The current schema enforces:

- `auth.workspaces.slug UNIQUE`

but PostgreSQL `text` uniqueness is case-sensitive by default.

The application also does not currently canonicalize every workspace slug on write.

## Production risk

- Two workspaces can claim effectively the same URL identity.
- Routing, link generation, and future provider/customer mappings can become ambiguous.
- This creates avoidable tenant-identity confusion in production.

## Reproduction

1. Sign up user 1 and create workspace slug `Acme-1234`.
2. Sign up user 2 and create workspace slug `acme-1234`.
3. Observe that both workspace creates succeed.
