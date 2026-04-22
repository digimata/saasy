import * as React from "react";

import { cn } from "@/lib/utils";

interface UrlInputProps extends React.ComponentProps<"input"> {
  prefix: string;
  variant?: "default" | "bubble";
}

function UrlInput({
  className,
  type,
  prefix,
  variant = "default",
  ...props
}: UrlInputProps) {
  const isBubble = variant === "bubble";

  return (
    <div className="relative flex w-full">
      <span
        className={cn(
          "absolute top-1/2 -translate-y-1/2 text-secondary-foreground text-xs font-mono pointer-events-none z-10",
          isBubble ? "left-4" : "left-3",
        )}
      >
        {prefix}
      </span>
      <input
        type={type}
        data-slot="input"
        className={cn(
          isBubble
            ? [
                "flex h-auto w-full min-w-0 rounded-[12px] border px-4 py-2.5 text-base shadow-subtle-lg transition-[border-color,background-color] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
                "focus-visible:border-foreground dark:focus-visible:border-ds-blue-500 focus-visible:outline-none",
                "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
              ]
            : [
                "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-border flex h-9 w-full min-w-0 rounded-md border bg-background py-1 text-base shadow-xs transition-[border-color,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                "focus-visible:border-foreground dark:focus-visible:border-ds-blue-500 focus-visible:outline-none",
                "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
              ],
          className,
        )}
        style={{
          paddingLeft: `${prefix.length * 0.5 + (isBubble ? 0.6 : 0.2)}rem`,
        }}
        {...props}
      />
    </div>
  );
}

export { UrlInput };
