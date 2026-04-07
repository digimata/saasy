import Stripe from "stripe";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@repo/db";
import { customers, subscriptions, type Subscription, type Workspace } from "@repo/db/schema";
import { env } from "./env";
import { CURRENT_PLAN_VERSION, PLANS, type Plan, type PlanId } from "./plans";

// ─── Client ────────────────────────────────────────────────

// --------------------------------------------------------
// projects/saasy/packages/billing/src/stripe.ts
//
// let stripe                                           L43
// export function getStripe()                          L45
// const ACTIVE_STATUSES                                L55
// type BillingSubscription                             L57
// export type BillingState                             L62
// plan                                                 L63
// status                                               L64
// currentPeriodEnd                                     L65
// cancelAtPeriodEnd                                    L66
// hasCustomer                                          L67
// export function selectCurrentSubscription()          L70
// export function toBillingState()                     L74
// export async function ensureStripeCustomer()         L99
// export async function createCheckoutSession()       L144
// export async function createPortalSession()         L171
// export async function getWorkspaceBillingState()    L189
// export type Invoice                                 L207
// id                                                  L208
// date                                                L209
// description                                         L210
// status                                              L211
// amountDue                                           L212
// currency                                            L213
// hostedInvoiceUrl                                    L214
// export type InvoicePage                             L217
// invoices                                            L218
// hasMore                                             L219
// export async function getWorkspaceInvoices()        L222
// --------------------------------------------------------

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
  subscription: BillingSubscription | null
): BillingState {
  if (!subscription || !ACTIVE_STATUSES.has(subscription.status)) {
    return {
      plan: { id: "hobby", version: CURRENT_PLAN_VERSION },
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

export async function ensureStripeCustomer(workspace: Pick<Workspace, "id" | "name" | "slug">) {
  const existing = await db
    .select()
    .from(customers)
    .where(and(eq(customers.workspaceId, workspace.id), eq(customers.provider, "stripe")))
    .limit(1);

  if (existing[0]) return existing[0];

  const s = getStripe();
  const stripeCustomer = await s.customers.create(
    {
      name: workspace.name,
      metadata: { workspaceId: workspace.id, slug: workspace.slug ?? "" },
    },
    {
      idempotencyKey: `workspace:${workspace.id}:stripe-customer`,
    }
  );

  const [row] = await db
    .insert(customers)
    .values({
      workspaceId: workspace.id,
      provider: "stripe",
      providerCustomerId: stripeCustomer.id,
    })
    .onConflictDoNothing()
    .returning();

  // Race: another request inserted first — fetch the winner
  if (!row) {
    const [winner] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.workspaceId, workspace.id), eq(customers.provider, "stripe")))
      .limit(1);
    return winner!;
  }

  return row;
}

// ─── Checkout ──────────────────────────────────────────────

export async function createCheckoutSession(
  workspace: Pick<Workspace, "id" | "name" | "slug">,
  plan: Exclude<PlanId, "hobby">,
  returnUrl: string
) {
  const priceId = PLANS[plan].priceId;
  if (!priceId) {
    throw new Error(`Stripe price not configured for plan: ${plan}`);
  }

  const customer = await ensureStripeCustomer(workspace);
  const s = getStripe();

  const session = await s.checkout.sessions.create({
    customer: customer.providerCustomerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: returnUrl,
    cancel_url: returnUrl,
    metadata: { workspaceId: workspace.id, plan },
  });

  return session.url!;
}

// ─── Portal ────────────────────────────────────────────────

export async function createPortalSession(
  workspace: Pick<Workspace, "id" | "name" | "slug">,
  returnUrl: string
) {
  const customer = await ensureStripeCustomer(workspace);
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

export async function getWorkspaceBillingState(workspaceId: string): Promise<BillingState> {
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.workspaceId, workspaceId))
    .limit(1);

  const orderedSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, workspaceId))
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

export async function getWorkspaceInvoices(
  workspaceId: string,
  cursor?: string,
  limit = 20
): Promise<InvoicePage> {
  const [customer] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.workspaceId, workspaceId), eq(customers.provider, "stripe")))
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
      return [{
        id: inv.id,
        date: inv.created,
        description: inv.description,
        status: inv.status,
        amountDue: inv.amount_due,
        currency: inv.currency,
        hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
      }];
    }),
    hasMore: result.has_more,
  };
}
