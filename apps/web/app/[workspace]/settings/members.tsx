"use client";

import { useState, useContext, useCallback } from "react";
import { toast } from "sonner";

import { useCurrentOrganization } from "@/hooks/auth/use-current-organization";
import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { getLocalizedError } from "@/lib/auth/utils";
import { InviteMemberDialog } from "@/components/auth/organization/invite-member-dialog";
import { IconPlus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function MembersTab() {
  const {
    authClient,
    hooks: { useSession, useHasPermission, useListMembers },
    organization: organizationOptions,
    localization,
    localizeErrors,
  } = useContext(AuthUIContext);

  const { data: sessionData } = useSession();
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
  const [isLeaving, setIsLeaving] = useState(false);

  const currentMember = members?.find((m) => m.userId === sessionData?.user?.id);

  const handleLeave = useCallback(async () => {
    if (!organization || !currentMember || isLeaving) return;
    setIsLeaving(true);
    try {
      await authClient.organization.removeMember({
        memberIdOrEmail: currentMember.id,
        organizationId: organization.id,
        fetchOptions: { throw: true },
      });
      window.location.replace("/");
    } catch (error) {
      toast.error(
        getLocalizedError({ error, localization, localizeErrors })
      );
      setIsLeaving(false);
    }
  }, [authClient, organization, currentMember, isLeaving, localization, localizeErrors]);

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
    <div className="space-y-10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-heading-20">Members</h3>
            <p className="text-copy-14 text-muted-foreground mt-1">
              Manage users who have access to this organization.
            </p>
          </div>
          {hasPermissionInvite?.success && (
            <Button
              variant="default"
              onClick={() => setInviteDialogOpen(true)}
              className="px-4"
            >
              <IconPlus className="size-3" />
              Invite
            </Button>
          )}
        </div>

        <div className="rounded-lg border border-ds-gray-100 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-3 text-label-13 font-medium text-foreground bg-ds-bg-300">
            <span>User</span>
            <span className="w-32">Joined on</span>
            <span className="w-20" />
          </div>

          {/* Rows */}
          {members
            ?.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
            .map((member) => {
              const user = member.user;

              if (!user) {
                return null;
              }

              const isCurrentUser = user.id === sessionData?.user?.id;
              return (
                <div
                  key={member.id}
                  className="grid grid-cols-[1fr_auto_auto] items-center px-5 py-4 border-t border-ds-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback className="text-xs bg-ds-bg-200 text-muted-foreground">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-label-14">
                      {user.email || user.name}
                    </span>
                    {isCurrentUser && (
                      <Badge variant="muted" className="text-label-12 font-normal bg-ds-green-500/12 border-ds-green-500/20 text-ds-green-500">
                        You
                      </Badge>
                    )}
                  </div>
                  <span className="text-label-13 text-muted-foreground w-32">
                    {new Date(member.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <div className="w-20 flex justify-end">
                    {isCurrentUser && member.role !== "owner" && (
                      <Button variant="secondary" size="sm" onClick={handleLeave} disabled={isLeaving}>
                        {isLeaving ? "Leaving..." : "Leave"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
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
