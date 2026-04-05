---
path: projects/saasy/apps/web/tests/flows/index.md
outline: |
  • Flow Tests      L7
---

# Flow Tests

| ID | Title | Covers | Depends | Last Run | Result |
|---|---|---|---|---|---|
| FL-001 | [Auth flows](auth.yaml) | /sign-in, /sign-up, /onboard, sign-out | — | a726d89 | pass |
| FL-002 | [Dashboard flows](dashboard.yaml) | /, /settings, /members, /billing, sidebar | — | a726d89 | skip |
| FL-003 | [Guard flows](guards.yaml) | middleware, auth-redirect, unauth-redirect | FL-001 | a726d89 | partial |

## OTP retrieval (dev only)

Auth flows require email OTP. The code is logged to the dev server console, but agents can also read it from the DB:

```sql
-- Connection: postgresql://postgres:postgres@localhost:54329/saasy
SELECT split_part(value, ':', 1) AS otp
FROM auth.verifications
WHERE identifier = 'sign-in-otp-' || '{email}'
ORDER BY created_at DESC LIMIT 1;
```
