import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SceneStudio } from "@/components/ai/scene-studio";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listCharacters } from "@/lib/characters/list";

export const metadata: Metadata = { title: "Scene" };

export default async function AiScenePage() {
  if (!isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const characters = await listCharacters(user.id);

  return <SceneStudio characters={characters} />;
}
