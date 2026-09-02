import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell, AuthDivider } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = { title: "Connexion" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Content de vous revoir"
      description="Connectez-vous pour accéder à votre studio RYNVA."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-brand-purple hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
        <AuthDivider />
        <GoogleButton />
      </div>
    </AuthShell>
  );
}
