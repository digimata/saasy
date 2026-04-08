---
id: iss-0001
title: "Webhook cancel state not syncing to local DB"
status: proposed
priority: high
labels: [billing, bug]
---

# iss-0001: Webhook cancel state not syncing to local DB

## Summary

When a subscription is cancelled via Stripe portal (cancel at period end), the local DB does not reflect the change. `billing.subscriptions.cancel_at_period_end` stays `false` while Stripe shows the subscription scheduled for cancellation.

## Observed

- User clicks "Manage in Stripe" → portal opens
- Cancels subscription at period end in portal
- Returns to app
- Billing page shows "Your subscription will auto renew on May 7, 2026"
- DB: `cancel_at_period_end = f`
- Stripe: `cancel_at` is set, portal shows "Cancels May 7"

## Expected

- After webhook sync, DB should have `cancel_at_period_end = t`
- Billing page should show "Your plan will end on May 7, 2026"

## Likely cause

Either:
1. The `customer.subscription.updated` webhook isn't firing after portal cancellation
2. The webhook fires but `stripe listen --forward-to` isn't forwarding it
3. The `syncSubscriptionFromStripe` function receives the event but doesn't update `cancel_at_period_end` correctly

## Reproduction

1. Seed a workspace with an active Pro subscription
2. Open Stripe portal, cancel at period end
3. Check `billing.subscriptions` — `cancel_at_period_end` should be `true`

## Source

Found during flow test run (FL-005, path: cancel-at-period-end).
