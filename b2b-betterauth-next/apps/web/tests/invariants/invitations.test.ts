import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auth } from "@repo/auth";
import { db, invitations, memberships, users, workspaces } from "@repo/db";
import { and, eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";
import { parseSetCookieHeader } from "better-auth/cookies";
import { describe, expect, it } from "vitest";

// -------------------------------------------------------------
// projects/saasy/apps/web/tests/invariants/invitations.test.ts
//
// function createCookieJar()                    L21
// const client                                 L55
// let migrated                                 L63
// async function ensureMigrated()              L65
// async function signUpUser()                  L79
// async function createWorkspace()             L98
// async function setActiveWorkspace()         L116
// async function inviteMember()               L132
// async function acceptInvitation()           L161
// async function rejectInvitation()           L187
// async function cleanupByEmailsAndSlug()     L203
// describe("invitation invariants")          L226
// -------------------------------------------------------------

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

async function signUpUser(email: string, password: string, name: string) {
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
  };
}

async function acceptInvitation(
  cookieJar: ReturnType<typeof createCookieJar>,
  invitationId: string
) {
  return client.organization.acceptInvitation({
    invitationId,
    fetchOptions: {
      throw: true,
      headers: cookieJar.headers(),
      onSuccess(context) {
        cookieJar.capture(context.response);
      },
    },
  });
}

async function rejectInvitation(
  cookieJar: ReturnType<typeof createCookieJar>,
  invitationId: string
) {
  return client.organization.rejectInvitation({
    invitationId,
    fetchOptions: {
      throw: true,
      headers: cookieJar.headers(),
      onSuccess(context) {
        cookieJar.capture(context.response);
      },
    },
  });
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

describe("invitation invariants", () => {
  it("INV-INV-002 rejects duplicate pending invitations for the same canonical email", async function inv002() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const inviteeEmail = `Invitee+${suffix}@example.com`;
    const duplicateEmail = `invitee+${suffix}@example.com`;
    const password = `Invite-${suffix}-Pass123!`;
    const slug = `inv-duplicate-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Invite ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      await inviteMember(ownerJar, workspace.id, inviteeEmail);

      await expect(inviteMember(ownerJar, workspace.id, duplicateEmail)).rejects.toBeDefined();

      const pendingRows = await db
        .select()
        .from(invitations)
        .where(and(eq(invitations.workspaceId, workspace.id), eq(invitations.status, "pending")));

      expect(pendingRows).toHaveLength(1);
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, inviteeEmail, duplicateEmail], slug);
    }
  });

  it("INV-INV-003 rejects acceptance by a signed-in user whose email does not match", async function inv003() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const inviteeEmail = `invitee+${suffix}@example.com`;
    const otherEmail = `other+${suffix}@example.com`;
    const password = `Invite-${suffix}-Pass123!`;
    const slug = `inv-mismatch-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Invite ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const invitation = await inviteMember(ownerJar, workspace.id, inviteeEmail);
      const { cookieJar: otherJar } = await signUpUser(otherEmail, password, "Other User");

      await expect(acceptInvitation(otherJar, invitation.id)).rejects.toBeDefined();

      const [otherUserRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, otherEmail))
        .limit(1);

      const membershipRows = await db
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.userId, otherUserRow!.id), eq(memberships.workspaceId, workspace.id))
        );

      const [invitationRow] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitation.id))
        .limit(1);

      expect(membershipRows).toHaveLength(0);
      expect(invitationRow?.status).toBe("pending");
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, inviteeEmail, otherEmail], slug);
    }
  });

  it("INV-INV-004 rejects expired invitations without creating a membership", async function inv004() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const inviteeEmail = `invitee+${suffix}@example.com`;
    const password = `Invite-${suffix}-Pass123!`;
    const slug = `inv-expired-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Invite ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const invitation = await inviteMember(ownerJar, workspace.id, inviteeEmail);

      await db
        .update(invitations)
        .set({ expiresAt: new Date(Date.now() - 60_000) })
        .where(eq(invitations.id, invitation.id));

      const { cookieJar: inviteeJar } = await signUpUser(inviteeEmail, password, "Invitee");

      await expect(acceptInvitation(inviteeJar, invitation.id)).rejects.toBeDefined();

      const [inviteeUserRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, inviteeEmail))
        .limit(1);

      const membershipRows = await db
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.userId, inviteeUserRow!.id), eq(memberships.workspaceId, workspace.id))
        );

      const [invitationRow] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitation.id))
        .limit(1);

      expect(membershipRows).toHaveLength(0);
      expect(invitationRow?.status).toBe("pending");
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, inviteeEmail], slug);
    }
  });

  it("INV-INV-009 keeps rejected invitations closed", async function inv009() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const inviteeEmail = `invitee+${suffix}@example.com`;
    const password = `Invite-${suffix}-Pass123!`;
    const slug = `inv-closed-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Invite ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const invitation = await inviteMember(ownerJar, workspace.id, inviteeEmail);
      const { cookieJar: inviteeJar } = await signUpUser(inviteeEmail, password, "Invitee");

      await rejectInvitation(inviteeJar, invitation.id);
      await expect(acceptInvitation(inviteeJar, invitation.id)).rejects.toBeDefined();

      const [inviteeUserRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, inviteeEmail))
        .limit(1);

      const membershipRows = await db
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.userId, inviteeUserRow!.id), eq(memberships.workspaceId, workspace.id))
        );

      const [invitationRow] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitation.id))
        .limit(1);

      expect(membershipRows).toHaveLength(0);
      expect(invitationRow?.status).toBe("rejected");
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, inviteeEmail], slug);
    }
  });

  it("INV-INV-005 keeps accepted invitations in a terminal state", async function inv005() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const inviteeEmail = `invitee+${suffix}@example.com`;
    const password = `Invite-${suffix}-Pass123!`;
    const slug = `inv-terminal-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Invite ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const invitation = await inviteMember(ownerJar, workspace.id, inviteeEmail);
      const { cookieJar: inviteeJar } = await signUpUser(inviteeEmail, password, "Invitee");

      await acceptInvitation(inviteeJar, invitation.id);

      await expect(acceptInvitation(inviteeJar, invitation.id)).rejects.toBeDefined();
      await expect(rejectInvitation(inviteeJar, invitation.id)).rejects.toBeDefined();

      const [invitationRow] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitation.id))
        .limit(1);

      expect(invitationRow?.status).toBe("accepted");
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, inviteeEmail], slug);
    }
  });

  it("INV-INV-006 accepts invitations atomically", async function inv006() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const inviteeEmail = `invitee+${suffix}@example.com`;
    const password = `Invite-${suffix}-Pass123!`;
    const slug = `inv-atomic-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Invite ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const invitation = await inviteMember(ownerJar, workspace.id, inviteeEmail);
      const { cookieJar: inviteeJar } = await signUpUser(inviteeEmail, password, "Invitee");

      await acceptInvitation(inviteeJar, invitation.id);

      const [inviteeUserRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, inviteeEmail))
        .limit(1);

      const membershipRows = await db
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.userId, inviteeUserRow!.id), eq(memberships.workspaceId, workspace.id))
        );

      const [invitationRow] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitation.id))
        .limit(1);

      expect(membershipRows).toHaveLength(1);
      expect(invitationRow?.status).toBe("accepted");
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, inviteeEmail], slug);
    }
  });

  it("INV-INV-007 preserves a single membership under concurrent acceptance", async function inv007() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const inviteeEmail = `invitee+${suffix}@example.com`;
    const password = `Invite-${suffix}-Pass123!`;
    const slug = `inv-race-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Invite ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const invitation = await inviteMember(ownerJar, workspace.id, inviteeEmail);
      const { cookieJar: inviteeJar } = await signUpUser(inviteeEmail, password, "Invitee");

      const results = await Promise.allSettled([
        acceptInvitation(inviteeJar, invitation.id),
        acceptInvitation(inviteeJar, invitation.id),
      ]);

      const fulfilledCount = results.filter((result) => result.status === "fulfilled").length;

      const [inviteeUserRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, inviteeEmail))
        .limit(1);

      const membershipRows = await db
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.userId, inviteeUserRow!.id), eq(memberships.workspaceId, workspace.id))
        );

      const [invitationRow] = await db
        .select()
        .from(invitations)
        .where(eq(invitations.id, invitation.id))
        .limit(1);

      expect(fulfilledCount).toBeGreaterThan(0);
      expect(membershipRows).toHaveLength(1);
      expect(invitationRow?.status).toBe("accepted");

      const session = await auth.api.getSession({
        headers: inviteeJar.headers(),
      });

      expect(session?.session.activeOrganizationId).toBe(workspace.id);
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, inviteeEmail], slug);
    }
  });

  it("INV-INV-008 prevents duplicate access for existing members", async function inv008() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const inviteeEmail = `invitee+${suffix}@example.com`;
    const password = `Invite-${suffix}-Pass123!`;
    const slug = `inv-existing-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Invite ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const firstInvitation = await inviteMember(ownerJar, workspace.id, inviteeEmail);
      const { cookieJar: inviteeJar } = await signUpUser(inviteeEmail, password, "Invitee");
      await acceptInvitation(inviteeJar, firstInvitation.id);

      const [inviteeUserRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, inviteeEmail))
        .limit(1);

      const initialMembershipRows = await db
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.userId, inviteeUserRow!.id), eq(memberships.workspaceId, workspace.id))
        );

      expect(initialMembershipRows).toHaveLength(1);

      await expect(inviteMember(ownerJar, workspace.id, inviteeEmail)).rejects.toBeDefined();

      const finalMembershipRows = await db
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.userId, inviteeUserRow!.id), eq(memberships.workspaceId, workspace.id))
        );

      expect(finalMembershipRows).toHaveLength(1);
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, inviteeEmail], slug);
    }
  });
});
