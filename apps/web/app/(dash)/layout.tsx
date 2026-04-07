import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@repo/auth";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { ScrollArea } from "@/components/ui/scroll-area";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (!session.session.activeOrganizationId) {
    redirect("/onboard");
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 pt-[52px] min-h-0">
        <Sidebar />
        <main className="flex-1 ml-14 p-2 min-h-0">
          <ScrollArea className="h-full bg-ds-bg-200 rounded-lg border border-solid border-ds-bg-300">
            <div className="px-8 pb-8 pt-7">{children}</div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
