// ---------------------------------------------
// projects/saasy/apps/web/components/auth/user-button.tsx
//
// export interface UserButtonClassNames     L64
//   base                                    L65
//   skeleton                                L66
//   trigger                                 L67
//   base                                    L68
//   avatar                                  L69
//   user                                    L70
//   skeleton                                L71
//   content                                 L73
//   base                                    L74
//   user                                    L75
//   avatar                                  L76
//   menuItem                                L77
//   separator                               L78
// export interface UserButtonProps          L82
//   className                               L83
//   classNames                              L84
//   align                                   L85
//   alignOffset                             L86
//   side                                    L87
//   sideOffset                              L88
//   additionalLinks                         L89
//   href                                    L91
//   icon                                    L92
//   label                                   L93
//   signedIn                                L94
//   separator                               L95
//   trigger                                 L99
//   disableDefaultLinks                    L100
//   localization                           L105
// export function UserButton()             L118
// ---------------------------------------------

"use client";
import { ChevronsUpDown, LogInIcon, LogOutIcon, SettingsIcon, UserRoundPlus } from "lucide-react";
import {
  type ComponentProps,
  Fragment,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";

import { useIsHydrated } from "@/hooks/auth/use-hydrated";
import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { cn } from "@/lib/auth/utils";
import type { AuthLocalization } from "@/lib/auth/localization/auth-localization";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar, type UserAvatarClassNames } from "./user-avatar";
import { UserView, type UserViewClassNames } from "./user-view";

export interface UserButtonClassNames {
  base?: string;
  skeleton?: string;
  trigger?: {
    base?: string;
    avatar?: UserAvatarClassNames;
    user?: UserViewClassNames;
    skeleton?: string;
  };
  content?: {
    base?: string;
    user?: UserViewClassNames;
    avatar?: UserAvatarClassNames;
    menuItem?: string;
    separator?: string;
  };
}

export interface UserButtonProps {
  className?: string;
  classNames?: UserButtonClassNames;
  align?: "center" | "start" | "end";
  alignOffset?: number;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  additionalLinks?: (
    | {
        href: string;
        icon?: ReactNode;
        label: ReactNode;
        signedIn?: boolean;
        separator?: boolean;
      }
    | ReactNode
  )[];
  trigger?: ReactNode;
  disableDefaultLinks?: boolean;
  /**
   * @default authLocalization
   * @remarks `AuthLocalization`
   */
  localization?: AuthLocalization;
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
export function UserButton({
  className,
  classNames,
  align,
  alignOffset,
  side,
  sideOffset,
  trigger,
  additionalLinks,
  disableDefaultLinks,
  localization: propLocalization,
  size,
  ...props
}: UserButtonProps & ComponentProps<typeof Button>) {
  const {
    basePath,
    hooks: { useSession },
    localization: contextLocalization,
    account: accountOptions,
    signUp,
    viewPaths,
    Link,
  } = useContext(AuthUIContext);

  const localization = useMemo(
    () => ({ ...contextLocalization, ...propLocalization }),
    [contextLocalization, propLocalization]
  );

  const { data: sessionData, isPending: sessionPending } = useSession();
  const user = sessionData?.user;

  const isHydrated = useIsHydrated();
  const isPending = sessionPending || !isHydrated;

  const warningLogged = useRef(false);

  useEffect(() => {
    if (size || warningLogged.current) return;

    console.warn(
      "[Better Auth UI] The `size` prop of `UserButton` no longer defaults to `icon`. Please pass `size='icon'` to the `UserButton` component to get the same behaviour as before. This warning will be removed in a future release. It can be suppressed in the meantime by defining the `size` prop."
    );

    warningLogged.current = true;
  }, [size]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className={cn(size === "icon" && "rounded-full", classNames?.trigger?.base)}
      >
        {trigger ||
          (size === "icon" ? (
            <Button size="icon" className="size-fit rounded-full" variant="ghost">
              <UserAvatar
                key={user?.image}
                isPending={isPending}
                className={cn(className, classNames?.base)}
                classNames={classNames?.trigger?.avatar}
                user={user}
                aria-label={localization.ACCOUNT}
                localization={localization}
              />
            </Button>
          ) : (
            <Button
              className={cn("!p-2 h-fit", className, classNames?.trigger?.base)}
              size={size}
              {...props}
            >
              <UserView
                size={size as any}
                user={user}
                isPending={isPending}
                classNames={classNames?.trigger?.user}
                localization={localization}
              />

              <ChevronsUpDown className="ml-auto" />
            </Button>
          ))}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className={cn(
          "w-[--radix-dropdown-menu-trigger-width] min-w-56 max-w-64",
          classNames?.content?.base
        )}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className={cn("p-2", classNames?.content?.menuItem)}>
          {user || isPending ? (
            <UserView
              user={user}
              isPending={isPending}
              classNames={classNames?.content?.user}
              localization={localization}
            />
          ) : (
            <div className="-my-1 text-muted-foreground text-xs">{localization.ACCOUNT}</div>
          )}
        </div>

        <DropdownMenuSeparator className={classNames?.content?.separator} />

        {additionalLinks?.map((link, index) => {
          // Handle ReactNode directly
          if (!link || typeof link !== "object" || !("href" in link)) {
            return (
              <DropdownMenuItem key={index} className={classNames?.content?.menuItem}>
                {link}
              </DropdownMenuItem>
            );
          }

          const { href, icon, label, signedIn, separator } = link;

          if (
            signedIn !== undefined &&
            ((signedIn && !sessionData) || (!signedIn && sessionData))
          ) {
            return null;
          }

          return (
            <Fragment key={index}>
              <Link href={href}>
                <DropdownMenuItem className={classNames?.content?.menuItem}>
                  {icon}
                  {label}
                </DropdownMenuItem>
              </Link>
              {separator && <DropdownMenuSeparator className={classNames?.content?.separator} />}
            </Fragment>
          );
        })}

        {!user ? (
          <>
            <Link href={`${basePath}/${viewPaths.SIGN_IN}`}>
              <DropdownMenuItem className={classNames?.content?.menuItem}>
                <LogInIcon />

                {localization.SIGN_IN}
              </DropdownMenuItem>
            </Link>

            {signUp && (
              <Link href={`${basePath}/${viewPaths.SIGN_UP}`}>
                <DropdownMenuItem className={classNames?.content?.menuItem}>
                  <UserRoundPlus />

                  {localization.SIGN_UP}
                </DropdownMenuItem>
              </Link>
            )}
          </>
        ) : (
          <>
            {!disableDefaultLinks && accountOptions && (
              <Link href={`${accountOptions.basePath}/${accountOptions.viewPaths?.SETTINGS}`}>
                <DropdownMenuItem className={classNames?.content?.menuItem}>
                  <SettingsIcon />

                  {localization.SETTINGS}
                </DropdownMenuItem>
              </Link>
            )}

            <Link href={`${basePath}/${viewPaths.SIGN_OUT}`}>
              <DropdownMenuItem className={classNames?.content?.menuItem}>
                <LogOutIcon />

                {localization.SIGN_OUT}
              </DropdownMenuItem>
            </Link>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
