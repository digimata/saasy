import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, capitalize } from "@/lib/utils";
import type { BillingStateResponse } from "@/lib/types";

const PLAN_NAMES: Record<string, string> = {
  free: "Free",
  pro: "Pro",
};

export function PlanCard({
  state,
  onAdjust,
}: {
  state: BillingStateResponse;
  onAdjust: () => void;
}) {
  const planId = state.plan?.id ?? "free";
  const planName = PLAN_NAMES[planId] ?? planId;
  const planVariant = planId === "pro" ? "pro" : "outline";
  const isPaid = planId !== "free";

  return (
    <div className="space-y-4">
      <h3 className="text-heading-20">Plan</h3>
      <div className="rounded-lg border border-ds-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-heading-16">{planName}</span>
              {state.status && <Badge variant={planVariant}>{capitalize(state.status)}</Badge>}
            </div>
            {isPaid && state.currentPeriodEnd ? (
              <p className="text-copy-13 text-muted-foreground">
                {state.cancelAtPeriodEnd
                  ? `Your plan will end on ${formatDate(state.currentPeriodEnd)}.`
                  : `Your subscription will auto renew on ${formatDate(state.currentPeriodEnd)}.`}
              </p>
            ) : (
              <p className="text-copy-13 text-muted-foreground">You are on the free plan.</p>
            )}
          </div>
          <Button variant={isPaid ? "secondary" : "default"} onClick={onAdjust}>
            {isPaid ? "Adjust plan" : "Upgrade"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { PLAN_NAMES };
