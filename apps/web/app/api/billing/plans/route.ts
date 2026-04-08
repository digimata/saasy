import { NextResponse } from "next/server";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { getWorkspacePlans } from "@repo/billing";
import { authClient } from "@repo/auth/client";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({}, { status: 401 });
  }

  // Get all orgs the user belongs to
  const orgs = await auth.api.listOrganizations({ headers: await headers() });
  if (!orgs || orgs.length === 0) {
    return NextResponse.json({});
  }

  const workspaceIds = orgs.map((o) => o.id);
  const plans = await getWorkspacePlans(workspaceIds);

  return NextResponse.json(plans);
}
