import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "size-10 rounded-lg bg-foreground flex items-center justify-center",
        className,
      )}
    >
      <span className="text-background font-bold text-lg">S</span>
    </div>
  );
}
