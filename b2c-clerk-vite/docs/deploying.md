---
path: projects/saasy/b2c-clerk-vite/docs/deploying.md
outline: |
  • Deploying                          L13
    ◦ Web (apps/web) on Vercel         L23
    ◦ API (apps/api) on Vercel         L33
      ▪ Update Clerk after deploy      L60
    ◦ Postgres via Neon                L65
    ◦ Gotchas                          L74
    ◦ Alternatives                     L81
---

# Deploying

The template runs well on **Vercel** (web + api as serverless functions) with **Neon** as the Postgres host. Both halves can run as **two separate Vercel projects** from the same repo — consumers can swap either host without touching the other.

| Piece | Recommended host | Why |
| --- | --- | --- |
| `apps/web` | Vercel (Vite preset) | Static build, edge CDN, preview per PR |
| `apps/api` | Vercel (serverless, `hono/vercel`) | Same DX, same Git flow |
| Postgres  | [Neon](https://neon.tech/) | Serverless-friendly pooler, DB branches per PR |

## Web (`apps/web`) on Vercel

1. Import the repo on vercel.com.
2. **Root directory:** `apps/web`.
3. **Framework preset:** Vite (auto-detected).
4. **Env vars:**
   - `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key (production).
   - `VITE_API_URL` — e.g. `https://api.yourdomain.com` (if you reference it from the client).
5. Deploy. Vercel runs `pnpm -F web build` and serves `apps/web/dist/`.

## API (`apps/api`) on Vercel

Vercel doesn't run long-lived Node processes — each endpoint is a serverless function. Swap the Node server entry for Hono's Vercel adapter:

1. **Add the Vercel entry** at `apps/api/api/[[...route]].ts`:
   ```ts
   import { handle } from "hono/vercel";
   import { build } from "@/app";

   export const runtime = "nodejs";
   const app = build();
   export const GET = handle(app);
   export const POST = handle(app);
   export const PUT = handle(app);
   export const PATCH = handle(app);
   export const DELETE = handle(app);
   ```
2. **Keep** `src/index.ts` — it's still used for `pnpm dev` locally via `@hono/node-server`.
3. Import the repo as a **second Vercel project**. Root directory `apps/api`.
4. **Framework preset:** Other (no build command needed — Vercel compiles the `api/` files automatically).
5. **Env vars:**
   - `DATABASE_URL` — Neon connection string (use the **pooled** URL).
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SIGNING_SECRET`
   - `WEB_ORIGIN` — the deployed web domain (for CORS).
6. Deploy. The API is reachable at `https://<project>.vercel.app/webhooks/clerk` etc.

### Update Clerk after deploy

- Update the Clerk webhook endpoint URL from the ngrok URL to the deployed API URL.
- Copy the **production** signing secret into the API project's env.

## Postgres via Neon

1. Create a Neon project; use the **pooled** connection string (`?sslmode=require` + pooler).
2. Run migrations against prod once:
   ```bash
   DATABASE_URL=<neon-pooled-url> pnpm --filter @repo/db db:migrate
   ```
3. (Optional) Configure a [Vercel + Neon integration](https://vercel.com/integrations/neon) so preview deploys get their own DB branch.

## Gotchas

- **Cold starts:** fine for Clerk webhooks (svix retries) and normal user requests. Not fine for WebSockets, long jobs, or cron — reach for [Vercel Cron](https://vercel.com/docs/cron-jobs) or a queue (Upstash / Inngest).
- **Postgres pooling:** serverless functions open a fresh pg client per invocation. Use Neon's pooled URL (port `6543`) — raw direct connections exhaust limits fast.
- **pino-pretty** is dev-only (gated on `NODE_ENV !== production`) and won't bundle into the function.
- **Monorepo root install:** Vercel runs `pnpm install` at the repo root by default (good — needed for workspace links).

## Alternatives

- **Single-provider simplicity:** [Railway](https://railway.app/) can host web + api + postgres under one dashboard. Trade-off: CDN is not as fast as Vercel/CF, and you lose per-PR preview for the web.
- **Long-running API:** [Fly.io](https://fly.io/) runs the API as a persistent container (keep the existing `@hono/node-server` entry). Better for websockets or background jobs.
