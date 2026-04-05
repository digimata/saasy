import type { SocialProvider } from "better-auth/social-providers";
import { useCallback, useContext } from "react";

import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import type { Provider } from "@/lib/auth/social-providers";
import { cn, getLocalizedError, getSearchParam } from "@/lib/auth/utils";
import type { AuthLocalization } from "@/lib/auth/localization/auth-localization";
import { Button } from "@/components/ui/button";
import type { AuthViewClassNames } from "./auth-view";

// ---------------------------------------
// projects/saasy/apps/web/components/auth/provider-button.tsx
//
// interface ProviderButtonProps       L27
//   className                         L28
//   classNames                        L29
//   callbackURL                       L30
//   isSubmitting                      L31
//   localization                      L32
//   provider                          L33
//   redirectTo                        L34
//   socialLayout                      L35
//   setIsSubmitting                   L36
// export function ProviderButton()    L39
// ---------------------------------------

interface ProviderButtonProps {
  className?: string;
  classNames?: AuthViewClassNames;
  callbackURL?: string;
  isSubmitting: boolean;
  localization: Partial<AuthLocalization>;
  provider: Provider;
  redirectTo?: string;
  socialLayout: "auto" | "horizontal" | "grid" | "vertical";
  setIsSubmitting: (isSubmitting: boolean) => void;
}

export function ProviderButton({
  className,
  classNames,
  callbackURL: callbackURLProp,
  isSubmitting,
  localization,
  provider,
  redirectTo: redirectToProp,
  socialLayout,
  setIsSubmitting,
}: ProviderButtonProps) {
  const {
    authClient,
    basePath,
    baseURL,
    persistClient,
    redirectTo: contextRedirectTo,
    viewPaths,
    social,
    toast,
    localizeErrors,
  } = useContext(AuthUIContext);

  const getRedirectTo = useCallback(
    () => redirectToProp || getSearchParam("redirectTo") || contextRedirectTo,
    [redirectToProp, contextRedirectTo]
  );

  const getCallbackURL = useCallback(
    () =>
      `${baseURL}${
        callbackURLProp ||
        (persistClient
          ? `${basePath}/${viewPaths.CALLBACK}?redirectTo=${encodeURIComponent(getRedirectTo())}`
          : getRedirectTo())
      }`,
    [callbackURLProp, persistClient, basePath, viewPaths, baseURL, getRedirectTo]
  );

  const doSignInSocial = async () => {
    setIsSubmitting(true);

    try {
      const socialParams = {
        provider: provider.provider as SocialProvider,
        callbackURL: getCallbackURL(),
        fetchOptions: { throw: true },
      };

      if (social?.signIn) {
        await social.signIn(socialParams);

        setTimeout(() => {
          setIsSubmitting(false);
        }, 10000);
      } else {
        await authClient.signIn.social(socialParams);
      }
    } catch (error) {
      toast({
        variant: "error",
        message: getLocalizedError({
          error,
          localization,
          localizeErrors,
        }),
      });

      setIsSubmitting(false);
    }
  };

  return (
    <Button
      className={cn(
        socialLayout === "vertical" ? "w-full" : "grow",
        className,
        classNames?.form?.button,
        classNames?.form?.outlineButton,
        classNames?.form?.providerButton
      )}
      disabled={isSubmitting}
      variant="outline"
      onClick={doSignInSocial}
    >
      {provider.icon && <provider.icon className={classNames?.form?.icon} />}

      {socialLayout === "grid" && provider.name}
      {socialLayout === "vertical" && `${localization.SIGN_IN_WITH} ${provider.name}`}
    </Button>
  );
}
