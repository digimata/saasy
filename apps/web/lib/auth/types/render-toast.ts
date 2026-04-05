// ------------------------------
// projects/saasy/apps/web/lib/auth/types/render-toast.ts
//
// type ToastVariant          L10
// export type RenderToast    L12
// variant                    L16
// message                    L17
// ------------------------------

type ToastVariant = "default" | "success" | "error" | "info" | "warning";

export type RenderToast = ({
  variant,
  message,
}: {
  variant?: ToastVariant;
  message?: string;
}) => void;
