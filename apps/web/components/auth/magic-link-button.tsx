import { LockIcon, MailIcon } from "lucide-react"
import { useContext } from "react"

import { AuthUIContext } from "@/lib/auth/auth-ui-provider"
import { cn } from "@/lib/auth/utils"
import type { AuthViewPath } from "@/lib/auth/view-paths"
import type { AuthLocalization } from "@/lib/auth/localization/auth-localization"
import { Button } from "@/components/ui/button"
import type { AuthViewClassNames } from "./auth-view"

// ----------------------------------------
// projects/saasy/apps/web/components/auth/magic-link-button.tsx
//
// interface MagicLinkButtonProps       L22
//   classNames                         L23
//   isSubmitting                       L24
//   localization                       L25
//   view                               L26
// export function MagicLinkButton()    L29
// ----------------------------------------

interface MagicLinkButtonProps {
    classNames?: AuthViewClassNames
    isSubmitting?: boolean
    localization: Partial<AuthLocalization>
    view: AuthViewPath
}

export function MagicLinkButton({
    classNames,
    isSubmitting,
    localization,
    view
}: MagicLinkButtonProps) {
    const { viewPaths, navigate, basePath, credentials } =
        useContext(AuthUIContext)

    return (
        <Button
            className={cn(
                "w-full",
                classNames?.form?.button,
                classNames?.form?.secondaryButton
            )}
            disabled={isSubmitting}
            type="button"
            variant="secondary"
            onClick={() =>
                navigate(
                    `${basePath}/${view === "MAGIC_LINK" || !credentials ? viewPaths.SIGN_IN : viewPaths.MAGIC_LINK}${window.location.search}`
                )
            }
        >
            {view === "MAGIC_LINK" ? (
                <LockIcon className={classNames?.form?.icon} />
            ) : (
                <MailIcon className={classNames?.form?.icon} />
            )}
            {localization.SIGN_IN_WITH}{" "}
            {view === "MAGIC_LINK"
                ? localization.PASSWORD
                : localization.MAGIC_LINK}
        </Button>
    )
}
