"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanCard } from "@/components/billing/plan-card";
import { PaymentCard } from "@/components/billing/payment-card";
import { InvoicesCard } from "@/components/billing/invoices-card";
import { PlanDialog } from "@/components/billing/plan-dialog";
import type { BillingStateResponse, InvoicesResponse } from "@/app/api/billing/schema";

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null));

export function BillingTab() {
  const { data: state } = useSWR<BillingStateResponse>("/api/billing/state", fetcher);
  const { data: invoicePages, size, setSize } = useSWRInfinite<InvoicesResponse>(
    (pageIndex, prev) => {
      if (prev && !prev.hasMore) return null;
      if (pageIndex === 0) return "/api/billing/invoices";
      const cursor = prev!.invoices[prev!.invoices.length - 1]!.id;
      return `/api/billing/invoices?cursor=${cursor}`;
    },
    fetcher,
  );

  const invoices = useMemo(
    () => invoicePages?.flatMap((p) => p.invoices) ?? [],
    [invoicePages],
  );
  const hasMore = invoicePages?.[invoicePages.length - 1]?.hasMore ?? false;

  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleCheckout(plan: "pro" | "ultra") {
    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  if (!state) {
    return (
      <div className="space-y-12">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
    );
  }

  if (!state.configured) {
    return (
      <div className="rounded-lg border border-ds-gray-100 p-6">
        <p className="text-copy-14 text-muted-foreground">
          Billing is not configured. Set{" "}
          <code className="text-label-13-mono">STRIPE_SECRET_KEY</code> and related environment
          variables to enable billing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <PlanCard state={state} onAdjust={() => setShowPlanDialog(true)} />

      {state.hasCustomer && <PaymentCard onManage={handlePortal} loading={portalLoading} />}

      <InvoicesCard
        invoices={invoices}
        hasMore={hasMore}
        onLoadMore={() => setSize(size + 1)}
      />

      <PlanDialog
        open={showPlanDialog}
        onOpenChange={setShowPlanDialog}
        currentPlan={state.plan ?? "hobby"}
        checkoutPlans={state.checkoutPlans}
        checkoutLoading={checkoutLoading}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
