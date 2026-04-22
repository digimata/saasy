import type { ReactNode } from "react";

import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="pt-[52px] pl-[60px]">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
