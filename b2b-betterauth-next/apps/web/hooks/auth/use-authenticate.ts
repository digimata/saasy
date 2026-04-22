import { useContext, useEffect } from "react";
import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import type { AuthViewPath } from "@/lib/auth/view-paths";
import type { AnyAuthClient } from "@/lib/auth/types/any-auth-client";

// ----------------------------------------
// projects/saasy/apps/web/hooks/auth/use-authenticate.ts
//
// interface AuthenticateOptions        L20
//   authClient                         L21
//   authView                           L22
//   enabled                            L23
// export type Session                  L26
// export type User                     L26
// export function useAuthenticate()    L26
// session                              L44
// user                                 L45
// ----------------------------------------

interface AuthenticateOptions<TAuthClient extends AnyAuthClient> {
  authClient?: TAuthClient;
  authView?: AuthViewPath;
  enabled?: boolean;
}

export function useAuthenticate<TAuthClient extends AnyAuthClient>(
  options?: AuthenticateOptions<TAuthClient>
) {
  type Session = TAuthClient["$Infer"]["Session"]["session"];
  type User = TAuthClient["$Infer"]["Session"]["user"];

  const { authView = "SIGN_IN", enabled = true } = options ?? {};

  const {
    hooks: { useSession },
    basePath,
    viewPaths,
    replace,
  } = useContext(AuthUIContext);

  const { data, isPending, error, refetch } = useSession();
  const sessionData = data as
    | {
        session: Session;
        user: User;
      }
    | null
    | undefined;

  useEffect(() => {
    if (!enabled || isPending || sessionData) return;

    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo =
      searchParams.get("redirectTo") || window.location.pathname + window.location.search;

    replace(
      `${basePath}/${(viewPaths as any)[authView]}?redirectTo=${encodeURIComponent(redirectTo)}`
    );
  }, [isPending, sessionData, basePath, viewPaths, replace, authView, enabled]);

  return {
    data: sessionData,
    user: sessionData?.user,
    isPending,
    error,
    refetch,
  };
}
