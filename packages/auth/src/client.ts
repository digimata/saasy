import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

const baseURL = process.env.NEXT_PUBLIC_APP_URL;

const authClient = createAuthClient({
  ...(baseURL ? { baseURL } : {}),
  plugins: [organizationClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
