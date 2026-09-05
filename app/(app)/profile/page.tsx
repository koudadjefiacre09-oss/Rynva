import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCard, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProfile } from "@/lib/profiles/get";
import { getInvitedCount } from "@/lib/profiles/invites";

export const metadata: Metadata = { title: "Mon profil" };

const PLAN_BADGE: Record<string, string> = { free: "Free", pro: "Pro" };
const PLAN_LABEL: Record<string, string> = {
  free: "Plan Personnel · Gratuit",
  pro: "Plan Pro",
};

export default async function ProfilePage() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";
  const memberSince = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
    new Date(user.created_at)
  );
  const invitedCount = await getInvitedCount(user.id);

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-white px-4 py-10 dark:bg-black lg:-m-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Mon profil
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Gérez vos informations personnelles et votre compte RYNVA.
          </p>
        </div>

        {/* Wide layout: main info card + a narrower stats column, so
            everything fits on one screen instead of stacking full-width. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none sm:p-6">
            <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Informations personnelles
            </h2>

            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start">
              <AvatarUploader
                name={fullName || user.email || "Utilisateur"}
                initialAvatarUrl={profile.avatarUrl}
              />

              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-zinc-500">Email</span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{user.email}</p>
                </div>
                <ProfileForm defaultName={fullName} />
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-6">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none sm:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Crédits utilisés
                </h2>
                <Badge variant="brand">{PLAN_BADGE[profile.plan] ?? "Free"}</Badge>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                {profile.tokensConsumed}
                <span className="ml-1.5 text-sm font-normal text-zinc-500">crédits</span>
              </p>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none sm:p-6">
              <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Statut du compte
              </h2>
              <div className="mt-4 flex items-center gap-2.5">
                <CreditCard className="h-4 w-4 text-zinc-400" />
                <p className="text-sm text-zinc-900 dark:text-white">
                  {PLAN_LABEL[profile.plan] ?? PLAN_LABEL.free}
                </p>
              </div>
              <p className="mt-2 text-xs text-zinc-500">Membre depuis le {memberSince}</p>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none sm:p-6">
              <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Amis invités
              </h2>
              <div className="mt-4 flex items-center gap-2.5">
                <UserPlus className="h-4 w-4 text-zinc-400" />
                <p className="text-sm text-zinc-900 dark:text-white">
                  {invitedCount} inscription{invitedCount > 1 ? "s" : ""} via votre lien
                </p>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Copiez votre lien depuis le bouton &laquo; Invite friends &raquo; en haut de l&rsquo;écran.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
