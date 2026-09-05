import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell, AuthDivider } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = { title: "Créer un compte" };

export default function RegisterPage() {
  return (
    <AuthShell
      activeTab="register"
      maxWidth="md"
      title="Créez votre compte"
      description="Rejoignez RYNVA et créez avec l'IA en quelques secondes."
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-ink underline underline-offset-2">
            Se connecter
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <RegisterForm />
        <AuthDivider />
        <GoogleButton />
      </div>
    </AuthShell>
  );
}
