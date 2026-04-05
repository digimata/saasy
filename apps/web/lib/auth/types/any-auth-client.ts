import type { createAuthClient } from "better-auth/react";

// -------------------------------
// projects/saasy/apps/web/lib/auth/types/any-auth-client.ts
//
// export type AnyAuthClient    L9
// -------------------------------

export type AnyAuthClient = Omit<ReturnType<typeof createAuthClient>, "signUp" | "getSession">;
