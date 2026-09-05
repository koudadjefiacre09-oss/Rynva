import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-white px-4 py-10 dark:bg-black lg:-m-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Paramètres
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Gérez la sécurité et la session de votre compte RYNVA.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none sm:p-6">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Apparence</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Choisissez l&rsquo;apparence de RYNVA sur cet appareil.
          </p>
          <div className="mt-4">
            <ThemeToggle />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none sm:p-6">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sécurité</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Choisissez un nouveau mot de passe pour {user.email}.
          </p>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none sm:p-6">
          <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Session</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Vous déconnecte de cet appareil. Vous pourrez vous reconnecter à tout moment.
          </p>
          <form action={logout} className="mt-4">
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 px-4 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 hover:border-red-200 dark:border-zinc-800 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:border-red-900"
            >
              <LogOut className="h-3.5 w-3.5" />
              Se déconnecter
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
