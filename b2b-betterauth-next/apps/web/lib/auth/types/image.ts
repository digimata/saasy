import type { ComponentType } from "react";

// ------------------------
// projects/saasy/apps/web/lib/auth/types/image.ts
//
// export type Image    L12
// src                  L13
// alt                  L14
// className            L15
// ------------------------

export type Image = ComponentType<{
  src: string;
  alt: string;
  className?: string;
}>;
