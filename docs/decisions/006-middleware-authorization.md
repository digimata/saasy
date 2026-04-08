---
path: projects/saasy/docs/decisions/006-middleware-authorization.md
outline: |
  • ADR-006 :: Negative-evidence middleware and validated-session authorization      L11
    ◦ 1. Decision                                                                    L19
    ◦ 2. Rationale                                                                   L29
    ◦ 3. Design Implications                                                         L39
    ◦ 4. When to Revisit                                                             L56
---

# ADR-006 :: Negative-evidence middleware and validated-session authorization

Last updated: `2026.04.07`

> Middleware is allowed to act only on negative evidence. Positive authentication, active-workspace validity, membership, and role checks belong to server code that validates the session and then checks the database.

---

## 1. Decision

- Edge middleware may use negative evidence only.
- In practice, this means middleware may treat the absence of a BetterAuth session cookie as anonymous, but may not treat the presence of that cookie as proof of authentication.
- Middleware may protect obviously private routes by redirecting requests that are definitely unauthenticated.
- Middleware may not make positive auth decisions, workspace-bootstrap decisions, membership decisions, or role-based authorization decisions.
- Positive auth decisions happen only after validating the session through BetterAuth.
- Workspace-scoped authorization happens only after validating the session and then checking the relevant workspace membership/role in application code.
- Route handlers and server-rendered surfaces may not trust `activeOrganizationId` by itself; they must verify that the session user still belongs to that workspace.

## 2. Rationale

- Session cookies are weak evidence. Presence can indicate a stale, invalid, or no-longer-authorized session.
- Middleware runs too early and with too little context to safely answer questions like:
  - is this session still valid?
  - does this user still belong to the active workspace?
  - should this user go to `/`, `/onboard`, or `/settings`?
- The earlier auth regressions came from exactly this confusion: middleware made optimistic decisions from cookie-shaped input and masked the real validated-session state.
- Keeping middleware conservative makes the system easier to reason about and lines up with the session and membership invariants already in the spec.

## 3. Design Implications

- Middleware may:
  - redirect definitely anonymous users away from protected routes
  - preserve `redirectTo`
  - avoid unnecessary work on public routes
- Middleware may not:
  - redirect authenticated users based only on cookie presence
  - decide whether a user has completed workspace setup
  - decide whether an active workspace is still valid
  - decide whether the user may access another workspace's route or API
- Server components, route handlers, and layout guards must:
  - validate the session with BetterAuth
  - resolve the active workspace from validated session state
  - check membership and role in the DB before privileged reads or writes
- Auth and billing APIs should share the same discipline: validate session first, then verify workspace scope in the DB, then perform the action.

## 4. When to Revisit

- If session validation becomes available and trustworthy at the edge with the same semantics as the server runtime.
- If the app architecture changes away from BetterAuth cookies and server-validated session reads.
- If route-level authorization moves to a dedicated policy layer that can safely run with validated identity at the middleware boundary.
