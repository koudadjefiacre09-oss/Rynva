import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Bienvenue" };

export default async function OnboardingPage() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.user_metadata?.full_name) redirect("/dashboard");

  return (
    <AuthShell
      title="Bienvenue sur RYNVA"
      description="Une dernière étape avant de créer."
    >
      <OnboardingForm defaultName={user.user_metadata?.full_name ?? ""} />
    </AuthShell>
  );
}
