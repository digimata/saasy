import { Link, useLocation } from "react-router";

import { cn } from "@/lib/utils";
import { IconActivity, IconInbox, IconBox, IconSettingsSlider } from "@/components/ui/icons";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const navItems = [
  { label: "Overview", to: "/", icon: IconActivity, match: (p: string) => p === "/" },
  { label: "Projects", to: "/projects", icon: IconBox, match: (p: string) => p.startsWith("/projects") },
  { label: "Inbox", to: "/inbox", icon: IconInbox, match: (p: string) => p.startsWith("/inbox") },
];

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <TooltipProvider>
      <aside className="fixed top-[52px] left-0 bottom-0 w-[60px] z-40 flex flex-col items-center justify-between py-4 pb-8 bg-background pl-1">
        <nav className="flex flex-col items-center gap-1 mt-2">
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Tooltip key={item.to}>
                <TooltipTrigger
                  render={
                    <Link
                      to={item.to}
                      className={cn(
                        "grid place-items-center size-9 rounded-md transition-colors duration-150",
                        active ? "text-foreground bg-ds-bg-200" : "text-ds-gray-600 hover:text-foreground",
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

        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                to="/settings"
                className={cn(
                  "grid place-items-center size-9 rounded-md transition-colors duration-150",
                  pathname.startsWith("/settings")
                    ? "text-foreground bg-ds-bg-200"
                    : "text-ds-gray-600 hover:text-foreground",
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
