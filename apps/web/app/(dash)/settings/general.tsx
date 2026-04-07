"use client";

import { useState, useEffect, useContext } from "react";
import { toast } from "sonner";

import { useCurrentOrganization } from "@/hooks/auth/use-current-organization";
import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { getLocalizedError } from "@/lib/auth/utils";
import { DeleteOrganizationDialog } from "@/components/auth/organization/delete-organization-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-heading-20">{title}</h3>
        {description && (
          <p className="text-copy-14 text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="rounded-lg border border-ds-gray-100 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function GeneralTab() {
  const {
    hooks: { useHasPermission },
    mutators: { updateOrganization },
    localizeErrors,
    localization,
  } = useContext(AuthUIContext);

  const {
    data: organization,
    isPending,
    refetch: refetchOrganization,
  } = useCurrentOrganization();

  const { data: hasPermission } = useHasPermission({
    organizationId: organization?.id ?? "",
    permissions: { organization: ["update"] },
  });

  const canEdit = hasPermission?.success === true;

  const [name, setName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name || "");
    }
  }, [organization]);

  const derivedSlug = slugify(name);

  const handleUpdateName = async () => {
    if (!organization || !canEdit) return;

    if (!name.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }

    if (name === organization.name) return;

    setIsUpdating(true);
    try {
      await updateOrganization({
        organizationId: organization.id,
        data: { name, slug: slugify(name) },
      });
      await refetchOrganization?.();
      toast.success("Workspace updated");
    } catch (error) {
      toast.error(
        getLocalizedError({ error, localization, localizeErrors })
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (!organization) {
    return <div className="text-muted-foreground">No workspace found.</div>;
  }

  return (
    <div className="space-y-10">
      <SettingsSection title="Workspace" description="Manage your workspace name and URL.">
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-label-13 text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter workspace name"
              disabled={!canEdit}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <label className="text-label-13 text-muted-foreground">URL</label>
            <Input
              value={derivedSlug}
              disabled
              className="text-muted-foreground"
            />
          </div>
        </div>
        <div className="border-t border-ds-gray-100 px-5 py-3 flex justify-end">
          <Button
            onClick={handleUpdateName}
            disabled={isUpdating || !canEdit || name === organization.name}
            variant="outline"
            size="sm"
          >
            {isUpdating ? "Saving..." : "Save"}
          </Button>
        </div>
      </SettingsSection>

      {canEdit && (
        <SettingsSection title="Danger zone">
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-label-14 font-medium">Delete workspace</p>
              <p className="text-copy-13 text-muted-foreground mt-0.5">
                Schedule workspace for permanent deletion.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-500 hover:text-red-500"
            >
              Delete
            </Button>
          </div>
        </SettingsSection>
      )}

      {canEdit && (
        <DeleteOrganizationDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          organization={organization}
        />
      )}
    </div>
  );
}
