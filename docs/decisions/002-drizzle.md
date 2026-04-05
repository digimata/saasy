---
path: projects/saasy/docs/decisions/002-drizzle.md
outline: |
  • ADR-002 :: Drizzle over Prisma      L11
    ◦ 1. Decision                       L19
    ◦ 2. Rationale                      L26
    ◦ 3. Design Implications            L42
    ◦ 4. When to Revisit                L49
---

# ADR-002 :: Drizzle over Prisma

Last updated: `2026.04.04`

> We use Drizzle ORM for database access and schema management. Drizzle gives us full control over the schema definition (including custom PG schemas), generates clean SQL, and works well with BetterAuth's adapter.

---

## 1. Decision

- Use Drizzle ORM as the database layer for all packages in the monorepo.
- Schema is defined in `packages/db/src/schema.ts` — this is the single source of truth for types and migrations.
- Use `drizzle-kit` for migration generation and execution.
- Use `postgres` (postgres.js) as the PG driver — no native bindings.

## 2. Rationale

**Considered:**

- **Prisma** — More mature ecosystem, better docs. But: generates a client from a `.prisma` schema file (separate from TypeScript), custom PG schemas require workarounds, heavier runtime (Rust query engine binary), and the schema file is a second source of truth alongside TypeScript types.
- **Kysely** — Lightweight query builder with good type inference. But: no schema definition or migration tooling — you'd need a separate migration tool. BetterAuth internally uses Kysely, but that's an implementation detail.

**Why Drizzle:**

- Schema defined in TypeScript — types are inferred directly from table definitions (`InferSelectModel`, `InferInsertModel`).
- `pgSchema()` lets us define tables in custom PG schemas (`auth.*`, `billing.*`).
- Lightweight — no generated client, no binary runtime.
- `drizzle-kit` handles migration generation from schema diffs.
- BetterAuth has a first-class Drizzle adapter.
- Query builder is SQL-like — less abstraction, fewer surprises.

## 3. Design Implications

- All table types are derived from the schema — no manual type definitions.
- Packages that need DB access import from `@repo/db`.
- Migration workflow: edit schema → `pnpm db:generate` → `pnpm db:migrate`.
- No Prisma client generation step in the build pipeline.

## 4. When to Revisit

- If Drizzle's migration tooling proves unreliable for complex schema changes.
- If we need features Prisma handles better (e.g., interactive transactions with retry, Prisma Accelerate for connection pooling at edge).
