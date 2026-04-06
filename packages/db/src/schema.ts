import { sql } from "drizzle-orm";
import { boolean, jsonb, pgSchema, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { check } from "drizzle-orm/pg-core";

// ----------------------------------
// projects/saasy/packages/db/src/schema.ts
//
// export const authSchema        L16
// export const users             L24
// export const workspaces        L40
// export const sessions          L56
// export const accounts          L78
// export const verifications    L111
// export const memberships      L126
// export const invitations      L155
// ----------------------------------

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
