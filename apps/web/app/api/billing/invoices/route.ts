import { NextRequest, NextResponse } from "next/server";

import { isBillingConfigured, getWorkspaceInvoices } from "@repo/billing";
import { resolveBillingWorkspace } from "../workspace";

// ----------------------------------
// projects/saasy/apps/web/app/api/billing/invoices/route.ts
//
// export async function GET()    L13
// ----------------------------------

export async function GET(req: NextRequest) {
  const context = await resolveBillingWorkspace();
  if (context instanceof NextResponse) {
    return context;
  }

  if (!isBillingConfigured()) {
    return NextResponse.json({ invoices: [], hasMore: false });
  }

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const page = await getWorkspaceInvoices(context.workspace.id, cursor);

  return NextResponse.json(page);
}
