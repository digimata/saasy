import type { ComponentType, ReactNode } from "react";

// -----------------------
// projects/saasy/apps/web/lib/auth/types/link.ts
//
// export type Link    L12
// href                L13
// className           L14
// children            L15
// -----------------------

export type Link = ComponentType<{
  href: string;
  className?: string;
  children: ReactNode;
}>;
