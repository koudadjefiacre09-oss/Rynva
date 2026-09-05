"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Image as ImageIcon,
  Video,
  Camera,
  Palette,
  AudioLines,
  MessageSquare,
  Users,
  Clapperboard,
  FolderKanban,
  History,
  Star,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ACCENT, DEFAULT_NAV_ACCENT } from "@/lib/nav-colors";
import { SidebarUserMenu } from "@/components/layout/sidebar-user-menu";
import type { UserMenuUser } from "@/components/layout/user-menu";
import type { Profile } from "@/lib/profiles/get";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/ai/image", label: "Image", icon: ImageIcon },
  { href: "/ai/video", label: "Video", icon: Video },
  { href: "/ai/photo", label: "Photo", icon: Camera },
  { href: "/ai/design", label: "Design", icon: Palette },
  { href: "/ai/audio", label: "Audio", icon: AudioLines },
  { href: "/ai/scene", label: "Scene", icon: Clapperboard },
  { href: "/ai/chat", label: "Chat", icon: MessageSquare },
  { href: "/characters", label: "Personnages", icon: Users },
  { href: "/projects", label: "Projets", icon: FolderKanban },
  { href: "/history", label: "Historique", icon: History },
  { href: "/favorites", label: "Favoris", icon: Star },
];

/**
 * Persistent desktop sidebar (per brief: desktop keeps a persistent sidebar,
 * mobile gets its own adapted nav — see MobileNav, not included in this file).
 *
 * Collapsible, Magnific-AI-style: collapsed by default to a thin icon-only
 * rail (w-16), expands to w-64 with labels on toggle. `isOpen` lives
 * locally — it survives navigation between pages on its own since this
 * component sits in the (app) route group's layout, which persists across
 * child route changes.
 *
 * Each item's icon sits in a small tinted chip, one accent color per
 * destination (see lib/nav-colors.ts, shared with the dashboard's tool
 * shortcuts) instead of a flat monochrome glyph.
 *
 * The bottom used to be a plain "Paramètres" link; it's now the account
 * avatar (SidebarUserMenu) — profile, billing, settings, admin and sign-out
 * all live in the one menu that opens above it.
 */
export function Sidebar({
  user,
  profile = null,
  isAdmin = false,
}: {
  user?: UserMenuUser | null;
  profile?: Profile | null;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:my-3 lg:ml-3 lg:flex lg:h-[calc(100%-1.5rem)] lg:shrink-0 lg:flex-col lg:rounded-3xl lg:border lg:border-zinc-200 lg:bg-white lg:shadow-sm lg:transition-all lg:duration-300 lg:ease-in-out dark:lg:border-zinc-800 dark:lg:bg-zinc-900",
        isOpen ? "lg:w-64" : "lg:w-16"
      )}
    >
      <div className={cn("flex items-center pb-2 pt-6", isOpen ? "gap-2.5 px-5" : "justify-center px-0")}>
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-icon.png" alt="RYNVA" width={30} height={30} className="shrink-0 rounded-md" />
          {isOpen && (
            <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-white">
              RYNVA
            </span>
          )}
        </Link>
      </div>

      <div className={cn("px-3 pb-2", isOpen ? "flex justify-end" : "flex justify-center")}>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? "Réduire la barre latérale" : "Ouvrir la barre latérale"}
          aria-expanded={isOpen}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-white"
        >
          <ChevronRight
            className={cn("h-4 w-4 transition-transform duration-300 ease-in-out", isOpen && "rotate-180")}
          />
        </button>
      </div>

      <nav className="no-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const accent = NAV_ACCENT[item.href] ?? DEFAULT_NAV_ACCENT;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={!isOpen ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg py-2 text-sm font-medium transition-colors",
                isOpen ? "px-2" : "justify-center px-0",
                isActive
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-white"
              )}
            >
              <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", accent)}>
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              {isOpen && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {user && (
        <SidebarUserMenu user={user} profile={profile} isAdmin={isAdmin} sidebarOpen={isOpen} />
      )}
    </aside>
  );
}
