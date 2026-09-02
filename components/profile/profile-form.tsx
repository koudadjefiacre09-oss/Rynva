"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateProfile } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-3 inline-flex h-9 w-fit items-center justify-center rounded-full bg-zinc-900 px-4 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900"
    >
      {pending ? "Enregistrement..." : "Enregistrer les modifications"}
    </button>
  );
}

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const [state, formAction] = useFormState(updateProfile, null);

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <label htmlFor="fullName" className="text-xs font-medium text-zinc-500">
        Nom d&rsquo;affichage
      </label>
      <Input
        id="fullName"
        name="fullName"
        defaultValue={defaultName}
        placeholder="Votre nom"
        autoComplete="name"
        error={state?.fieldErrors?.fullName}
        className="border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500"
      />

      {state?.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}
      {state?.message && !state.error && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">{state.message}</p>
      )}

      <SaveButton />
    </form>
  );
}
