// -------------------------------------------
// projects/saasy/apps/web/lib/auth/middleware.ts
//
// const AUTH_ENTRY_PREFIXES               L16
// export type MiddlewarePolicyInput       L18
// pathname                                L19
// search                                  L20
// hasSessionCookie                        L21
// export type MiddlewarePolicyDecision    L24
// kind                                    L25
// kind                                    L26
// location                                L26
// export function decide()                L28
// -------------------------------------------

const AUTH_ENTRY_PREFIXES = ["/sign-in", "/sign-up"];

export type MiddlewarePolicyInput = {
  pathname: string;
  search?: string;
  hasSessionCookie: boolean;
};

export type MiddlewarePolicyDecision =
  | { kind: "allow" }
  | { kind: "redirect"; location: string };

export function decide({
  pathname,
  search = "",
  hasSessionCookie,
}: MiddlewarePolicyInput): MiddlewarePolicyDecision {
  const isAuthEntryPath = AUTH_ENTRY_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (hasSessionCookie || isAuthEntryPath) {
    return { kind: "allow" };
  }

  const params = new URLSearchParams({
    redirectTo: `${pathname}${search}`,
  });

  return {
    kind: "redirect",
    location: `/sign-in?${params.toString()}`,
  };
}
