"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, User, Settings, CreditCard, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/auth/actions";
import type { Profile } from "@/lib/profiles/get";

export type UserMenuUser = { id: string; name: string; email: string };

const PLAN_BADGE: Record<string, string> = { free: "Free", pro: "Pro" };

function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

/**
 * Avatar + dropdown menu (profile header, upgrade CTA, profile/billing/
 * settings/logout links). Shared between the authenticated Topbar and the
 * public SiteHeader (shown there once the visitor is signed in) so both use
 * the exact same menu.
 */
export function UserMenu({
  user,
  profile = null,
}: {
  user: UserMenuUser;
  profile?: Profile | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const planLabel = PLAN_BADGE[profile?.plan ?? "free"] ?? "Free";

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`Connecté en tant que ${user.name}`}
        title={user.email}
        className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-90"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-brand text-xs font-semibold text-white">
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsOf(user.name)
          )}
        </span>
        <span className="hidden text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:inline">
          {user.name.split(" ")[0]}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-zinc-400 transition-transform duration-200",
            menuOpen && "rotate-180"
          )}
        />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-zinc-100 bg-white py-2 shadow-lg shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40"
        >
          {/* Profile header */}
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-brand text-sm font-semibold text-white">
              {profile?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initialsOf(user.name)
              )}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                {user.name}
              </span>
              <span className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                {user.email}
              </span>
            </div>
          </div>

          {/* Upgrade CTA */}
          {profile?.plan !== "pro" && (
            <div className="px-3 pb-3">
              <Link
                href="/premium"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                <Crown className="h-4 w-4" />
                Passer à RYNVA Pro
              </Link>
            </div>
          )}

          <div className="border-t border-zinc-100 py-1 dark:border-zinc-800">
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <User className="h-4 w-4" />
              Mon profil
            </Link>
            <Link
              href="/premium"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <CreditCard className="h-4 w-4" />
              Abonnement et facturation
              <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {planLabel}
              </span>
            </Link>
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <Settings className="h-4 w-4" />
              Réglages
            </Link>
            <div className="my-1 h-px bg-zinc-100 dark:bg-zinc-800" />
            <form action={logout}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
