import { beforeEach, describe, expect, it, vi } from "vitest";

const clerk_state = vi.hoisted(() => ({
  user_id: null as string | null,
}));

vi.mock("@clerk/hono", () => ({
  clerkMiddleware: vi.fn(),
  getAuth: () =>
    clerk_state.user_id
      ? {
          userId: clerk_state.user_id,
        }
      : null,
}));

import { currentUserId, requireAuth } from "@/lib/auth";
import { UnauthorizedError } from "@/lib/error";

describe("auth invariants", () => {
  beforeEach(() => {
    clerk_state.user_id = null;
  });

  it("INV-AUTH-002 rejects missing Clerk auth context", async () => {
    const next = vi.fn();

    await expect(requireAuth({} as never, next)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(next).not.toHaveBeenCalled();
    expect(() => currentUserId({} as never)).toThrow(UnauthorizedError);
  });

  it("INV-AUTH-002 accepts validated Clerk auth context", async () => {
    clerk_state.user_id = "user_test_auth";

    const next = vi.fn();
    await requireAuth({} as never, next);

    expect(next).toHaveBeenCalledOnce();
    expect(currentUserId({} as never)).toBe("user_test_auth");
  });
});
