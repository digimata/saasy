import { eq } from "drizzle-orm";
import type { Context } from "hono";

import { db, users, type NewUser, type User } from "@repo/db";
import { InternalServerError } from "@/lib/error";
import { logger } from "@/lib/logger";

/**
 * Resolve the local user row for a Clerk user ID. If no row exists yet,
 * fetch the user from Clerk and upsert — makes the template resilient to
 * missed webhook runs and predates-webhook-setup signups.
 */
export async function ensureLocalUser(c: Context, clerkUserId: string): Promise<User> {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, clerkUserId))
    .limit(1);

  if (existing) return existing;

  const clerk = c.get("clerk");
  const clerkUser = await clerk.users.getUser(clerkUserId);

  const primaryEmail =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    throw new InternalServerError("Clerk user has no email address");
  }

  const row: NewUser = {
    clerkUserId: clerkUser.id,
    email: primaryEmail,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
  };

  const [inserted] = await db
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
    })
    .returning();

  if (!inserted) throw new InternalServerError("Failed to sync user");

  logger.info({ clerkUserId, source: "lazy-sync" }, "user.synced");
  return inserted;
}
