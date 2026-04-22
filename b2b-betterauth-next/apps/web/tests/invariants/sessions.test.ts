import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auth } from "@repo/auth";
import { db, sessions, users, workspaces } from "@repo/db";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";
import { parseSetCookieHeader } from "better-auth/cookies";
import { describe, expect, it } from "vitest";

// ----------------------------------------------------------
// projects/saasy/apps/web/tests/invariants/sessions.test.ts
//
// function createCookieJar()                 L21
// const client                              L55
// let migrated                              L63
// async function ensureMigrated()           L65
// async function signUpUser()               L79
// async function createWorkspace()          L98
// async function setActiveWorkspace()      L116
// async function inviteMember()            L132
// async function acceptInvitation()        L150
// async function removeMember()            L176
// async function getFreshSession()         L191
// async function cleanupByEmailsAndSlug()  L201
// describe("session invariants")          L224
// ----------------------------------------------------------

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

async function getFreshSession(cookieJar: ReturnType<typeof createCookieJar> | Headers) {
  const headers = cookieJar instanceof Headers ? cookieJar : cookieJar.headers();

  return auth.api.getSession({
    headers,
    query: {
      disableCookieCache: true,
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

describe("session invariants", () => {
  it("INV-SES-001 keeps session tokens unique and bound to one user", async function ses001() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const firstEmail = `first+${suffix}@example.com`;
    const secondEmail = `second+${suffix}@example.com`;
    const password = `Session-${suffix}-Pass123!`;

    try {
      await signUpUser(firstEmail, password, "First User");
      await signUpUser(secondEmail, password, "Second User");

      const [firstUserRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, firstEmail))
        .limit(1);

      const [secondUserRow] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, secondEmail))
        .limit(1);

      const firstSessionRows = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, firstUserRow!.id));

      const secondSessionRows = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, secondUserRow!.id));

      expect(firstSessionRows.length).toBeGreaterThan(0);
      expect(secondSessionRows.length).toBeGreaterThan(0);

      const tokens = new Set([
        ...firstSessionRows.map((row) => row.token),
        ...secondSessionRows.map((row) => row.token),
      ]);

      expect(tokens.size).toBe(firstSessionRows.length + secondSessionRows.length);
      expect(firstSessionRows.every((row) => row.userId === firstUserRow!.id)).toBe(true);
      expect(secondSessionRows.every((row) => row.userId === secondUserRow!.id)).toBe(true);
    } finally {
      await cleanupByEmailsAndSlug([firstEmail, secondEmail], `missing-${suffix}`);
    }
  });

  it("INV-SES-002 fails closed for expired sessions", async function ses002() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const email = `expired+${suffix}@example.com`;
    const password = `Session-${suffix}-Pass123!`;
    const slug = `ses-expired-${suffix}`;

    try {
      const { cookieJar } = await signUpUser(email, password, "Expired Session");
      const workspace = await createWorkspace(cookieJar, `Expired ${suffix}`, slug);
      await setActiveWorkspace(cookieJar, workspace.id);

      const originalHeaders = cookieJar.headers();

      await db
        .update(sessions)
        .set({ expiresAt: new Date(Date.now() - 60_000) })
        .where(eq(sessions.userId, (await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1))[0]!.id));

      const session = await getFreshSession(originalHeaders);
      expect(session).toBeNull();
    } finally {
      await cleanupByEmailsAndSlug([email], slug);
    }
  });

  it("INV-SES-003 invalidates the session server-side after sign-out", async function ses003() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const email = `signout+${suffix}@example.com`;
    const password = `Session-${suffix}-Pass123!`;
    const slug = `ses-signout-${suffix}`;

    try {
      const { cookieJar } = await signUpUser(email, password, "Signout Session");
      const workspace = await createWorkspace(cookieJar, `Signout ${suffix}`, slug);
      await setActiveWorkspace(cookieJar, workspace.id);

      const originalHeaders = cookieJar.headers();

      const result = await client.signOut({
        fetchOptions: {
          throw: true,
          headers: cookieJar.headers(),
          onSuccess(context) {
            cookieJar.capture(context.response);
          },
        },
      });

      expect(result.success).toBe(true);

      const session = await getFreshSession(originalHeaders);
      expect(session).toBeNull();
    } finally {
      await cleanupByEmailsAndSlug([email], slug);
    }
  });

  it("INV-SES-004 rejects setting an active workspace the user does not belong to", async function ses004() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const firstEmail = `first+${suffix}@example.com`;
    const secondEmail = `second+${suffix}@example.com`;
    const password = `Session-${suffix}-Pass123!`;
    const firstSlug = `ses-first-${suffix}`;
    const secondSlug = `ses-second-${suffix}`;

    try {
      const { cookieJar: firstJar } = await signUpUser(firstEmail, password, "First User");
      const firstWorkspace = await createWorkspace(firstJar, `First ${suffix}`, firstSlug);
      await setActiveWorkspace(firstJar, firstWorkspace.id);

      const { cookieJar: secondJar } = await signUpUser(secondEmail, password, "Second User");
      const secondWorkspace = await createWorkspace(secondJar, `Second ${suffix}`, secondSlug);
      await setActiveWorkspace(secondJar, secondWorkspace.id);

      await expect(setActiveWorkspace(firstJar, secondWorkspace.id)).rejects.toBeDefined();

      const session = await getFreshSession(firstJar);

      expect(session?.user.email).toBe(firstEmail);
      expect(session?.session.activeOrganizationId).not.toBe(secondWorkspace.id);
      expect([firstWorkspace.id, null]).toContain(session?.session.activeOrganizationId ?? null);
    } finally {
      await cleanupByEmailsAndSlug([firstEmail, secondEmail], firstSlug);
      await cleanupByEmailsAndSlug([], secondSlug);
    }
  });

  it("INV-SES-005 clears stale active workspace context after membership removal", async function ses005() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const ownerEmail = `owner+${suffix}@example.com`;
    const inviteeEmail = `invitee+${suffix}@example.com`;
    const password = `Session-${suffix}-Pass123!`;
    const slug = `ses-remove-${suffix}`;

    try {
      const { cookieJar: ownerJar } = await signUpUser(ownerEmail, password, "Owner");
      const workspace = await createWorkspace(ownerJar, `Remove ${suffix}`, slug);
      await setActiveWorkspace(ownerJar, workspace.id);

      const invitation = await inviteMember(ownerJar, workspace.id, inviteeEmail);
      const { cookieJar: inviteeJar } = await signUpUser(inviteeEmail, password, "Invitee");

      await acceptInvitation(inviteeJar, (invitation as { id: string }).id);

      const beforeRemovalSession = await getFreshSession(inviteeJar);
      expect(beforeRemovalSession?.session.activeOrganizationId).toBe(workspace.id);

      await removeMember(ownerJar, workspace.id, inviteeEmail);

      const afterRemovalSession = await getFreshSession(inviteeJar);

      expect(afterRemovalSession?.user.email).toBe(inviteeEmail);
      expect(afterRemovalSession?.session.activeOrganizationId ?? null).toBeNull();
    } finally {
      await cleanupByEmailsAndSlug([ownerEmail, inviteeEmail], slug);
    }
  });
});
