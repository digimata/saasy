import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auth } from "@repo/auth";
import { accounts, db, users, verifications } from "@repo/db";
import { and, eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createAuthClient } from "better-auth/client";
import { emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { parseSetCookieHeader } from "better-auth/cookies";
import { describe, expect, it } from "vitest";

// -------------------------------------------------------
// projects/saasy/apps/web/tests/invariants/auth.test.ts
//
// function createCookieJar()                L21
// const client                             L55
// let migrated                             L63
// async function ensureMigrated()          L65
// async function signUpUser()              L79
// async function signInUser()              L98
// async function cleanupByEmails()         L117
// describe("auth invariants")             L134
// -------------------------------------------------------

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
  plugins: [emailOTPClient(), organizationClient()],
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

async function cleanupByEmails(emails: string[]) {
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

describe("auth invariants", () => {
  it("INV-AUTH-001 rejects duplicate canonical emails", async function auth001() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const firstEmail = `User.${suffix}@example.com`;
    const secondEmail = `user.${suffix}@example.com`;
    const password = `Auth-${suffix}-Pass123!`;

    try {
      await signUpUser(firstEmail, password, "First User");

      await expect(signUpUser(secondEmail, password, "Second User")).rejects.toBeDefined();

      const matchingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, secondEmail));

      expect(matchingUsers).toHaveLength(1);
    } finally {
      await cleanupByEmails([firstEmail, secondEmail]);
    }
  });

  it("INV-AUTH-002 enforces provider account uniqueness at the database layer", async function auth002() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const firstEmail = `first+${suffix}@example.com`;
    const secondEmail = `second+${suffix}@example.com`;

    try {
      const [firstUser] = await db
        .insert(users)
        .values({ email: firstEmail, name: "First" })
        .returning({ id: users.id });

      const [secondUser] = await db
        .insert(users)
        .values({ email: secondEmail, name: "Second" })
        .returning({ id: users.id });

      await db.insert(accounts).values({
        userId: firstUser!.id,
        providerId: "google",
        accountId: "provider-123",
      });

      await expect(
        db.insert(accounts).values({
          userId: secondUser!.id,
          providerId: "google",
          accountId: "provider-123",
        })
      ).rejects.toBeDefined();
    } finally {
      await cleanupByEmails([firstEmail, secondEmail]);
    }
  });

  it("INV-AUTH-003 keeps sign-up idempotent under concurrent retries", async function auth003() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const email = `race+${suffix}@example.com`;
    const password = `Auth-${suffix}-Pass123!`;

    try {
      const results = await Promise.allSettled([
        signUpUser(email, password, "Race User"),
        signUpUser(email, password, "Race User"),
      ]);

      const fulfilledCount = results.filter((result) => result.status === "fulfilled").length;

      const matchingUsers = await db.select().from(users).where(eq(users.email, email));
      const [userRow] = matchingUsers;

      const matchingAccounts = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, userRow!.id), eq(accounts.providerId, "credential")));

      expect(fulfilledCount).toBe(1);
      expect(matchingUsers).toHaveLength(1);
      expect(matchingAccounts).toHaveLength(1);
    } finally {
      await cleanupByEmails([email]);
    }
  });

  it("INV-AUTH-004 rejects invalid password authentication attempts", async function auth004() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const email = `signin+${suffix}@example.com`;
    const password = `Auth-${suffix}-Pass123!`;

    try {
      await signUpUser(email, password, "Signin User");

      await expect(signInUser(email, `${password}-wrong`)).rejects.toBeDefined();

      const { result } = await signInUser(email, password);
      expect(result.user.email).toBe(email);
    } finally {
      await cleanupByEmails([email]);
    }
  });

  it("INV-AUTH-005 keeps sign-in OTPs single-use", async function auth005() {
    await ensureMigrated();

    const suffix = randomUUID().slice(0, 8);
    const email = `otp+${suffix}@example.com`;
    const password = `Auth-${suffix}-Pass123!`;

    try {
      await signUpUser(email, password, "OTP User");

      await client.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
        fetchOptions: {
          throw: true,
        },
      });

      const [verificationRow] = await db
        .select()
        .from(verifications)
        .where(eq(verifications.identifier, `sign-in-otp-${email}`))
        .limit(1);

      const otp = verificationRow?.value.split(":")[0];

      expect(otp).toBeDefined();

      await client.signIn.emailOtp({
        email,
        otp: otp!,
        fetchOptions: {
          throw: true,
        },
      });

      await expect(
        client.signIn.emailOtp({
          email,
          otp: otp!,
          fetchOptions: {
            throw: true,
          },
        })
      ).rejects.toBeDefined();
    } finally {
      await cleanupByEmails([email]);
    }
  });

  it("INV-AUTH-006 rejects invalid session tokens during validated session lookup", async function auth006() {
    await ensureMigrated();

    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: "better-auth.session_token=bogus-session-token",
      }),
      query: {
        disableCookieCache: true,
      },
    });

    expect(session).toBeNull();
  });
});
