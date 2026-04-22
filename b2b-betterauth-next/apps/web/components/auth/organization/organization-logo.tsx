// --------------------------------------------------
// projects/saasy/apps/web/components/auth/organization/organization-logo.tsx
//
// export interface OrganizationLogoClassNames    L31
//   base                                         L32
//   image                                        L33
//   fallback                                     L34
//   fallbackIcon                                 L35
//   skeleton                                     L36
// export interface OrganizationLogoProps         L39
//   classNames                                   L40
//   isPending                                    L41
//   size                                         L42
//   organization                                 L43
//   localization                                 L48
// export function OrganizationLogo()             L58
// --------------------------------------------------

"use client";

import type { Organization } from "better-auth/plugins/organization";
import { type ComponentProps, useContext, useMemo } from "react";

import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { cn } from "@/lib/auth/utils";
import type { AuthLocalization } from "@/lib/auth/localization/auth-localization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export interface OrganizationLogoClassNames {
  base?: string;
  image?: string;
  fallback?: string;
  fallbackIcon?: string;
  skeleton?: string;
}

export interface OrganizationLogoProps {
  classNames?: OrganizationLogoClassNames;
  isPending?: boolean;
  size?: "sm" | "default" | "lg" | "xl" | null;
  organization?: Partial<Organization> | null;
  /**
   * @default authLocalization
   * @remarks `AuthLocalization`
   */
  localization?: AuthLocalization;
}

/**
 * Displays an organization logo with image and fallback support
 *
 * Renders an organization's logo image when available, with appropriate fallbacks:
 * - Shows a skeleton when isPending is true
 * - Falls back to a building icon when no logo is available
 */
export function OrganizationLogo({
  className,
  classNames,
  isPending,
  size,
  organization,
  localization: propLocalization,
  ...props
}: OrganizationLogoProps & ComponentProps<typeof Avatar>) {
  const { localization: contextLocalization, avatar } = useContext(AuthUIContext);

  const localization = useMemo(
    () => ({ ...contextLocalization, ...propLocalization }),
    [contextLocalization, propLocalization]
  );

  const name = organization?.name;
  const src = organization?.logo;

  if (isPending) {
    return (
      <Skeleton
        className={cn(
          "shrink-0 rounded-full",
          size === "sm"
            ? "size-6"
            : size === "lg"
              ? "size-10"
              : (size as string) === "xl"
                ? "size-12"
                : "size-8",
          className,
          classNames?.base,
          classNames?.skeleton
        )}
      />
    );
  }

  const sizeClass =
    size === "sm"
      ? "size-6"
      : size === "lg"
        ? "size-10"
        : (size as string) === "xl"
          ? "size-12"
          : "size-8";

  const radiusClass =
    size === "lg"
      ? "rounded-[12px]"
      : (size as string) === "xl"
        ? "rounded-[14px]"
        : "rounded-[8px]";

  const afterRadiusClass =
    size === "lg"
      ? "after:rounded-[12px]"
      : (size as string) === "xl"
        ? "after:rounded-[14px]"
        : "after:rounded-[8px]";

  const textClass =
    size === "sm"
      ? "text-[10px]"
      : size === "lg"
        ? "text-base"
        : (size as string) === "xl"
          ? "text-lg"
          : "text-sm";

  if (src) {
    return (
      <Avatar
        className={cn(
          "bg-ds-green-500/12",
          radiusClass,
          afterRadiusClass,
          sizeClass,
          className,
          classNames?.base
        )}
        {...props}
      >
        {avatar?.Image ? (
          <avatar.Image
            alt={name || localization?.ORGANIZATION}
            className={cn(radiusClass, classNames?.image)}
            src={src}
          />
        ) : (
          <AvatarImage
            alt={name || localization?.ORGANIZATION}
            className={cn(radiusClass, classNames?.image)}
            src={src}
          />
        )}

        <AvatarFallback className={cn("text-ds-green-500 font-medium", radiusClass, textClass, classNames?.fallback)}>
          {name?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div
      className={cn(
        "bg-ds-green-500/12 flex items-center justify-center text-ds-green-500 font-medium shrink-0",
        radiusClass,
        textClass,
        sizeClass,
        className,
        classNames?.base
      )}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}
