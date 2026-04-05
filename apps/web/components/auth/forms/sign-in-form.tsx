// ----------------------------------------
// projects/saasy/apps/web/components/auth/forms/sign-in-form.tsx
//
// export interface SignInFormProps     L49
//   className                          L50
//   classNames                         L51
//   isSubmitting                       L52
//   localization                       L53
//   redirectTo                         L54
//   setIsSubmitting                    L55
//   passwordValidation                 L56
//   callbackURL                        L57
// export function SignInForm()         L60
// export async function signIn()       L60
// code                                L151
// error                               L151
// message                             L151
// ----------------------------------------

"use client";

import type { BetterFetchOption } from "@better-fetch/fetch";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { useIsHydrated } from "@/hooks/auth/use-hydrated";
import { useOnSuccessTransition } from "@/hooks/auth/use-success-transition";
import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { cn, getLocalizedError, getPasswordSchema } from "@/lib/auth/utils";
import type { AuthLocalization } from "@/lib/auth/localization/auth-localization";
import type { PasswordValidation } from "@/lib/auth/types/password-validation";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { AuthFormClassNames } from "@/components/auth/auth-form";

export interface SignInFormProps {
  className?: string;
  classNames?: AuthFormClassNames;
  isSubmitting?: boolean;
  localization: Partial<AuthLocalization>;
  redirectTo?: string;
  setIsSubmitting?: (isSubmitting: boolean) => void;
  passwordValidation?: PasswordValidation;
  callbackURL?: string;
}

export function SignInForm({
  className,
  classNames,
  isSubmitting,
  localization,
  redirectTo,
  setIsSubmitting,
  passwordValidation,
  callbackURL,
}: SignInFormProps) {
  const isHydrated = useIsHydrated();
  const {
    authClient,
    basePath,
    credentials,
    localization: contextLocalization,
    viewPaths,
    navigate,
    toast,
    Link,
    localizeErrors,
    emailVerification,
  } = useContext(AuthUIContext);

  const rememberMeEnabled = credentials?.rememberMe;
  const contextPasswordValidation = credentials?.passwordValidation;

  localization = { ...contextLocalization, ...localization };
  passwordValidation = { ...contextPasswordValidation, ...passwordValidation };

  const { onSuccess, isPending: transitionPending } = useOnSuccessTransition({
    redirectTo,
  });

  const formSchema = z.object({
    email: z.string().email({
      message: `${localization.EMAIL} ${localization.IS_INVALID}`,
    }),
    password: getPasswordSchema(passwordValidation, localization),
    rememberMe: z.boolean().optional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: !rememberMeEnabled,
    },
  });

  isSubmitting = isSubmitting || form.formState.isSubmitting || transitionPending;

  useEffect(() => {
    setIsSubmitting?.(form.formState.isSubmitting || transitionPending);
  }, [form.formState.isSubmitting, transitionPending, setIsSubmitting]);

  async function signIn({ email, password, rememberMe }: z.infer<typeof formSchema>) {
    try {
      const fetchOptions: BetterFetchOption = {
        throw: true,
        headers: {},
      };

      const response: Record<string, unknown> = await authClient.signIn.email({
        email,
        password,
        rememberMe,
        fetchOptions,
        callbackURL,
      });

      if (response.twoFactorRedirect) {
        navigate(`${basePath}/${viewPaths.TWO_FACTOR}${window.location.search}`);
      } else {
        await onSuccess();
      }
    } catch (error) {
      form.resetField("password");

      toast({
        variant: "error",
        message: getLocalizedError({
          error,
          localization,
          localizeErrors,
        }),
      });

      if (
        emailVerification?.otp &&
        (error as { error?: { code?: string; message?: string } })?.error?.code ===
          "EMAIL_NOT_VERIFIED"
      ) {
        navigate(`${basePath}/${viewPaths.EMAIL_VERIFICATION}?email=${encodeURIComponent(email)}`);
      }
    }
  }

  return (
    <Form {...form}>
      <form
        method="POST"
        onSubmit={form.handleSubmit(signIn)}
        noValidate={isHydrated}
        className={cn("grid w-full gap-6", className, classNames?.base)}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={classNames?.label}>{localization.EMAIL}</FormLabel>

              <FormControl>
                <Input
                  autoComplete="email"
                  className={classNames?.input}
                  type="email"
                  placeholder={localization.EMAIL_PLACEHOLDER}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>

              <FormMessage className={classNames?.error} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel className={classNames?.label}>{localization.PASSWORD}</FormLabel>

                {credentials?.forgotPassword && (
                  <Link
                    className={cn("text-sm hover:underline", classNames?.forgotPasswordLink)}
                    href={`${basePath}/${viewPaths.FORGOT_PASSWORD}${
                      isHydrated ? window.location.search : ""
                    }`}
                  >
                    {localization.FORGOT_PASSWORD_LINK}
                  </Link>
                )}
              </div>

              <FormControl>
                <PasswordInput
                  autoComplete="current-password"
                  className={classNames?.input}
                  placeholder={localization.PASSWORD_PLACEHOLDER}
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>

              <FormMessage className={classNames?.error} />
            </FormItem>
          )}
        />

        {rememberMeEnabled && (
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>

                <FormLabel>{localization.REMEMBER_ME}</FormLabel>
              </FormItem>
            )}
          />
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn("w-full", classNames?.button, classNames?.primaryButton)}
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : localization.SIGN_IN_ACTION}
        </Button>
      </form>
    </Form>
  );
}
