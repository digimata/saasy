import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import {
  canCreateCheckout,
  createCheckoutSession,
  createPortalSession,
  getUserBillingState,
  getUserInvoices,
  isBillingConfigured,
  type PlanId,
} from "@repo/billing";

import { env } from "@/lib/env";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/error";
import { requireAuth, currentUserId } from "@/lib/auth";
import { ensureLocalUser } from "@/lib/user";

// ---------------------------
// projects/saasy/b2c-clerk-vite/apps/api/src/api/billing.ts
//
// const billing           L26
// const checkoutSchema    L30
// const portalSchema      L58
// ---------------------------

const billing = new Hono();

billing.use("*", requireAuth);

billing.get("/state", async (c) => {
  if (!isBillingConfigured()) {
    return c.json({ configured: false, checkoutPlans: { pro: false } });
  }

  const clerkUserId = currentUserId(c);
  const user = await ensureLocalUser(c, clerkUserId);
  const state = await getUserBillingState(user.id);

  return c.json({
    configured: true,
    checkoutPlans: { pro: canCreateCheckout("pro") },
    ...state,
  });
});

billing.get("/invoices", async (c) => {
  if (!isBillingConfigured()) {
    return c.json({ invoices: [], hasMore: false });
  }

  const clerkUserId = currentUserId(c);
  const user = await ensureLocalUser(c, clerkUserId);
  const cursor = c.req.query("cursor") ?? undefined;
  const page = await getUserInvoices(user.id, cursor);

  return c.json(page);
});

const checkoutSchema = z.object({
  plan: z.enum(["pro"] as const satisfies readonly Exclude<PlanId, "free">[]),
  returnUrl: z.url().optional(),
});

billing.post("/checkout", zValidator("json", checkoutSchema), async (c) => {
  if (!isBillingConfigured()) {
    throw new NotFoundError("Billing is not configured");
  }

  const { plan, returnUrl } = c.req.valid("json");

  if (!canCreateCheckout(plan)) {
    throw new ForbiddenError(`Plan "${plan}" is not available for checkout`);
  }

  const clerkUserId = currentUserId(c);
  const user = await ensureLocalUser(c, clerkUserId);

  const url = await createCheckoutSession(
    user,
    plan,
    returnUrl ?? `${env.WEB_ORIGIN}/settings/billing`,
  );

  return c.json({ url });
});

const portalSchema = z.object({
  returnUrl: z.url().optional(),
});

billing.post("/portal", zValidator("json", portalSchema), async (c) => {
  if (!isBillingConfigured()) {
    throw new NotFoundError("Billing is not configured");
  }

  const { returnUrl } = c.req.valid("json");
  const clerkUserId = currentUserId(c);
  const user = await ensureLocalUser(c, clerkUserId);

  const url = await createPortalSession(
    user,
    returnUrl ?? `${env.WEB_ORIGIN}/settings/billing`,
  );

  if (!url) throw new ValidationError("Failed to create portal session");

  return c.json({ url });
});

export default billing;
