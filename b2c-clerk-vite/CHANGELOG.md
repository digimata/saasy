# Changelog

All notable changes to the **saasy-b2c-clerk-vite** template. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning follows
[SemVer](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-04-21

First tagged version of the template. Baseline feature set for a B2C SaaS
scaffold: Vite + React + Clerk on the web, Hono + Drizzle + Postgres on the
API, Stripe billing wired end-to-end.

### Added
- `@repo/billing` package: versioned plan catalog, user-scoped Stripe
  customers + subscriptions (Drizzle), checkout + portal helpers, webhook
  signature verification + subscription sync, entitlements (flags + limits).
- API routes: `POST /billing/{checkout,portal}`, `GET /billing/{state,invoices}`,
  `POST /webhooks/stripe`. Stripe webhook mounts before Clerk middleware so it
  authenticates via Stripe signature.
- Billing UI ported from the b2b template (2-tier): `PlanCard`, `PaymentCard`,
  `InvoicesCard`, `PlanDialog`. Settings → Billing tab renders the live state;
  "not configured" fallback keeps the tab usable without Stripe credentials.
- `ensureLocalUser` helper: lazy-syncs the Clerk user into Postgres on first
  authenticated request, so the template is resilient to missed webhook runs.
- `ServiceUnavailableError` (503) for "billing not configured" responses;
  shared `handleError` attached to sub-apps so thrown `APIError`s return the
  right status in isolation tests.
- Invariant tests: `billing-routes.test.ts`, `billing-webhooks.test.ts`,
  `sign-in.test.tsx`, `protected-layout.test.tsx`.

### Changed
- `drizzle.config.ts` loads `apps/api/.env` via `dotenv` so `pnpm db:migrate`
  works without prefixing the command with `DATABASE_URL=...`.
- Zod schemas use `z.url()` (the v4 idiom) instead of the deprecated
  `z.string().url()` chain.

### Repo
- Split out of the monorepo previously rooted at `saasy/` — the original
  BetterAuth/Next.js template now lives under `saasy/b2b-betterauth-next/`,
  and this template lives at `saasy/b2c-clerk-vite/`. `saasy/` stays the
  single git repo so both templates can evolve together.
