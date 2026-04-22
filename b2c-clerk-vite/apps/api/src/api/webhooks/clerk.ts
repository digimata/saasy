import { Hono } from "hono";
import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import { db, users, type NewUser } from "@repo/db";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { UnauthorizedError, ValidationError } from "@/lib/error";
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
      const email = primaryEmail(data);
      if (!email) throw new ValidationError("missing primary email");

      const row: NewUser = {
        clerkUserId: data.id,
        email,
        firstName: data.first_name,
        lastName: data.last_name,
        imageUrl: data.image_url,
      };

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

      logger.info({ clerkUserId: data.id, type: event.type }, "user.synced");
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
