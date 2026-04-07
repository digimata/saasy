import { afterEach, describe, expect, it, vi } from "vitest";

type BillingPlan = {
  id: "hobby" | "pro" | "ultra";
  version: number;
};

async function loadEntitlementsModule(plan: BillingPlan = { id: "hobby", version: 1 }) {
  vi.resetModules();

  const getWorkspaceBillingState = vi.fn(async () => ({
    plan,
    status: plan.id === "hobby" ? null : "active",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    hasCustomer: plan.id !== "hobby",
  }));

  const selectBuilder = {
    from: vi.fn(() => selectBuilder),
    where: vi.fn(() => selectBuilder),
    limit: vi.fn(async () => []),
  };

  const db = {
    select: vi.fn(() => selectBuilder),
    insert: vi.fn(() => ({ values: vi.fn(), onConflictDoUpdate: vi.fn() })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    execute: vi.fn(async () => []),
  };

  vi.doMock("@repo/db", () => ({ db }));
  vi.doMock("@repo/db/schema", () => ({
    usage: {
      workspaceId: Symbol("usage.workspaceId"),
      feature: Symbol("usage.feature"),
      val: Symbol("usage.val"),
    },
  }));
  vi.doMock("drizzle-orm", () => ({
    and: vi.fn(() => Symbol("and")),
    eq: vi.fn(() => Symbol("eq")),
    sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values })),
  }));
  vi.doMock("../src/stripe", () => ({
    getWorkspaceBillingState,
  }));

  const mod = await import("../src/entitlements");

  return { mod, db, getWorkspaceBillingState };
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("entitlement invariants", () => {
  it("INV-ENT-001 resolves the same plan version to the same entitlement set", async function ent001() {
    const { mod } = await loadEntitlementsModule();

    const first = mod.entitlementsFor({ id: "pro", version: 1 });
    const second = mod.entitlementsFor({ id: "pro", version: 1 });

    expect(first.plan).toEqual({ id: "pro", version: 1 });
    expect(second.plan).toEqual({ id: "pro", version: 1 });
    expect(first.has("api_access")).toBe(true);
    expect(second.has("api_access")).toBe(true);
    expect(first.value("max_projects")).toBe(20);
    expect(second.value("max_projects")).toBe(20);
    expect(first.value("custom_domains")).toBe(false);
    expect(second.value("custom_domains")).toBe(false);
  });

  it("INV-ENT-002 resolves exactly one effective entitlement set from workspace billing state", async function ent002() {
    const hobby = await loadEntitlementsModule({ id: "hobby", version: 1 });
    const hobbyEntitlements = await hobby.mod.getWorkspaceEntitlements("ws_hobby");
    expect(hobbyEntitlements.plan).toEqual({ id: "hobby", version: 1 });
    expect(hobbyEntitlements.has("api_access")).toBe(false);
    expect(hobbyEntitlements.value("max_projects")).toBe(3);

    const pro = await loadEntitlementsModule({ id: "pro", version: 1 });
    const proEntitlements = await pro.mod.getWorkspaceEntitlements("ws_pro");
    expect(proEntitlements.plan).toEqual({ id: "pro", version: 1 });
    expect(proEntitlements.has("api_access")).toBe(true);
    expect(proEntitlements.value("max_projects")).toBe(20);
  });

  it("INV-ENT-003 keeps server-side entitlement enforcement authoritative", async function ent003() {
    const { mod } = await loadEntitlementsModule();

    const hobby = mod.entitlementsFor({ id: "hobby", version: 1 });
    const pro = mod.entitlementsFor({ id: "pro", version: 1 });

    expect(() => hobby.check("api_access")).toThrow(mod.EntitlementError);
    expect(() => pro.check("api_access")).not.toThrow();
  });

  it("INV-ENT-006 blocks further expansion after a downgrade below the new stock limit", async function ent006() {
    const { mod } = await loadEntitlementsModule();

    const hobby = mod.entitlementsFor({ id: "hobby", version: 1 });
    const pro = mod.entitlementsFor({ id: "pro", version: 1 });
    const ultra = mod.entitlementsFor({ id: "ultra", version: 1 });

    expect(() => pro.check("max_projects", 19)).not.toThrow();
    expect(() => pro.check("max_projects", 20)).toThrow(mod.EntitlementError);

    expect(() => hobby.check("max_projects", 3)).toThrow(mod.EntitlementError);
    expect(() => ultra.check("max_projects", 999)).not.toThrow();
  });

  it("INV-ENT-007 fails closed for unknown plan versions and entitlement IDs", async function ent007() {
    const { mod } = await loadEntitlementsModule();

    const unknownVersion = mod.entitlementsFor({ id: "pro", version: 999 });
    expect(() => unknownVersion.has("api_access")).toThrow(/Unknown plan version/);

    const known = mod.entitlementsFor({ id: "pro", version: 1 });
    expect(() => known.has("not_real" as never)).toThrow(/Unknown entitlement/);
  });
});
