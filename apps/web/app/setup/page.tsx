// ------------------------------------------------
// projects/saasy/apps/web/app/setup/page.tsx
//
// export default function SetupPage()          L14
// export default async function bootstrap()    L14
// ------------------------------------------------

"use client";

import { useEffect, useRef, useState } from "react";
import { authClient } from "@repo/auth/client";
import { slugify } from "@/lib/utils";

export default function SetupPage() {
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void bootstrap();

    async function bootstrap() {
      try {
        const { data: session } = await authClient.getSession();
        if (!session) {
          window.location.replace("/sign-in");
          return;
        }

        if (session.session.activeOrganizationId) {
          window.location.replace("/");
          return;
        }

        const { data: organizations } = await authClient.organization.list();
        const firstOrganization = organizations?.[0];

        if (firstOrganization) {
          await authClient.organization.setActive({
            organizationId: firstOrganization.id,
            fetchOptions: {
              throw: true,
            },
          });
          window.location.replace("/");
          return;
        }

        const workspaceName = session.user.name || session.user.email.split("@")[0] || "My Workspace";
        const baseSlug = slugify(workspaceName) || "workspace";
        const slugCandidates = [baseSlug, `${baseSlug}-${session.user.id.slice(0, 8)}`];
        let workspace: { id: string } | null = null;

        for (const slug of slugCandidates) {
          try {
            workspace = await authClient.organization.create({
              name: workspaceName,
              slug,
              fetchOptions: {
                throw: true,
              },
            });
            break;
          } catch {
            workspace = null;
          }
        }

        if (!workspace) {
          throw new Error("Workspace creation failed");
        }

        await authClient.organization.setActive({
          organizationId: workspace.id,
          fetchOptions: {
            throw: true,
          },
        });

        window.location.replace("/");
      } catch {
        ran.current = false;
        setError("Could not finish workspace setup. Please try again.");
      }
    }
  }, []);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button
          type="button"
          className="rounded-md bg-foreground px-4 py-2 text-sm text-background"
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
        >
          Retry setup
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm">Setting up your workspace...</p>
    </div>
  );
}
