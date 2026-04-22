import type { DialogRoot } from "@base-ui/react/dialog";

/**
 * Close a base-ui Dialog via its onOpenChange callback.
 * Handles the two-arg signature that base-ui expects.
 */
// ------------------------------------
// projects/saasy/apps/web/lib/auth/dialog-helpers.ts
//
// export function closeDialog()    L13
// ------------------------------------

export function closeDialog(onOpenChange?: DialogRoot.Props["onOpenChange"]) {
  onOpenChange?.(false, { reason: "click" } as unknown as DialogRoot.ChangeEventDetails);
}
