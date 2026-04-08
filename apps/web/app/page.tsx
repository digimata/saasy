import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@repo/auth";
import { db } from "@repo/db";
import { workspaces } from "@repo/db/schema";

export default async function RootPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (!session.session.activeOrganizationId) {
    redirect("/onboard");
  }

  const [ws] = await db
    .select({ slug: workspaces.slug })
    .from(workspaces)
    .where(eq(workspaces.id, session.session.activeOrganizationId))
    .limit(1);

  if (!ws) {
    redirect("/onboard");
  }

  redirect(`/${ws.slug}`);
}
