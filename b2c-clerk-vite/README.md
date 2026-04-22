# Saasy B2C (Clerk + Vite)

A B2C SaaS starter — single-user accounts, Clerk auth, Vite + React, Hono API, Postgres + Drizzle.

## Stack

- **Web:** Vite 8 + React 19, Tailwind CSS 4
- **API:** [Hono](https://hono.dev/) on Node (`@hono/node-server`), Pino logs
- **Auth:** [Clerk](https://clerk.com/) (drop-in sign-in / OAuth, webhook-driven user sync)
- **DB:** Postgres + [Drizzle ORM](https://orm.drizzle.team/)
- **Routing (web):** [react-router](https://reactrouter.com/) v7, declarative
- **Monorepo:** Turborepo + pnpm workspaces

## Structure

```
b2c-clerk-vite/
  apps/
    web/                    # Vite + React client
      src/
        main.tsx            # entry — BrowserRouter
        App.tsx             # ClerkProvider + routes
        app/                # Next App Router-style layout (code-routed)
          layout.tsx
          page.tsx          # /
          (auth)/
            layout.tsx
            sign-in/page.tsx
            sign-up/page.tsx
          app/
            layout.tsx      # SignedIn guard
            page.tsx        # /app
    api/                    # Hono API (port 3001)
      src/
        index.ts            # entry — serve()
        app.ts              # Hono builder
        lib/
          env.ts            # zod-validated env
          logger.ts         # pino + logreq middleware
          error.ts          # APIError hierarchy + onError handler
        types/
          clerk.ts          # Clerk webhook payload types
        api/webhooks/
          clerk.ts          # POST /webhooks/clerk
  packages/
    db/                     # Drizzle + Postgres (users table mirrored from Clerk)
      src/
        index.ts
        schema.ts
        env.ts
      drizzle/              # generated migrations
  docs/                     # long-form guides
  docker-compose.yml        # local Postgres
```

## Getting Started

1. Create a Clerk app at [dashboard.clerk.com](https://dashboard.clerk.com/).
2. Copy env files and fill in secrets:
   ```bash
   cp apps/web/.env.example apps/web/.env
   cp apps/api/.env.example apps/api/.env
   ```
3. Bring up Postgres, install, push schema, run:
   ```bash
   docker compose up -d
   pnpm install
   pnpm --filter @repo/db db:push
   pnpm dev
   ```

The web app runs at `http://localhost:5173`, the API at `http://localhost:3001`.

## Docs

- [**Testing checklist**](./docs/testing.md) — manual walk-through after first boot.
- [**Clerk webhooks**](./docs/webhooks.md) — local dev setup via ngrok + dashboard config.
- [**Deploying**](./docs/deploying.md) — Vercel (web + api) + Neon (postgres) recipe.

## Scripts

| Command                              | Description               |
| ------------------------------------ | ------------------------- |
| `pnpm dev`                           | Run web + api             |
| `pnpm build`                         | Build all workspaces      |
| `pnpm lint`                          | Lint all workspaces       |
| `pnpm check-types`                   | Type-check all workspaces |
| `pnpm --filter @repo/db db:generate` | Generate migration        |
| `pnpm --filter @repo/db db:push`     | Push schema to DB         |
| `pnpm --filter @repo/db db:studio`   | Drizzle Studio            |

## Routes

### Web

| Path         | Access        | Description            |
| ------------ | ------------- | ---------------------- |
| `/`          | Public        | Landing                |
| `/sign-in/*` | Public        | Custom Clerk sign-in   |
| `/sign-up/*` | Public        | Redirects to `sign-in` |
| `/app`       | Authenticated | Example protected page |

### API

| Method | Path              | Description             |
| ------ | ----------------- | ----------------------- |
| GET    | `/health`         | Health check            |
| POST   | `/webhooks/clerk` | Clerk user sync webhook |
