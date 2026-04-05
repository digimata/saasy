// --------------------------------------------------
// projects/saasy/apps/web/components/auth/organization/organization-cell-view.tsx
//
// export interface OrganizationViewClassNames    L32
//   base                                         L33
//   avatar                                       L34
//   content                                      L35
//   title                                        L36
//   subtitle                                     L37
//   skeleton                                     L38
// export interface OrganizationViewProps         L41
//   className                                    L42
//   classNames                                   L43
//   isPending                                    L44
//   size                                         L45
//   organization                                 L46
//   localization                                 L51
// export function OrganizationCellView()         L54
// --------------------------------------------------

"use client";

import type { Organization } from "better-auth/plugins/organization";
import { useContext } from "react";

import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { cn } from "@/lib/auth/utils";
import type { AuthLocalization } from "@/lib/auth/localization/auth-localization";
import { Skeleton } from "@/components/ui/skeleton";
import { OrganizationLogo, type OrganizationLogoClassNames } from "./organization-logo";

export interface OrganizationViewClassNames {
  base?: string;
  avatar?: OrganizationLogoClassNames;
  content?: string;
  title?: string;
  subtitle?: string;
  skeleton?: string;
}

export interface OrganizationViewProps {
  className?: string;
  classNames?: OrganizationViewClassNames;
  isPending?: boolean;
  size?: "sm" | "default" | "lg";
  organization?: Organization | null;
  /**
   * @default authLocalization
   * @remarks `AuthLocalization`
   */
  localization?: AuthLocalization;
}

export function OrganizationCellView({
  className,
  classNames,
  isPending,
  size,
  organization,
  localization: propLocalization,
}: OrganizationViewProps) {
  const { localization: contextLocalization } = useContext(AuthUIContext);

  const localization = { ...contextLocalization, ...propLocalization };

  return (
    <div className={cn("flex items-center gap-2 truncate", className, classNames?.base)}>
      <OrganizationLogo
        className={cn(size !== "sm" && "my-0.5")}
        classNames={classNames?.avatar}
        isPending={isPending}
        localization={localization}
        organization={organization}
        size={size}
      />

      <div className={cn("flex flex-col truncate text-left leading-tight", classNames?.content)}>
        {isPending ? (
          <>
            <Skeleton
              className={cn(
                "max-w-full",
                size === "lg" ? "h-4.5 w-32" : "h-3.5 w-24",
                classNames?.title,
                classNames?.skeleton
              )}
            />

            {size !== "sm" && (
              <Skeleton
                className={cn(
                  "mt-1.5 max-w-full",
                  size === "lg" ? "h-3.5 w-24" : "h-3 w-16",
                  classNames?.subtitle,
                  classNames?.skeleton
                )}
              />
            )}
          </>
        ) : (
          <>
            <span
              className={cn(
                "truncate font-semibold",
                size === "lg" ? "text-base" : "text-sm",
                classNames?.title
              )}
            >
              {organization?.name || localization?.ORGANIZATION}
            </span>

            {size !== "sm" && organization?.slug && (
              <span
                className={cn(
                  "truncate opacity-70",
                  size === "lg" ? "text-sm" : "text-xs",
                  classNames?.subtitle
                )}
              >
                {organization.slug}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
