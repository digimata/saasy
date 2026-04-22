import { Routes, Route, useNavigate } from "react-router";
import { ClerkProvider } from "@clerk/clerk-react";
import RootLayout from "./app/layout";
import HomePage from "./app/page";
import AuthLayout from "./app/(auth)/layout";
import SignInPage from "./app/(auth)/sign-in/page";
import SignUpPage from "./app/(auth)/sign-up/page";
import SSOCallbackPage from "./app/sso-callback/page";
import ProtectedLayout from "./app/(app)/layout";
import ProjectsPage from "./app/(app)/projects/page";
import InboxPage from "./app/(app)/inbox/page";
import SettingsPage from "./app/(app)/settings/page";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env");
}

export default function App() {
  const navigate = useNavigate();
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route element={<AuthLayout />}>
            <Route path="sign-in/*" element={<SignInPage />} />
            <Route path="sign-up/*" element={<SignUpPage />} />
            <Route path="sso-callback" element={<SSOCallbackPage />} />
          </Route>
          <Route element={<ProtectedLayout />}>
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="inbox" element={<InboxPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </ClerkProvider>
  );
}
