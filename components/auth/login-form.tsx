"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { login } from "@/app/auth/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Auth-page-only input skin — overrides the app-wide Input styling to match
// the fixed light auth shell, without touching the shared component (used
// with its default theme-aware look everywhere else in the app).
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
      Se connecter
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [state, formAction] = useFormState(login, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-ink-muted">
            Mot de passe
          </label>
          <Link href="/reset-password" className="text-xs text-ink-muted underline underline-offset-2 hover:text-ink">
            Oublié ?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={state?.fieldErrors?.password}
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
