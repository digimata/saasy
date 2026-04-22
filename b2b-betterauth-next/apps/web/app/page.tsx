import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@repo/auth";
import { db } from "@repo/db";
import { workspaces, memberships } from "@repo/db/schema";

export default async function RootPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Try the active workspace first
  if (session.session.activeOrganizationId) {
    const [ws] = await db
      .select({ slug: workspaces.slug })
      .from(workspaces)
      .where(eq(workspaces.id, session.session.activeOrganizationId))
      .limit(1);

    if (ws) {
      redirect(`/${ws.slug}`);
    }
  }

  // No active workspace — find the first one the user belongs to
  const [first] = await db
    .select({ id: workspaces.id, slug: workspaces.slug })
    .from(workspaces)
    .innerJoin(memberships, eq(memberships.workspaceId, workspaces.id))
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  if (first) {
    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: { organizationId: first.id },
    });
    redirect(`/${first.slug}`);
  }

  redirect("/onboard");
}
