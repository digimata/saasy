import { Link } from "react-router";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";

import { AppLayout } from "@/components/app-layout";
import { useApi } from "@/lib/api";
import type { MeResponse } from "@/lib/types";

function LandingView() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
      <h1 className="text-heading-32 font-semibold">Saasy B2C</h1>
      <p className="text-muted-foreground">Vite + React + Clerk starter.</p>
      <div className="flex items-center gap-3">
        <Link
          to="/sign-in"
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          to="/sign-up"
          className="rounded-md border border-border px-4 py-2 hover:bg-secondary"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}

function DashboardView() {
  const { user } = useUser();
  const { data, error, isLoading } = useApi<MeResponse>("/me");

  return (
    <AppLayout>
      <h1 className="text-heading-24 font-semibold">
        Welcome, {user?.firstName ?? "friend"}
      </h1>
      <p className="mt-2 text-muted-foreground">
        This page is protected — only signed-in users can see it.
      </p>

      <div className="mt-8 max-w-xl rounded-lg border border-ds-gray-100 p-5">
        <p className="text-label-13 text-muted-foreground mb-2">
          GET /me — round-trips Clerk session → API → Postgres
        </p>
        {error ? (
          <p className="text-copy-13 text-destructive">{error.message}</p>
        ) : isLoading || !data ? (
          <p className="text-copy-13 text-muted-foreground">Loading…</p>
        ) : (
          <pre className="text-label-12 overflow-x-auto">
{JSON.stringify(data.user, null, 2)}
          </pre>
        )}
      </div>
    </AppLayout>
  );
}

export default function HomePage() {
  return (
    <>
      <SignedOut>
        <LandingView />
      </SignedOut>
      <SignedIn>
        <DashboardView />
      </SignedIn>
    </>
  );
}
