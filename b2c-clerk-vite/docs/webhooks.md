---
path: projects/saasy/b2c-clerk-vite/docs/webhooks.md
outline: |
  • Clerk webhooks (local dev)          L10
    ◦ Setup                             L14
    ◦ How it works                      L35
    ◦ Events beyond user lifecycle      L43
---

# Clerk webhooks (local dev)

Clerk fires webhooks on user lifecycle events (`user.created`, `user.updated`, `user.deleted`). The API verifies signatures via [svix](https://www.svix.com/) and syncs the local `auth.users` table. Local dev needs a public tunnel.

## Setup

1. **Expose the API** via [localtunnel](https://github.com/localtunnel/localtunnel):
   ```bash
   # install once: npm i -g localtunnel
   lt --port 3001
   ```
   Copy the `https://<subdomain>.loca.lt` URL.

2. **Register the endpoint** in the Clerk dashboard → **Webhooks** → **Add Endpoint**:
   - Endpoint URL: `https://<subdomain>.loca.lt/webhooks/clerk`
   - Subscribe to events: `user.created`, `user.updated`, `user.deleted`

3. **Copy the signing secret** from the endpoint's settings page into `apps/api/.env`:
   ```
   CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
   ```

4. Restart `pnpm dev` so the API picks up the new env.

5. **Verify**: sign up a test user in the web app — a row should land in `auth.users`.

## How it works

- `apps/api/src/api/webhooks/clerk.ts` handles `POST /webhooks/clerk`.
- Svix verifies the `svix-id` / `svix-timestamp` / `svix-signature` headers against `CLERK_WEBHOOK_SIGNING_SECRET`. Bad signature → `401`.
- `user.created` / `user.updated` → upsert into `auth.users` keyed on `clerk_user_id` (idempotent).
- `user.deleted` → hard delete the matching row.
- Unknown event types are acknowledged with `200 { ignored: "<type>" }` so the dashboard doesn't mark the endpoint unhealthy.

## Events beyond user lifecycle

To subscribe to other Clerk events (sessions, organizations, etc.), subscribe them in the dashboard and add a `case` in the `switch` inside `clerk.ts`. Typed event payloads live in `apps/api/src/types/clerk.ts`.
