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
        <Toaster richColors position="top-right" />
      </AuthUIProvider>
    </ThemeProvider>
  );
}
