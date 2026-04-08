"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { authClient, signOut } from "@repo/auth/client";

import { Button } from "@/components/ui/button";
import { InputBubble } from "@/components/ui/input-bubble";
import { UrlInput } from "@/components/ui/url-input";
import { Logo } from "@/components/logo";

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [email, setEmail] = useState("");
  const [ready, setReady] = useState(false);
  const ran = useRef(false);

  // Check session + redirect if already set up
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      const { data: session } = await authClient.getSession();
      if (!session) {
        window.location.replace("/sign-in");
        return;
      }

      setEmail(session.user.email);
      setReady(true);
    })();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (name: string) => {
    setWorkspaceName(name);
    setWorkspaceSlug(generateSlug(name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const trimmedName = workspaceName.trim();
    const trimmedSlug = workspaceSlug.trim();

    if (trimmedName.length < 2) {
      setError("Workspace name must be at least 2 characters.");
      setLoading(false);
      return;
    }

    if (trimmedName.length > 50) {
      setError("Workspace name must be less than 50 characters.");
      setLoading(false);
      return;
    }

    if (trimmedSlug && !/^[a-zA-Z0-9-]+$/.test(trimmedSlug)) {
      setError(
        "Workspace URL can only contain letters, numbers, and hyphens.",
      );
      setLoading(false);
      return;
    }

    try {
      const { data: workspace, error: createError } =
        await authClient.organization.create({
          name: trimmedName,
          slug: trimmedSlug,
        });

      if (createError || !workspace) {
        setError(createError?.message || "Failed to create workspace.");
        setLoading(false);
        return;
      }

      await authClient.organization.setActive({
        organizationId: workspace.id,
        fetchOptions: { throw: true },
      });

      window.location.replace("/");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    void signOut({
      fetchOptions: {
        onSuccess: () => window.location.replace("/sign-in"),
      },
    });
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex flex-col text-label-13 text-muted-foreground">
          Logged in as:{" "}
          <span className="text-primary font-medium">{email}</span>
        </div>
        <Button
          variant="link"
          size="sm"
          className="text-muted-foreground"
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>

      {/* Main content */}
      <div className="flex items-start justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="w-full max-w-md space-y-6 p-6 pt-[20vh]"
        >
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <Logo className="size-8" />
            </div>
            <h1 className="text-heading-24 font-semibold">Create a workspace</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <InputBubble
                placeholder="Workspace name"
                value={workspaceName}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={loading}
                required
                minLength={2}
                maxLength={50}
                autoComplete="off"
              />

              <UrlInput
                prefix="saasy.app/"
                placeholder="URL"
                value={workspaceSlug}
                onChange={(e) => setWorkspaceSlug(e.target.value)}
                variant="bubble"
                disabled={loading}
                pattern="[a-zA-Z0-9\-]+"
                title="Only letters, numbers, and hyphens are allowed"
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={
                  loading || !workspaceName.trim() || !workspaceSlug.trim()
                }
                className="w-64 h-11 px-4 bg-primary hover:bg-primary/90 text-background font-medium rounded-lg text-base disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Creating workspace...
                  </div>
                ) : (
                  "Create workspace"
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
