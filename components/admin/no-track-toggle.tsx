"use client";

import { useState, useTransition } from "react";
import { EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { setNoTrack } from "@/lib/visits/set-no-track";

/**
 * "Ne pas compter mes visites" — sets/clears the rynva_no_track cookie (see
 * lib/visits/no-track.ts) so the admin's own browsing doesn't inflate the
 * traffic numbers just above it. Signed-in admins are already excluded
 * automatically (app/api/track-visit/route.ts); this covers logged-out
 * browsing on the same browser too.
 */
export function NoTrackToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    startTransition(() => {
      setNoTrack(next);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        enabled
          ? "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          : "border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
      )}
    >
      <EyeOff className="h-3.5 w-3.5" />
      Ne pas compter mes visites
      <span
        className={cn(
          "ml-1 flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors",
          enabled ? "bg-zinc-900 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-700"
        )}
      >
        <span
          className={cn(
            "h-3 w-3 rounded-full bg-white transition-transform dark:bg-zinc-900",
            enabled && "translate-x-3"
          )}
        />
      </span>
    </button>
  );
}
