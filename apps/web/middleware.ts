import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

import { evaluateMiddlewarePolicy } from "@/lib/auth/middleware-policy";

// -----------------------------------
// projects/saasy/apps/web/middleware.ts
//
// export function middleware()    L23
// export const config             L46
// -----------------------------------

/**
 * Middleware is intentionally conservative.
 *
 * Semantics:
 * - A missing BetterAuth session cookie is enough to conclude that a protected request is anonymous.
 * - A present cookie is not enough to conclude that the request is authenticated or workspace-initialized.
 * - Positive auth decisions belong to validated session reads in auth pages, `/setup`, and `/(dash)/layout.tsx`.
 *
 * Pseudocode:
 * 1. Classify auth entry routes (`/sign-in`, `/sign-up`).
 * 2. Read the BetterAuth session cookie using BetterAuth's cookie helper.
 * 3. If the request targets a protected route and there is definitely no session cookie, redirect to `/sign-in`.
 * 4. Otherwise allow the request and let page/layout code validate the session and active workspace.
 */

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionCookie = getSessionCookie(request.headers);

  const decision = evaluateMiddlewarePolicy({
    pathname,
    search,
    hasSessionCookie: !!sessionCookie,
  });

  if (decision.kind === "redirect") {
    return NextResponse.redirect(new URL(decision.location, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
