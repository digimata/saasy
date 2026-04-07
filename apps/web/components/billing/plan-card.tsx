import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, capitalize } from "@/lib/utils";
import type { BillingStateResponse } from "@/app/api/billing/schema";

const PLAN_NAMES: Record<string, string> = {
  hobby: "Hobby",
  pro: "Pro",
  ultra: "Ultra",
};

export function PlanCard({
  state,
  onAdjust,
}: {
  state: BillingStateResponse;
  onAdjust: () => void;
}) {
  const planId = state.plan?.id ?? "hobby";
  const planName = PLAN_NAMES[planId] ?? planId;
  const isPaid = planId !== "hobby";

  return (
    <div className="space-y-4">
      <h3 className="text-heading-20">Plan</h3>
      <div className="rounded-lg border border-ds-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-heading-16">{planName}</span>
              {state.status && <Badge variant="muted">{capitalize(state.status)}</Badge>}
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
          <Button variant="secondary" onClick={onAdjust}>
            Adjust plan
          </Button>
        </div>
      </div>
    </div>
  );
}

export { PLAN_NAMES };
