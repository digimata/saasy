---
path: projects/saasy/docs/decisions/001-betterauth.md
outline: |
  • ADR-001 :: BetterAuth over Clerk/WorkOS      L11
    ◦ 1. Decision                                L19
    ◦ 2. Rationale                               L26
    ◦ 3. Design Implications                     L43
    ◦ 4. When to Revisit                         L51
---

# ADR-001 :: BetterAuth over Clerk/WorkOS

Last updated: `2026.04.04`

> We use BetterAuth (open-source, MIT) for authentication instead of hosted services like Clerk or WorkOS. BetterAuth runs embedded in the Next.js app, gives us full control over the identity schema, and avoids per-MAU pricing that scales poorly.

---

## 1. Decision

- Use BetterAuth as the auth provider for all Next.js dashboard apps built from this template.
- BetterAuth handles session management, OAuth provider callbacks, email/password, and wallet (SIWE) login.
- The canonical identity data model (`auth.users`, `auth.accounts`, etc.) is ours — BetterAuth is wired to it via its Drizzle adapter, not the other way around.
- BetterAuth's organization plugin maps to our `auth.workspaces` and `auth.members` tables via `modelName` remapping.

## 2. Rationale

**Considered:**
- **Clerk** — Polished hosted auth. Per-MAU pricing (\$0.02/MAU after 10K). No schema control — Clerk owns the user table. Vendor lock-in on a core identity primitive.
- **WorkOS** — Enterprise SSO focus. Good for SAML/SCIM. Overkill for MVP. Expensive at scale.
- **NextAuth / Auth.js** — Mature, widely used. But v5 has been in beta for a long time, adapter ecosystem is fragmented, and it doesn't have built-in org/workspace support.
- **Roll our own** — Maximum control, maximum effort. Not justified when BetterAuth covers the same ground with less code.

**Why BetterAuth:**
- Open-source (MIT), 27k+ stars, active development.
- First-class Drizzle adapter — maps directly to our schema.
- Organization plugin handles workspace/member/invite flows out of the box.
- SIWE plugin for wallet login.
- 2FA (TOTP) plugin.
- No per-MAU costs. Runs in our infra.
- Session management, CSRF, rate limiting built in.

## 3. Design Implications

- Auth routes live at `/api/auth/[...all]` — a single catch-all handler.
- BetterAuth's internal model names must be remapped to our table names in the adapter config.
- Custom PG schema (`auth.*`) requires `search_path` on the connection string since BetterAuth's CLI doesn't natively support `pgSchema()`.
- If BetterAuth's organization plugin doesn't map cleanly to our workspace model, we bypass the plugin and manage workspaces directly via Drizzle.
- OAuth secrets are env vars — no hosted dashboard to manage them.

## 4. When to Revisit

- If BetterAuth development stalls or the project is abandoned.
- If we need enterprise SSO (SAML/SCIM) and BetterAuth's SSO plugin doesn't cover it — WorkOS becomes relevant.
- If we need to support a mobile app with native auth flows that BetterAuth can't handle.
