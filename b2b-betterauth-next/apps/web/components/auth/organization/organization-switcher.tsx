// -------------------------------------------------------
// projects/saasy/apps/web/components/auth/organization/organization-switcher.tsx
//
// export interface OrganizationSwitcherClassNames     L68
//   base                                              L69
//   skeleton                                          L70
//   trigger                                           L71
//   base                                              L72
//   avatar                                            L73
//   user                                              L74
//   organization                                      L75
//   skeleton                                          L76
//   content                                           L78
//   base                                              L79
//   user                                              L80
//   organization                                      L81
//   avatar                                            L82
//   menuItem                                          L83
//   separator                                         L84
// export interface OrganizationSwitcherProps          L88
//   classNames                                        L89
//   align                                             L90
//   alignOffset                                       L91
//   side                                              L92
//   sideOffset                                        L93
//   trigger                                           L94
//   localization                                      L95
//   slug                                              L96
//   onSetActive                                       L97
//   hidePersonal                                     L104
//   hideCreate                                       L105
// export function OrganizationSwitcher()             L118
// -------------------------------------------------------

"use client";

import type { Organization } from "better-auth/plugins/organization";
import { ChevronsUpDown, PlusCircleIcon } from "lucide-react";
import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import useSWR from "swr";

import { useCurrentOrganization } from "@/hooks/auth/use-current-organization";
import { Badge } from "@/components/ui/badge";
import { PLAN_BADGE } from "@/components/billing/plan-card";
import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { cn, getLocalizedError } from "@/lib/auth/utils";
import type { AuthLocalization } from "@/lib/auth/localization/auth-localization";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar, type UserAvatarClassNames } from "@/components/auth/user-avatar";
import type { UserViewClassNames } from "@/components/auth/user-view";
import { OrganizationCellView, type OrganizationViewClassNames } from "./organization-cell-view";
import { OrganizationLogo } from "./organization-logo";
import { PersonalAccountView } from "./personal-account-view";

export interface OrganizationSwitcherClassNames {
  base?: string;
  skeleton?: string;
  trigger?: {
    base?: string;
    avatar?: UserAvatarClassNames;
    user?: UserViewClassNames;
    organization?: OrganizationViewClassNames;
    skeleton?: string;
  };
  content?: {
    base?: string;
    user?: UserViewClassNames;
    organization?: OrganizationViewClassNames;
    avatar?: UserAvatarClassNames;
    menuItem?: string;
    separator?: string;
  };
}

export interface OrganizationSwitcherProps extends Omit<ComponentProps<typeof Button>, "trigger"> {
  classNames?: OrganizationSwitcherClassNames;
  align?: "center" | "start" | "end";
  alignOffset?: number;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  trigger?: ReactNode;
  localization?: AuthLocalization;
  slug?: string;
  onSetActive?: (organization: Organization | null) => void;
  /**
   * Hide the personal organization option from the switcher.
   * When true, users can only switch between organizations and cannot access their personal account.
   * If no organization is active, the first available organization will be automatically selected.
   * @default false
   */
  hidePersonal?: boolean;
  hideCreate?: boolean;
}

/**
 * Displays an interactive user button with dropdown menu functionality
 *
 * Renders a user interface element that can be displayed as either an icon or full button:
 * - Shows a user avatar or placeholder when in icon mode
 * - Displays user name and email with dropdown indicator in full mode
 * - Provides dropdown menu with authentication options (sign in/out, settings, etc.)
 * - Supports multi-session functionality for switching between accounts
 * - Can be customized with additional links and styling options
 */
export function OrganizationSwitcher({
  className,
  classNames,
  align,
  alignOffset,
  side,
  sideOffset,
  trigger,
  localization: localizationProp,
  slug: slugProp,
  size,
  onSetActive,
  hidePersonal,
  hideCreate,
  ...props
}: OrganizationSwitcherProps) {
  const {
    authClient,
    basePath,
    hooks: { useSession, useListOrganizations },
    localization: contextLocalization,
    account: accountOptions,
    organization: organizationOptions,
    redirectTo,
    navigate,
    toast,
    viewPaths,
    Link,
    localizeErrors,
  } = useContext(AuthUIContext);

  const { pathMode, slug: contextSlug, personalPath } = organizationOptions || {};

  const slug = slugProp || contextSlug;

  const localization = useMemo(
    () => ({ ...contextLocalization, ...localizationProp }),
    [contextLocalization, localizationProp]
  );

  const [activeOrganizationPending, setActiveOrganizationPending] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: workspacePlans } = useSWR<Record<string, string>>(
    dropdownOpen ? "/api/billing/plans" : null,
    (url: string) => fetch(url).then((r) => r.json()),
  );

  const { data: sessionData, isPending: sessionPending } = useSession();
  const user = sessionData?.user;

  const { data: organizations, isPending: organizationsPending } = useListOrganizations();

  const {
    data: activeOrganization,
    isPending: organizationPending,
    isRefetching: organizationRefetching,
    refetch: organizationRefetch,
  } = useCurrentOrganization({ slug });

  const isPending =
    organizationsPending || sessionPending || activeOrganizationPending || organizationPending;

  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  useEffect(() => {
    if (organizationRefetching) return;

    setActiveOrganizationPending(false);
  }, [activeOrganization, organizationRefetching]);

  const switchOrganization = useCallback(
    async (organization: Organization | null) => {
      // Prevent switching to personal account when hidePersonal is true
      if (hidePersonal && organization === null) {
        return;
      }

      if (pathMode === "slug") {
        if (organization) {
          navigate(`${organizationOptions?.basePath}/${organization.slug}`);
        } else {
          navigate(personalPath ?? redirectTo);
        }

        return;
      }

      setActiveOrganizationPending(true);

      try {
        onSetActive?.(organization);

        await authClient.organization.setActive({
          organizationId: organization?.id || null,
          fetchOptions: {
            throw: true,
          },
        });

        organizationRefetch?.();
      } catch (error) {
        toast({
          variant: "error",
          message: getLocalizedError({
            error,
            localization,
            localizeErrors,
          }),
        });

        setActiveOrganizationPending(false);
      }
    },
    [
      authClient,
      toast,
      localization,
      localizeErrors,
      onSetActive,
      hidePersonal,
      pathMode,
      personalPath,
      organizationOptions?.basePath,
      redirectTo,
      navigate,
      organizationRefetch,
    ]
  );

  // Auto-select first organization when hidePersonal is true
  useEffect(() => {
    if (
      hidePersonal &&
      !activeOrganization &&
      !activeOrganizationPending &&
      organizations &&
      organizations.length > 0 &&
      !sessionPending &&
      !organizationPending &&
      !slug
    ) {
      switchOrganization(organizations[0] ?? null);
    }
  }, [
    hidePersonal,
    activeOrganization,
    activeOrganizationPending,
    organizations,
    sessionPending,
    organizationPending,
    switchOrganization,
    slug,
  ]);

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          {trigger ||
            (size === "icon" ? (
              <Button
                size="icon"
                className={cn("size-fit rounded-full", className, classNames?.trigger?.base)}
                variant="ghost"
                type="button"
                {...props}
              >
                {isPending || activeOrganization || !sessionData || hidePersonal ? (
                  <OrganizationLogo
                    key={activeOrganization?.logo}
                    className={cn(className, classNames?.base)}
                    classNames={classNames?.trigger?.avatar}
                    isPending={isPending}
                    organization={activeOrganization}
                    aria-label={localization.ORGANIZATION}
                    localization={localization}
                  />
                ) : (
                  <UserAvatar
                    key={user?.image}
                    className={cn(className, classNames?.base)}
                    classNames={classNames?.trigger?.avatar}
                    user={user}
                    aria-label={localization.ACCOUNT}
                    localization={localization}
                  />
                )}
              </Button>
            ) : (
              <Button
                className={cn("!p-2 h-fit", className, classNames?.trigger?.base)}
                size={size}
                {...props}
              >
                {isPending || activeOrganization || !sessionData || hidePersonal ? (
                  <OrganizationCellView
                    classNames={classNames?.trigger?.organization}
                    isPending={isPending}
                    localization={localization}
                    organization={activeOrganization}
                    size={size as any}
                  />
                ) : (
                  <PersonalAccountView
                    classNames={classNames?.trigger?.user}
                    localization={localization}
                    size={size as any}
                    user={user}
                  />
                )}

                <ChevronsUpDown className="ml-auto" />
              </Button>
            ))}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="min-w-56 max-w-64 p-1"
          align={align}
          alignOffset={alignOffset}
          side={side}
          sideOffset={sideOffset}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {organizations?.map((organization) => (
            <DropdownMenuItem
              key={organization.id}
              className="gap-3 px-3 py-2.5"
              onClick={() => {
                if (organization.id !== activeOrganization?.id) {
                  switchOrganization(organization);
                }
                setDropdownOpen(false);
              }}
            >
              <div className="size-6 rounded-[6px] bg-ds-green-500/12 flex items-center justify-center text-ds-green-500 text-[11px] font-medium shrink-0">
                {organization.name?.[0]?.toUpperCase() || "?"}
              </div>
              <span className="text-label-13 font-medium text-foreground truncate">{organization.name}</span>
              {workspacePlans && (
                <Badge variant={PLAN_BADGE[workspacePlans[organization.id] ?? "hobby"]?.variant ?? "muted"} className="text-[11px] font-normal ml-auto shrink-0">
                  {PLAN_BADGE[workspacePlans[organization.id] ?? "hobby"]?.label ?? "Hobby"}
                </Badge>
              )}
            </DropdownMenuItem>
          ))}

          {!isPending && sessionData && !hideCreate && (
            <>
              {organizations && organizations.length > 0 && (
                <DropdownMenuSeparator />
              )}
              <DropdownMenuItem
                className="gap-3 px-3 py-2.5"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/onboard");
                }}
              >
                <PlusCircleIcon className="size-4 text-muted-foreground shrink-0 ml-0.5" />
                <span className="text-label-13 font-medium text-foreground">Create workspace</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

    </>
  );
}
