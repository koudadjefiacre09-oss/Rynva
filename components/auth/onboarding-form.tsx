"use client";

import { useFormState, useFormStatus } from "react-dom";
import { completeOnboarding } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" loading={pending}>
      Continuer vers le studio
    </Button>
  );
}

export function OnboardingForm({ defaultName = "" }: { defaultName?: string }) {
  const [state, formAction] = useFormState(completeOnboarding, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-text-secondary">
          Nom complet
        </label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={defaultName}
          placeholder="Votre nom"
          autoComplete="name"
          error={state?.fieldErrors?.fullName}
        />
      </div>

      {state?.error && (
        <p className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
