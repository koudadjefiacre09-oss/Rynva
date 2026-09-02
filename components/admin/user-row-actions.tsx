"use client";

import { useState, useTransition } from "react";
import { Trash2, Ban, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteUserAdmin, setUserSuspended } from "@/app/(app)/admin/actions";

export function UserRowActions({ userId, banned }: { userId: string; banned: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  function handleDelete() {
    if (
      !window.confirm(
        "Supprimer définitivement ce compte et toutes ses données (générations, personnages, historique) ? Cette action est irréversible."
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await deleteUserAdmin(userId);
      if (res.error) setError(res.error);
      else setDeleted(true);
    });
  }

  function handleSuspendToggle() {
    const verb = banned ? "réactiver" : "suspendre";
    if (!window.confirm(`Confirmer : ${verb} ce compte ?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await setUserSuspended(userId, !banned);
      if (res.error) setError(res.error);
    });
  }

  if (deleted) {
    return <span className="text-xs text-zinc-400 dark:text-zinc-500">Supprimé</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && <span className="text-[11px] text-red-600 dark:text-red-400">{error}</span>}
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={handleSuspendToggle}
          disabled={pending}
          className={cn(
            "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            banned
              ? "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              : "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:hover:bg-amber-950/30"
          )}
        >
          {banned ? <RotateCcw className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
          {banned ? "Réactiver" : "Suspendre"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="flex items-center gap-1 rounded-full border border-red-300 px-2.5 py-1 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <Trash2 className="h-3 w-3" />
          Supprimer
        </button>
      </div>
    </div>
  );
}
