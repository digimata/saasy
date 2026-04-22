import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { useSignIn, useSignUp } from "@clerk/clerk-react";

import { Button } from "@/components/ui/button";
import { sanitizeRedirectTo } from "@/lib/redirect";
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
  IconLinkedIn,
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

type Flow = "sign-in" | "sign-up";
type OAuthProvider = "oauth_google" | "oauth_github" | "oauth_linkedin_oidc";

export default function SignInPage() {
  const { isLoaded: signInLoaded, signIn, setActive: setActiveSignIn } = useSignIn();
  const { isLoaded: signUpLoaded, signUp, setActive: setActiveSignUp } = useSignUp();

  const [verifying, setVerifying] = useState(false);
  const [flow, setFlow] = useState<Flow>("sign-in");
  const [error, setError] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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

  const redirectTo = sanitizeRedirectTo(searchParams.get("redirectTo"));

  const onEmailSubmit = async (values: EmailValues) => {
    if (!signInLoaded || !signUpLoaded || !signIn || !signUp) return;

    setError("");
    setEmailValue(values.email);
    setIsInitialLoad(false);

    try {
      await signIn.create({
        identifier: values.email,
        strategy: "email_code",
      });
      setFlow("sign-in");
      setVerifying(true);
    } catch (err) {
      const code = (err as { errors?: { code?: string }[] })?.errors?.[0]?.code;
      if (code === "form_identifier_not_found") {
        try {
          await signUp.create({ emailAddress: values.email });
          await signUp.prepareEmailAddressVerification({
            strategy: "email_code",
          });
          setFlow("sign-up");
          setVerifying(true);
        } catch (signUpErr) {
          setError(extractClerkError(signUpErr, "Failed to send verification code."));
        }
      } else {
        setError(extractClerkError(err, "Failed to send verification code."));
      }
    }
  };

  const onCodeSubmit = async (values: CodeValues) => {
    if (!signInLoaded || !signUpLoaded || !signIn || !signUp) return;

    setError("");
    setIsVerifyingCode(true);

    try {
      if (flow === "sign-in") {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: values.code,
        });
        if (result.status === "complete") {
          await setActiveSignIn({ session: result.createdSessionId });
          navigate(redirectTo, { replace: true });
        } else {
          setError("Verification incomplete. Please try again.");
          setIsVerifyingCode(false);
        }
      } else {
        const result = await signUp.attemptEmailAddressVerification({
          code: values.code,
        });
        if (result.status === "complete") {
          await setActiveSignUp({ session: result.createdSessionId });
          navigate(redirectTo, { replace: true });
        } else {
          setError("Verification incomplete. Please try again.");
          setIsVerifyingCode(false);
        }
      }
    } catch (err) {
      setError(extractClerkError(err, "Invalid verification code."));
      setIsVerifyingCode(false);
    }
  };

  const handleBackToEmail = () => {
    setVerifying(false);
    codeForm.reset({ code: "" });
    setError("");
  };

  const signInWithOAuth = (strategy: OAuthProvider) => {
    if (!signInLoaded || !signIn) return;
    setError("");
    void signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: "/sso-callback",
      redirectUrlComplete: redirectTo,
    });
  };

  return (
    <div className="flex min-h-screen items-start justify-center">
      <div id="clerk-captcha" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50" />
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
                <Logo className="size-8" />
              </div>
              <h1 className="text-heading-24 font-semibold mb-3">
                Enter the code you received
              </h1>
              <p className="text-muted-foreground text-label-13">
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
              ease: isInitialLoad ? [0.25, 0.46, 0.45, 0.94] : "easeOut",
            }}
            className="w-full max-w-md space-y-10 p-6 pt-[24vh]"
          >
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <Logo className="size-8" />
              </div>
              <h1 className="text-heading-24 font-semibold mb-8">
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
                  className={`pr-12 ${isValidEmail ? "border-ds-blue-500" : ""}`}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-ds-steel-500 transition-all duration-200 ${isValidEmail ? "opacity-100" : "opacity-24"}`}
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

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => signInWithOAuth("oauth_google")}
                className="flex-1 h-10 bg-secondary hover:bg-secondary/80 rounded-md"
              >
                <IconGoogle />
              </Button>
              <Button
                variant="ghost"
                onClick={() => signInWithOAuth("oauth_github")}
                className="flex-1 h-10 bg-secondary hover:bg-secondary/80 rounded-md"
              >
                <IconGitHub />
              </Button>
              <Button
                variant="ghost"
                onClick={() => signInWithOAuth("oauth_linkedin_oidc")}
                className="flex-1 h-10 bg-secondary hover:bg-secondary/80 rounded-md"
              >
                <IconLinkedIn />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function extractClerkError(err: unknown, fallback: string): string {
  const message = (err as { errors?: { message?: string }[] })?.errors?.[0]
    ?.message;
  return message || fallback;
}
