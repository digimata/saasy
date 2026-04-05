import { cn } from "@/lib/utils";

// -------------------------
// projects/saasy/apps/web/components/ui/skeleton.tsx
//
// function Skeleton()    L9
// -------------------------

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
