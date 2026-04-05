import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  magicLinkClient,
  multiSessionClient,
  organizationClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import type { SocialProvider } from "better-auth/social-providers";

// ------------------------------
// projects/saasy/packages/auth/src/client.ts
//
// const baseURL              L17
// const socialProviders      L19
// export const authClient    L25
// ------------------------------

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
    magicLinkClient(),
    emailOTPClient(),
    twoFactorClient(),
    organizationClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
