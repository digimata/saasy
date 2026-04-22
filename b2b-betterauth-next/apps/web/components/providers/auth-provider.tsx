// -------------------------------------
// projects/saasy/apps/web/components/providers/auth-provider.tsx
//
// export function AuthProvider()    L16
// children                          L16
// -------------------------------------

"use client";

import type { SocialProvider } from "better-auth/social-providers";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toaster } from "sonner";
import { authClient, enabledSocialProviders } from "@repo/auth/client";
import { AuthUIProvider } from "@/lib/auth/auth-ui-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AuthProvider({
  children,
  socialProviders = enabledSocialProviders,
}: {
  children: React.ReactNode;
  socialProviders?: SocialProvider[];
}) {
  const router = useRouter();

  return (
    <ThemeProvider>
      <AuthUIProvider
        authClient={authClient}
        basePath=""
        redirectTo="/"
        credentials={{ forgotPassword: false }}
        organization
        multiSession
        social={socialProviders.length > 0 ? { providers: socialProviders } : undefined}
        navigate={(href) => router.push(href)}
        replace={(href) => router.replace(href)}
        Link={Link}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            unstyled: true,
            classNames: {
              toast: "w-full flex items-center gap-3 rounded-lg border border-ds-gray-100 bg-ds-bg-200 px-4 py-3 text-label-13 text-foreground shadow-lg",
              error: "!border-red-500/20 !text-red-400",
              success: "!border-ds-green-500/20 !text-ds-green-500",
            },
          }}
        />
      </AuthUIProvider>
    </ThemeProvider>
  );
}
