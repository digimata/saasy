import { Outlet } from "react-router";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

import { AppLayout } from "@/components/app-layout";

export default function ProtectedLayout() {
  return (
    <>
      <SignedIn>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
