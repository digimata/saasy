---
path: projects/saasy/docs/decisions/003-pg-schema.md
outline: |
  • ADR-003 :: Custom PG schemas via Drizzle pgSchema   L11
    ◦ 1. Decision                                       L19
    ◦ 2. Rationale                                      L25
    ◦ 3. Design Implications                            L30
    ◦ 4. When to Revisit                                L36
---

# ADR-003 :: Custom PG schemas via Drizzle pgSchema

Last updated: `2026.04.09`

> Auth tables live in `auth.*`, billing in `billing.*`, not `public.*`. Enforced at the Drizzle level via `pgSchema("auth")` and `pgSchema("billing")`. No `search_path` required — the Drizzle adapter generates fully qualified queries (`"auth"."users"`, etc.).

---

## 1. Decision

- All identity/auth tables use `pgSchema("auth")` in the Drizzle schema.
- All billing tables use `pgSchema("billing")`.
- No `search_path` on the connection string — Drizzle always emits schema-qualified SQL.
- BetterAuth's Drizzle adapter resolves tables through the schema map we provide, so all runtime queries are schema-qualified.

## 2. Rationale

- PG schemas provide namespace isolation without requiring separate databases. Auth, billing, and app data share one connection but don't collide.
- BetterAuth's `npx auth generate` emits `pgTable()` instead of `pgSchema().table()`, so we maintain the Drizzle schema manually — but this is fine since we own the schema definition.
- Separate databases would add operational overhead (connection management, cross-DB joins impossible) for minimal benefit at our scale.

## 3. Design Implications

- BetterAuth's CLI-generated schema output (`npx auth generate`) needs manual editing to use `pgSchema("auth")` — don't blindly accept its output.
- Migrations created by `drizzle-kit` will correctly target the `auth`/`billing` schemas because the Drizzle schema definition uses `pgSchema()`.
- The `CREATE SCHEMA auth` and `CREATE SCHEMA billing` must exist before the first migration. The initial Drizzle migration handles this.

## 4. When to Revisit

- If BetterAuth adds native `pgSchema()` support in its CLI — we could simplify the setup.
- If we move to a multi-database setup for billing isolation at scale.
