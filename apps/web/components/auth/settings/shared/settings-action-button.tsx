// ---------------------------------------------
// projects/saasy/apps/web/components/auth/settings/shared/settings-action-button.tsx
//
// interface SettingsActionButtonProps       L22
//   classNames                              L23
//   actionLabel                             L24
//   disabled                                L25
//   isSubmitting                            L26
// export function SettingsActionButton()    L29
// ---------------------------------------------

"use client";

import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useFormState } from "react-hook-form";

import { cn } from "@/lib/auth/utils";
import { Button } from "@/components/ui/button";
import type { SettingsCardClassNames } from "./settings-card";

interface SettingsActionButtonProps extends ComponentProps<typeof Button> {
  classNames?: SettingsCardClassNames;
  actionLabel: ReactNode;
  disabled?: boolean;
  isSubmitting?: boolean;
}

export function SettingsActionButton({
  classNames,
  actionLabel,
  disabled,
  isSubmitting,
  variant,
  onClick,
  ...props
}: SettingsActionButtonProps) {
  if (!onClick) {
    const formState = useFormState();
    isSubmitting = formState.isSubmitting;
  }

  return (
    <Button
      className={cn(
        "md:ms-auto",
        classNames?.button,
        variant === "default" && classNames?.primaryButton,
        variant === "destructive" && classNames?.destructiveButton
      )}
      disabled={isSubmitting || disabled}
      size="sm"
      type={onClick ? "button" : "submit"}
      variant={variant}
      onClick={onClick}
      {...props}
    >
      {isSubmitting && <Loader2 className="animate-spin" />}
      {actionLabel}
    </Button>
  );
}
