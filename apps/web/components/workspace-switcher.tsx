"use client";

import { IconChevronUpDown } from "@/components/ui/icons";
import { useContext } from "react";

import { useCurrentOrganization } from "@/hooks/auth/use-current-organization";
import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { OrganizationSwitcher } from "@/components/auth/organization/organization-switcher";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";

export function WorkspaceSwitcher() {
  const { data: organization, isPending } = useCurrentOrganization();

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
          <Badge variant="muted" className="text-label-12 font-normal text-muted-foreground">
            Free
          </Badge>
          <OrganizationSwitcher
            hidePersonal
            align="start"
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
