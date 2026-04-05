---
path: projects/saasy/docs/ARCHITECTURE.md
outline: |
  • Architecture                  L15
    ◦ 1. Monorepo Structure       L23
    ◦ 2. Auth                     L41
      ▪ Identity Model            L57
    ◦ 3. Workspaces               L72
    ◦ 4. Billing Stub             L82
    ◦ 5. Database                 L94
    ◦ 6. UI                      L109
    ◦ 7. Decisions               L118
---

# Architecture

Last updated: `2026.04.04`

> Saasy is a reusable SaaS template — a monorepo foundation for apps that need auth, workspaces, and billing. Clone it, customize it, ship.

---

## 1. Monorepo Structure

Turborepo + pnpm workspaces. Single deployable app, shared packages.

```
saasy/
  apps/
    web/                  # Next.js 16 (App Router)
  packages/
    db/                   # Drizzle ORM — schema, client, migrations
    auth/                 # BetterAuth — config, plugins, adapters
    ui/                   # Shared components (shadcn/ui)
```

**Why this split:** The `db` and `auth` packages are separated so that (a) schema is the single source of truth for types across the monorepo, and (b) auth config can be swapped or extended without touching the app. The `ui` package holds shared components that any future app in the monorepo can consume.

---

## 2. Auth

**Provider:** [BetterAuth](https://www.better-auth.com/) (open-source, MIT, TypeScript).

BetterAuth runs embedded in the Next.js app via a catch-all API route (`/api/auth/[...all]`). It handles:

- Email/password signup + login
- OAuth (Google, GitHub)
- Wallet login (SIWE / EIP-4361 for EVM)
- Session management
- 2FA (TOTP) — configured, optional per user

**Adapter:** Drizzle. BetterAuth's internal model names are remapped to our canonical tables via the adapter's `schema` option.

**Custom PG schema:** All auth tables live in `auth.*` (not `public.*`). Achieved via `search_path` on the connection string. The Drizzle schema uses `pgSchema("auth")` so migrations target the correct schema.

### Identity Model

| Table | Purpose |
|---|---|
| `auth.users` | Canonical user identity |
| `auth.accounts` | External login identities (email, OAuth, wallet) |
| `auth.sessions` | Active sessions |
| `auth.verifications` | Email verification tokens, password resets |
| `auth.workspaces` | Organizational unit — owns billing, API keys |
| `auth.memberships` | User-to-workspace membership + role |
| `auth.invitations` | Pending workspace invites |

BetterAuth's organization plugin maps to `auth.workspaces`, `auth.memberships`, and `auth.invitations` via adapter config. BetterAuth is not the source of truth — the Drizzle schema is.

---

## 3. Workspaces

A workspace is the organizational and billing unit. Every user belongs to at least one workspace. MVP creates an implicit 1:1 workspace on signup.

- Schema supports multi-user workspaces from day one (via `auth.memberships`)
- Role model: `admin` only for MVP
- Member invites are future-ready in the schema but hidden in MVP UI

---

## 4. Billing Stub

Stripe integration point. The template provides:

- Stripe customer creation on workspace setup
- Billing portal link (Stripe Customer Portal)
- Tier/status display (`free`, `pro`, etc.)

Credit ledgers, usage metering, and payment protocol integrations (x402, MPP) are **out of scope** — those are app-specific. The template only provides the Stripe customer + subscription lifecycle wiring.

---

## 5. Database

**ORM:** [Drizzle](https://orm.drizzle.team/) with PostgreSQL.

**Schema strategy:** Separate PG schemas for different concerns:
- `auth.*` — identity, sessions, workspaces, memberships
- `billing.*` — Stripe customers, subscriptions (future)
- `public.*` — app-specific data (added per-project)

**Migrations:** `drizzle-kit` generates and runs migrations from the schema definition.

**Driver:** `postgres` (postgres.js) — lightweight, no native bindings.

Detailed ontology and table responsibilities live in [spec/db.md](spec/db.md).

---

## 6. UI

- **Framework:** Next.js 16 (App Router, React 19)
- **Styling:** Tailwind CSS 4
- **Components:** shadcn/ui
- **Layout:** Sidebar with workspace switcher, nav sections (Settings, Members, Billing)

---

## 7. Decisions

Architectural decisions are recorded in [`docs/decisions/`](decisions/).

| ID | Decision | Date |
|---|---|---|
| ADR-001 | [BetterAuth over Clerk/WorkOS](decisions/001-betterauth.md) | 2026-04-04 |
| ADR-002 | [Drizzle over Prisma](decisions/002-drizzle.md) | 2026-04-04 |
| ADR-003 | [Custom PG schema via search_path](decisions/003-pg-schema.md) | 2026-04-04 |
