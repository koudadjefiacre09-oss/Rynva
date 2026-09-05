"use client";

import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { updatePassword } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const inputClassName =
  "border-ink/15 bg-cream text-ink placeholder:text-ink-muted/70 focus-visible:border-ink";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      loading={pending}
      className="w-full gap-1.5 rounded-full bg-ink font-semibold text-white hover:brightness-110"
    >
      Mettre à jour le mot de passe
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

export function UpdatePasswordForm() {
  const [state, formAction] = useFormState(updatePassword, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink-muted">
          Nouveau mot de passe
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="8 caractères minimum"
          autoComplete="new-password"
          error={state?.fieldErrors?.password}
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-ink-muted">
          Confirmer le mot de passe
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={state?.fieldErrors?.confirmPassword}
          className={inputClassName}
        />
      </div>

      {state?.error && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
