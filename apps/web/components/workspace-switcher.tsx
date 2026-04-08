"use client";

import { IconChevronUpDown } from "@/components/ui/icons";
import { useContext } from "react";

import { useCurrentOrganization } from "@/hooks/auth/use-current-organization";
import { useBillingState } from "@/hooks/_/use-billing-state";
import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { OrganizationSwitcher } from "@/components/auth/organization/organization-switcher";
import { Badge } from "@/components/ui/badge";
import { PLAN_BADGE } from "@/components/billing/plan-card";
import { Logo } from "@/components/logo";

export function WorkspaceSwitcher() {
  const { data: organization, isPending } = useCurrentOrganization();
  const { data: billing } = useBillingState();
  const planId = billing?.plan?.id ?? "hobby";
  const badge = PLAN_BADGE[planId] ?? PLAN_BADGE.hobby;

  return (
    <div className="flex items-center gap-2">
      <Logo />

      <span className="text-ds-gray-300 text-label-14 mx-3 inline-block rotate-[10deg]">/</span>

      <div className="size-6 rounded-[8px] bg-ds-green-500/12 flex items-center justify-center text-ds-green-500 text-[11px] font-medium shrink-0">
        {organization?.name?.[0]?.toUpperCase() || "?"}
      </div>
      {!isPending && organization && (
        <>
          <span className="text-label-13 font-medium text-foreground">
            {organization.name}
          </span>
          <Badge variant={badge.variant} className="text-label-12 font-normal">
            {badge.label}
          </Badge>
          <OrganizationSwitcher
            hidePersonal
            align="start"
            alignOffset={-8}
            side="bottom"
            sideOffset={8}
            trigger={
              <button
                type="button"
                className="grid place-items-center size-6 rounded-sm cursor-pointer hover:bg-ds-bg-300 transition-colors text-muted-foreground"
              >
                <IconChevronUpDown className="size-3.5" />
              </button>
            }
          />
        </>
      )}
    </div>
  );
}
