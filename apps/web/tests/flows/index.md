---
path: projects/saasy/apps/web/tests/flows/index.md
outline: |
  • Flow Tests      L7
---

# Flow Tests

| ID | Title | Covers | Depends | Last Run | Result |
|---|---|---|---|---|---|
| FL-001 | [Auth flows](auth.yaml) | /sign-in, /sign-up, /setup, sign-out | — | e52fca7 | pass |
| FL-002 | [Dashboard flows](dashboard.yaml) | /, /settings, /members, /billing, sidebar | — | e52fca7 | pass |
| FL-003 | [Guard flows](guards.yaml) | middleware, auth-redirect, unauth-redirect | FL-001 | e52fca7 | pass |
