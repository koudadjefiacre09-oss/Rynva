"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav-items";
import { NAV_ACCENT, DEFAULT_NAV_ACCENT } from "@/lib/nav-colors";
import { AccountMenuContent } from "@/components/layout/account-menu-content";
import type { UserMenuUser } from "@/components/layout/user-menu";
import type { Profile } from "@/lib/profiles/get";

/**
 * The hamburger button in the topbar (mobile/tablet only, lg:hidden) used to
 * render with no onClick at all — this is that button plus the slide-in
 * drawer it's supposed to open, since the desktop Sidebar is hidden below
 * the lg breakpoint and mobile had no nav of its own otherwise. Reuses the
 * same NAV_ITEMS/NAV_ACCENT as the desktop sidebar and the same
 * AccountMenuContent as both other account menus, so all three stay in sync.
 */
export function MobileNav({
  user,
  profile = null,
  isAdmin = false,
}: {
  user?: UserMenuUser | null;
  profile?: Profile | null;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation, and don't let the page scroll behind the drawer.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="thin-scrollbar absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-white shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between px-4 pb-2 pt-5">
              <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
                <Image src="/logo-icon.png" alt="RYNVA" width={28} height={28} className="rounded-md" />
                <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
                  RYNVA
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-1 px-3 py-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                const accent = NAV_ACCENT[item.href] ?? DEFAULT_NAV_ACCENT;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                    )}
                  >
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", accent)}>
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {user && (
              <div className="mt-auto border-t border-zinc-100 py-1 dark:border-zinc-800">
                <AccountMenuContent
                  user={user}
                  profile={profile}
                  isAdmin={isAdmin}
                  onNavigate={() => setOpen(false)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
