import { clerkMiddleware, getAuth } from "@clerk/hono";
import type { Context, MiddlewareHandler } from "hono";

import { UnauthorizedError } from "@/lib/error";

export { clerkMiddleware };

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new UnauthorizedError();
  }
  await next();
};

export function currentUserId(c: Context): string {
  const auth = getAuth(c);
  if (!auth?.userId) {
    throw new UnauthorizedError();
  }
  return auth.userId;
}
