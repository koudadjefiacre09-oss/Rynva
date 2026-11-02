"use client";

import { useActionState, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { deleteAccount } from "@/lib/account/actions";
import { DELETE_CONFIRMATION } from "@/lib/account/constants";

export function ExportDataButton() {
  return (
    <a
      href="/api/account/export"
      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <Download className="h-4 w-4" />
      Exporter mes données
    </a>
  );
}

export function DeleteAccountForm() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [state, action, pending] = useActionState(deleteAccount, null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-danger/40 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
      >
        <Trash2 className="h-4 w-4" />
        Supprimer mon compte
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4">
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        Votre compte, vos créations, personnages, conversations et historique seront <strong>définitivement</strong>{" "}
        supprimés. Pensez à exporter vos données avant.
      </p>
      <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-500">
        Tapez {DELETE_CONFIRMATION} pour confirmer
        <input
          name="confirmation"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        />
      </label>
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={value.trim() !== DELETE_CONFIRMATION || pending}
          className="inline-flex items-center gap-2 rounded-full bg-danger px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          {pending ? "Suppression…" : "Supprimer définitivement"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setValue("");
          }}
          className="rounded-full px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
