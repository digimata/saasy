import { useContext, useEffect, useMemo, useRef } from "react"

import { useOnSuccessTransition } from "@/hooks/auth/use-success-transition"
import { AuthUIContext } from "@/lib/auth/auth-ui-provider"
import { getLocalizedError } from "@/lib/auth/utils"
import type { AuthLocalization } from "@/lib/auth/localization/auth-localization"

interface OneTapProps {
    localization: Partial<AuthLocalization>
    redirectTo?: string
}

export function OneTap({ localization, redirectTo }: OneTapProps) {
    const {
        authClient,
        localization: contextLocalization,
        toast,
        localizeErrors
    } = useContext(AuthUIContext)
    const oneTapFetched = useRef(false)

    localization = useMemo(
        () => ({ ...contextLocalization, ...localization }),
        [contextLocalization, localization]
    )

    const { onSuccess } = useOnSuccessTransition({ redirectTo })

    useEffect(() => {
        if (oneTapFetched.current) return
        oneTapFetched.current = true

        try {
            authClient.oneTap({
                fetchOptions: {
                    throw: true,
                    onSuccess
                }
            })
        } catch (error) {
            toast({
                variant: "error",
                message: getLocalizedError({
                    error,
                    localization,
                    localizeErrors
                })
            })
        }
    }, [authClient, localization, localizeErrors, onSuccess, toast])

    return null
}
