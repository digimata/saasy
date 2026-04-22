import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq, like } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const auth_state = vi.hoisted(() => ({
  user_id: null as string | null,
  clerk_user: null as
    | {
        id: string;
        primaryEmailAddressId: string | null;
        emailAddresses: Array<{ id: string; emailAddress: string }>;
        firstName: string | null;
        lastName: string | null;
        imageUrl: string | null;
      }
    | null,
}));

const svix_state = vi.hoisted(() => ({
  event: null as
    | {
        type: string;
        data: Record<string, unknown>;
      }
    | null,
  should_throw: false,
}));

vi.mock("@clerk/hono", () => ({
  clerkMiddleware: () => async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<unknown>) => {
    c.set("clerk", {
      users: {
        getUser: async () => {
          if (!auth_state.clerk_user) {
            throw new Error("missing test Clerk user");
          }

          return auth_state.clerk_user;
        },
      },
    });

    await next();
  },
  getAuth: () =>
    auth_state.user_id
      ? {
          userId: auth_state.user_id,
        }
      : null,
}));

vi.mock("svix", () => ({
  Webhook: class {
    verify() {
      if (svix_state.should_throw || !svix_state.event) {
        throw new Error("invalid signature");
      }

      return svix_state.event;
    }
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  },
  logreq: async (_c: unknown, next: () => Promise<unknown>) => {
    await next();
  },
}));

import { build } from "@/app";
import { db, users } from "@repo/db";

let migrated = false;

async function ensure_migrated() {
  if (migrated) {
    return;
  }

  const migrations_folder = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../../packages/db/drizzle",
  );

  await migrate(db, { migrationsFolder: migrations_folder });
  migrated = true;
}

function test_clerk_id(label: string): string {
  return `inv_test_${label}_${randomUUID().slice(0, 8)}`;
}

function test_email(label: string): string {
  return `inv+${label}.${randomUUID().slice(0, 8)}@example.com`;
}

function user_event(
  type: "user.created" | "user.updated",
  clerk_user_id: string,
  email: string,
  overrides: Partial<{
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    email_addresses: Array<{ id: string; email_address: string }>;
    primary_email_address_id: string | null;
  }> = {},
) {
  return {
    type,
    data: {
      id: clerk_user_id,
      email_addresses:
        overrides.email_addresses ?? [{ id: "em_1", email_address: email }],
      primary_email_address_id: overrides.primary_email_address_id ?? "em_1",
      first_name: overrides.first_name ?? "Test",
      last_name: overrides.last_name ?? "User",
      image_url: overrides.image_url ?? "https://example.com/avatar.png",
    },
  };
}

function deleted_event(clerk_user_id: string) {
  return {
    type: "user.deleted",
    data: {
      id: clerk_user_id,
    },
  };
}

function webhook_headers() {
  return {
    "content-type": "application/json",
    "svix-id": "msg_test_123",
    "svix-timestamp": "1700000000",
    "svix-signature": "v1,test",
  };
}

async function rows_for(clerk_user_id: string) {
  return db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerk_user_id));
}

async function cleanup_test_rows() {
  await db.delete(users).where(like(users.clerkUserId, "inv_test_%"));
}

describe("sync invariants", () => {
  beforeAll(async () => {
    await ensure_migrated();
  });

  beforeEach(() => {
    auth_state.user_id = null;
    auth_state.clerk_user = null;
    svix_state.event = null;
    svix_state.should_throw = false;
  });

  afterEach(async () => {
    await cleanup_test_rows();
  });

  it("INV-SYNC-001 rejects webhook requests missing svix headers", async () => {
    const app = build();
    const response = await app.request("http://localhost/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "validation_error",
      },
    });
  });

  it.fails(
    "INV-AUTH-001 keeps canonical email identities globally unique",
    async () => {
      const first_clerk_user_id = test_clerk_id("canonical_first");
      const second_clerk_user_id = test_clerk_id("canonical_second");

      const app = build();

      svix_state.event = user_event(
        "user.created",
        first_clerk_user_id,
        "User.Name@example.com",
      );

      const first = await app.request("http://localhost/webhooks/clerk", {
        method: "POST",
        headers: webhook_headers(),
        body: JSON.stringify({ id: first_clerk_user_id }),
      });

      svix_state.event = user_event(
        "user.created",
        second_clerk_user_id,
        "user.name@example.com",
      );

      const second = await app.request("http://localhost/webhooks/clerk", {
        method: "POST",
        headers: webhook_headers(),
        body: JSON.stringify({ id: second_clerk_user_id }),
      });

      expect(first.status).toBe(200);
      expect(second.status).toBe(409);
    },
  );

  it("INV-SYNC-001 rejects webhook requests with invalid svix proof", async () => {
    svix_state.should_throw = true;

    const app = build();
    const response = await app.request("http://localhost/webhooks/clerk", {
      method: "POST",
      headers: webhook_headers(),
      body: JSON.stringify({ ok: true }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "unauthorized",
      },
    });
  });

  it("INV-SYNC-002 rejects user sync inputs without a resolvable email", async () => {
    const clerk_user_id = test_clerk_id("missing_email");
    svix_state.event = user_event("user.created", clerk_user_id, "unused@example.com", {
      email_addresses: [],
      primary_email_address_id: null,
    });

    const app = build();
    const response = await app.request("http://localhost/webhooks/clerk", {
      method: "POST",
      headers: webhook_headers(),
      body: JSON.stringify({ id: clerk_user_id }),
    });

    expect(response.status).toBe(400);
    await expect(rows_for(clerk_user_id)).resolves.toHaveLength(0);
  });

  it("INV-SYNC-003 keeps webhook sync idempotent under duplicate delivery", async () => {
    const clerk_user_id = test_clerk_id("idempotent");
    const email = test_email("idempotent");
    svix_state.event = user_event("user.updated", clerk_user_id, email, {
      first_name: "Updated",
      last_name: "User",
    });

    const app = build();

    const first = await app.request("http://localhost/webhooks/clerk", {
      method: "POST",
      headers: webhook_headers(),
      body: JSON.stringify({ id: clerk_user_id }),
    });

    const second = await app.request("http://localhost/webhooks/clerk", {
      method: "POST",
      headers: webhook_headers(),
      body: JSON.stringify({ id: clerk_user_id }),
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);

    const matching_rows = await rows_for(clerk_user_id);

    expect(matching_rows).toHaveLength(1);
    expect(matching_rows[0]?.email).toBe(email);
    expect(matching_rows[0]?.firstName).toBe("Updated");
  });

  it("INV-SYNC-004 keeps lazy sync and webhook sync converged on one row", async () => {
    const clerk_user_id = test_clerk_id("converged");
    const email = test_email("converged");

    auth_state.user_id = clerk_user_id;
    auth_state.clerk_user = {
      id: clerk_user_id,
      primaryEmailAddressId: "em_lazy",
      emailAddresses: [{ id: "em_lazy", emailAddress: email }],
      firstName: "Lazy",
      lastName: "Sync",
      imageUrl: "https://example.com/lazy.png",
    };

    const app = build();
    const lazy_sync = await app.request("http://localhost/me");

    expect(lazy_sync.status).toBe(200);

    svix_state.event = user_event("user.updated", clerk_user_id, email, {
      first_name: "Webhook",
      last_name: "Sync",
    });

    const webhook_sync = await app.request("http://localhost/webhooks/clerk", {
      method: "POST",
      headers: webhook_headers(),
      body: JSON.stringify({ id: clerk_user_id }),
    });

    expect(webhook_sync.status).toBe(200);

    const matching_rows = await rows_for(clerk_user_id);

    expect(matching_rows).toHaveLength(1);
    expect(matching_rows[0]?.firstName).toBe("Webhook");
  });

  it("INV-SYNC-005 deletes only the addressed Clerk user row and stays safe on replay", async () => {
    const deleted_clerk_user_id = test_clerk_id("delete_target");
    const surviving_clerk_user_id = test_clerk_id("delete_survivor");

    await db.insert(users).values([
      {
        clerkUserId: deleted_clerk_user_id,
        email: test_email("delete_target"),
        firstName: "Delete",
        lastName: "Me",
      },
      {
        clerkUserId: surviving_clerk_user_id,
        email: test_email("delete_survivor"),
        firstName: "Keep",
        lastName: "Me",
      },
    ]);

    svix_state.event = deleted_event(deleted_clerk_user_id);

    const app = build();
    const first = await app.request("http://localhost/webhooks/clerk", {
      method: "POST",
      headers: webhook_headers(),
      body: JSON.stringify({ id: deleted_clerk_user_id }),
    });

    const second = await app.request("http://localhost/webhooks/clerk", {
      method: "POST",
      headers: webhook_headers(),
      body: JSON.stringify({ id: deleted_clerk_user_id }),
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    await expect(rows_for(deleted_clerk_user_id)).resolves.toHaveLength(0);
    await expect(rows_for(surviving_clerk_user_id)).resolves.toHaveLength(1);
  });
});
