---
path: projects/saasy/apps/web/tests/flows/index.md
outline: |
  • Flow Tests      L7
---

# Flow Tests

| ID | Title | Covers | Depends | Last Run | Result |
|---|---|---|---|---|---|
| FL-001 | [Auth flows](auth.yaml) | /sign-in, /sign-up, /onboard, sign-out, otp, oauth | — | 39c4c3f | pass |
| FL-002 | [Dashboard flows](dashboard.yaml) | /, /settings, sidebar, settings-tabs | — | 39c4c3f | pass |
| FL-003 | [Guard flows](guards.yaml) | middleware, auth-redirect, unauth-redirect | FL-001 | 39c4c3f | partial |
| FL-004 | [Invitation flows](invitations.yaml) | /accept-invitation, invite, reject | FL-001, FL-002 | — | — |

## OTP retrieval (dev only)

Auth flows require email OTP. In production, codes are sent via Resend. In dev, the code can be read from the DB:

```sql
-- Connection: postgresql://postgres:postgres@localhost:54329/saasy
SELECT split_part(value, ':', 1) AS otp
FROM auth.verifications
WHERE identifier = 'sign-in-otp-' || '{email}'
ORDER BY created_at DESC LIMIT 1;
```
