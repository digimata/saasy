"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Users, CreditCard, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const navItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Members", href: "/members", icon: Users },
  { label: "Billing", href: "/billing", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  return (
    <aside
      className="fixed top-0 left-0 h-full w-16 z-40 flex flex-col justify-between py-8 px-4 border-r border-border bg-background transition-all duration-300 hover:w-52"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div>
        {/* Logo / workspace initial */}
        <div className="grid place-items-center size-8 mb-8">
          <div className="bg-primary text-primary-foreground flex items-center justify-center rounded-lg size-8 text-xs font-bold">
            S
          </div>
        </div>

        {/* Nav */}
        <nav className="grid gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 h-10 transition-colors duration-200",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="grid place-items-center w-8 shrink-0">
                  <item.icon className="size-4" />
                </span>
                <span
                  className={cn(
                    "text-sm font-medium whitespace-nowrap transition-all duration-300",
                    hovered
                      ? "translate-x-0 opacity-100 blur-none"
                      : "translate-x-[-8px] opacity-0 blur-sm",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: sign out */}
      <button
        onClick={handleSignOut}
        className="flex items-center gap-3 h-10 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
      >
        <span className="grid place-items-center w-8 shrink-0">
          <LogOut className="size-4" />
        </span>
        <span
          className={cn(
            "text-sm font-medium whitespace-nowrap transition-all duration-300",
            hovered
              ? "translate-x-0 opacity-100 blur-none"
              : "translate-x-[-8px] opacity-0 blur-sm",
          )}
        >
          Sign out
        </span>
      </button>
    </aside>
  );
}
