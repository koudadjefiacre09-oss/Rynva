"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountMenuContent } from "@/components/layout/account-menu-content";
import { initialsOf } from "@/lib/initials";
import type { Profile } from "@/lib/profiles/get";

export type UserMenuUser = { id: string; name: string; email: string };

/**
 * Avatar + dropdown menu (profile header, upgrade CTA, profile/billing/
 * settings/theme/logout — see AccountMenuContent for the shared body).
 * Shared between the authenticated Topbar and the public SiteHeader (shown
 * there once the visitor is signed in) so both use the exact same menu.
 */
export function UserMenu({
  user,
  profile = null,
  isAdmin = false,
}: {
  user: UserMenuUser;
  profile?: Profile | null;
  isAdmin?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        <span className="hidden max-w-[140px] truncate text-sm font-medium text-zinc-700 dark:text-zinc-300 sm:inline">
          {user.name}
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
          <AccountMenuContent
            user={user}
            profile={profile}
            isAdmin={isAdmin}
            onNavigate={() => setMenuOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
