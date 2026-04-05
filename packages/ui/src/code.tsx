import { type JSX } from "react";

// -----------------------------
// projects/saasy/packages/ui/src/code.tsx
//
// export function Code()    L11
// children                  L15
// className                 L16
// -----------------------------

export function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return <code className={className}>{children}</code>;
}
