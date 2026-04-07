// --------------------------------
// projects/saasy/apps/web/components/sidebar.tsx
//
// const navItems               L17
// export function Sidebar()    L23
// --------------------------------

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { IconActivity, IconInbox, IconBox, IconSettingsSlider } from "@/components/ui/icons";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const navItems = [
  { label: "Overview", href: "/", icon: IconActivity },
  { label: "Projects", href: "/projects", icon: IconBox },
  { label: "Orders", href: "/orders", icon: IconInbox },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <aside className="fixed top-[52px] left-0 bottom-0 w-14 z-40 flex flex-col items-center justify-between py-4 pb-8 bg-background">
        {/* Top: main nav */}
        <nav className="flex flex-col items-center gap-1 mt-2">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger
                  render={
                    <Link
                      href={item.href}
                      prefetch={false}
                      className={cn(
                        "grid place-items-center size-9 rounded-md transition-colors duration-150",
                        active
                          ? "text-foreground bg-ds-bg-200"
                          : "text-ds-gray-600 hover:text-foreground"
                      )}
                    />
                  }
                >
                  <item.icon className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom: settings */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/settings"
                prefetch={false}
                className={cn(
                  "grid place-items-center size-9 rounded-md transition-colors duration-150",
                  pathname.startsWith("/settings")
                    ? "text-foreground bg-ds-bg-200"
                    : "text-ds-gray-600 hover:text-foreground"
                )}
              />
            }
          >
            <IconSettingsSlider className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Settings
          </TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  );
}
