import { afterEach, describe, expect, it, vi } from "vitest";

function makeSelectBuilder(result: unknown) {
  const builder = {
    from: vi.fn(() => builder),
    innerJoin: vi.fn(() => builder),
    where: vi.fn(() => builder),
    limit: vi.fn(async () => result),
  };

  return builder;
}

async function loadWorkspaceResolver(options?: {
  session?: {
    user: { id: string };
    session: { activeOrganizationId?: string | null };
  } | null;
  rows?: unknown[];
}) {
  vi.resetModules();

  const getSession = vi.fn(async () => options?.session ?? null);
  const db = {
    select: vi.fn(() => makeSelectBuilder(options?.rows ?? [])),
  };

  vi.doMock("next/headers", () => ({
    headers: vi.fn(async () => new Headers()),
  }));
  vi.doMock("@repo/auth", () => ({
    auth: {
      api: {
        getSession,
      },
    },
  }));
  vi.doMock("@repo/db", () => ({ db }));
  vi.doMock("@repo/db/schema", () => ({
    memberships: {
      workspaceId: Symbol("memberships.workspaceId"),
      userId: Symbol("memberships.userId"),
    },
    workspaces: {
      id: Symbol("workspaces.id"),
    },
  }));
  vi.doMock("drizzle-orm", () => ({
    and: vi.fn(() => Symbol("and")),
    eq: vi.fn(() => Symbol("eq")),
  }));

  const mod = await import("../../app/api/billing/workspace");

  return { mod, getSession, db };
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("billing workspace resolver", () => {
  it("returns 401 when there is no active workspace in session", async function billingWorkspace001() {
    const { mod, db } = await loadWorkspaceResolver({
      session: {
        user: { id: "user_123" },
        session: { activeOrganizationId: null },
      },
    });

    const response = await mod.resolveBillingWorkspace();

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
    expect(db.select).not.toHaveBeenCalled();
  });

  it("returns 403 when the signed-in user is not a member of the active workspace", async function billingWorkspace002() {
    const { mod } = await loadWorkspaceResolver({
      session: {
        user: { id: "user_123" },
        session: { activeOrganizationId: "ws_123" },
      },
      rows: [],
    });

    const response = await mod.resolveBillingWorkspace();

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(403);
  });

  it("returns the active workspace for a valid member", async function billingWorkspace003() {
    const workspace = { id: "ws_123", name: "Acme", slug: "acme" };
    const { mod } = await loadWorkspaceResolver({
      session: {
        user: { id: "user_123" },
        session: { activeOrganizationId: "ws_123" },
      },
      rows: [{ workspace }],
    });

    await expect(mod.resolveBillingWorkspace()).resolves.toEqual({
      workspace,
      userId: "user_123",
    });
  });
});
