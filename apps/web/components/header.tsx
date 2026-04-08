"use client";

import { useState } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { Bell, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { IconSearch } from "@/components/ui/icons";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { signOut, useSession } from "@repo/auth/client";

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
import { WorkspaceSwitcher } from "./workspace-switcher";

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background pt-1.5 pb-0.5">
      <div className="flex h-12 items-center px-5">
        {/* Left: workspace switcher */}
        <WorkspaceSwitcher />

        {/* Right: notifications + profile */}
        <div className="ml-auto flex items-center gap-2 mr-2">
          <button
            type="button"
            className="grid place-items-center size-8 rounded-md text-ds-gray-900 hover:text-foreground transition-colors"
          >
            <IconSearch className="size-3.5" />
          </button>
          <button
            type="button"
            className="grid place-items-center size-8 rounded-md text-ds-gray-900 hover:text-foreground transition-colors"
          >
            <Bell className="size-3.5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="cursor-pointer">
                <Avatar className="size-7">
                  <AvatarImage src={session?.user?.image || undefined} />
                  <AvatarFallback className="bg-ds-green-500/12 text-ds-green-500 text-xs font-medium">
                    {session?.user?.name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">
                  {session?.user?.name || session?.user?.email}
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={8} className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-medium text-foreground">{session?.user?.name}</div>
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
