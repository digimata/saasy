import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { afterEach, describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const envPaths = [
  path.join(repoRoot, ".env.local"),
  path.join(repoRoot, "apps/web/.env.local"),
];

for (const envPath of envPaths) {
  if (typeof process.loadEnvFile === "function" && fs.existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}

const [{ db }, { customers, subscriptions, workspaces }, { PLANS }, stripeModule, { syncSubscriptionFromStripe }] =
  await Promise.all([
    import("@repo/db"),
    import("@repo/db/schema"),
    import("../src/plans"),
    import("../src/stripe"),
    import("../src/webhooks"),
  ]);

const {
  createCheckoutSession,
  createPortalSession,
  ensureStripeCustomer,
  getStripe,
  getWorkspaceBillingState,
} = stripeModule;

const runStripeSmoke =
  process.env.BILLING_STRIPE_SMOKE === "1" &&
  !!process.env.DATABASE_URL &&
  !!process.env.STRIPE_SECRET_KEY &&
  !!process.env.STRIPE_PRICE_PRO &&
  !!process.env.STRIPE_PRICE_ULTRA;

const describeStripeSmoke = runStripeSmoke ? describe : describe.skip;

let migrated = false;
let workspaceId: string | null = null;
let stripeCustomerId: string | null = null;
let stripeSubscriptionId: string | null = null;

async function ensureMigrated() {
  if (migrated) {
    return;
  }

  await migrate(db, {
    migrationsFolder: path.join(repoRoot, "packages/db/drizzle"),
  });

  migrated = true;
}

async function cleanupStripeArtifacts() {
  if (!runStripeSmoke) {
    return;
  }

  const stripe = getStripe();

  if (stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(stripeSubscriptionId);
    } catch {
      // Ignore cleanup errors for already-canceled subscriptions.
    }
  }

  if (stripeCustomerId) {
    try {
      await stripe.customers.del(stripeCustomerId);
    } catch {
      // Ignore cleanup errors for already-deleted customers.
    }
  }

  if (workspaceId) {
    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
  }

  workspaceId = null;
  stripeCustomerId = null;
  stripeSubscriptionId = null;
}

afterEach(async () => {
  await cleanupStripeArtifacts();
});

describeStripeSmoke("live Stripe smoke", () => {
  it(
    "runs the real Stripe billing lifecycle against provider and local state",
    async function stripeLive001() {
    await ensureMigrated();

    const [createdWorkspace] = await db
      .insert(workspaces)
      .values({
        name: `Stripe Smoke ${randomUUID().slice(0, 8)}`,
        slug: `stripe-smoke-${randomUUID().slice(0, 8)}`,
      })
      .returning();

    if (!createdWorkspace) {
      throw new Error("Failed to create smoke-test workspace");
    }

    const workspace = createdWorkspace;

    workspaceId = workspace.id;

    const customer = await ensureStripeCustomer(workspace);
    stripeCustomerId = customer.providerCustomerId;

    const [localCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.workspaceId, workspace.id))
      .limit(1);

    expect(localCustomer?.providerCustomerId).toBe(customer.providerCustomerId);

    const stripe = getStripe();
    const remoteCustomer = await stripe.customers.retrieve(customer.providerCustomerId);

    expect("deleted" in remoteCustomer).toBe(false);
    if (!("deleted" in remoteCustomer)) {
      expect(remoteCustomer.metadata.workspaceId).toBe(workspace.id);
      expect(remoteCustomer.metadata.slug).toBe(workspace.slug);
    }

    const checkoutUrl = await createCheckoutSession(workspace, "pro", "http://localhost/settings?tab=billing");
    expect(checkoutUrl).toContain("checkout.stripe.com");

    const portalUrlBeforeSubscription = await createPortalSession(
      workspace,
      "http://localhost/settings?tab=billing"
    );
    expect(portalUrlBeforeSubscription).toContain("billing.stripe.com");

    await stripe.customers.update(customer.providerCustomerId, { source: "tok_visa" });

    let remoteSubscription = await stripe.subscriptions.create({
      customer: customer.providerCustomerId,
      items: [{ price: PLANS.pro.priceId as string }],
    });
    stripeSubscriptionId = remoteSubscription.id;

    await syncSubscriptionFromStripe(remoteSubscription as Stripe.Subscription);

    let billingState = await getWorkspaceBillingState(workspace.id);
    expect(billingState.plan).toBe("pro");
    expect(billingState.status).toBe(remoteSubscription.status);
    expect(billingState.hasCustomer).toBe(true);

    let [localSubscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.workspaceId, workspace.id))
      .limit(1);

    expect(localSubscription?.plan).toBe("pro");
    expect(localSubscription?.providerSubscriptionId).toBe(remoteSubscription.id);

    const currentItem = remoteSubscription.items.data[0];
    expect(currentItem?.price.id).toBe(PLANS.pro.priceId);

    remoteSubscription = await stripe.subscriptions.update(remoteSubscription.id, {
      items: [{ id: currentItem?.id as string, price: PLANS.ultra.priceId as string }],
      proration_behavior: "none",
    });

    await syncSubscriptionFromStripe(remoteSubscription as Stripe.Subscription);

    billingState = await getWorkspaceBillingState(workspace.id);
    expect(billingState.plan).toBe("ultra");

    localSubscription = (
      await db.select().from(subscriptions).where(eq(subscriptions.workspaceId, workspace.id)).limit(1)
    )[0];
    expect(localSubscription?.plan).toBe("ultra");
    expect(localSubscription?.providerPriceId).toBe(PLANS.ultra.priceId);

    const upgradedItem = remoteSubscription.items.data[0];
    expect(upgradedItem?.price.id).toBe(PLANS.ultra.priceId);

    remoteSubscription = await stripe.subscriptions.update(remoteSubscription.id, {
      items: [{ id: upgradedItem?.id as string, price: PLANS.pro.priceId as string }],
      proration_behavior: "none",
    });

    await syncSubscriptionFromStripe(remoteSubscription as Stripe.Subscription);

    billingState = await getWorkspaceBillingState(workspace.id);
    expect(billingState.plan).toBe("pro");

    localSubscription = (
      await db.select().from(subscriptions).where(eq(subscriptions.workspaceId, workspace.id)).limit(1)
    )[0];
    expect(localSubscription?.plan).toBe("pro");
    expect(localSubscription?.providerPriceId).toBe(PLANS.pro.priceId);

    remoteSubscription = await stripe.subscriptions.update(remoteSubscription.id, {
      cancel_at_period_end: true,
    });

    await syncSubscriptionFromStripe(remoteSubscription as Stripe.Subscription);

    billingState = await getWorkspaceBillingState(workspace.id);
    expect(billingState.plan).toBe("pro");
    expect(billingState.cancelAtPeriodEnd).toBe(true);

    localSubscription = (
      await db.select().from(subscriptions).where(eq(subscriptions.workspaceId, workspace.id)).limit(1)
    )[0];
    expect(localSubscription?.cancelAtPeriodEnd).toBe(true);

    const portalUrlAfterSubscription = await createPortalSession(
      workspace,
      "http://localhost/settings?tab=billing"
    );
    expect(portalUrlAfterSubscription).toContain("billing.stripe.com");

    remoteSubscription = await stripe.subscriptions.cancel(remoteSubscription.id);
    stripeSubscriptionId = null;

    await syncSubscriptionFromStripe(remoteSubscription as Stripe.Subscription);

    billingState = await getWorkspaceBillingState(workspace.id);
    expect(billingState.plan).toBe("hobby");
    expect(billingState.status).toBe("canceled");
    expect(billingState.hasCustomer).toBe(true);

    const allLocalSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.workspaceId, workspace.id));

    expect(allLocalSubscriptions).toHaveLength(1);
    expect(allLocalSubscriptions[0]?.status).toBe("canceled");
    },
    120_000
  );
});
