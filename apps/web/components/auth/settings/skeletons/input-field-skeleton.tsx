// -------------------------------------------
// projects/saasy/apps/web/components/auth/settings/skeletons/input-field-skeleton.tsx
//
// export function InputFieldSkeleton()    L14
// classNames                              L14
// -------------------------------------------

"use client";

import { cn } from "@/lib/auth/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { SettingsCardClassNames } from "../shared/settings-card";

export function InputFieldSkeleton({ classNames }: { classNames?: SettingsCardClassNames }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Skeleton className={cn("h-4 w-32", classNames?.skeleton)} />
      <Skeleton className={cn("h-9 w-full", classNames?.skeleton)} />
    </div>
  );
}
