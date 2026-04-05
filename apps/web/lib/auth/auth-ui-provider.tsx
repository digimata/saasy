// ---------------------------------------
// projects/saasy/apps/web/lib/auth/auth-ui-provider.tsx
//
// const DefaultLink                   L92
// const defaultNavigate               L98
// const defaultReplace               L102
// const defaultToast                 L106
// export type AuthUIContextType      L114
// authClient                         L115
// additionalFields                   L119
// avatar                             L124
// basePath                           L129
// baseURL                            L133
// credentials                        L134
// redirectTo                         L139
// changeEmail                        L144
// deleteUser                         L149
// emailVerification                  L153
// freshAge                           L158
// gravatar                           L162
// hooks                              L163
// localization                       L164
// localizeErrors                     L170
// magicLink                          L175
// emailOTP                           L180
// multiSession                       L181
// mutators                           L182
// nameRequired                       L187
// optimistic                         L192
// organization                       L196
// persistClient                      L201
// account                            L205
// signUp                             L209
// social                             L213
// toast                              L214
// twoFactor                          L219
// viewPaths                          L220
// navigate                           L225
// onSessionChange                    L229
// replace                            L234
// Link                               L239
// export type AuthUIProviderProps    L242
// children                           L243
// authClient                         L249
// account                            L254
// avatar                             L259
// deleteUser                         L264
// hooks                              L268
// viewPaths                          L274
// emailVerification                  L279
// toast                              L284
// localization                       L290
// localizeErrors                     L296
// mutators                           L300
// organization                       L304
// credentials                        L309
// signUp                             L314
// export const AuthUIContext         L335
// export const AuthUIProvider        L337
// ---------------------------------------

"use client";

import { createContext, type ReactNode, useMemo } from "react";
import { toast } from "sonner";

import { useAuthData } from "@/hooks/auth/use-auth-data";
import { type AuthLocalization, authLocalization } from "@/lib/auth/localization/auth-localization";
import type { AccountOptions, AccountOptionsContext } from "@/lib/auth/types/account-options";
import type { AdditionalFields } from "@/lib/auth/types/additional-fields";
import type { AnyAuthClient } from "@/lib/auth/types/any-auth-client";
import type { AuthClient } from "@/lib/auth/types/auth-client";
import type { AuthHooks } from "@/lib/auth/types/auth-hooks";
import type { AuthMutators } from "@/lib/auth/types/auth-mutators";
import type { AvatarOptions } from "@/lib/auth/types/avatar-options";
import type { CredentialsOptions } from "@/lib/auth/types/credentials-options";
import type { DeleteUserOptions } from "@/lib/auth/types/delete-user-options";
import type { EmailVerificationOptions } from "@/lib/auth/types/email-verification-options";
import type { GravatarOptions } from "@/lib/auth/types/gravatar-options";
import type { Link } from "@/lib/auth/types/link";
import type {
  OrganizationOptions,
  OrganizationOptionsContext,
} from "@/lib/auth/types/organization-options";
import type { RenderToast } from "@/lib/auth/types/render-toast";
import type { SignUpOptions } from "@/lib/auth/types/sign-up-options";
import type { SocialOptions } from "@/lib/auth/types/social-options";
import { OrganizationRefetcher } from "./organization-refetcher";
import type { AuthViewPaths } from "./view-paths";
import { accountViewPaths, authViewPaths, organizationViewPaths } from "./view-paths";

const DefaultLink: Link = ({ href, className, children }) => (
  <a className={className} href={href}>
    {children}
  </a>
);

const defaultNavigate = (href: string) => {
  window.location.href = href;
};

const defaultReplace = (href: string) => {
  window.location.replace(href);
};

const defaultToast: RenderToast = ({ variant = "default", message }) => {
  if (variant === "default") {
    toast(message);
  } else {
    toast[variant](message);
  }
};

export type AuthUIContextType = {
  authClient: AuthClient;
  /**
   * Additional fields for users
   */
  additionalFields?: AdditionalFields;
  /**
   * Avatar configuration
   * @default undefined
   */
  avatar?: AvatarOptions;
  /**
   * Base path for the auth views
   * @default "/auth"
   */
  basePath: string;
  /**
   * Front end base URL for auth API callbacks
   */
  baseURL?: string;
  credentials?: CredentialsOptions;
  /**
   * Default redirect URL after authenticating
   * @default "/"
   */
  redirectTo: string;
  /**
   * Enable or disable user change email support
   * @default true
   */
  changeEmail?: boolean;
  /**
   * User Account deletion configuration
   * @default undefined
   */
  deleteUser?: DeleteUserOptions;
  /**
   * Email verification configuration
   */
  emailVerification?: EmailVerificationOptions;
  /**
   * Freshness age for Session data
   * @default 60 * 60 * 24
   */
  freshAge: number;
  /**
   * Gravatar configuration
   */
  gravatar?: boolean | GravatarOptions;
  hooks: AuthHooks;
  localization: typeof authLocalization;
  /**
   * Enable or disable error localization.
   * When false, errors messages from backend will be used directly.
   * @default true
   */
  localizeErrors: boolean;
  /**
   * Enable or disable Magic Link support
   * @default false
   */
  magicLink?: boolean;
  /**
   * Enable or disable Email OTP support
   * @default false
   */
  emailOTP?: boolean;
  multiSession?: boolean;
  mutators: AuthMutators;
  /**
   * Whether the name field should be required
   * @default true
   */
  nameRequired?: boolean;
  /**
   * Perform some User updates optimistically
   * @default false
   */
  optimistic?: boolean;
  /**
   * Organization configuration
   */
  organization?: OrganizationOptionsContext;
  /**
   * Forces better-auth-tanstack to refresh the Session on the auth callback page
   * @default false
   */
  persistClient?: boolean;
  /**
   * Account configuration
   */
  account?: AccountOptionsContext;
  /**
   * Sign Up configuration
   */
  signUp?: SignUpOptions;
  /**
   * Social provider configuration
   */
  social?: SocialOptions;
  toast: RenderToast;
  /**
   * Enable or disable two-factor authentication support
   * @default undefined
   */
  twoFactor?: ("otp" | "totp")[];
  viewPaths: AuthViewPaths;
  /**
   * Navigate to a new URL
   * @default window.location.href
   */
  navigate: (href: string) => void;
  /**
   * Called whenever the Session changes
   */
  onSessionChange?: () => void | Promise<void>;
  /**
   * Replace the current URL
   * @default navigate
   */
  replace: (href: string) => void;
  /**
   * Custom Link component for navigation
   * @default <a>
   */
  Link: Link;
};

export type AuthUIProviderProps = {
  children: ReactNode;
  /**
   * Better Auth client returned from createAuthClient
   * @default Required
   * @remarks `AuthClient`
   */
  authClient: AnyAuthClient;
  /**
   * Enable account view & account configuration
   * @default { fields: ["image", "name"] }
   */
  account?: boolean | Partial<AccountOptions>;
  /**
   * Avatar configuration
   * @default undefined
   */
  avatar?: boolean | Partial<AvatarOptions>;
  /**
   * User Account deletion configuration
   * @default undefined
   */
  deleteUser?: DeleteUserOptions | boolean;
  /**
   * ADVANCED: Custom hooks for fetching auth data
   */
  hooks?: Partial<AuthHooks>;
  /**
   * Customize the paths for the auth views
   * @default authViewPaths
   * @remarks `AuthViewPaths`
   */
  viewPaths?: Partial<AuthViewPaths>;
  /**
   * Email verification configuration
   * @default undefined
   */
  emailVerification?: boolean | Partial<EmailVerificationOptions>;
  /**
   * Render custom Toasts
   * @default Sonner
   */
  toast?: RenderToast;
  /**
   * Customize the Localization strings
   * @default authLocalization
   * @remarks `AuthLocalization`
   */
  localization?: AuthLocalization;
  /**
   * Enable or disable error localization.
   * When false, errors messages from backend will be used directly.
   * @default true
   */
  localizeErrors?: boolean;
  /**
   * ADVANCED: Custom mutators for updating auth data
   */
  mutators?: Partial<AuthMutators>;
  /**
   * Organization plugin configuration
   */
  organization?: OrganizationOptions | boolean;
  /**
   * Enable or disable Credentials support
   * @default { forgotPassword: true }
   */
  credentials?: boolean | CredentialsOptions;
  /**
   * Enable or disable Sign Up form
   * @default { fields: ["name"] }
   */
  signUp?: SignUpOptions | boolean;
} & Partial<
  Omit<
    AuthUIContextType,
    | "authClient"
    | "viewPaths"
    | "localization"
    | "mutators"
    | "toast"
    | "hooks"
    | "avatar"
    | "account"
    | "deleteUser"
    | "credentials"
    | "signUp"
    | "organization"
    | "localizeErrors"
    | "emailVerification"
  >
>;

export const AuthUIContext = createContext<AuthUIContextType>({} as unknown as AuthUIContextType);

export const AuthUIProvider = ({
  children,
  authClient: authClientProp,
  account: accountProp,
  avatar: avatarProp,
  deleteUser: deleteUserProp,
  social: socialProp,
  basePath = "/auth",
  baseURL = "",
  redirectTo = "/",
  credentials: credentialsProp,
  changeEmail = true,
  freshAge = 60 * 60 * 24,
  hooks: hooksProp,
  mutators: mutatorsProp,
  localization: localizationProp,
  localizeErrors = true,
  multiSession = true,
  nameRequired = true,
  organization: organizationProp,
  signUp: signUpProp = true,
  toast = defaultToast,
  viewPaths: viewPathsProp,
  navigate,
  replace,
  Link = DefaultLink,
  emailVerification: emailVerificationProp,
  ...props
}: AuthUIProviderProps) => {
  const authClient = authClientProp as AuthClient;

  const avatar = useMemo<AvatarOptions | undefined>(() => {
    if (!avatarProp) return;

    if (avatarProp === true) {
      return {
        extension: "png",
        size: 128,
      };
    }

    return {
      upload: avatarProp.upload,
      delete: avatarProp.delete,
      extension: avatarProp.extension || "png",
      size: avatarProp.size || (avatarProp.upload ? 256 : 128),
      Image: avatarProp.Image,
    };
  }, [avatarProp]);

  const emailVerification = useMemo<EmailVerificationOptions | undefined>(() => {
    if (!emailVerificationProp) return;

    if (emailVerificationProp === true) {
      return {
        otp: false,
      };
    }

    return {
      otp: emailVerificationProp.otp ?? false,
    };
  }, [emailVerificationProp]);

  const account = useMemo<AccountOptionsContext | undefined>(() => {
    if (accountProp === false) return;

    if (accountProp === true || accountProp === undefined) {
      return {
        basePath: "/account",
        fields: ["image", "name"],
        viewPaths: accountViewPaths,
      };
    }

    // Remove trailing slash from basePath
    const basePath = accountProp.basePath?.endsWith("/")
      ? accountProp.basePath.slice(0, -1)
      : accountProp.basePath;

    return {
      basePath: basePath ?? "/account",
      fields: accountProp.fields || ["image", "name"],
      viewPaths: { ...accountViewPaths, ...accountProp.viewPaths },
    };
  }, [accountProp]);

  const deleteUser = useMemo<DeleteUserOptions | undefined>(() => {
    if (!deleteUserProp) return;

    if (deleteUserProp === true) {
      return {};
    }

    return deleteUserProp;
  }, [deleteUserProp]);

  const social = useMemo<SocialOptions | undefined>(() => {
    if (!socialProp) return;

    return socialProp;
  }, [socialProp]);

  const credentials = useMemo<CredentialsOptions | undefined>(() => {
    if (credentialsProp === false) return;

    if (credentialsProp === true) {
      return {
        forgotPassword: true,
        usernameRequired: false,
      };
    }

    return {
      ...credentialsProp,
      forgotPassword: credentialsProp?.forgotPassword ?? true,
      usernameRequired: credentialsProp?.usernameRequired ?? false,
    };
  }, [credentialsProp]);

  const signUp = useMemo<SignUpOptions | undefined>(() => {
    if (signUpProp === false) return;

    if (signUpProp === true || signUpProp === undefined) {
      return {
        fields: ["name"],
      };
    }

    return {
      fields: signUpProp.fields || ["name"],
    };
  }, [signUpProp]);

  const organization = useMemo<OrganizationOptionsContext | undefined>(() => {
    if (!organizationProp) return;

    if (organizationProp === true) {
      return {
        basePath: "/organization",
        viewPaths: organizationViewPaths,
        customRoles: [],
      };
    }

    let logo: OrganizationOptionsContext["logo"] | undefined;

    if (organizationProp.logo === true) {
      logo = {
        extension: "png",
        size: 128,
      };
    } else if (organizationProp.logo) {
      logo = {
        upload: organizationProp.logo.upload,
        delete: organizationProp.logo.delete,
        extension: organizationProp.logo.extension || "png",
        size: organizationProp.logo.size || (organizationProp.logo.upload ? 256 : 128),
      };
    }

    // Remove trailing slash from basePath
    const basePath = organizationProp.basePath?.endsWith("/")
      ? organizationProp.basePath.slice(0, -1)
      : organizationProp.basePath;

    return {
      ...organizationProp,
      logo,
      basePath: basePath ?? "/organization",
      customRoles: organizationProp.customRoles || [],
      viewPaths: {
        ...organizationViewPaths,
        ...organizationProp.viewPaths,
      },
    };
  }, [organizationProp]);

  const defaultMutators = useMemo(() => {
    return {
      revokeDeviceSession: (params) =>
        authClient.multiSession.revoke({
          ...params,
          fetchOptions: { throw: true },
        }),
      revokeSession: (params) =>
        authClient.revokeSession({
          ...params,
          fetchOptions: { throw: true },
        }),
      setActiveSession: (params) =>
        authClient.multiSession.setActive({
          ...params,
          fetchOptions: { throw: true },
        }),
      updateOrganization: (params) =>
        authClient.organization.update({
          ...params,
          fetchOptions: { throw: true },
        }),
      updateUser: (params) =>
        authClient.updateUser({
          ...params,
          fetchOptions: { throw: true },
        }),
      unlinkAccount: (params) =>
        authClient.unlinkAccount({
          ...params,
          fetchOptions: { throw: true },
        }),
    } as AuthMutators;
  }, [authClient]);

  const defaultHooks = useMemo(() => {
    return {
      useSession: authClient.useSession,
      useListAccounts: () =>
        useAuthData({
          queryFn: authClient.listAccounts,
          cacheKey: "listAccounts",
        }),
      useAccountInfo: (params) =>
        useAuthData({
          queryFn: () => authClient.accountInfo(params),
          cacheKey: `accountInfo:${JSON.stringify(params)}`,
        }),
      useListDeviceSessions: () =>
        useAuthData({
          queryFn: authClient.multiSession.listDeviceSessions,
          cacheKey: "listDeviceSessions",
        }),
      useListSessions: () =>
        useAuthData({
          queryFn: authClient.listSessions,
          cacheKey: "listSessions",
        }),
      useActiveOrganization: authClient.useActiveOrganization,
      useListOrganizations: authClient.useListOrganizations,
      useHasPermission: (params) =>
        useAuthData({
          queryFn: () =>
            authClient.$fetch("/organization/has-permission", {
              method: "POST",
              body: params,
            }),
          cacheKey: `hasPermission:${JSON.stringify(params)}`,
        }),
      useInvitation: (params) =>
        useAuthData({
          queryFn: () => authClient.organization.getInvitation(params),
          cacheKey: `invitation:${JSON.stringify(params)}`,
        }),
      useListInvitations: (params) =>
        useAuthData({
          queryFn: () =>
            authClient.$fetch(
              `/organization/list-invitations?organizationId=${params?.query?.organizationId || ""}`
            ),
          cacheKey: `listInvitations:${JSON.stringify(params)}`,
        }),
      useListUserInvitations: () =>
        useAuthData({
          queryFn: () => authClient.$fetch("/organization/list-user-invitations"),
          cacheKey: `listUserInvitations`,
        }),
      useListMembers: (params) =>
        useAuthData({
          queryFn: () =>
            authClient.$fetch(
              `/organization/list-members?organizationId=${params?.query?.organizationId || ""}`
            ),
          cacheKey: `listMembers:${JSON.stringify(params)}`,
        }),
    } as AuthHooks;
  }, [authClient]);

  const viewPaths = useMemo(() => {
    return { ...authViewPaths, ...viewPathsProp };
  }, [viewPathsProp]);

  const localization = useMemo(() => {
    return { ...authLocalization, ...localizationProp };
  }, [localizationProp]);

  const hooks = useMemo(() => {
    return { ...defaultHooks, ...hooksProp };
  }, [defaultHooks, hooksProp]);

  const mutators = useMemo(() => {
    return { ...defaultMutators, ...mutatorsProp };
  }, [defaultMutators, mutatorsProp]);

  // Remove trailing slash from baseURL
  baseURL = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;

  // Remove trailing slash from basePath
  basePath = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;

  const { data: sessionData } = hooks.useSession();

  return (
    <AuthUIContext.Provider
      value={{
        authClient,
        avatar,
        basePath: basePath === "/" ? "" : basePath,
        baseURL,
        redirectTo,
        changeEmail,
        credentials,
        deleteUser,
        emailVerification,
        freshAge,
        hooks,
        mutators,
        localization,
        localizeErrors,
        multiSession,
        nameRequired,
        organization,
        account,
        signUp,
        social,
        toast,
        navigate: navigate || defaultNavigate,
        replace: replace || navigate || defaultReplace,
        viewPaths,
        Link,
        ...props,
      }}
    >
      {sessionData && organization && <OrganizationRefetcher />}

      {children}
    </AuthUIContext.Provider>
  );
};
