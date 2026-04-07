---
id: I-0001
title: Authenticated user not redirected away from /sign-in
status: proposed
priority: low
labels: [auth, guard]
---

# Authenticated user not redirected away from /sign-in

## Symptom

An authenticated user with an active workspace can navigate to `/sign-in` and the page renders normally instead of redirecting to `/`.

## Steps to reproduce

1. Sign in with a valid account (email OTP)
2. Verify you land on `/` (dashboard)
3. Navigate to `http://localhost:3000/sign-in`
4. Observe: sign-in page renders with "Welcome to Saasy." heading

## Expected

Redirect to `/` (or current workspace dashboard).

## Actual

Sign-in page renders. No redirect occurs.

## Evidence

- FL-003 `authed-away-from-auth` path fails at 39c4c3f
- Unauth guards (/, /settings, /onboard) all work correctly
- The sign-in page is a client component — no server-side session check

## Hypothesis

The sign-in page (`app/(auth)/sign-in/page.tsx`) is a client component and does not check for an existing session on mount. The auth layout (`app/(auth)/layout.tsx`) also has no server-side guard. The middleware likely only protects `(dash)` routes, not `(auth)` routes in reverse.

## Severity

Low — cosmetic/UX issue. User can still use the app normally; they just see the sign-in page if they manually navigate there while logged in.
