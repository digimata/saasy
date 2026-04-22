import { useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Bell, LogOut, Monitor, Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/providers/theme-provider";
import { IconSearch } from "@/components/ui/icons";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { Logo } from "@/components/logo";

export function Header() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut({ redirectUrl: "/sign-in" });
    } catch {
      setIsSigningOut(false);
    }
  }

  const displayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || user.primaryEmailAddress?.emailAddress
    : "";
  const displayEmail = user?.primaryEmailAddress?.emailAddress;
  const initial = displayName?.[0]?.toUpperCase() || "?";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background pt-1.5 pb-0.5">
      <div className="flex h-12 items-center px-5">
        <div className="flex items-center gap-2">
          <Logo className="size-5" />
          <span className="text-sm font-semibold">Saasy</span>
        </div>

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
                  <AvatarImage src={user?.imageUrl || undefined} />
                  <AvatarFallback className="bg-ds-green-500/12 text-ds-green-500 text-xs font-medium">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">{displayName}</span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" sideOffset={8} className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-medium text-foreground">{displayName}</div>
                  <div className="text-xs text-muted-foreground">{displayEmail}</div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Theme
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as "system" | "light" | "dark")}>
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
