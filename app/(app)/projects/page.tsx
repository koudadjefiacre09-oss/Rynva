import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { ProjectsSubnav } from "@/components/gallery/projects-subnav";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listGenerations } from "@/lib/generations/list";

export const metadata: Metadata = { title: "Projets" };

export default async function ProjectsPage() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const items = await listGenerations(user.id);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:gap-8">
      <ProjectsSubnav active="projects" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Projets
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Toutes vos créations, générées automatiquement à chaque utilisation d&apos;un outil IA.
            </p>
          </div>
          <Link
            href="/ai/image"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" />
            Nouvelle création
          </Link>
        </div>

        <GalleryGrid items={items} />
      </div>
    </div>
  );
}
