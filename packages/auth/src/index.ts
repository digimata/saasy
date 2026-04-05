import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, organization } from "better-auth/plugins";
import { db } from "@repo/db";
import * as schema from "@repo/db/schema";

// ----------------------------
// projects/saasy/packages/auth/src/index.ts
//
// const enabledProviders   L15
// const socialProviders    L19
// export const auth        L42
// export type Auth         L97
// ----------------------------

const enabledProviders = new Set(
  (process.env.NEXT_PUBLIC_AUTH_SOCIAL_PROVIDERS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
);

const providerEnv = {
  google: { clientId: process.env.GOOGLE_CLIENT_ID ?? "", clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "" },
  github: { clientId: process.env.GITHUB_CLIENT_ID ?? "", clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "" },
  apple: { clientId: process.env.APPLE_CLIENT_ID ?? "", clientSecret: process.env.APPLE_CLIENT_SECRET ?? "" },
  microsoft: { clientId: process.env.MICROSOFT_CLIENT_ID ?? "", clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? "" },
} as const;

const socialProviders = Object.fromEntries(
  Object.entries(providerEnv).filter(([key]) => enabledProviders.has(key)),
);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      organization: schema.workspaces,
      workspaces: schema.workspaces,
      member: schema.memberships,
      memberships: schema.memberships,
      invitation: schema.invitations,
      invitations: schema.invitations,
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
    emailOTP({
      sendVerificationOTP: async ({ email, otp }) => {
        console.log(`\n🔑 OTP for ${email}: ${otp}\n`);
      },
    }),
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
