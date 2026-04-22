import Stripe from "stripe";
import { eq, and, desc } from "drizzle-orm";

import { db } from "@repo/db";
import { customers, subscriptions, type Subscription, type User } from "@repo/db";

import { env } from "./env";
import { CURRENT_PLAN_VERSION, PLANS, type Plan, type PlanId } from "./plans";

// ─── Client ────────────────────────────────────────────────

// -----------------------------------------------------
// projects/saasy/b2c-clerk-vite/packages/billing/src/stripe.ts
//
// let stripe                                        L33
// export function getStripe()                       L35
// const ACTIVE_STATUSES                             L45
// type BillingSubscription                          L47
// export type BillingState                          L52
// plan                                              L53
// status                                            L54
// currentPeriodEnd                                  L55
// cancelAtPeriodEnd                                 L56
// hasCustomer                                       L57
// export function selectCurrentSubscription()       L60
// export function toBillingState()                  L64
// export async function ensureStripeCustomer()      L89
// export async function createCheckoutSession()    L133
// export async function createPortalSession()      L160
// export async function getUserBillingState()      L180
// -----------------------------------------------------

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
    }
    stripe = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

type BillingSubscription = Pick<
  Subscription,
  "plan" | "planVersion" | "status" | "currentPeriodEnd" | "cancelAtPeriodEnd" | "createdAt"
>;

export type BillingState = {
  plan: Plan;
  status: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
};

export function selectCurrentSubscription(subs: BillingSubscription[]): BillingSubscription | null {
  return subs.find((sub) => ACTIVE_STATUSES.has(sub.status)) ?? subs[0] ?? null;
}

export function toBillingState(
  hasCustomer: boolean,
  subscription: BillingSubscription | null,
): BillingState {
  if (!subscription || !ACTIVE_STATUSES.has(subscription.status)) {
    return {
      plan: { id: "free", version: CURRENT_PLAN_VERSION },
      status: subscription?.status ?? null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      hasCustomer,
    };
  }

  return {
    plan: { id: subscription.plan as PlanId, version: subscription.planVersion },
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    hasCustomer,
  };
}

// ─── Customers ─────────────────────────────────────────────

export async function ensureStripeCustomer(user: Pick<User, "id" | "email" | "firstName" | "lastName">) {
  const existing = await db
    .select()
    .from(customers)
    .where(and(eq(customers.userId, user.id), eq(customers.provider, "stripe")))
    .limit(1);

  if (existing[0]) return existing[0];

  const s = getStripe();
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  const stripeCustomer = await s.customers.create(
    {
      email: user.email,
      name: name || undefined,
      metadata: { userId: user.id },
    },
    { idempotencyKey: `user:${user.id}:stripe-customer` },
  );

  const [row] = await db
    .insert(customers)
    .values({
      userId: user.id,
      provider: "stripe",
      providerCustomerId: stripeCustomer.id,
    })
    .onConflictDoNothing()
    .returning();

  if (!row) {
    const [winner] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.userId, user.id), eq(customers.provider, "stripe")))
      .limit(1);
    return winner!;
  }

  return row;
}

// ─── Checkout ──────────────────────────────────────────────

export async function createCheckoutSession(
  user: Pick<User, "id" | "email" | "firstName" | "lastName">,
  plan: Exclude<PlanId, "free">,
  returnUrl: string,
) {
  const priceId = PLANS[plan].priceId;
  if (!priceId) {
    throw new Error(`Stripe price not configured for plan: ${plan}`);
  }

  const customer = await ensureStripeCustomer(user);
  const s = getStripe();

  const session = await s.checkout.sessions.create({
    customer: customer.providerCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: returnUrl,
    cancel_url: returnUrl,
    metadata: { userId: user.id, plan },
  });

  return session.url!;
}

// ─── Portal ────────────────────────────────────────────────

export async function createPortalSession(
  user: Pick<User, "id" | "email" | "firstName" | "lastName">,
  returnUrl: string,
) {
  const customer = await ensureStripeCustomer(user);
  const s = getStripe();

  const session = await s.billingPortal.sessions.create({
    customer: customer.providerCustomerId,
    return_url: returnUrl,
    ...(env.STRIPE_PORTAL_CONFIGURATION_ID && {
      configuration: env.STRIPE_PORTAL_CONFIGURATION_ID,
    }),
  });

  return session.url;
}

// ─── State ────────────────────────────────────────────────

export async function getUserBillingState(userId: string): Promise<BillingState> {
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.userId, userId))
    .limit(1);

  const orderedSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt));

  return toBillingState(!!customer, selectCurrentSubscription(orderedSubscriptions));
}

// ─── Invoices ──────────────────────────────────────────────

export type Invoice = {
  id: string;
  date: number;
  description: string | null;
  status: string | null;
  amountDue: number;
  currency: string;
  hostedInvoiceUrl: string | null;
};

export type InvoicePage = {
  invoices: Invoice[];
  hasMore: boolean;
};

export async function getUserInvoices(
  userId: string,
  cursor?: string,
  limit = 20,
): Promise<InvoicePage> {
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.userId, userId), eq(customers.provider, "stripe")))
    .limit(1);

  if (!customer) return { invoices: [], hasMore: false };

  const s = getStripe();
  const result = await s.invoices.list({
    customer: customer.providerCustomerId,
    limit,
    ...(cursor && { starting_after: cursor }),
  });

  return {
    invoices: result.data.flatMap((inv) => {
      if (!inv.id) return [];
      return [
        {
          id: inv.id,
          date: inv.created,
          description: inv.description,
          status: inv.status,
          amountDue: inv.amount_due,
          currency: inv.currency,
          hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
        },
      ];
    }),
    hasMore: result.has_more,
  };
}
