import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@repo/auth";
import { Sidebar, Header } from "@/components/dashboard/sidebar";

// ------------------------------------------------------
// projects/saasy/apps/web/app/(dash)/layout.tsx
//
// export default async function DashboardLayout()    L13
// children                                           L13
// ------------------------------------------------------

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
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="ml-32 mt-16 px-16 py-12 max-w-4xl">{children}</main>
    </div>
  );
}
