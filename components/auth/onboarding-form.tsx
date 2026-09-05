"use client";

import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { completeOnboarding } from "@/app/auth/actions";
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
      Continuer vers le studio
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

export function OnboardingForm({ defaultName = "" }: { defaultName?: string }) {
  const [state, formAction] = useFormState(completeOnboarding, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fullName" className="text-sm font-medium text-ink-muted">
          Nom complet
        </label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={defaultName}
          placeholder="Votre nom"
          autoComplete="name"
          error={state?.fieldErrors?.fullName}
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
