"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PLAN_NAMES } from "./plan-card";

type Interval = "monthly" | "annual";

const PLAN_DETAILS = {
  hobby: {
    name: "Hobby",
    monthly: "Free",
    annual: "Free",
    interval: null,
    description: "For individuals and small projects getting started.",
    features: [
      "Up to 3 projects",
      "Community support",
      "Basic analytics",
    ],
  },
  pro: {
    name: "Pro",
    monthly: "$20",
    annual: "$16",
    interval: "mo",
    description: "For growing teams that need more power and flexibility.",
    features: [
      "Unlimited projects",
      "Priority support",
      "Advanced analytics",
      "Custom integrations",
    ],
  },
  ultra: {
    name: "Ultra",
    monthly: "$50",
    annual: "$40",
    interval: "mo",
    description: "For organizations that need the best performance and features.",
    features: [
      "Everything in Pro",
      "Dedicated support",
      "SLA guarantees",
      "SSO & advanced security",
      "Custom contracts",
    ],
  },
} as const;

function IntervalToggle({
  value,
  onChange,
}: {
  value: Interval;
  onChange: (v: Interval) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 mt-4 mb-2">
      <div className="relative inline-flex rounded-full bg-ds-bg-300 p-1">
        {(["monthly", "annual"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "relative z-10 px-4 py-1.5 text-label-14 font-medium rounded-full transition-colors duration-200 cursor-pointer",
              value === v
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {value === v && (
              <motion.span
                layoutId="interval-pill"
                className="absolute inset-0 rounded-full bg-ds-bg-200 shadow-sm"
                transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10">{v === "monthly" ? "Monthly" : "Annual"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function PlanDialog({
  open,
  onOpenChange,
  currentPlan,
  checkoutPlans,
  checkoutLoading,
  onCheckout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: string;
  checkoutPlans?: { pro: boolean; ultra: boolean };
  checkoutLoading: string | null;
  onCheckout: (plan: "pro" | "ultra") => void;
}) {
  const [interval, setInterval] = useState<Interval>("monthly");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-10">
        <DialogHeader>
          <DialogTitle className="text-heading-24 text-center">Adjust your plan</DialogTitle>
          <DialogDescription className="text-center text-copy-14 text-muted-foreground">
            Current plan: {PLAN_NAMES[currentPlan] ?? currentPlan}
          </DialogDescription>
        </DialogHeader>

        <IntervalToggle value={interval} onChange={setInterval} />

        <div className="grid grid-cols-3 gap-4 mt-4">
          {(["hobby", "pro", "ultra"] as const).map((p) => {
            const details = PLAN_DETAILS[p];
            const isCurrent = currentPlan === p;
            const isPaid = p !== "hobby";
            const isAvailable = p === "hobby" ? true : (checkoutPlans?.[p] ?? true);
            const price = interval === "annual" ? details.annual : details.monthly;
            return (
              <div key={p} className="rounded-lg border border-ds-gray-100 p-5 flex flex-col">
                <h4 className="text-heading-16">{details.name}</h4>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-heading-24">{price}</span>
                  {details.interval && (
                    <span className="text-copy-13 text-muted-foreground">/{details.interval}</span>
                  )}
                  {isPaid && interval === "annual" && (
                    <span className="text-[11px] font-medium text-ds-green-500 bg-ds-green-500/12 px-1.5 py-0.5 rounded-full leading-none">
                      -20%
                    </span>
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
                ) : null}
              </div>
            );
          })}
        </div>

        <p className="text-copy-13 text-muted-foreground text-center mt-4">
          Need more capabilities for your business? Learn more about our{" "}
          <a href="#" className="text-foreground underline underline-offset-2">
            Enterprise plans.
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
}
