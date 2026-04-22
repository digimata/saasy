import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { auth } from "@repo/auth";
import { db } from "@repo/db";
import { workspaces, memberships } from "@repo/db/schema";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkspaceSlugProvider } from "@/lib/workspace-context";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/sign-in?redirectTo=/${encodeURIComponent(slug)}`);
  }

  const [row] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .innerJoin(
      memberships,
      and(eq(memberships.workspaceId, workspaces.id), eq(memberships.userId, session.user.id)),
    )
    .where(eq(workspaces.slug, slug))
    .limit(1);

  if (!row) {
    notFound();
  }

  if (session.session.activeOrganizationId !== row.id) {
    await auth.api.setActiveOrganization({
      headers: await headers(),
      body: { organizationId: row.id },
    });
  }

  return (
    <WorkspaceSlugProvider slug={slug}>
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
    </WorkspaceSlugProvider>
  );
}
