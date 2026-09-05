import Link from "next/link";
import { LayoutGrid, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/projects", label: "Tous les projets", icon: LayoutGrid },
  { href: "/favorites", label: "Favoris", icon: Star },
  { href: "/trash", label: "Corbeille", icon: Trash2 },
] as const;

/**
 * Small vertical nav shared by /projects, /favorites and /trash — lets you
 * switch between the three without going back through the main sidebar.
 * Narrower version of RYNVA's own nav styling (see components/layout/
 * sidebar.tsx), not Magnific's full folder/team tree: RYNVA has no
 * project-folder or team concept to show there.
 */
export function ProjectsSubnav({ active }: { active: "projects" | "favorites" | "trash" }) {
  return (
    <nav className="flex shrink-0 flex-col gap-1 sm:w-48">
      {ITEMS.map((item) => {
        const isActive = item.href === `/${active}`;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
