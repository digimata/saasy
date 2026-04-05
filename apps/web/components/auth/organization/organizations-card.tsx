// ------------------------------------------
// projects/saasy/apps/web/components/auth/organization/organizations-card.tsx
//
// export function OrganizationsCard()    L20
// ------------------------------------------

"use client";
import { useContext, useMemo, useState } from "react";

import { useIsHydrated } from "@/hooks/auth/use-hydrated";
import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { cn } from "@/lib/auth/utils";
import type { SettingsCardProps } from "@/components/auth/settings/shared/settings-card";
import { SettingsCard } from "@/components/auth/settings/shared/settings-card";
import { SettingsCellSkeleton } from "@/components/auth/settings/skeletons/settings-cell-skeleton";
import { CardContent } from "@/components/ui/card";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { OrganizationCell } from "./organization-cell";

export function OrganizationsCard({
  className,
  classNames,
  localization,
  ...props
}: SettingsCardProps) {
  const {
    hooks: { useListOrganizations },
    localization: contextLocalization,
  } = useContext(AuthUIContext);

  localization = useMemo(
    () => ({ ...contextLocalization, ...localization }),
    [contextLocalization, localization]
  );
  const loc = localization ?? contextLocalization;

  const isHydrated = useIsHydrated();
  const { data: organizations, isPending: organizationsPending } = useListOrganizations();

  const isPending = !isHydrated || organizationsPending;

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <SettingsCard
        className={className}
        classNames={classNames}
        title={loc.ORGANIZATIONS}
        description={loc.ORGANIZATIONS_DESCRIPTION}
        instructions={loc.ORGANIZATIONS_INSTRUCTIONS}
        actionLabel={loc.CREATE_ORGANIZATION}
        action={() => setCreateDialogOpen(true)}
        isPending={isPending}
        {...props}
      >
        <CardContent className={cn("grid gap-4", classNames?.content)}>
          {isPending && <SettingsCellSkeleton />}
          {organizations?.map((organization) => (
            <OrganizationCell
              key={organization.id}
              classNames={classNames}
              organization={organization}
              localization={loc}
            />
          ))}
        </CardContent>
      </SettingsCard>

      <CreateOrganizationDialog
        classNames={classNames}
        localization={loc}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  );
}
