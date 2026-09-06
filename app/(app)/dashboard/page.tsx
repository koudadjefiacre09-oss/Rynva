import Link from "next/link";
import Image from "next/image";
import { Crown, ChevronRight, Image as ImageIcon, Video } from "lucide-react";
import { ProjectCard } from "@/components/gallery/project-card";
import { CommandPalette } from "@/components/search/command-palette";
import { WelcomeCreditsModal } from "@/components/dashboard/welcome-credits-modal";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listGenerations, type GenerationWithUrl } from "@/lib/generations/list";
import { getProfile, type Profile } from "@/lib/profiles/get";
import { AI_TOOLS } from "@/lib/ai-tools";
import { NAV_ACCENT, DEFAULT_NAV_ACCENT } from "@/lib/nav-colors";
import { getGreeting } from "@/lib/greeting";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  let firstName = "";
  let recentProjects: GenerationWithUrl[] = [];
  let profile: Profile | null = null;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const fullName = user?.user_metadata?.full_name as string | undefined;
    firstName = fullName?.split(" ")[0] ?? "";

    if (user) {
      recentProjects = await listGenerations(user.id, 4);
      profile = await getProfile(user.id);
    }
  }

  // Metered accounts only: Pro and pre-trial-feature accounts have
  // creditsExpireAt = null (see migration 0014) and never show this.
  const isMetered = Boolean(profile && profile.plan !== "pro" && profile.creditsExpireAt);

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-white px-4 py-14 dark:bg-black lg:-m-6 lg:px-8">
      {profile && !profile.welcomeShown && profile.plan !== "pro" && profile.creditsExpireAt && (
        <WelcomeCreditsModal
          imagesGranted={profile.imagesRemaining}
          videosGranted={profile.videosRemaining}
          expiresAt={profile.creditsExpireAt}
        />
      )}

      {/* Hero: greeting + big search bar + tool shortcuts — Magnific-style launcher. */}
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-7 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          {getGreeting(firstName)}
        </h1>

        {isMetered && profile && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-zinc-500">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
              <ImageIcon className="h-3.5 w-3.5 text-brand-purple" />
              {profile.imagesRemaining} image{profile.imagesRemaining !== 1 ? "s" : ""} restante
              {profile.imagesRemaining !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
              <Video className="h-3.5 w-3.5 text-brand-purple" />
              {profile.videosRemaining} vidéo{profile.videosRemaining !== 1 ? "s" : ""} restante
              {profile.videosRemaining !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        <div className="w-full max-w-xl">
          <CommandPalette size="lg" recentGenerations={recentProjects} />
        </div>

        <div className="grid w-full grid-cols-3 gap-2 sm:grid-cols-6">
          {AI_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex flex-col items-center gap-2 rounded-2xl p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <span
                className={cn(
                  "relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl",
                  NAV_ACCENT[tool.href] ?? DEFAULT_NAV_ACCENT
                )}
              >
                <Image src={tool.imageSrc} alt="" fill sizes="48px" className="object-cover" />
              </span>
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{tool.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-6xl flex-col gap-8">
        <Link
          href="/premium"
          className="group relative flex flex-col items-start gap-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-brand-purple/30 dark:border-zinc-800 dark:bg-black sm:flex-row sm:items-center sm:justify-between sm:p-7"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-radial-glow opacity-20 dark:opacity-70" />

          <div className="relative">
            <div className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <Crown className="h-3.5 w-3.5" />
              RYNVA Pro
            </div>
            <p className="text-base font-medium tracking-tight text-zinc-900 dark:text-white">
              Plus de crédits et export haute résolution
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Le plan Free reste disponible pour toujours.
            </p>
          </div>
          <div className="relative flex shrink-0 items-center gap-1 text-sm font-medium text-brand-purple">
            Voir les tarifs
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </div>
        </Link>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-500">Projets récents</h2>
            {recentProjects.length > 0 && (
              <Link href="/projects" className="text-xs font-medium text-brand-purple hover:underline">
                Voir tout
              </Link>
            )}
          </div>
          {recentProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {recentProjects.map((item) => (
                <ProjectCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 py-12 text-center dark:border-zinc-800/60 dark:bg-zinc-900/60">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Aucun projet récent</p>
              <p className="max-w-sm text-xs text-zinc-500">
                Vos projets récents apparaîtront ici dès votre première génération.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
