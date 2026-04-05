// -----------------------------------------------
// projects/saasy/apps/web/components/auth/forms/forgot-password-form.tsx
//
// export interface ForgotPasswordFormProps    L38
//   className                                 L39
//   classNames                                L40
//   isSubmitting                              L41
//   localization                              L42
//   setIsSubmitting                           L43
// export function ForgotPasswordForm()        L46
// export async function forgotPassword()      L46
// -----------------------------------------------

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { BetterFetchOption } from "better-auth/react";
import { Loader2 } from "lucide-react";
import { useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useIsHydrated } from "@/hooks/auth/use-hydrated";
import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { cn, getLocalizedError } from "@/lib/auth/utils";
import type { AuthLocalization } from "@/lib/auth/localization/auth-localization";
import { Button } from "@/components/ui/button";
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

export interface ForgotPasswordFormProps {
  className?: string;
  classNames?: AuthFormClassNames;
  isSubmitting?: boolean;
  localization: Partial<AuthLocalization>;
  setIsSubmitting?: (value: boolean) => void;
}

export function ForgotPasswordForm({
  className,
  classNames,
  isSubmitting,
  localization,
  setIsSubmitting,
}: ForgotPasswordFormProps) {
  const isHydrated = useIsHydrated();
  const {
    authClient,
    basePath,
    baseURL,
    localization: contextLocalization,
    navigate,
    toast,
    viewPaths,
    localizeErrors,
  } = useContext(AuthUIContext);

  localization = { ...contextLocalization, ...localization };

  const formSchema = z.object({
    email: z
      .string()
      .email({
        message: `${localization.EMAIL} ${localization.IS_INVALID}`,
      })
      .min(1, {
        message: `${localization.EMAIL} ${localization.IS_REQUIRED}`,
      }),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  isSubmitting = isSubmitting || form.formState.isSubmitting;

  useEffect(() => {
    setIsSubmitting?.(form.formState.isSubmitting);
  }, [form.formState.isSubmitting, setIsSubmitting]);

  async function forgotPassword({ email }: z.infer<typeof formSchema>) {
    try {
      const fetchOptions: BetterFetchOption = {
        throw: true,
        headers: {},
      };

      await authClient.requestPasswordReset({
        email,
        redirectTo: `${baseURL}${basePath}/${viewPaths.RESET_PASSWORD}`,
        fetchOptions,
      });

      toast({
        variant: "success",
        message: localization.FORGOT_PASSWORD_EMAIL,
      });

      navigate(`${basePath}/${viewPaths.SIGN_IN}${window.location.search}`);
    } catch (error) {
      toast({
        variant: "error",
        message: getLocalizedError({
          error,
          localization,
          localizeErrors,
        }),
      });
    }
  }

  return (
    <Form {...form}>
      <form
        method="POST"
        onSubmit={form.handleSubmit(forgotPassword)}
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

        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn("w-full", classNames?.button, classNames?.primaryButton)}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            localization.FORGOT_PASSWORD_ACTION
          )}
        </Button>
      </form>
    </Form>
  );
}
