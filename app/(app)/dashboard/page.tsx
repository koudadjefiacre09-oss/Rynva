import Link from "next/link";
import Image from "next/image";
import { Crown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/gallery/project-card";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listGenerations, type GenerationWithUrl } from "@/lib/generations/list";
import { AI_TOOLS } from "@/lib/ai-tools";

export default async function DashboardPage() {
  let firstName = "";
  let recentProjects: GenerationWithUrl[] = [];

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const fullName = user?.user_metadata?.full_name as string | undefined;
    firstName = fullName?.split(" ")[0] ?? "";

    if (user) {
      recentProjects = await listGenerations(user.id, 4);
    }
  }

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] bg-white px-4 py-10 dark:bg-black lg:-m-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Bon retour{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Choisissez un outil pour démarrer une nouvelle création.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-medium text-zinc-500">Outils IA</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AI_TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-900/60 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80"
              >
                <div className="flex w-full items-start justify-between">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden">
                    <Image
                      src={tool.imageSrc}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-contain"
                    />
                  </div>
                  {tool.badge && <Badge variant="brand">{tool.badge}</Badge>}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{tool.label}</p>
                  <p className="mt-1 text-xs text-zinc-500">{tool.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

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
