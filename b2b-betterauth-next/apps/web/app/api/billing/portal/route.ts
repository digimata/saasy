import { NextRequest, NextResponse } from "next/server";
import { isBillingConfigured, createPortalSession } from "@repo/billing";
import { resolveBillingWorkspace } from "../workspace";

export async function POST(req: NextRequest) {
  const context = await resolveBillingWorkspace();
  if (context instanceof NextResponse) {
    return context;
  }

  if (!isBillingConfigured()) {
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }

  const returnUrl = `${req.nextUrl.origin}/${context.workspace.slug}/settings?tab=billing`;
  const url = await createPortalSession(context.workspace, returnUrl);
  return NextResponse.json({ url });
}
