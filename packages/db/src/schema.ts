import { sql, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { boolean, integer, jsonb, pgSchema, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { check } from "drizzle-orm/pg-core";

// -----------------------------------
// projects/saasy/packages/db/src/schema.ts
//
// export const authSchema         L33
// export const users              L41
// export const workspaces         L57
// export const sessions           L73
// export const accounts           L95
// export const verifications     L128
// export const memberships       L143
// export const invitations       L173
// export const billingSchema     L196
// export const customers         L204
// export const subscriptions     L231
// export type User               L254
// export type NewUser            L255
// export type Workspace          L256
// export type NewWorkspace       L257
// export type Session            L258
// export type Account            L259
// export type Membership         L260
// export type Invitation         L261
// export type Customer           L262
// export type NewCustomer        L263
// export type Subscription       L264
// export type NewSubscription    L265
// -----------------------------------

export const authSchema = pgSchema("auth");

/**
 * Canonical application identity used by BetterAuth core flows.
 * A user is the stable identity record; login methods live in `accounts`.
 *
 * See: `docs/spec/db.md` §3.1 "User"
 */
export const users = authSchema.table("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Organizational and billing principal for the template.
 * Billing and future machine credentials attach to the workspace, not the user.
 *
 * See: `docs/spec/db.md` §3.3 "Workspace"
 */
export const workspaces = authSchema.table("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Browser/dashboard session state.
 * Sessions belong to users and may carry the active workspace context.
 *
 * See: `docs/spec/db.md` §3.5 "Session"
 */
export const sessions = authSchema.table("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  activeWorkspaceId: uuid("active_workspace_id").references(() => workspaces.id, {
    onDelete: "set null",
  }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * External authentication methods linked to a canonical user.
 * Examples include email/password, OAuth providers, and future wallet identities.
 *
 * See: `docs/spec/db.md` §3.2 "Account"
 */
export const accounts = authSchema.table(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    idToken: text("id_token"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerAccountUnique: uniqueIndex("auth_accounts_provider_account_unique").on(
      table.providerId,
      table.accountId
    ),
  })
);

/**
 * Verification and recovery tokens used by auth flows.
 *
 * This covers email verification, password reset, and similar auth proofs.
 * See: `docs/spec/db.md` §3.7 "Verification"
 */
export const verifications = authSchema.table("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Canonical user-to-workspace join model.
 *
 * BetterAuth's internal `member` concept maps to this table via adapter config.
 * See: `docs/spec/db.md` §3.4 "Membership"
 */
export const memberships = authSchema.table(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("admin"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    validRole: check("auth_memberships_role_check", sql`${table.role} in ('admin', 'member')`),
    userWorkspaceUnique: uniqueIndex("auth_memberships_user_workspace_unique").on(
      table.userId,
      table.workspaceId
    ),
  })
);

/**
 * Pending workspace invites.
 *
 * The MVP UI can hide invitations, but the schema exists so workspace membership flows
 * can map cleanly onto BetterAuth's organization plugin.
 *
 * See: `docs/spec/db.md` §3.6 "Invitation"
 */
export const invitations = authSchema.table(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull().default("admin"),
    status: text("status").notNull().default("pending"),
    inviterUserId: uuid("inviter_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    validRole: check("auth_invitations_role_check", sql`${table.role} in ('admin', 'member')`),
  })
);

// ─── Billing ────────────────────────────────────────

export const billingSchema = pgSchema("billing");

/**
 * Links a workspace to an external billing provider customer.
 * One customer record per workspace per provider.
 *
 * See: `docs/spec/db.md` §4.1 "Customer"
 */
export const customers = billingSchema.table(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerCustomerId: text("provider_customer_id").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    workspaceProviderUnique: uniqueIndex("billing_customers_workspace_provider_unique").on(
      table.workspaceId,
      table.provider
    ),
  })
);

/**
 * Billing-backed subscription state for a workspace.
 * One row per Stripe subscription, updated in place from webhooks.
 * The `hobby` (free) tier is derived from the absence of an active paid row.
 *
 * See: `docs/spec/db.md` §4.2 "Subscription"
 */
export const subscriptions = billingSchema.table("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
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

// ─── Inferred Types ────────────────────────────────────────

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Workspace = InferSelectModel<typeof workspaces>;
export type NewWorkspace = InferInsertModel<typeof workspaces>;
export type Session = InferSelectModel<typeof sessions>;
export type Account = InferSelectModel<typeof accounts>;
export type Membership = InferSelectModel<typeof memberships>;
export type Invitation = InferSelectModel<typeof invitations>;
export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;
