import { NextRequest, NextResponse } from "next/server";

// -----------------------------------
// projects/saasy/apps/web/middleware.ts
//
// export function middleware()    L10
// export const config             L28
// -----------------------------------

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("better-auth.session_token");

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/sign-in") ||
    request.nextUrl.pathname.startsWith("/sign-up");

  if (!sessionCookie && !isAuthPage && request.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
