import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "@repo/db";
import * as schema from "@repo/db/schema";

const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      organization: schema.workspaces,
      member: schema.memberships,
      invitation: schema.invitations,
    },
  }),
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  plugins: [
    organization({
      creatorRole: "admin",
      schema: {
        session: {
          fields: {
            activeOrganizationId: "activeWorkspaceId",
          },
        },
        organization: {
          modelName: "workspaces",
        },
        member: {
          modelName: "memberships",
          fields: {
            organizationId: "workspaceId",
          },
        },
        invitation: {
          modelName: "invitations",
          fields: {
            organizationId: "workspaceId",
            inviterId: "inviterUserId",
          },
        },
      },
    }),
  ],
});

export type Auth = typeof auth;
