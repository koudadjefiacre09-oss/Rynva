import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProjectsSubnav } from "@/components/gallery/projects-subnav";
import { TrashGrid } from "@/components/gallery/trash-grid";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listTrash } from "@/lib/generations/list";

export const metadata: Metadata = { title: "Corbeille" };

export default async function TrashPage() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const items = await listTrash(user.id);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:gap-8">
      <ProjectsSubnav active="trash" />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Corbeille
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Les projets supprimés restent ici jusqu&rsquo;à ce que vous les restauriez ou les
            supprimiez définitivement.
          </p>
        </div>

        <TrashGrid initialItems={items} />
      </div>
    </div>
  );
}
