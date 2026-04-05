// ------------------------------------------
// projects/saasy/apps/web/components/auth/settings/shared/settings-card.tsx
//
// export type SettingsCardClassNames     L58
// base                                   L59
// avatar                                 L60
// button                                 L61
// cell                                   L62
// checkbox                               L63
// destructiveButton                      L64
// content                                L65
// description                            L66
// dialog                                 L67
// content                                L68
// footer                                 L69
// header                                 L70
// error                                  L72
// footer                                 L73
// header                                 L74
// icon                                   L75
// input                                  L76
// instructions                           L77
// label                                  L78
// primaryButton                          L79
// secondaryButton                        L80
// outlineButton                          L81
// skeleton                               L82
// title                                  L83
// export interface SettingsCardProps     L86
//   children                             L87
//   className                            L88
//   classNames                           L89
//   title                                L90
//   description                          L91
//   instructions                         L92
//   actionLabel                          L93
//   isSubmitting                         L94
//   disabled                             L95
//   isPending                            L96
//   optimistic                           L97
//   variant                              L98
//   localization                         L99
//   action                              L100
// export function SettingsCard()        L103
// ------------------------------------------

"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/auth/utils";
import type { AuthLocalization } from "@/lib/auth/localization/auth-localization";
import { Card } from "@/components/ui/card";
import type { UserAvatarClassNames } from "../../user-avatar";
import { SettingsCardFooter } from "./settings-card-footer";
import { SettingsCardHeader } from "./settings-card-header";

export type SettingsCardClassNames = {
  base?: string;
  avatar?: UserAvatarClassNames;
  button?: string;
  cell?: string;
  checkbox?: string;
  destructiveButton?: string;
  content?: string;
  description?: string;
  dialog?: {
    content?: string;
    footer?: string;
    header?: string;
  };
  error?: string;
  footer?: string;
  header?: string;
  icon?: string;
  input?: string;
  instructions?: string;
  label?: string;
  primaryButton?: string;
  secondaryButton?: string;
  outlineButton?: string;
  skeleton?: string;
  title?: string;
};

export interface SettingsCardProps extends Omit<ComponentProps<typeof Card>, "title"> {
  children?: ReactNode;
  className?: string;
  classNames?: SettingsCardClassNames;
  title?: ReactNode;
  description?: ReactNode;
  instructions?: ReactNode;
  actionLabel?: ReactNode;
  isSubmitting?: boolean;
  disabled?: boolean;
  isPending?: boolean;
  optimistic?: boolean;
  variant?: "default" | "destructive";
  localization?: AuthLocalization;
  action?: () => Promise<unknown> | unknown;
}

export function SettingsCard({
  children,
  className,
  classNames,
  title,
  description,
  instructions,
  actionLabel,
  disabled,
  isPending,
  isSubmitting,
  optimistic,
  variant,
  action,
  ...props
}: SettingsCardProps) {
  return (
    <Card
      className={cn(
        "w-full pb-0 text-start",
        variant === "destructive" && "border-destructive/40",
        className,
        classNames?.base
      )}
      {...props}
    >
      <SettingsCardHeader
        classNames={classNames}
        description={description}
        isPending={isPending}
        title={title}
      />

      {children}

      <SettingsCardFooter
        classNames={classNames}
        actionLabel={actionLabel}
        disabled={disabled}
        isPending={isPending}
        isSubmitting={isSubmitting}
        instructions={instructions}
        optimistic={optimistic}
        variant={variant}
        action={action}
      />
    </Card>
  );
}
