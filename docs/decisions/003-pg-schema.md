---
path: projects/saasy/docs/decisions/003-pg-schema.md
outline: |
  • ADR-003 :: Custom PG schema via search_path      L11
    ◦ 1. Decision                                    L19
    ◦ 2. Rationale                                   L26
    ◦ 3. Design Implications                         L32
    ◦ 4. When to Revisit                             L39
---

# ADR-003 :: Custom PG schema via search_path

Last updated: `2026.04.04`

> Auth tables live in `auth.*`, not `public.*`. This is enforced at the Drizzle level via `pgSchema("auth")` and at runtime via `search_path` on the connection string. This keeps auth, billing, and app data cleanly separated in the same database.

---

## 1. Decision

- All identity/auth tables use `pgSchema("auth")` in the Drizzle schema.
- The database connection string includes `?options=-c search_path=auth,public` so BetterAuth's internal Kysely queries resolve to the correct schema at runtime.
- Future billing tables will use `pgSchema("billing")`.
- App-specific tables use `public.*` or a custom schema per project.

## 2. Rationale

- PG schemas provide namespace isolation without requiring separate databases. Auth, billing, and app data share one connection but don't collide.
- `search_path` is the cleanest way to make BetterAuth (which doesn't natively support `pgSchema()` in its CLI) work with non-public schemas. BetterAuth's `npx auth generate` emits `pgTable()` instead of `pgSchema().table()`, so we maintain the Drizzle schema manually — but this is fine since we own the schema definition.
- Separate databases would add operational overhead (connection management, cross-DB joins impossible) for minimal benefit at our scale.

## 3. Design Implications

- Every connection string must include the `search_path` option — this is set in the env files.
- BetterAuth's CLI-generated schema output (`npx auth generate`) needs manual editing to use `pgSchema("auth")` — don't blindly accept its output.
- Migrations created by `drizzle-kit` will correctly target the `auth` schema because the Drizzle schema definition uses `pgSchema()`.
- The `CREATE SCHEMA auth` must be run before the first migration. Include it in the migration setup or as a prerequisite.

## 4. When to Revisit

- If BetterAuth adds native `pgSchema()` support in its CLI (tracked in GitHub issue #6606) — we could simplify the setup.
- If cross-schema foreign keys cause issues with BetterAuth's internal queries.
- If we move to a multi-database setup for billing isolation at scale.
