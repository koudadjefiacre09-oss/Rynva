"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updatePassword } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 inline-flex h-9 w-fit items-center justify-center rounded-full bg-zinc-900 px-4 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900"
    >
      {pending ? "Mise à jour..." : "Mettre à jour le mot de passe"}
    </button>
  );
}

// Reuses the same `updatePassword` server action as the post-reset-link flow
// (/update-password) — on success it redirects to /dashboard, same as there.
export function ChangePasswordForm() {
  const [state, formAction] = useFormState(updatePassword, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-medium text-zinc-500">
          Nouveau mot de passe
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="8 caractères minimum"
          autoComplete="new-password"
          error={state?.fieldErrors?.password}
          className="border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-xs font-medium text-zinc-500">
          Confirmer le mot de passe
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={state?.fieldErrors?.confirmPassword}
          className="border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus-visible:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus-visible:border-zinc-500"
        />
      </div>

      {state?.error && <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>}

      <SubmitButton />
    </form>
  );
}
