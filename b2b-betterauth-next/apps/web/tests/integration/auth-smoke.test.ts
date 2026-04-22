import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auth } from "@repo/auth";
import { accounts, db, invitations, memberships, sessions, users, workspaces } from "@repo/db";
import { and, eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";
import { parseSetCookieHeader } from "better-auth/cookies";
import { describe, expect, it } from "vitest";

// -----------------------------------------------
// projects/saasy/apps/web/tests/integration/auth-smoke.test.ts
//
// function createCookieJar()                  L54
// capture()                                   L58
// headers()                                   L73
// const client                                L88
// let migrated                                L96
// async function ensureMigrated()             L98
// async function signUpUser()                L112
// onSuccess()                                L122
// async function signInUser()                L131
// onSuccess()                                L140
// async function createWorkspace()           L149
// onSuccess()                                L160
// async function setActiveWorkspace()        L167
// onSuccess()                                L176
// async function inviteMember()              L183
// onSuccess()                                L196
// id                                         L201
// organizationId                             L202
// email                                      L203
// role                                       L204
// status                                     L205
// inviterId                                  L206
// expiresAt                                  L207
// createdAt                                  L208
// async function acceptInvitation()          L212
// onSuccess()                                L221
// invitation                                 L226
// id                                         L227
// organizationId                             L228
// status                                     L229
// member                                     L231
// organizationId                             L232
// role                                       L233
// userId                                     L234
// async function cleanupByEmailsAndSlug()    L239
// onSuccess()                                L424
// -----------------------------------------------

function createCookieJar() {
  const cookies = new Map<string, string>();

  return {
    capture(response: Response) {
      const setCookies =
        typeof response.headers.getSetCookie === "function"
          ? response.headers.getSetCookie()
          : response.headers.get("set-cookie")
            ? [response.headers.get("set-cookie") as string]
            : [];

      for (const setCookie of setCookies) {
        for (const [name, attrs] of parseSetCookieHeader(setCookie)) {
          cookies.set(name, attrs.value);
        }
      }
    },

    headers() {
      const headers = new Headers();
      if (cookies.size > 0) {
        headers.set(
          "cookie",
          Array.from(cookies.entries())
            .map(([name, value]) => `${name}=${value}`)
            .join("; ")
        );
      }
      return headers;
    },
  };
}

const client = createAuthClient({
  baseURL: "http://localhost/api/auth",
  plugins: [organizationClient()],
  fetchOptions: {
    customFetchImpl: async (url, init) => auth.handler(new Request(url, init)),
  },
});

let migrated = false;

async function ensureMigrated() {
  if (migrated) {
    return;
  }

  const migrationsFolder = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../../packages/db/drizzle"
  );

  await migrate(db, { migrationsFolder });
  migrated = true;
}

async function signUpUser(email: string, password: string, name = "Smoke Test") {
  const cookieJar = createCookieJar();

  const result = await client.signUp.email({
    email,
    password,
    name,
    fetchOptions: {
      throw: true,
      headers: cookieJar.headers(),
      onSuccess(context) {
        cookieJar.capture(context.response);
      },
    },
  });

  return { cookieJar, result };
}

async function signInUser(email: string, password: string) {
  const cookieJar = createCookieJar();

  const result = await client.signIn.email({
    email,
    password,
    fetchOptions: {
      throw: true,
      headers: cookieJar.headers(),
      onSuccess(context) {
        cookieJar.capture(context.response);
      },
    },
  });

  return { cookieJar, result };
}

async function createWorkspace(
  cookieJar: ReturnType<typeof createCookieJar>,
  name: string,
  slug: string
) {
  return client.organization.create({
    name,
    slug,
    fetchOptions: {
      throw: true,
      headers: cookieJar.headers(),
      onSuccess(context) {
        cookieJar.capture(context.response);
      },
    },
  });
}

async function setActiveWorkspace(
  cookieJar: ReturnType<typeof createCookieJar>,
  workspaceId: string
) {
  await client.organization.setActive({
    organizationId: workspaceId,
    fetchOptions: {
      throw: true,
      headers: cookieJar.headers(),
      onSuccess(context) {
        cookieJar.capture(context.response);
      },
    },
  });
}

async function inviteMember(
  cookieJar: ReturnType<typeof createCookieJar>,
  workspaceId: string,
  email: string,
  role: "admin" | "member" | "owner" = "member"
) {
  return (await client.organization.inviteMember({
    organizationId: workspaceId,
    email,
    role,
    fetchOptions: {
      throw: true,
      headers: cookieJar.headers(),
      onSuccess(context) {
        cookieJar.capture(context.response);
      },
    },
  })) as {
    id: string;
    organizationId: string;
    email: string;
    role: "admin" | "member" | "owner";
    status: string;
    inviterId: string;
    expiresAt: Date;
    createdAt: Date;
  };
}

async function acceptInvitation(
  cookieJar: ReturnType<typeof createCookieJar>,
  invitationId: string
) {
  return (await client.organization.acceptInvitation({
    invitationId,
    fetchOptions: {
      throw: true,
      headers: cookieJar.headers(),
      onSuccess(context) {
        cookieJar.capture(context.response);
      },
    },
  })) as {
    invitation: {
      id: string;
      organizationId: string;
      status: string;
    };
    member: {
      organizationId: string;
      role: string;
      userId: string;
    };
  };
}

async function cleanupByEmailsAndSlug(emails: string[], slug: string) {
  const [workspaceRow] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);

  if (workspaceRow) {
    await db.delete(workspaces).where(eq(workspaces.id, workspaceRow.id));
  }

  for (const email of emails) {
    const [userRow] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userRow) {
      await db.delete(users).where(eq(users.id, userRow.id));
    }
  }
}

describe("auth smoke flow", () => {
  it("signs up, creates a workspace, and sets the active workspace", async () => {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const email = `smoke+${suffix}@example.com`;
    const password = `Smoke-${suffix}-Pass123!`;
    const slug = `smoke-${suffix}`;
    const workspaceName = `Smoke ${suffix}`;

    try {
      const { cookieJar, result: signUp } = await signUpUser(email, password);

      expect(signUp.user.email).toBe(email);

      const workspace = await createWorkspace(cookieJar, workspaceName, slug);

      expect(workspace.slug).toBe(slug);

      await setActiveWorkspace(cookieJar, workspace.id);

      const session = await auth.api.getSession({
        headers: cookieJar.headers(),
      });

      expect(session).not.toBeNull();
      expect(session?.user.email).toBe(email);
      expect(session?.session.activeOrganizationId).toBe(workspace.id);

      const [userRow] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      expect(userRow).toBeDefined();

      const accountRows = await db.select().from(accounts).where(eq(accounts.userId, userRow!.id));
      expect(accountRows.length).toBeGreaterThan(0);

      const [workspaceRow] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.slug, slug))
        .limit(1);
      expect(workspaceRow?.id).toBe(workspace.id);

      const membershipRows = await db
        .select()
        .from(memberships)
        .where(and(eq(memberships.userId, userRow!.id), eq(memberships.workspaceId, workspace.id)));
      expect(membershipRows).toHaveLength(1);
      expect(membershipRows[0]?.role).toBe("admin");

      const sessionRows = await db.select().from(sessions).where(eq(sessions.userId, userRow!.id));
      expect(sessionRows.length).toBeGreaterThan(0);
      expect(sessionRows.some((row) => row.activeWorkspaceId === workspace.id)).toBe(true);
    } finally {
      await cleanupByEmailsAndSlug([email], slug);
    }
  });

  it("invites a second user and accepts the invitation into the workspace", async () => {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const inviteeEmail = `invitee+${suffix}@example.com`;
    const password = `Smoke-${suffix}-Pass123!`;
    const slug = `invite-${suffix}`;
    const workspaceName = `Invite ${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, workspaceName, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const invitation = await inviteMember(ownerJar, workspace.id, inviteeEmail, "member");

      expect(invitation.email).toBe(inviteeEmail.toLowerCase());
      expect(invitation.organizationId).toBe(workspace.id);
      expect(invitation.status).toBe("pending");

      const [invitationRowBeforeAccept] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitation.id))
        .limit(1);

      expect(invitationRowBeforeAccept?.status).toBe("pending");

      const { cookieJar: inviteeJar, result: inviteeSignUp } = await signUpUser(
        inviteeEmail,
        password,
        "Invitee"
      );

      expect(inviteeSignUp.user.email).toBe(inviteeEmail);

      const acceptance = await acceptInvitation(inviteeJar, invitation.id);

      expect(acceptance.invitation.id).toBe(invitation.id);
      expect(acceptance.invitation.status).toBe("accepted");
      expect(acceptance.member.organizationId).toBe(workspace.id);

      const inviteeSession = await auth.api.getSession({
        headers: inviteeJar.headers(),
      });

      expect(inviteeSession?.session.activeOrganizationId).toBe(workspace.id);

      const [inviteeUserRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, inviteeEmail))
        .limit(1);

      expect(inviteeUserRow).toBeDefined();

      const [invitationRowAfterAccept] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitation.id))
        .limit(1);

      expect(invitationRowAfterAccept?.status).toBe("accepted");

      const inviteeMembershipRows = await db
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.userId, inviteeUserRow!.id), eq(memberships.workspaceId, workspace.id))
        );

      expect(inviteeMembershipRows).toHaveLength(1);
      expect(inviteeMembershipRows[0]?.role).toBe("member");

      const inviteeSessionRows = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, inviteeUserRow!.id));

      expect(inviteeSessionRows.some((row) => row.activeWorkspaceId === workspace.id)).toBe(true);
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, inviteeEmail], slug);
    }
  });

  it("signs in an existing user and preserves active workspace state", async () => {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const email = `signin+${suffix}@example.com`;
    const password = `Smoke-${suffix}-Pass123!`;
    const slug = `signin-${suffix}`;
    const workspaceName = `Signin ${suffix}`;

    try {
      const { cookieJar: signUpJar } = await signUpUser(email, password, "Signin User");
      const workspace = await createWorkspace(signUpJar, workspaceName, slug);
      await setActiveWorkspace(signUpJar, workspace.id);

      const signOutResult = await client.signOut({
        fetchOptions: {
          throw: true,
          headers: signUpJar.headers(),
          onSuccess(context) {
            signUpJar.capture(context.response);
          },
        },
      });

      expect(signOutResult.success).toBe(true);

      const { cookieJar: signInJar, result: signIn } = await signInUser(email, password);

      expect(signIn.user.email).toBe(email);

      const session = await auth.api.getSession({
        headers: signInJar.headers(),
      });

      expect(session).not.toBeNull();
      expect(session?.user.email).toBe(email);

      const [userRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      expect(userRow).toBeDefined();

      const membershipRows = await db
        .select()
        .from(memberships)
        .where(and(eq(memberships.userId, userRow!.id), eq(memberships.workspaceId, workspace.id)));

      expect(membershipRows).toHaveLength(1);

      const sessionRows = await db.select().from(sessions).where(eq(sessions.userId, userRow!.id));

      expect(sessionRows.length).toBeGreaterThan(0);
    } finally {
      await cleanupByEmailsAndSlug([email], slug);
    }
  });
});
