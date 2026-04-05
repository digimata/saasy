import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@repo/auth";
import { Sidebar } from "@/components/dashboard/sidebar";

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

  return (
    <div className="h-full">
      <Sidebar />
      <main className="ml-16 min-h-screen p-8">{children}</main>
    </div>
  );
}
