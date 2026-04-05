import { LockIcon, MailIcon } from "lucide-react";
import { useContext } from "react";

import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { cn } from "@/lib/auth/utils";
import type { AuthViewPath } from "@/lib/auth/view-paths";
import type { AuthLocalization } from "@/lib/auth/localization/auth-localization";
import { Button } from "@/components/ui/button";
import type { AuthViewClassNames } from "./auth-view";

// ---------------------------------------
// projects/saasy/apps/web/components/auth/email-otp-button.tsx
//
// interface EmailOTPButtonProps       L22
//   classNames                        L23
//   isSubmitting                      L24
//   localization                      L25
//   view                              L26
// export function EmailOTPButton()    L29
// ---------------------------------------

interface EmailOTPButtonProps {
  classNames?: AuthViewClassNames;
  isSubmitting?: boolean;
  localization: Partial<AuthLocalization>;
  view: AuthViewPath;
}

export function EmailOTPButton({
  classNames,
  isSubmitting,
  localization,
  view,
}: EmailOTPButtonProps) {
  const { viewPaths, navigate, basePath } = useContext(AuthUIContext);

  return (
    <Button
      className={cn("w-full", classNames?.form?.button, classNames?.form?.secondaryButton)}
      disabled={isSubmitting}
      type="button"
      variant="secondary"
      onClick={() =>
        navigate(
          `${basePath}/${view === "EMAIL_OTP" ? viewPaths.SIGN_IN : viewPaths.EMAIL_OTP}${window.location.search}`
        )
      }
    >
      {view === "EMAIL_OTP" ? (
        <LockIcon className={classNames?.form?.icon} />
      ) : (
        <MailIcon className={classNames?.form?.icon} />
      )}
      {localization.SIGN_IN_WITH}{" "}
      {view === "EMAIL_OTP" ? localization.PASSWORD : localization.EMAIL_OTP}
    </Button>
  );
}
