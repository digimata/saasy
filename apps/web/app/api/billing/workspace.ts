import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@repo/auth";
import { db } from "@repo/db";
import { memberships, workspaces, type Workspace } from "@repo/db/schema";

type BillingWorkspaceContext = {
  workspace: Workspace;
  userId: string;
};

export async function resolveBillingWorkspace(): Promise<BillingWorkspaceContext | NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.session.activeOrganizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [row] = await db
    .select({ workspace: workspaces })
    .from(workspaces)
    .innerJoin(
      memberships,
      and(eq(memberships.workspaceId, workspaces.id), eq(memberships.userId, session.user.id))
    )
    .where(eq(workspaces.id, session.session.activeOrganizationId))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return {
    workspace: row.workspace,
    userId: session.user.id,
  };
}
