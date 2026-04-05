"use client";

import { useState, useEffect, useContext } from "react";
import { toast } from "sonner";

import { useCurrentOrganization } from "@/hooks/auth/use-current-organization";
import { AuthUIContext } from "@/lib/auth/auth-ui-provider";
import { getLocalizedError } from "@/lib/auth/utils";
import { DeleteOrganizationDialog } from "@/components/auth/organization/delete-organization-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export function GeneralTab() {
  const {
    hooks: { useHasPermission, useListMembers },
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

  const [formData, setFormData] = useState({ name: "", slug: "" });
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingSlug, setIsUpdatingSlug] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        slug: organization.slug || "",
      });
    }
  }, [organization]);

  const handleUpdateName = async () => {
    if (!organization || !canEdit) return;

    if (!formData.name.trim()) {
      toast.error("Please enter a workspace name");
      return;
    }

    if (formData.name === organization.name) return;

    setIsUpdatingName(true);
    try {
      await updateOrganization({
        organizationId: organization.id,
        data: { name: formData.name },
      });
      await refetchOrganization?.();
      toast.success("Workspace name updated");
    } catch (error) {
      toast.error(
        getLocalizedError({ error, localization, localizeErrors })
      );
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdateSlug = async () => {
    if (!organization || !canEdit) return;

    if (!formData.slug.trim()) {
      toast.error("Please enter a workspace URL");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error("Slug can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    if (formData.slug === organization.slug) return;

    setIsUpdatingSlug(true);
    try {
      await updateOrganization({
        organizationId: organization.id,
        data: { slug: formData.slug },
      });
      await refetchOrganization?.();
      toast.success("Workspace URL updated");
    } catch (error) {
      toast.error(
        getLocalizedError({ error, localization, localizeErrors })
      );
    } finally {
      setIsUpdatingSlug(false);
    }
  };

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-full max-w-96" />
        <Skeleton className="h-9 w-full max-w-96" />
      </div>
    );
  }

  if (!organization) {
    return <div className="text-muted-foreground">No workspace found.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Workspace name */}
      <div className="space-y-3">
        <Label htmlFor="ws-name">Workspace name</Label>
        <div className="flex gap-2">
          <Input
            id="ws-name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter workspace name"
            className="max-w-96"
            disabled={!canEdit}
            autoComplete="off"
          />
          <Button
            onClick={handleUpdateName}
            disabled={
              isUpdatingName ||
              !canEdit ||
              formData.name === organization.name
            }
            variant="outline"
            className="shrink-0"
          >
            {isUpdatingName ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Workspace URL / slug */}
      <div className="space-y-3">
        <Label htmlFor="ws-slug">Workspace URL</Label>
        <div className="flex gap-2">
          <Input
            id="ws-slug"
            value={formData.slug}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                slug: e.target.value.toLowerCase(),
              }))
            }
            placeholder="workspace-url"
            className="max-w-96"
            disabled={!canEdit}
            autoComplete="off"
          />
          <Button
            onClick={handleUpdateSlug}
            disabled={
              isUpdatingSlug ||
              !canEdit ||
              formData.slug === organization.slug
            }
            variant="outline"
            className="shrink-0"
          >
            {isUpdatingSlug ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Delete workspace */}
      {canEdit && (
        <div className="flex items-center justify-between pt-8">
          <div>
            <h3 className="text-sm font-medium mb-1.5">Delete workspace</h3>
            <p className="text-sm text-muted-foreground">
              Schedule workspace for permanent deletion.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-500 hover:text-red-500 text-[13px] font-normal"
          >
            Delete workspace
          </Button>
        </div>
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
