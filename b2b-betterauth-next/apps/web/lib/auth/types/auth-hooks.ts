import type { BetterFetchError } from "@better-fetch/fetch";
import type { Account, User } from "better-auth";
import type { Member, Organization } from "better-auth/plugins/organization";
import type { AnyAuthClient } from "./any-auth-client";
import type { AuthClient } from "./auth-client";
import type { Invitation } from "./invitation";
import type { Refetch } from "./refetch";

// -----------------------------
// projects/saasy/apps/web/lib/auth/types/auth-hooks.ts
//
// type AnyAuthSession       L44
// type AuthHook             L46
// isPending                 L47
// isRefetching              L48
// data                      L49
// error                     L50
// refetch                   L51
// export type AuthHooks     L54
// useSession                L55
// useListAccounts           L56
// useAccountInfo            L57
// user                      L57
// useListDeviceSessions     L58
// useListSessions           L59
// useActiveOrganization     L60
// useListOrganizations      L61
// useHasPermission          L62
// error                     L65
// success                   L66
// useInvitation             L68
// organizationName          L70
// organizationSlug          L71
// organizationLogo          L72
// useListInvitations        L75
// useListUserInvitations    L78
// useListMembers            L79
// members                   L80
// user                      L80
// total                     L81
// useIsRestoring            L83
// -----------------------------

type AnyAuthSession = AnyAuthClient["$Infer"]["Session"];

type AuthHook<T> = {
  isPending: boolean;
  isRefetching: boolean;
  data?: T | null;
  error?: BetterFetchError | null;
  refetch?: Refetch;
};

export type AuthHooks = {
  useSession: () => ReturnType<AnyAuthClient["useSession"]>;
  useListAccounts: () => AuthHook<Account[]>;
  useAccountInfo: (params: Parameters<AuthClient["accountInfo"]>[0]) => AuthHook<{ user: User }>;
  useListDeviceSessions: () => AuthHook<AnyAuthClient["$Infer"]["Session"][]>;
  useListSessions: () => AuthHook<AnyAuthSession["session"][]>;
  useActiveOrganization: () => Partial<ReturnType<AuthClient["useActiveOrganization"]>>;
  useListOrganizations: () => Partial<AuthHook<Organization[]>>;
  useHasPermission: (
    params: Parameters<AuthClient["organization"]["hasPermission"]>[0]
  ) => AuthHook<{
    error: null;
    success: boolean;
  }>;
  useInvitation: (params: Parameters<AuthClient["organization"]["getInvitation"]>[0]) => AuthHook<
    Invitation & {
      organizationName: string;
      organizationSlug: string;
      organizationLogo?: string;
    }
  >;
  useListInvitations: (
    params: Parameters<AuthClient["organization"]["listInvitations"]>[0]
  ) => AuthHook<Invitation[]>;
  useListUserInvitations: () => AuthHook<Invitation[]>;
  useListMembers: (params: Parameters<AuthClient["organization"]["listMembers"]>[0]) => AuthHook<{
    members: (Member & { user?: Partial<User> | null })[];
    total: number;
  }>;
  useIsRestoring?: () => boolean;
};
