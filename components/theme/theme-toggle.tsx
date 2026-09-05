"use client";

import { Sun, Moon, SunMoon } from "lucide-react";
import { useTheme, type Theme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Clair" },
  { value: "dark", icon: Moon, label: "Sombre" },
  { value: "system", icon: SunMoon, label: "Système" },
];

/** Full 3-way light/dark/system control — used on the Settings page. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Thème"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const CYCLE: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" };
const CYCLE_ICON: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: SunMoon };
const CYCLE_LABEL: Record<Theme, string> = { light: "Clair", dark: "Sombre", system: "Système" };

/** Compact single-icon cycle button — used in the topbar. */
export function ThemeToggleCompact() {
  const { theme, setTheme } = useTheme();
  const Icon = CYCLE_ICON[theme];

  return (
    <button
      type="button"
      onClick={() => setTheme(CYCLE[theme])}
      aria-label="Changer le thème"
      title={`Thème : ${CYCLE_LABEL[theme]}`}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
    >
      <Icon className="h-4.5 w-4.5" />
    </button>
  );
}
