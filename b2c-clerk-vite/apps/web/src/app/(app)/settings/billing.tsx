import { useState, useMemo, useCallback } from "react";
import useSWRInfinite from "swr/infinite";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { PlanCard } from "@/components/billing/plan-card";
import { PaymentCard } from "@/components/billing/payment-card";
import { InvoicesCard } from "@/components/billing/invoices-card";
import { PlanDialog } from "@/components/billing/plan-dialog";
import { useApi, useAuthedFetch, APIError } from "@/lib/api";
import type { BillingStateResponse, InvoicesResponse } from "@/lib/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export function BillingTab() {
  const { data: state } = useApi<BillingStateResponse>("/billing/state");
  const authedFetch = useAuthedFetch();
  const { getToken, isSignedIn } = useAuth();

  const invoiceFetcher = useCallback(
    async ([path]: [string, string]) => {
      const token = await getToken();
      const res = await fetch(`${API_URL}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return res.ok ? ((await res.json()) as InvoicesResponse) : null;
    },
    [getToken],
  );

  const { data: invoicePages, size, setSize } = useSWRInfinite<InvoicesResponse | null>(
    (pageIndex, prev) => {
      if (!isSignedIn || !state?.configured) return null;
      if (prev && !prev.hasMore) return null;
      if (pageIndex === 0) return ["/billing/invoices", "authed"];
      const cursor = prev!.invoices[prev!.invoices.length - 1]!.id;
      return [`/billing/invoices?cursor=${cursor}`, "authed"];
    },
    invoiceFetcher,
  );

  const invoices = useMemo(
    () => invoicePages?.flatMap((p) => p?.invoices ?? []) ?? [],
    [invoicePages],
  );
  const hasMore = invoicePages?.[invoicePages.length - 1]?.hasMore ?? false;

  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleCheckout = async (plan: "pro") => {
    setCheckoutLoading(plan);
    try {
      const { url } = await authedFetch<{ url: string }>("/billing/checkout", {
        method: "POST",
        body: { plan },
      });
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof APIError ? err.message : "Failed to start checkout";
      toast.error(msg);
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await authedFetch<{ url: string }>("/billing/portal", {
        method: "POST",
        body: {},
      });
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof APIError ? err.message : "Failed to open billing portal";
      toast.error(msg);
      setPortalLoading(false);
    }
  };

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
          <code className="text-label-13-mono">STRIPE_SECRET_KEY</code> and related
          environment variables to enable billing.
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
        currentPlan={state.plan?.id ?? "free"}
        checkoutPlans={state.checkoutPlans}
        checkoutLoading={checkoutLoading}
        onCheckout={handleCheckout}
        onPortal={handlePortal}
      />
    </div>
  );
}
