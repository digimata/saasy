import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PLAN_NAMES } from "./plan-card";

type PlanId = "free" | "pro";

const PLAN_DETAILS: Record<PlanId, {
  name: string;
  price: string;
  interval: string | null;
  description: string;
  features: string[];
}> = {
  free: {
    name: "Free",
    price: "Free",
    interval: null,
    description: "For individuals getting started.",
    features: ["Up to 3 projects", "Community support", "Core features"],
  },
  pro: {
    name: "Pro",
    price: "$20",
    interval: "mo",
    description: "For power users who need more.",
    features: ["Unlimited projects", "API access", "Priority support"],
  },
};

export function PlanDialog({
  open,
  onOpenChange,
  currentPlan,
  checkoutPlans,
  checkoutLoading,
  onCheckout,
  onPortal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanId;
  checkoutPlans?: { pro: boolean };
  checkoutLoading: string | null;
  onCheckout: (plan: "pro") => void;
  onPortal?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-10">
        <DialogHeader>
          <DialogTitle className="text-heading-24 text-center">Adjust your plan</DialogTitle>
          <DialogDescription className="text-center text-copy-14 text-muted-foreground">
            Current plan: {PLAN_NAMES[currentPlan] ?? currentPlan}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-6">
          {(["free", "pro"] as const).map((p) => {
            const details = PLAN_DETAILS[p];
            const isCurrent = currentPlan === p;
            const isPaid = p !== "free";
            const isAvailable = p === "free" ? true : (checkoutPlans?.[p] ?? true);
            return (
              <div key={p} className="rounded-lg border border-ds-gray-100 p-5 flex flex-col">
                <h4 className="text-heading-16">{details.name}</h4>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-heading-24">{details.price}</span>
                  {details.interval && (
                    <span className="text-copy-13 text-muted-foreground">/{details.interval}</span>
                  )}
                </div>
                <p className="text-copy-13 text-muted-foreground mt-3">{details.description}</p>
                <ul className="mt-4 space-y-2 flex-1">
                  {details.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-copy-13">
                      <Check className="size-3.5 text-ds-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button className="mt-5 w-full" variant="outline" disabled>
                    Current plan
                  </Button>
                ) : isPaid ? (
                  <Button
                    className="mt-5 w-full"
                    disabled={!isAvailable || checkoutLoading === p}
                    onClick={() => onCheckout(p)}
                  >
                    {isAvailable ? "Choose plan" : "Unavailable"}
                  </Button>
                ) : currentPlan !== "free" ? (
                  <Button className="mt-5 w-full" variant="outline" onClick={onPortal}>
                    Downgrade
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
