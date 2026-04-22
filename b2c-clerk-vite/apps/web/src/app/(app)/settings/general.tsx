import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useUser, useClerk } from "@clerk/clerk-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const isDirty =
    user !== null &&
    user !== undefined &&
    (firstName !== (user.firstName || "") || lastName !== (user.lastName || ""));

  async function handleSave() {
    if (!user || !isDirty) return;
    setIsSaving(true);
    try {
      await user.update({ firstName, lastName });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(extractError(err, "Failed to update profile"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!user) return;
    setIsDeleting(true);
    try {
      await user.delete();
      await signOut();
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(extractError(err, "Failed to delete account"));
      setIsDeleting(false);
    }
  }

  if (!isLoaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-muted-foreground">Not signed in.</div>;
  }

  return (
    <div className="space-y-10">
      <SettingsSection title="Profile" description="Your name and email.">
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-label-13 text-muted-foreground">First name</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-label-13 text-muted-foreground">Last name</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-label-13 text-muted-foreground">Email</label>
            <Input value={primaryEmail} disabled className="text-muted-foreground" />
          </div>
        </div>
        <div className="border-t border-ds-gray-100 px-5 py-3 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            variant="outline"
            size="sm"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Danger zone">
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-label-14 font-medium">Delete account</p>
            <p className="text-copy-13 text-muted-foreground mt-0.5">
              Permanently delete your account and all associated data.
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

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              This is permanent. Your account and all data will be deleted.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function extractError(err: unknown, fallback: string): string {
  const message = (err as { errors?: { message?: string }[] })?.errors?.[0]?.message;
  return message || fallback;
}
