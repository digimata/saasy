import { and, eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, organization } from "better-auth/plugins";

import { db } from "@repo/db";
import * as schema from "@repo/db/schema";
import { resend, EMAIL_FROM } from "@repo/email"

import OTPEmail from "@repo/email/templates/otp";
import InvitationEmail from "@repo/email/templates/invitation";

// ------------------------------
// projects/saasy/packages/auth/src/index.ts
//
// const enabledProviders     L24
// const env                  L28
// const socialProviders      L35
// function slugify()         L39
// export const auth          L43
// export type Auth          L168
// ------------------------------

const enabledProviders = new Set(
  (process.env.NEXT_PUBLIC_AUTH_SOCIAL_PROVIDERS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
);

const env = {
  google: { clientId: process.env.GOOGLE_CLIENT_ID ?? "", clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "" },
  github: { clientId: process.env.GITHUB_CLIENT_ID ?? "", clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "" },
  apple: { clientId: process.env.APPLE_CLIENT_ID ?? "", clientSecret: process.env.APPLE_CLIENT_SECRET ?? "" },
  microsoft: { clientId: process.env.MICROSOFT_CLIENT_ID ?? "", clientSecret: process.env.MICROSOFT_CLIENT_SECRET ?? "" },
} as const;

const socialProviders = Object.fromEntries(
  Object.entries(env).filter(([key]) => enabledProviders.has(key)),
);

function slugify(slug: string) {
  return slug.trim().toLowerCase();
}

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
        if (!process.env.RESEND_API_KEY) {
          console.log(`\n🔑 OTP for ${email}: ${otp}\n`);
          return;
        }
        await resend.emails.send({
          from: EMAIL_FROM,
          to: email,
          subject: "Your verification code",
          react: OTPEmail({ code: otp }),
        });
      },
    }),
    organization({
      creatorRole: "admin",
      sendInvitationEmail: async ({ id, email, organization, inviter, role }) => {
        const appUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
        const acceptUrl = `${appUrl}/accept-invitation?invitationId=${id}`;

        if (!process.env.RESEND_API_KEY) {
          console.log(`\n📨 Invitation for ${email} to ${organization.name}: ${acceptUrl}\n`);
          return;
        }

        await resend.emails.send({
          from: EMAIL_FROM,
          to: email,
          subject: `Join ${organization.name}`,
          react: InvitationEmail({
            organizationName: organization.name,
            inviterName: inviter.user.name ?? inviter.user.email,
            role,
            acceptUrl,
          }),
        });
      },
      organizationHooks: {
        beforeCreateOrganization: async ({ organization }) => {
          if (!organization.slug) {
            return;
          }

          return {
            data: {
              slug: slugify(organization.slug),
            },
          };
        },
        beforeUpdateOrganization: async ({ organization }) => {
          if (!organization.slug) {
            return;
          }

          return {
            data: {
              slug: slugify(organization.slug),
            },
          };
        },
        afterRemoveMember: async ({ member, user }) => {
          await db
            .update(schema.sessions)
            .set({ activeWorkspaceId: null })
            .where(
              and(
                eq(schema.sessions.userId, user.id),
                eq(schema.sessions.activeWorkspaceId, member.organizationId)
              )
            );
        },
      },
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
