import { describe, expect, it } from "vitest";

describe("auth smoke flow", () => {
  it.skip("signs up, creates a workspace, and sets the active workspace", async () => {
    // Intended first end-to-end auth integration flow:
    // 1. Apply DB migrations to a blank test database.
    // 2. Start the Next auth route against that database.
    // 3. Sign up a user via BetterAuth email/password flow.
    // 4. Create a workspace through the organization plugin.
    // 5. Set the active workspace on the session.
    // 6. Assert DB rows exist in:
    //    - auth.users
    //    - auth.accounts
    //    - auth.sessions
    //    - auth.workspaces
    //    - auth.memberships
    // 7. Assert auth.sessions.active_workspace_id matches the created workspace.

    expect(true).toBe(true);
  });
});
