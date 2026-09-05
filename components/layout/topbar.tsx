"use client";

import { usePathname } from "next/navigation";
import { Menu, UserPlus } from "lucide-react";
import { ThemeToggleCompact } from "@/components/theme/theme-toggle";
import { UserMenu, type UserMenuUser } from "@/components/layout/user-menu";
import { NotificationsBell } from "@/components/layout/notifications-bell";
import { CommandPalette } from "@/components/search/command-palette";
import { notifySuccess } from "@/lib/toast";
import type { Profile } from "@/lib/profiles/get";
import type { GenerationWithUrl } from "@/lib/generations/list";
import type { NotificationRow } from "@/lib/notifications/types";

const SECTION_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/dashboard", title: "Dashboard" },
  { prefix: "/ai/image", title: "AI Image" },
  { prefix: "/ai/video", title: "AI Video" },
  { prefix: "/ai/photo", title: "AI Photo" },
  { prefix: "/ai/design", title: "AI Design" },
  { prefix: "/ai/audio", title: "AI Audio" },
  { prefix: "/ai/scene", title: "AI Scene" },
  { prefix: "/ai/chat", title: "AI Chat" },
  { prefix: "/characters", title: "Personnages" },
  { prefix: "/projects", title: "Projets" },
  { prefix: "/history", title: "Historique" },
  { prefix: "/favorites", title: "Favoris" },
  { prefix: "/profile", title: "Mon profil" },
  { prefix: "/settings", title: "Réglages" },
  { prefix: "/admin", title: "Administration" },
  { prefix: "/premium", title: "RYNVA Pro" },
];

function sectionTitle(pathname: string) {
  return SECTION_TITLES.find((s) => pathname.startsWith(s.prefix))?.title ?? "RYNVA";
}

/**
 * Top bar: section title, ⌘K search, invite friends, credit balance,
 * notifications, profile dropdown.
 */
export function Topbar({
  user = null,
  profile = null,
  recentGenerations = [],
  notifications = [],
  unreadNotificationsCount = 0,
}: {
  user?: UserMenuUser | null;
  profile?: Profile | null;
  recentGenerations?: GenerationWithUrl[];
  notifications?: NotificationRow[];
  unreadNotificationsCount?: number;
}) {
  const pathname = usePathname();
  const tokensLabel = new Intl.NumberFormat("fr-FR").format(profile?.tokensConsumed ?? 0);

  function handleInvite() {
    if (!user) return;
    const link = `${window.location.origin}/register?ref=${user.id}`;
    navigator.clipboard
      .writeText(link)
      .then(() => notifySuccess("Lien d'invitation copié !"))
      .catch(() => {
        /* clipboard denied — nothing sensible to do, fail silently */
      });
  }

  return (
    <header className="mx-3 mt-3 flex h-16 shrink-0 items-center gap-4 rounded-3xl border border-zinc-200 bg-white px-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:px-6">
      <button
        type="button"
        aria-label="Ouvrir le menu"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="hidden shrink-0 text-xl font-bold tracking-tight text-zinc-900 dark:text-white md:block">
        {sectionTitle(pathname)}
      </h1>

      <div className="flex flex-1 justify-center">
        <div className="w-full max-w-md">
          <CommandPalette recentGenerations={recentGenerations} />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={handleInvite}
          disabled={!user}
          className="hidden items-center gap-1.5 rounded-full bg-gradient-brand px-3.5 py-2 text-xs font-medium text-white transition-all hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50 sm:inline-flex"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Invite friends
        </button>

        <span
          title="Crédits consommés au total"
          className="hidden items-center gap-1.5 rounded-full bg-gradient-brand px-2.5 py-1 text-xs font-medium text-white sm:inline-flex"
        >
          {tokensLabel} crédits utilisés
        </span>

        <ThemeToggleCompact />

        {user && (
          <NotificationsBell
            userId={user.id}
            initialNotifications={notifications}
            initialUnreadCount={unreadNotificationsCount}
          />
        )}

        {user ? (
          <UserMenu user={user} profile={profile} />
        ) : (
          <div className="h-9 w-9 rounded-full bg-gradient-brand" aria-label="Profil utilisateur" />
        )}
      </div>
    </header>
  );
}
