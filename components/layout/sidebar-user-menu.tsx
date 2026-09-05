"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { AccountMenuContent } from "@/components/layout/account-menu-content";
import { initialsOf, type UserMenuUser } from "@/components/layout/user-menu";
import type { Profile } from "@/lib/profiles/get";

/**
 * Replaces the old standalone "Paramètres" link at the bottom of the
 * sidebar: an avatar row that opens a dropdown *above* itself (ChatGPT's
 * bottom-left account menu shape) rather than below, since it sits at the
 * very bottom of the screen — a downward menu would run off-viewport.
 * Body is AccountMenuContent, shared with the topbar's UserMenu.
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
          <AccountMenuContent
            user={user}
            profile={profile}
            isAdmin={isAdmin}
            onNavigate={() => setMenuOpen(false)}
          />
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
