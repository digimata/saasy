import {
  emailOTPClient,
  magicLinkClient,
  multiSessionClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";

import { createAuthClient } from "better-auth/react";

// @ts-ignore TS2742 — inferred type uses deep internal modules, but this is fine for type inference
// ------------------------------
// projects/saasy/apps/web/lib/auth/types/auth-client.ts
//
// export const authClient    L21
// export type AuthClient     L36
// export type Session        L38
// export type User           L39
// ------------------------------

export const authClient = createAuthClient({
  // Provide a placeholder baseURL to prevent errors in non-HTTP environments
  // (e.g., Tauri, Electron where window.location.origin is tauri:// or file://)
  // This client is only used for type inference and should not be used at runtime.
  // See: https://github.com/better-auth-ui/better-auth-ui/issues/313
  baseURL: "http://localhost",
  plugins: [
    multiSessionClient(),
    magicLinkClient(),
    emailOTPClient(),
    twoFactorClient(),
    organizationClient(),
  ],
});

export type AuthClient = typeof authClient;

export type Session = AuthClient["$Infer"]["Session"]["session"];
export type User = AuthClient["$Infer"]["Session"]["user"];
