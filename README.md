---
path: projects/saasy/README.md
outline: |
  • Saasy                    L13
    ◦ Stack                  L17
    ◦ Structure              L26
    ◦ What’s Included        L38
    ◦ Getting Started        L46
    ◦ Scripts                L55
    ◦ Docs                   L65
---

# Saasy

A reusable SaaS template — a monorepo foundation for apps that need auth, workspaces, and billing.

## Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Auth:** [BetterAuth](https://www.better-auth.com/) (email/password, OAuth, wallet login, 2FA)
- **Database:** PostgreSQL + [Drizzle ORM](https://orm.drizzle.team/)
- **Billing:** Stripe (customer lifecycle + portal)
- **UI:** Tailwind CSS 4, shadcn/ui
- **Monorepo:** Turborepo + pnpm workspaces

## Structure

```
saasy/
  apps/
    web/              # Next.js app
  packages/
    auth/             # BetterAuth config, plugins, adapters
    db/               # Drizzle schema, client, migrations
    ui/               # Shared shadcn/ui components
```

## What's Included

- **Auth flows** — sign up, sign in, sign out, email OTP, magic link, OAuth (Google/GitHub), 2FA (TOTP)
- **Workspaces** — multi-user organizational units with roles, invitations, and member management
- **Billing stub** — Stripe customer creation, subscription lifecycle, billing portal
- **Settings** — account settings, workspace settings, multi-session management
- **Database schema** — separated PG schemas (`auth.*`, `billing.*`, `public.*`) with Drizzle migrations

## Getting Started

```bash
pnpm install
pnpm dev
```

The web app runs at `http://localhost:3000`.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format code with Prettier |
| `pnpm check-types` | Type-check all packages |

## Docs

Architecture and decisions are documented in [`docs/`](docs/):

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design, identity model, database strategy
- [decisions/](docs/decisions/) — architectural decision records (ADRs)
