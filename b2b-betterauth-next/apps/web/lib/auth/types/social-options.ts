import type { SocialProvider } from "better-auth/social-providers";
import type { AuthClient } from "./auth-client";

// --------------------------------
// projects/saasy/apps/web/lib/auth/types/social-options.ts
//
// export type SocialOptions    L12
// providers                    L17
// signIn                       L21
// --------------------------------

export type SocialOptions = {
  /**
   * Array of Social Providers to enable
   * @remarks `SocialProvider[]`
   */
  providers: SocialProvider[];
  /**
   * Custom social sign in function
   */
  signIn?: (params: Parameters<AuthClient["signIn"]["social"]>[0]) => Promise<unknown>;
};
