// -------------------------------------
// projects/saasy/apps/web/components/auth/auth-view.tsx
//
// export type AuthViewClassNames    L60
// base                              L61
// content                           L62
// description                       L63
// footer                            L64
// footerLink                        L65
// continueWith                      L66
// form                              L67
// header                            L68
// separator                         L69
// title                             L70
// export interface AuthViewProps    L73
//   className                       L74
//   classNames                      L75
//   callbackURL                     L76
//   cardHeader                      L77
//   cardFooter                      L78
//   localization                    L79
//   path                            L80
//   pathname                        L81
//   redirectTo                      L82
//   socialLayout                    L83
//   view                            L84
//   otpSeparators                   L85
// export function AuthView()        L88
// -------------------------------------

"use client";

import { ArrowLeftIcon } from "lucide-react";
import { type ReactNode, useContext, useEffect, useState } from "react";
import { useIsHydrated } from "@/hooks/auth/use-hydrated";
import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { socialProviders } from "@/lib/auth/social-providers";
import { cn, getViewByPath } from "@/lib/auth/utils";
import type { AuthViewPaths } from "@/lib/auth/view-paths";
import type { AuthLocalization } from "@/lib/auth/localization/auth-localization";
import { AcceptInvitationCard } from "@/components/auth/organization/accept-invitation-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AuthCallback } from "./auth-callback";
import { AuthForm, type AuthFormClassNames } from "./auth-form";
import { EmailOTPButton } from "./email-otp-button";
import { MagicLinkButton } from "./magic-link-button";
// import { PasskeyButton } from "./passkey-button" // TODO: passkey not enabled
import { ProviderButton } from "./provider-button";
import { SignOut } from "./sign-out";

export type AuthViewClassNames = {
  base?: string;
  content?: string;
  description?: string;
  footer?: string;
  footerLink?: string;
  continueWith?: string;
  form?: AuthFormClassNames;
  header?: string;
  separator?: string;
  title?: string;
};

export interface AuthViewProps {
  className?: string;
  classNames?: AuthViewClassNames;
  callbackURL?: string;
  cardHeader?: ReactNode;
  cardFooter?: ReactNode;
  localization?: AuthLocalization;
  path?: string;
  pathname?: string;
  redirectTo?: string;
  socialLayout?: "auto" | "horizontal" | "grid" | "vertical";
  view?: keyof AuthViewPaths;
  otpSeparators?: 0 | 1 | 2;
}

export function AuthView({
  className,
  classNames,
  callbackURL,
  cardHeader,
  cardFooter,
  localization,
  path: pathProp,
  pathname,
  redirectTo,
  socialLayout: socialLayoutProp = "auto",
  view: viewProp,
  otpSeparators = 0,
}: AuthViewProps) {
  const isHydrated = useIsHydrated();
  const {
    basePath,
    credentials,
    localization: contextLocalization,
    magicLink,
    emailOTP,
    signUp,
    social,
    viewPaths,
    Link,
  } = useContext(AuthUIContext);

  const loc = { ...contextLocalization, ...localization };

  let socialLayout = socialLayoutProp;
  if (socialLayout === "auto") {
    socialLayout = !credentials
      ? "vertical"
      : social?.providers && social.providers.length > 2
        ? "horizontal"
        : "vertical";
  }

  const path = pathProp ?? pathname?.split("/").pop();

  const view = viewProp || getViewByPath(viewPaths!, path) || "SIGN_IN";

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handlePageHide = () => setIsSubmitting(false);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      setIsSubmitting(false);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, []);

  if (view === "CALLBACK") return <AuthCallback redirectTo={redirectTo} />;
  if (view === "SIGN_OUT") return <SignOut redirectTo={redirectTo} />;
  if (view === "ACCEPT_INVITATION")
    return <AcceptInvitationCard className={className} classNames={classNames} />;

  const description =
    !credentials && !magicLink && !emailOTP
      ? loc.DISABLED_CREDENTIALS_DESCRIPTION
      : loc[`${view}_DESCRIPTION` as keyof typeof loc];

  return (
    <Card className={cn("w-full max-w-sm", className, classNames?.base)}>
      <CardHeader className={classNames?.header}>
        {cardHeader ? (
          cardHeader
        ) : (
          <>
            <CardTitle className={cn("text-lg md:text-xl", classNames?.title)}>
              {loc[view as keyof typeof loc]}
            </CardTitle>
            {description && (
              <CardDescription className={cn("text-xs md:text-sm", classNames?.description)}>
                {description}
              </CardDescription>
            )}
          </>
        )}
      </CardHeader>

      <CardContent className={cn("grid gap-6", classNames?.content)}>
        {(credentials || magicLink || emailOTP) && (
          <div className="grid gap-4">
            <AuthForm
              classNames={classNames?.form ?? {}}
              callbackURL={callbackURL}
              isSubmitting={isSubmitting}
              localization={loc}
              otpSeparators={otpSeparators}
              view={view}
              redirectTo={redirectTo}
              setIsSubmitting={setIsSubmitting}
            />

            {magicLink &&
              ((credentials &&
                ["FORGOT_PASSWORD", "SIGN_UP", "SIGN_IN", "MAGIC_LINK", "EMAIL_OTP"].includes(
                  view as string
                )) ||
                (emailOTP && view === "EMAIL_OTP")) && (
                <MagicLinkButton
                  classNames={classNames}
                  localization={loc}
                  view={view}
                  isSubmitting={isSubmitting}
                />
              )}

            {emailOTP &&
              ((credentials &&
                ["FORGOT_PASSWORD", "SIGN_UP", "SIGN_IN", "MAGIC_LINK", "EMAIL_OTP"].includes(
                  view as string
                )) ||
                (magicLink && ["SIGN_IN", "MAGIC_LINK"].includes(view as string))) && (
                <EmailOTPButton
                  classNames={classNames}
                  localization={loc}
                  view={view}
                  isSubmitting={isSubmitting}
                />
              )}
          </div>
        )}

        {view !== "RESET_PASSWORD" &&
          view !== "EMAIL_VERIFICATION" &&
          social?.providers?.length && (
            <>
              {(credentials || magicLink || emailOTP) && (
                <div className={cn("flex items-center gap-2", classNames?.continueWith)}>
                  <Separator className={cn("!w-auto grow", classNames?.separator)} />
                  <span className="flex-shrink-0 text-muted-foreground text-sm">
                    {loc.OR_CONTINUE_WITH}
                  </span>
                  <Separator className={cn("!w-auto grow", classNames?.separator)} />
                </div>
              )}

              <div className="grid gap-4">
                {social?.providers?.length && (
                  <div
                    className={cn(
                      "flex w-full items-center justify-between gap-4",
                      socialLayout === "horizontal" && "flex-wrap",
                      socialLayout === "vertical" && "flex-col",
                      socialLayout === "grid" && "grid grid-cols-2"
                    )}
                  >
                    {social?.providers?.map((provider) => {
                      const socialProvider = socialProviders.find(
                        (socialProvider) => socialProvider.provider === provider
                      );
                      if (!socialProvider) return null;
                      return (
                        <ProviderButton
                          key={provider}
                          classNames={classNames}
                          callbackURL={callbackURL}
                          isSubmitting={isSubmitting}
                          localization={loc}
                          provider={socialProvider}
                          redirectTo={redirectTo}
                          setIsSubmitting={setIsSubmitting}
                          socialLayout={socialLayout}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
      </CardContent>

      {cardFooter && <CardFooter className={classNames?.footer}>{cardFooter}</CardFooter>}

      {credentials && signUp && (
        <CardFooter
          className={cn("justify-center gap-1.5 text-muted-foreground text-sm", classNames?.footer)}
        >
          {view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP" ? (
            loc.DONT_HAVE_AN_ACCOUNT
          ) : view === "SIGN_UP" ? (
            loc.ALREADY_HAVE_AN_ACCOUNT
          ) : (
            <ArrowLeftIcon className="size-3" />
          )}

          {view === "SIGN_IN" ||
          view === "MAGIC_LINK" ||
          view === "EMAIL_OTP" ||
          view === "SIGN_UP" ? (
            <Link
              className={cn(
                "inline-flex items-center px-0 text-sm text-foreground underline underline-offset-4",
                classNames?.footerLink
              )}
              href={`${basePath}/${
                viewPaths[
                  view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP"
                    ? "SIGN_UP"
                    : "SIGN_IN"
                ]
              }${isHydrated ? window.location.search : ""}`}
            >
              {view === "SIGN_IN" || view === "MAGIC_LINK" || view === "EMAIL_OTP"
                ? loc.SIGN_UP
                : loc.SIGN_IN}
            </Link>
          ) : (
            <Button
              variant="link"
              size="sm"
              className={cn("px-0 text-foreground underline", classNames?.footerLink)}
              onClick={() => window.history.back()}
            >
              {loc.GO_BACK}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
