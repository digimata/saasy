import { Hono } from "hono";
import { cors } from "hono/cors";

import { env } from "@/lib/env";
import { logreq } from "@/lib/logger";
import { handleError } from "@/lib/error-handler";
import { clerkMiddleware } from "@/lib/auth";

import clerkWebhook from "@/api/webhooks/clerk";
import stripeWebhook from "@/api/webhooks/stripe";
import me from "@/api/me";
import billing from "@/api/billing";

/**
 * Hono builder — registers middleware, routes, and the error handler.
 */
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
