# Saasy

A collection of reusable SaaS starter templates. Each variant is a self-contained workspace — clone the folder you want and go.

## Variants

| Variant | Audience | Framework | Auth | Status |
|---|---|---|---|---|
| [`b2b-betterauth-next/`](./b2b-betterauth-next/) | B2B | Next.js 16 | BetterAuth | Active |
| [`b2c-clerk-vite/`](./b2c-clerk-vite/) | B2C | Vite + React | Clerk | Active |

## Structure

Each variant is its own pnpm + turbo workspace with its own `package.json`, `pnpm-lock.yaml`, and dependency tree. There is no root workspace — variants do not share code at the filesystem level. If a pattern proves reusable across variants, extract it into a published package rather than cross-linking folders.

## Using a template

```bash
cp -r saasy/b2c-clerk-vite my-new-app
cd my-new-app
pnpm install
pnpm dev
```
