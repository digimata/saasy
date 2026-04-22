---
path: projects/saasy/b2c-clerk-vite/docs/testing.md
outline: |
  • Testing checklist          L11
    ◦ Infra                    L15
    ◦ API (direct)             L22
    ◦ Web                      L42
    ◦ Clerk webhook (E2E)      L52
---

# Testing checklist

Walk through this top-to-bottom after first boot to sanity-check the stack.

## Infra

- [ ] `docker compose up -d` — postgres container reports healthy
- [ ] `pnpm install` — installs clean, no peer-dep errors
- [ ] `pnpm --filter @repo/db db:push` — schema applied, `auth.users` table exists
- [ ] `pnpm dev` — web up on `:5173`, api up on `:3001`

## API (direct)

- [ ] Health:
  ```bash
  curl -s http://localhost:3001/health
  # → {"ok":true}
  ```
- [ ] Missing svix headers → `400 validation_error`:
  ```bash
  curl -s -X POST http://localhost:3001/webhooks/clerk -d '{}'
  ```
- [ ] Bad signature → `401 unauthorized`:
  ```bash
  curl -s -X POST http://localhost:3001/webhooks/clerk \
    -H 'svix-id: test' \
    -H 'svix-timestamp: 1700000000' \
    -H 'svix-signature: v1,bogus' \
    -d '{}'
  ```

## Web

- [ ] `/` (signed out) — landing renders with Sign in / Sign up buttons
- [ ] `/sign-in` — logo, "Welcome to Saasy", email bubble, 3 OAuth buttons
- [ ] Google button → redirects to Google → back to `/sso-callback` → lands on `/`
- [ ] `/` (signed in) — header + sidebar shell, welcome message
- [ ] Sign out via header avatar menu → returns to landing at `/`
- [ ] `/sign-up` → redirects to `/sign-in`

## Clerk webhook (E2E)

Requires [localtunnel](https://github.com/localtunnel/localtunnel) + a configured Clerk endpoint (see [webhooks.md](./webhooks.md)).

- [ ] `lt --port 3001` tunnel up, URL registered in Clerk dashboard
- [ ] `CLERK_WEBHOOK_SIGNING_SECRET` in `apps/api/.env`; `pnpm dev` restarted
- [ ] **Sign up a new user** in the web app:
  - [ ] api logs a `user.synced` line with the `clerk_user_id`
  - [ ] row appears in `auth.users`:
    ```bash
    psql postgres://saasy:saasy@localhost:54330/saasy \
      -c "select clerk_user_id, email, first_name, last_name from auth.users;"
    ```
- [ ] **Update** the user's profile in the Clerk dashboard → row's `updated_at` bumps, name/image reflect the change
- [ ] **Delete** the user in the Clerk dashboard → row disappears from `auth.users`
- [ ] **Replay** a webhook from the Clerk dashboard (idempotency) → returns 200, no duplicate row, no error
