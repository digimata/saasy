---
path: projects/saasy/docs/ARCHITECTURE.md
outline: |
  • Architecture                  L16
    ◦ 1. Monorepo Structure       L24
    ◦ 2. Auth                     L42
      ▪ Identity Model            L58
      ▪ Route Access Policy       L72
    ◦ 3. Workspaces               L91
    ◦ 4. Billing Stub            L101
    ◦ 5. Database                L113
    ◦ 6. UI                      L131
    ◦ 7. Decisions               L140
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

**Custom PG schema:** All auth tables live in `auth.*` (not `public.*`). The Drizzle schema uses `pgSchema("auth")` so all queries are fully schema-qualified — no `search_path` needed.

### Identity Model

| Table                | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `auth.users`         | Canonical user identity                          |
| `auth.accounts`      | External login identities (email, OAuth, wallet) |
| `auth.sessions`      | Active sessions                                  |
| `auth.verifications` | Email verification tokens, password resets       |
| `auth.workspaces`    | Organizational unit — owns billing, API keys     |
| `auth.memberships`   | User-to-workspace membership + role              |
| `auth.invitations`   | Pending workspace invites                        |

BetterAuth's organization plugin maps to `auth.workspaces`, `auth.memberships`, and `auth.invitations` via adapter config. BetterAuth is not the source of truth — the Drizzle schema is.

### Route Access Policy

Route behavior is defined in terms of a validated session and a validated active workspace.

| Route class | No valid session | Valid session, no active workspace | Valid session, active workspace |
| ----------- | ---------------- | ---------------------------------- | ------------------------------- |
| `/sign-in`, `/sign-up` | Allow | Redirect to `/setup` | Redirect to `/` |
| `/setup` | Redirect to `/sign-in` | Allow | Redirect to `/` |
| Protected app routes | Redirect to `/sign-in` | Redirect to `/setup` | Allow |

Middleware is intentionally weaker than the route contract above.

- Middleware may use negative evidence only: if there is definitely no BetterAuth session cookie, treat the request as anonymous.
- Middleware must not treat cookie presence as proof of a valid session.
- Middleware must not decide whether a user should go to `/setup` or `/`.
- Positive auth decisions belong to validated session reads in auth pages, `/setup`, and dashboard layouts.

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

| ID      | Decision                                                       | Date       |
| ------- | -------------------------------------------------------------- | ---------- |
| ADR-001 | [BetterAuth over Clerk/WorkOS](decisions/001-betterauth.md)    | 2026-04-04 |
| ADR-002 | [Drizzle over Prisma](decisions/002-drizzle.md)                | 2026-04-04 |
| ADR-003 | [Custom PG schemas via Drizzle pgSchema](decisions/003-pg-schema.md) | 2026-04-04 |
| ADR-004 | [Feature entitlements](decisions/004-entitlements.md)          | 2026-04-07 |
| ADR-005 | [Workspace-scoped Stripe billing control plane](decisions/005-billing-control-plane.md) | 2026-04-07 |
| ADR-006 | [Negative-evidence middleware and validated-session authorization](decisions/006-middleware-authorization.md) | 2026-04-07 |
