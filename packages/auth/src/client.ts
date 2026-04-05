import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

// -----------------------
// projects/saasy/packages/auth/src/client.ts
//
// const baseURL       L11
// const authClient    L13
// -----------------------

const baseURL = process.env.NEXT_PUBLIC_APP_URL;

const authClient = createAuthClient({
  ...(baseURL ? { baseURL } : {}),
  plugins: [organizationClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
