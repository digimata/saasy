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
// projects/saasy/apps/web/tests/invariants/memberships.test.ts
//
// function createCookieJar()                    L21
// const client                                 L55
// let migrated                                 L63
// async function ensureMigrated()              L65
// async function signUpUser()                  L79
// async function createWorkspace()             L98
// async function setActiveWorkspace()         L116
// async function inviteMember()               L132
// async function acceptInvitation()           L150
// async function removeMember()               L176
// async function updateMemberRole()           L194
// async function cleanupByEmailsAndSlug()     L212
// describe("membership invariants")          L235
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
  return client.organization.setActive({
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
  return client.organization.inviteMember({
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
  });
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

async function removeMember(
  cookieJar: ReturnType<typeof createCookieJar>,
  workspaceId: string,
  memberIdOrEmail: string
) {
  return client.organization.removeMember({
    organizationId: workspaceId,
    memberIdOrEmail,
    fetchOptions: {
      throw: true,
      headers: cookieJar.headers(),
      onSuccess(context) {
        cookieJar.capture(context.response);
      },
    },
  });
}

async function updateMemberRole(
  cookieJar: ReturnType<typeof createCookieJar>,
  workspaceId: string,
  memberId: string,
  role: string
) {
  return client.organization.updateMemberRole({
    organizationId: workspaceId,
    memberId,
    role,
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

describe("membership invariants", () => {
  it("INV-MEM-003 rejects non-admin invitation attempts", async function mem003() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const memberEmail = `member+${suffix}@example.com`;
    const outsiderEmail = `outsider+${suffix}@example.com`;
    const password = `Member-${suffix}-Pass123!`;
    const slug = `mem-invite-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Members ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const invitation = await inviteMember(ownerJar, workspace.id, memberEmail, "member");
      const { cookieJar: memberJar } = await signUpUser(memberEmail, password, "Member");
      await acceptInvitation(memberJar, (invitation as { id: string }).id);

      await expect(inviteMember(memberJar, workspace.id, outsiderEmail, "member")).rejects.toBeDefined();

      const outsiderInvitations = await db
        .select()
        .from(invitations)
        .where(and(eq(invitations.workspaceId, workspace.id), eq(invitations.email, outsiderEmail)));

      expect(outsiderInvitations).toHaveLength(0);
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, memberEmail, outsiderEmail], slug);
    }
  });

  it("INV-MEM-005 rejects cross-workspace membership mutation attempts", async function mem005() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const adminAEmail = `admina+${suffix}@example.com`;
    const adminBEmail = `adminb+${suffix}@example.com`;
    const memberBEmail = `memberb+${suffix}@example.com`;
    const password = `Member-${suffix}-Pass123!`;
    const slugA = `mem-a-${suffix}`;
    const slugB = `mem-b-${suffix}`;

    try {
      const { cookieJar: adminAJar } = await signUpUser(adminAEmail, password, "Admin A");
      const workspaceA = await createWorkspace(adminAJar, `Workspace A ${suffix}`, slugA);
      await setActiveWorkspace(adminAJar, workspaceA.id);

      const { cookieJar: adminBJar } = await signUpUser(adminBEmail, password, "Admin B");
      const workspaceB = await createWorkspace(adminBJar, `Workspace B ${suffix}`, slugB);
      await setActiveWorkspace(adminBJar, workspaceB.id);

      const invitation = await inviteMember(adminBJar, workspaceB.id, memberBEmail, "member");
      const { cookieJar: memberBJar } = await signUpUser(memberBEmail, password, "Member B");
      await acceptInvitation(memberBJar, (invitation as { id: string }).id);

      await expect(removeMember(adminAJar, workspaceB.id, memberBEmail)).rejects.toBeDefined();

      const [memberBUserRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, memberBEmail))
        .limit(1);

      const workspaceBMemberships = await db
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.userId, memberBUserRow!.id), eq(memberships.workspaceId, workspaceB.id))
        );

      expect(workspaceBMemberships).toHaveLength(1);
    } finally {
      await cleanupByEmailsAndSlug([adminAEmail], slugA);
      await cleanupByEmailsAndSlug([adminBEmail, memberBEmail], slugB);
    }
  });

  it("INV-MEM-006 rejects self-escalation of membership role", async function mem006() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const memberEmail = `member+${suffix}@example.com`;
    const password = `Member-${suffix}-Pass123!`;
    const slug = `mem-escalate-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Escalate ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const invitation = await inviteMember(ownerJar, workspace.id, memberEmail, "member");
      const { cookieJar: memberJar } = await signUpUser(memberEmail, password, "Member");
      await acceptInvitation(memberJar, (invitation as { id: string }).id);

      const [memberUserRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, memberEmail))
        .limit(1);

      const [memberRow] = await db
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.userId, memberUserRow!.id), eq(memberships.workspaceId, workspace.id))
        )
        .limit(1);

      await expect(updateMemberRole(memberJar, workspace.id, memberRow!.id, "admin")).rejects.toBeDefined();

      const [updatedMemberRow] = await db
        .select()
        .from(memberships)
        .where(eq(memberships.id, memberRow!.id))
        .limit(1);

      expect(updatedMemberRow?.role).toBe("member");
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, memberEmail], slug);
    }
  });

  it("INV-MEM-002 rejects invalid membership role values", async function mem002() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const memberEmail = `member+${suffix}@example.com`;
    const password = `Member-${suffix}-Pass123!`;
    const slug = `mem-role-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Roles ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const invitation = await inviteMember(ownerJar, workspace.id, memberEmail, "member");
      const { cookieJar: memberJar } = await signUpUser(memberEmail, password, "Member");
      await acceptInvitation(memberJar, (invitation as { id: string }).id);

      const [memberUserRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, memberEmail))
        .limit(1);

      const [memberRow] = await db
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.userId, memberUserRow!.id), eq(memberships.workspaceId, workspace.id))
        )
        .limit(1);

      await expect(updateMemberRole(ownerJar, workspace.id, memberRow!.id, "superadmin")).rejects.toBeDefined();

      const [updatedMemberRow] = await db
        .select()
        .from(memberships)
        .where(eq(memberships.id, memberRow!.id))
        .limit(1);

      expect(updatedMemberRow?.role).toBe("member");
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, memberEmail], slug);
    }
  });
});
