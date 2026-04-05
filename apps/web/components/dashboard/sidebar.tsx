"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/providers/theme-provider";
import { LayoutDashboard, LogOut, Monitor, Moon, Settings, Sun, User } from "lucide-react";
import { signOut, useSession } from "@repo/auth/client";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OrganizationSwitcher } from "@/components/auth/organization/organization-switcher";

const topNavItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="group fixed top-16 left-0 bottom-0 w-32 z-40 flex flex-col justify-between py-8 px-5 bg-background overflow-visible after:absolute after:top-0 after:left-full after:h-full after:w-24 after:content-['']"
    >
      {/* Top: main nav */}
      <div>
        <nav className="grid gap-1">
          {topNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={cn(
                  "flex items-center gap-3 h-10 transition-colors duration-200",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="grid place-items-center w-8 shrink-0">
                  <item.icon className="size-4" />
                </span>
                <span
                  className="text-sm font-medium whitespace-nowrap transition-all duration-300 -translate-x-2 opacity-0 blur-sm group-hover:translate-x-0 group-hover:opacity-100 group-hover:blur-none"
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: settings */}
      <div className="grid gap-1">
        <Link
          href="/settings"
          prefetch={false}
          className={cn(
            "flex items-center gap-3 h-10 transition-colors duration-200",
            pathname === "/settings"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="grid place-items-center w-8 shrink-0">
            <Settings className="size-4" />
          </span>
          <span className="text-sm font-medium whitespace-nowrap transition-all duration-300 -translate-x-2 opacity-0 blur-sm group-hover:translate-x-0 group-hover:opacity-100 group-hover:blur-none">
            Settings
          </span>
        </Link>
      </div>
    </aside>
  );
}

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);

    void signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.replace("/sign-in");
        },
      },
    }).catch(() => {
      setIsSigningOut(false);
    });
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background">
      <div className="flex h-16 items-center">
        {/* Left: org switcher, aligned above sidebar */}
        <div className="flex items-center px-5 w-32 shrink-0">
          <OrganizationSwitcher
            size="icon"
            hidePersonal
            align="start"
            side="bottom"
            sideOffset={8}
          />
        </div>

        {/* Right: profile avatar */}
        <div className="ml-auto flex items-center pr-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="cursor-pointer"
              >
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-muted text-muted-foreground flex items-center justify-center rounded-full size-8 text-xs font-medium">
                    {session?.user?.name?.[0]?.toUpperCase() || <User className="size-4" />}
                  </div>
                )}
                <span className="sr-only">
                  {session?.user?.name || session?.user?.email}
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={8} className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-medium">{session?.user?.name}</div>
                  <div className="text-xs text-muted-foreground">{session?.user?.email}</div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Theme
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="system">
                    <Monitor className="size-4 mr-2" />
                    System
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="light">
                    <Sun className="size-4 mr-2" />
                    Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <Moon className="size-4 mr-2" />
                    Dark
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
                  <LogOut className="size-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
