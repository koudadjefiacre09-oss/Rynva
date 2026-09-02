import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function UpdatePasswordPage() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/reset-password");

  return (
    <AuthShell
      title="Nouveau mot de passe"
      description="Choisissez un nouveau mot de passe pour votre compte."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
