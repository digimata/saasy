import { Hono } from "hono";
import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import { db, users, type NewUser } from "@repo/db";
import { sendEmail, WelcomeEmailTemplate } from "@repo/email";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { ConflictError, UnauthorizedError, ValidationError } from "@/lib/error";
import { canonicalEmail, isEmailUniqueViolation } from "@/lib/email";
import {
  primaryEmail,
  type ClerkEvent,
  type ClerkUserData,
  type ClerkDeletedData,
} from "@/types/clerk";

const webhooks = new Hono();

/**
 * POST /webhooks/clerk
 *
 * Clerk webhook endpoint. Verifies the svix signature and upserts/removes
 * the local `users` row keyed on `clerk_user_id`.
 */
webhooks.post("/", async (cx) => {
  const svixId = cx.req.header("svix-id");
  const svixTimestamp = cx.req.header("svix-timestamp");
  const svixSignature = cx.req.header("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new ValidationError("missing svix headers");
  }

  const payload = await cx.req.text();
  const wh = new Webhook(env.CLERK_WEBHOOK_SIGNING_SECRET);

  let event: ClerkEvent;
  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;
  } catch {
    throw new UnauthorizedError("invalid signature");
  }

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const data = event.data as ClerkUserData;
      const rawEmail = primaryEmail(data);
      if (!rawEmail) throw new ValidationError("missing primary email");

      const row: NewUser = {
        clerkUserId: data.id,
        email: canonicalEmail(rawEmail),
        firstName: data.first_name,
        lastName: data.last_name,
        imageUrl: data.image_url,
      };

      try {
        await db
          .insert(users)
          .values(row)
          .onConflictDoUpdate({
            target: users.clerkUserId,
            set: {
              email: row.email,
              firstName: row.firstName,
              lastName: row.lastName,
              imageUrl: row.imageUrl,
              updatedAt: new Date(),
            },
          });
      } catch (err) {
        // INV-AUTH-001: distinct Clerk IDs landing on the same canonical email
        // are a conflict, not an internal error.
        if (isEmailUniqueViolation(err)) {
          throw new ConflictError("email already in use");
        }
        throw err;
      }

      logger.info({ clerkUserId: data.id, type: event.type }, "user.synced");

      if (event.type === "user.created") {
        try {
          await sendEmail(row.email, WelcomeEmailTemplate, {
            firstName: row.firstName ?? null,
          });
        } catch (err) {
          logger.error({ err, clerkUserId: data.id }, "email.welcome.failed");
        }
      }

      return cx.json({ ok: true });
    }

    case "user.deleted": {
      const data = event.data as ClerkDeletedData;
      await db.delete(users).where(eq(users.clerkUserId, data.id));
      logger.info({ clerkUserId: data.id }, "user.deleted");
      return cx.json({ ok: true });
    }

    default:
      return cx.json({ ok: true, ignored: event.type });
  }
});

export default webhooks;
