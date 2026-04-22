import { Hono, type Context } from "hono";
import { cors } from "hono/cors";

import { env } from "@/lib/env";
import { logger, logreq } from "@/lib/logger";
import { APIError } from "@/lib/error";
import { clerkMiddleware } from "@/lib/auth";

import clerkWebhook from "@/api/webhooks/clerk";
import stripeWebhook from "@/api/webhooks/stripe";
import me from "@/api/me";
import billing from "@/api/billing";

/**
 * Hono builder — registers middleware, routes, and the error handler.
 */
// ------------------------------
// projects/saasy/b2c-clerk-vite/apps/api/src/app.ts
//
// export function build()    L20
// function handleError()     L41
// ------------------------------

export function build(): Hono {
  const app = new Hono();

  app.use("/*", logreq);
  app.use(
    "/*",
    cors({
      origin: [env.WEB_ORIGIN],
      credentials: true,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  app.onError(handleError);

  app.get("/health", (cx) => cx.json({ ok: true }));

  app.route("/webhooks/clerk", clerkWebhook);
  app.route("/webhooks/stripe", stripeWebhook);

  app.use(
    "/*",
    clerkMiddleware({
      secretKey: env.CLERK_SECRET_KEY,
      publishableKey: env.CLERK_PUBLISHABLE_KEY,
    }),
  );

  app.route("/me", me);
  app.route("/billing", billing);

  return app;
}

function handleError(err: Error, cx: Context): Response {
  if (err instanceof APIError) {
    logger.error({ err, metadata: err.metadata }, err.message);
    return cx.json(err.json(), err.statusCode);
  }

  logger.error({ err }, "unknown:error");
  return cx.json(
    {
      error: {
        code: "internal_server_error",
        message: "An unexpected error occurred",
      },
    },
    500,
  );
}
