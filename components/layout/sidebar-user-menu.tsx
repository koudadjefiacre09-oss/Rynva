"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, User, Settings, CreditCard, Crown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/auth/actions";
import { initialsOf, type UserMenuUser } from "@/components/layout/user-menu";
import type { Profile } from "@/lib/profiles/get";

const PLAN_BADGE: Record<string, string> = { free: "Free", pro: "Pro" };

/**
 * Replaces the old standalone "Paramètres" link at the bottom of the
 * sidebar: an avatar row that opens a dropdown *above* itself (ChatGPT's
 * bottom-left account menu shape) rather than below, since it sits at the
 * very bottom of the screen — a downward menu would run off-viewport.
 * Folds in what used to be separate destinations (profile, settings, admin)
 * plus sign-out, so this one row replaces the whole old bottom section.
 */
export function SidebarUserMenu({
  user,
  profile = null,
  isAdmin = false,
  sidebarOpen,
}: {
  user: UserMenuUser;
  profile?: Profile | null;
  isAdmin?: boolean;
  sidebarOpen: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const planLabel = PLAN_BADGE[profile?.plan ?? "free"] ?? "Free";

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
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
    <div className="relative border-t border-zinc-100 p-3 dark:border-zinc-800/50" ref={menuRef}>
      {menuOpen && (
        <div
          role="menu"
          className="absolute bottom-full left-3 z-50 mb-2 w-64 overflow-hidden rounded-2xl border border-zinc-100 bg-white py-2 shadow-lg shadow-zinc-200/60 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40"
        >
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
              <span className="truncate text-xs text-zinc-400 dark:text-zinc-500">{user.email}</span>
            </div>
          </div>

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
            {isAdmin && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <ShieldCheck className="h-4 w-4" />
                Administration
              </Link>
            )}
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

      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title={!sidebarOpen ? user.name : undefined}
        className={cn(
          "flex w-full items-center gap-3 rounded-full py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900",
          sidebarOpen ? "px-2" : "justify-center px-0"
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-brand text-xs font-semibold text-white">
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initialsOf(user.name)
          )}
        </span>
        {sidebarOpen && <span className="truncate">{user.name.split(" ")[0]}</span>}
      </button>
    </div>
  );
}
