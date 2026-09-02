import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CharactersManager } from "@/components/characters/characters-manager";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listCharacters } from "@/lib/characters/list";

export const metadata: Metadata = { title: "Personnages" };

export default async function CharactersPage() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const characters = await listCharacters(user.id);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Personnages</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Créez des personnages réutilisables — leur visage reste cohérent d&apos;une scène à
          l&apos;autre dans <span className="text-zinc-900">AI Scene</span>.
        </p>
      </div>

      <CharactersManager initialCharacters={characters} />
    </div>
  );
}
