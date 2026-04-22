import { NextResponse } from "next/server";
import { canCreateCheckout, isBillingConfigured, getWorkspaceBillingState } from "@repo/billing";
import { resolveBillingWorkspace } from "../workspace";

// ----------------------------------
// projects/saasy/apps/web/app/api/billing/state/route.ts
//
// export async function GET()    L12
// ----------------------------------

export async function GET() {
  const context = await resolveBillingWorkspace();
  if (context instanceof NextResponse) {
    return context;
  }

  if (!isBillingConfigured()) {
    return NextResponse.json({
      configured: false,
      checkoutPlans: { pro: false, ultra: false },
    });
  }

  const state = await getWorkspaceBillingState(context.workspace.id);

  return NextResponse.json({
    configured: true,
    checkoutPlans: {
      pro: canCreateCheckout("pro"),
      ultra: canCreateCheckout("ultra"),
    },
    ...state,
  });
}
