import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auth } from "@repo/auth";
import { db, memberships, users, workspaces } from "@repo/db";
import { and, eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";
import { parseSetCookieHeader } from "better-auth/cookies";
import { describe, expect, it } from "vitest";

// ------------------------------------------------------------
// projects/saasy/apps/web/tests/invariants/workspaces.test.ts
//
// function createCookieJar()                   L21
// const client                                L55
// let migrated                                L63
// async function ensureMigrated()             L65
// async function signUpUser()                 L79
// async function createWorkspace()            L98
// async function setActiveWorkspace()        L116
// async function inviteMember()              L132
// async function acceptInvitation()          L150
// async function updateWorkspace()           L176
// async function removeMember()              L194
// async function updateMemberRole()          L212
// async function cleanupByEmailsAndSlug()    L230
// describe("workspace invariants")          L253
// ------------------------------------------------------------

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

async function updateWorkspace(
  cookieJar: ReturnType<typeof createCookieJar>,
  workspaceId: string,
  data: { name?: string; slug?: string }
) {
  return client.organization.update({
    organizationId: workspaceId,
    data,
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

async function listMembers(cookieJar: ReturnType<typeof createCookieJar>, workspaceId: string) {
  return client.organization.listMembers({
    query: {
      organizationId: workspaceId,
    },
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

describe("workspace invariants", () => {
  it("INV-WS-002 creates a manageable workspace with an admin membership", async function ws002() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const email = `creator+${suffix}@example.com`;
    const password = `Workspace-${suffix}-Pass123!`;
    const slug = `ws-manageable-${suffix}`;

    try {
      const { cookieJar } = await signUpUser(email, password, "Creator");
      const workspace = await createWorkspace(cookieJar, `Workspace ${suffix}`, slug);
      await setActiveWorkspace(cookieJar, workspace.id);

      const [userRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      const [membershipRow] = await db
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.userId, userRow!.id), eq(memberships.workspaceId, workspace.id))
        )
        .limit(1);

      expect(membershipRow?.role).toBe("admin");
    } finally {
      await cleanupByEmailsAndSlug([email], slug);
    }
  });

  it("INV-WS-001 rejects slug collisions after canonicalization", async function ws001() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const firstEmail = `first+${suffix}@example.com`;
    const secondEmail = `second+${suffix}@example.com`;
    const password = `Workspace-${suffix}-Pass123!`;
    const mixedSlug = `Acme-${suffix}`;
    const canonicalSlug = `acme-${suffix}`;

    try {
      const { cookieJar: firstJar } = await signUpUser(firstEmail, password, "First User");
      await createWorkspace(firstJar, `Acme ${suffix}`, mixedSlug);

      const { cookieJar: secondJar } = await signUpUser(secondEmail, password, "Second User");

      await expect(createWorkspace(secondJar, `Acme Lower ${suffix}`, canonicalSlug)).rejects.toBeDefined();
    } finally {
      await cleanupByEmailsAndSlug([firstEmail], mixedSlug);
      await cleanupByEmailsAndSlug([secondEmail], canonicalSlug);
    }
  });

  it("INV-WS-004 rejects workspace setting updates by non-admin members", async function ws004() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const memberEmail = `member+${suffix}@example.com`;
    const password = `Workspace-${suffix}-Pass123!`;
    const slug = `ws-update-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Workspace ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const invitation = await inviteMember(ownerJar, workspace.id, memberEmail, "member");
      const { cookieJar: memberJar } = await signUpUser(memberEmail, password, "Member");
      await acceptInvitation(memberJar, (invitation as { id: string }).id);

      await expect(
        updateWorkspace(memberJar, workspace.id, {
          name: `Renamed ${suffix}`,
        })
      ).rejects.toBeDefined();

      const [workspaceRow] = await db
        .select()
        .from(workspaces)
        .where(eq(workspaces.id, workspace.id))
        .limit(1);

      expect(workspaceRow?.name).toBe(`Workspace ${suffix}`);
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, memberEmail], slug);
    }
  });

  it("INV-WS-003 rejects workspace-scoped reads by non-members", async function ws003() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const outsiderEmail = `outsider+${suffix}@example.com`;
    const password = `Workspace-${suffix}-Pass123!`;
    const slug = `ws-read-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Workspace ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const { cookieJar: outsiderJar } = await signUpUser(outsiderEmail, password, "Outsider");

      await expect(listMembers(outsiderJar, workspace.id)).rejects.toBeDefined();
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, outsiderEmail], slug);
    }
  });

  it("INV-WS-005 rejects removing the sole admin from a workspace", async function ws005remove() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const password = `Workspace-${suffix}-Pass123!`;
    const slug = `ws-remove-admin-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Workspace ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      await expect(removeMember(ownerJar, workspace.id, ownerEmail)).rejects.toBeDefined();

      const [ownerUserRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, ownerEmail))
        .limit(1);

      const adminMemberships = await db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.userId, ownerUserRow!.id),
            eq(memberships.workspaceId, workspace.id),
            eq(memberships.role, "admin")
          )
        );

      expect(adminMemberships).toHaveLength(1);
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail], slug);
    }
  });

  it("INV-WS-005 rejects demoting the sole admin of a workspace", async function ws005demote() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const password = `Workspace-${suffix}-Pass123!`;
    const slug = `ws-demote-admin-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Workspace ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const [ownerUserRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, ownerEmail))
        .limit(1);

      const [ownerMembership] = await db
        .select()
        .from(memberships)
        .where(
          and(eq(memberships.userId, ownerUserRow!.id), eq(memberships.workspaceId, workspace.id))
        )
        .limit(1);

      await expect(updateMemberRole(ownerJar, workspace.id, ownerMembership!.id, "member")).rejects.toBeDefined();

      const [updatedMembership] = await db
        .select()
        .from(memberships)
        .where(eq(memberships.id, ownerMembership!.id))
        .limit(1);

      expect(updatedMembership?.role).toBe("admin");
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail], slug);
    }
  });
});
