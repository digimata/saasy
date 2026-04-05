// -------------------------------------------
// projects/saasy/apps/web/app/(auth)/sign-in/page.tsx
//
// const emailSchema                       L37
// const codeSchema                        L41
// type EmailValues                        L48
// type CodeValues                         L49
// export default function SignInPage()    L51
// function SignInContent()                L59
// -------------------------------------------

"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { authClient, enabledSocialProviders } from "@repo/auth/client";

import { Button } from "@/components/ui/button";
import { InputBubble } from "@/components/ui/input-bubble";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  IconArrowRight,
  IconChevronLeftSmall,
  IconGoogle,
  IconGitHub,
} from "@/components/ui/icons";
import { Logo } from "@/components/logo";

const emailSchema = z.object({
  email: z.email("Please enter a valid email address."),
});

const codeSchema = z.object({
  code: z
    .string()
    .min(6, "Your verification code must be 6 characters.")
    .max(6, "Your verification code must be 6 characters."),
});

type EmailValues = z.infer<typeof emailSchema>;
type CodeValues = z.infer<typeof codeSchema>;

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const searchParams = useSearchParams();

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const codeForm = useForm<CodeValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const watchedEmail = emailForm.watch("email");
  const isValidEmail = emailSchema.safeParse({ email: watchedEmail }).success;

  const redirectTo = searchParams.get("redirectTo") || "/onboard";

  const onEmailSubmit = async (values: EmailValues) => {
    setError("");
    setEmailValue(values.email);
    setIsInitialLoad(false);

    try {
      // BetterAuth email OTP: send code (works for both new and existing users)
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email: values.email,
        type: "sign-in",
      });

      if (error) {
        setError(error.message || "Failed to send verification code.");
        return;
      }

      setVerifying(true);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const onCodeSubmit = async (values: CodeValues) => {
    setError("");
    setIsVerifyingCode(true);

    try {
      // signIn.emailOtp handles both new and existing users
      const { error } = await authClient.signIn.emailOtp({
        email: emailValue,
        otp: values.code,
      });

      if (error) {
        setError(error.message || "Invalid verification code.");
        setIsVerifyingCode(false);
        return;
      }

      window.location.replace(redirectTo);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsVerifyingCode(false);
    }
  };

  const handleBackToEmail = () => {
    setVerifying(false);
    codeForm.reset({ code: "" });
    setError("");
  };

  const signInWithOAuth = (provider: "google" | "github") => {
    setError("");
    void authClient.signIn.social({
      provider,
      callbackURL: redirectTo,
    });
  };

  const hasGoogle = enabledSocialProviders.includes("google");
  const hasGitHub = enabledSocialProviders.includes("github");
  const hasOAuth = hasGoogle || hasGitHub;

  return (
    <div className="flex min-h-screen items-start justify-center bg-background">
      <AnimatePresence mode="wait">
        {verifying ? (
          <motion.div
            key="verification-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-md space-y-10 p-6 pt-[22vh]"
          >
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <Logo />
              </div>
              <h1 className="text-[27px] font-medium mb-3">
                Enter the code you received
              </h1>
              <p className="text-muted-foreground text-[13.4px]">
                We&apos;ve sent an email with a verification code to{" "}
                <span className="text-primary font-medium">{emailValue}</span>.
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form
              onSubmit={codeForm.handleSubmit(onCodeSubmit)}
              className="space-y-8"
            >
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={codeForm.watch("code") || ""}
                  onChange={(value) => {
                    codeForm.setValue("code", value);
                    if (value.length === 6) {
                      setIsVerifyingCode(true);
                      setTimeout(() => {
                        codeForm.handleSubmit(onCodeSubmit)();
                      }, 100);
                    }
                  }}
                  containerClassName="gap-2"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="h-12 w-12 text-base" />
                    <InputOTPSlot index={1} className="h-12 w-12 text-base" />
                    <InputOTPSlot index={2} className="h-12 w-12 text-base" />
                    <InputOTPSlot index={3} className="h-12 w-12 text-base" />
                    <InputOTPSlot index={4} className="h-12 w-12 text-base" />
                    <InputOTPSlot index={5} className="h-12 w-12 text-base" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {codeForm.formState.errors.code && (
                <p className="text-center text-sm text-destructive">
                  {codeForm.formState.errors.code.message}
                </p>
              )}

              <div className="flex justify-center">
                <Button
                  type="submit"
                  disabled={isVerifyingCode}
                  className="w-64 h-11 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-background font-medium rounded-lg text-base"
                >
                  {isVerifyingCode ? "Verifying..." : "Verify your email"}
                </Button>
              </div>
            </form>

            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={handleBackToEmail}
                className="font-mono text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
              >
                <IconChevronLeftSmall className="w-3 h-3" />
                Back
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="email-form"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: isInitialLoad ? 0.8 : 0.2,
              ease: isInitialLoad
                ? [0.25, 0.46, 0.45, 0.94]
                : "easeOut",
            }}
            className="w-full max-w-md space-y-10 p-6 pt-[24vh]"
          >
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <Logo />
              </div>
              <h1 className="text-[27px] font-medium mb-8">
                Welcome to Saasy.
              </h1>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <form
              onSubmit={emailForm.handleSubmit(onEmailSubmit)}
              className="space-y-6"
            >
              <div className="relative">
                <InputBubble
                  placeholder="Enter your email address..."
                  {...emailForm.register("email")}
                  className={`pr-12 text-charcoal ${isValidEmail ? "border-mil-green-200" : ""}`}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-charcoal-blue transition-all duration-200 ${isValidEmail ? "opacity-100" : "opacity-24"}`}
                >
                  <IconArrowRight className="size-3.5" />
                </Button>
              </div>

              {emailForm.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </form>

            {hasOAuth && (
              <div className="flex items-center space-x-4">
                {hasGoogle && (
                  <Button
                    variant="ghost"
                    onClick={() => signInWithOAuth("google")}
                    className="flex-1 h-10 bg-mil-green-100 hover:bg-mil-green-200 rounded-lg"
                  >
                    <IconGoogle />
                  </Button>
                )}
                {hasGitHub && (
                  <Button
                    variant="ghost"
                    onClick={() => signInWithOAuth("github")}
                    className="flex-1 h-10 bg-mil-green-100 hover:bg-mil-green-200 rounded-lg"
                  >
                    <IconGitHub />
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
