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
  Settings,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
 * Deliberately always dark (bg-ink, RYNVA's own near-black from the landing
 * page palette — see tailwind.config.ts) regardless of the app's own
 * light/dark toggle, Vercel/Linear-style: a permanently dark rail reads as
 * more premium and minimal than one that flips with the theme, and it's the
 * one brand color guaranteed to look right against both light- and dark-mode
 * content next to it. Active item is a solid white pill (bg-white text-ink),
 * everything else sits at low-opacity white so the active state is the only
 * thing competing for attention.
 *
 * Collapsible, Magnific-AI-style: collapsed by default to a thin icon-only
 * rail (w-16, monochrome), expands to w-64 with labels on toggle. `isOpen`
 * lives locally — it survives navigation between pages on its own since this
 * component sits in the (app) route group's layout, which persists across
 * child route changes.
 */
export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:h-full lg:shrink-0 lg:flex-col lg:bg-ink lg:transition-all lg:duration-300 lg:ease-in-out",
        isOpen ? "lg:w-64" : "lg:w-16"
      )}
    >
      <div className={cn("flex h-16 items-center", isOpen ? "gap-2.5 px-5" : "justify-center px-0")}>
        <Image src="/logo-icon.png" alt="RYNVA" width={30} height={30} className="shrink-0 rounded-md" />
      </div>

      <div className={cn("px-3 pb-2", isOpen ? "flex justify-end" : "flex justify-center")}>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? "Réduire la barre latérale" : "Ouvrir la barre latérale"}
          aria-expanded={isOpen}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ChevronRight
            className={cn("h-4 w-4 transition-transform duration-300 ease-in-out", isOpen && "rotate-180")}
          />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              title={!isOpen ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-full py-2.5 text-sm font-medium transition-colors",
                isOpen ? "px-3.5" : "justify-center px-0",
                isActive
                  ? "bg-white text-ink shadow-sm"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={2} />
              {isOpen && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        {isAdmin && (
          <Link
            href="/admin"
            title={!isOpen ? "Admin" : undefined}
            className={cn(
              "mb-1 flex items-center gap-3 rounded-full py-2.5 text-sm font-medium transition-colors",
              isOpen ? "px-3.5" : "justify-center px-0",
              pathname === "/admin"
                ? "bg-white text-ink shadow-sm"
                : "text-white/50 hover:bg-white/5 hover:text-white"
            )}
          >
            <ShieldCheck className="h-4.5 w-4.5 shrink-0" strokeWidth={2} />
            {isOpen && <span className="truncate">Admin</span>}
          </Link>
        )}
        <Link
          href="/settings"
          title={!isOpen ? "Paramètres" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-full py-2.5 text-sm font-medium transition-colors",
            isOpen ? "px-3.5" : "justify-center px-0",
            pathname === "/settings"
              ? "bg-white text-ink shadow-sm"
              : "text-white/50 hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings className="h-4.5 w-4.5 shrink-0" strokeWidth={2} />
          {isOpen && <span className="truncate">Paramètres</span>}
        </Link>
      </div>
    </aside>
  );
}
