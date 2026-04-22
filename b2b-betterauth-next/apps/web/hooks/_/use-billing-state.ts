import useSWR from "swr";
import { useCurrentOrganization } from "@/hooks/auth/use-current-organization";
import type { BillingStateResponse } from "@/app/api/billing/schema";

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null));

export function useBillingState() {
  const { data: org } = useCurrentOrganization();
  return useSWR<BillingStateResponse>(
    org?.id ? `/api/billing/state?ws=${org.id}` : null,
    fetcher,
  );
}
