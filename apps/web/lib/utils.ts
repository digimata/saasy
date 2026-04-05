import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ---------------------------
// projects/saasy/apps/web/lib/utils.ts
//
// export function cn()    L10
// ---------------------------

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
