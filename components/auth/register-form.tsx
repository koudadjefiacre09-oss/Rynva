"use client";

import { useFormState, useFormStatus } from "react-dom";
import { register } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      Créer mon compte
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useFormState(register, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-text-secondary">
          Nom complet
        </label>
        <Input
          id="fullName"
          name="fullName"
          placeholder="Votre nom"
          autoComplete="name"
          error={state?.fieldErrors?.fullName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-text-secondary">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="vous@exemple.com"
          autoComplete="email"
          error={state?.fieldErrors?.email}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-text-secondary">
          Mot de passe
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="8 caractères minimum"
          autoComplete="new-password"
          error={state?.fieldErrors?.password}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-text-secondary">
          Confirmer le mot de passe
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={state?.fieldErrors?.confirmPassword}
        />
      </div>

      {state?.error && (
        <p className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="text-center text-xs text-text-muted">
        En créant un compte, vous acceptez les conditions d'utilisation de RYNVA.
      </p>
    </form>
  );
}
