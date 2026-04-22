import { Outlet } from "react-router";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/providers/theme-provider";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Outlet />
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
}
