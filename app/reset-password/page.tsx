import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Indiquez votre email, nous vous envoyons un lien de réinitialisation."
      footer={
        <Link href="/login" className="font-medium text-ink underline underline-offset-2">
          Retour à la connexion
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
