"use client";

import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { register } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Auth-page-only input skin — see login-form.tsx.
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
      Créer mon compte
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useFormState(register, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fullName" className="text-sm font-medium text-ink-muted">
            Nom complet
          </label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="Votre nom"
            autoComplete="name"
            error={state?.fieldErrors?.fullName}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-ink-muted">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="vous@exemple.com"
            autoComplete="email"
            error={state?.fieldErrors?.email}
            className={inputClassName}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-ink-muted">
            Mot de passe
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
      </div>

      {state?.error && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="text-center text-xs text-ink-muted">
        En créant un compte, vous acceptez les conditions d&apos;utilisation de RYNVA.
      </p>
    </form>
  );
}
