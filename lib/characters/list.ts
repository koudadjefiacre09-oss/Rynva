import { createClient } from "@/lib/supabase/server";
import type { CharacterRow } from "@/lib/characters/types";

export interface CharacterWithUrl extends CharacterRow {
  url: string;
}

export async function listCharacters(userId: string): Promise<CharacterWithUrl[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !rows || rows.length === 0) return [];

  const paths = rows.map((row) => row.storage_path);
  const { data: signedUrls, error: signError } = await supabase.storage
    .from("generations")
    .createSignedUrls(paths, 60 * 60, { download: true });

  if (signError || !signedUrls) return [];

  const urlByPath = new Map(signedUrls.map((s) => [s.path, s.signedUrl]));

  return rows
    .map((row) => {
      const url = urlByPath.get(row.storage_path);
      return url ? { ...row, url } : null;
    })
    .filter((row): row is CharacterWithUrl => row !== null);
}
