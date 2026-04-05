// ------------------------------------
// projects/saasy/apps/web/lib/auth/types/auth-mutators.ts
//
// type MutateFn                    L21
// export interface AuthMutators    L23
//   revokeDeviceSession            L24
//   sessionToken                   L24
//   revokeSession                  L25
//   token                          L25
//   sessionToken                   L26
//   setActiveSession               L26
//   updateOrganization             L27
//   organizationId                 L28
//   data                           L29
//   updateUser                     L31
//   accountId                      L32
//   providerId                     L32
//   unlinkAccount                  L32
// ------------------------------------

type MutateFn<T = Record<string, unknown>> = (params: T) => Promise<unknown> | Promise<void>;

export interface AuthMutators {
  revokeDeviceSession: MutateFn<{ sessionToken: string }>;
  revokeSession: MutateFn<{ token: string }>;
  setActiveSession: MutateFn<{ sessionToken: string }>;
  updateOrganization: MutateFn<{
    organizationId: string;
    data: Record<string, unknown>;
  }>;
  updateUser: MutateFn;
  unlinkAccount: MutateFn<{ providerId: string; accountId?: string }>;
}
