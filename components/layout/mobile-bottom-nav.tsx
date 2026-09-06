"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BOTTOM_NAV_ITEMS } from "@/lib/nav-items";
import { NAV_ACCENT } from "@/lib/nav-colors";

/**
 * Fixed bottom tab bar, mobile/tablet only (lg:hidden — the desktop Sidebar
 * takes over above that). A handful of the most-used destinations; the full
 * list still lives in the hamburger drawer (components/layout/mobile-nav.tsx).
 */
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-full border border-zinc-200 bg-white/95 py-2 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 lg:hidden">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        const accent = NAV_ACCENT[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-0.5 py-1"
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                isActive ? accent : "text-zinc-400 dark:text-zinc-500"
              )}
            >
              <Icon className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
            <span
              className={cn(
                "text-[10px] font-medium",
                isActive ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
