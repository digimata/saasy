import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import {
  boolean,
  integer,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const authSchema = pgSchema("auth");
export const billingSchema = pgSchema("billing");

/**
 * Application user mirrored from Clerk via webhooks.
 * `clerkUserId` is Clerk's stable `user_xxx` identifier — unique per account.
 */
export const users = authSchema.table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

/**
 * Stripe customer record for a user. One row per (user, provider).
 * Separate from subscription so the customer survives sub lifecycle churn.
 */
export const customers = billingSchema.table(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerCustomerId: text("provider_customer_id").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userProviderUnique: uniqueIndex("billing_customers_user_provider_unique").on(
      table.userId,
      table.provider,
    ),
  }),
);

/**
 * Subscription state for a user, synced from Stripe webhooks.
 * The `free` tier is implicit — derived from the absence of an active paid row.
 */
export const subscriptions = billingSchema.table("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerSubscriptionId: text("provider_subscription_id").notNull().unique(),
  providerPriceId: text("provider_price_id").notNull(),
  plan: text("plan").notNull(),
  planVersion: integer("plan_version").notNull().default(1),
  status: text("status").notNull(),
  interval: text("interval"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;
