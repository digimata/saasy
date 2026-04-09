---
id: I-0003
title: Login redirects to /onboard even when user has a workspace
status: proposed
priority: medium
labels: [auth, routing]
---

# Login redirects to /onboard even when user has a workspace

## Symptom

A user who already belongs to a workspace is redirected to `/onboard` after signing in, instead of being taken to their workspace (`/{workspace}`).

## Steps to reproduce

1. Create an account and a workspace (normal onboarding flow)
2. Sign out
3. Sign back in with the same credentials
4. Observe: redirected to `/onboard` instead of the workspace

## Expected behavior

After login, if the user has an existing workspace, redirect to `/{workspace}` (or the last active workspace). Only show `/onboard` for users with no workspace membership.

## Hypothesis

The post-login redirect logic likely checks for an active workspace on the session but doesn't query existing memberships. After a fresh login the session has no `activeWorkspaceId` set, so the middleware treats it as a new user and sends them to onboard.
