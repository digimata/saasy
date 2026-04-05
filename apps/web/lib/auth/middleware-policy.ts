// --------------------------------------------------------
// projects/saasy/apps/web/lib/auth/middleware-policy.ts
//
// const AUTH_ENTRY_PREFIXES                    L8
// export function evaluateMiddlewarePolicy()  L19
// --------------------------------------------------------

const AUTH_ENTRY_PREFIXES = ["/sign-in", "/sign-up"];

export type MiddlewarePolicyInput = {
  pathname: string;
  search?: string;
  hasSessionCookie: boolean;
};

export type MiddlewarePolicyDecision =
  | { kind: "allow" }
  | { kind: "redirect"; location: string };

export function evaluateMiddlewarePolicy({
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
