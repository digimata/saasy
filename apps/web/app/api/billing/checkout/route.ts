import { NextRequest, NextResponse } from "next/server";

import { canCreateCheckout, createCheckoutSession } from "@repo/billing";
import { checkoutRequestSchema } from "../schema";
import { resolveBillingWorkspace } from "../workspace";

// -----------------------------------
// projects/saasy/apps/web/app/api/billing/checkout/route.ts
//
// export async function POST()    L17
// -----------------------------------

export async function POST(req: NextRequest) {
  const parsed = checkoutRequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const context = await resolveBillingWorkspace();
  if (context instanceof NextResponse) {
    return context;
  }

  if (!canCreateCheckout(parsed.data.plan)) {
    return NextResponse.json({ error: `Billing is not configured for ${parsed.data.plan}` }, { status: 503 });
  }

  const returnUrl = `${req.nextUrl.origin}/${context.workspace.slug}/settings?tab=billing`;
  const url = await createCheckoutSession(context.workspace, parsed.data.plan, returnUrl);

  return NextResponse.json({ url });
}
