import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Projets</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Toutes vos créations, générées automatiquement à chaque utilisation d&apos;un outil IA.
        </p>
      </div>

      <GalleryGrid items={items} />
    </div>
  );
}
