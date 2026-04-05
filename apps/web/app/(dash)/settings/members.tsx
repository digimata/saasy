"use client";

import { useState, useContext } from "react";
import { Plus } from "lucide-react";

import { useCurrentOrganization } from "@/hooks/auth/use-current-organization";
import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { InviteMemberDialog } from "@/components/auth/organization/invite-member-dialog";
import { UserView } from "@/components/auth/user-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MembersTab() {
  const {
    hooks: { useHasPermission, useListMembers },
    organization: organizationOptions,
    localization,
  } = useContext(AuthUIContext);

  const { data: organization, isPending: orgPending } = useCurrentOrganization();

  const { data: hasPermissionInvite } = useHasPermission({
    organizationId: organization?.id ?? "",
    permissions: { invitation: ["create"] },
  });

  const { data } = useListMembers({
    query: { organizationId: organization?.id ?? "" },
  });

  const members = data?.members;

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const builtInRoles = [
    { role: "owner", label: localization.OWNER },
    { role: "admin", label: localization.ADMIN },
    { role: "member", label: localization.MEMBER },
  ];
  const roles = [...builtInRoles, ...(organizationOptions?.customRoles || [])];

  if (orgPending) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!organization) {
    return <div className="text-muted-foreground">No workspace found.</div>;
  }

  return (
    <div className="space-y-4">
      {hasPermissionInvite?.success && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInviteDialogOpen(true)}
          >
            <Plus className="size-4 mr-1.5" />
            Invite
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {members
          ?.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
          .map((member) => {
            const role = roles.find((r) => r.role === member.role);
            return (
              <Card
                key={member.id}
                className="flex items-center justify-between p-4"
              >
                <UserView user={member.user} />
                <span className="text-xs text-muted-foreground">
                  {role?.label ?? member.role}
                </span>
              </Card>
            );
          })}
      </div>

      {organization && (
        <InviteMemberDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          organization={organization}
        />
      )}
    </div>
  );
}
