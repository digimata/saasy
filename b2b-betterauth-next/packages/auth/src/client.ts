import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  multiSessionClient,
  organizationClient,
} from "better-auth/client/plugins";
import type { SocialProvider } from "better-auth/social-providers";

// ------------------------------------------
// projects/saasy/packages/auth/src/client.ts
//
// const baseURL                          L18
// const socialProviders                  L19
// export const enabledSocialProviders    L24
// export const authClient                L26
// ------------------------------------------

const baseURL = process.env.NEXT_PUBLIC_APP_URL;
const socialProviders = (process.env.NEXT_PUBLIC_AUTH_SOCIAL_PROVIDERS ?? "")
  .split(",")
  .map((provider) => provider.trim())
  .filter(Boolean) as SocialProvider[];

export const enabledSocialProviders = [...new Set(socialProviders)];

export const authClient = createAuthClient({
  ...(baseURL ? { baseURL } : {}),
  plugins: [
    multiSessionClient(),
    emailOTPClient(),
    organizationClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
