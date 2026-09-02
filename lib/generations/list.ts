import { createClient } from "@/lib/supabase/server";
import type { GenerationRow } from "@/lib/generations/types";

export interface GenerationWithUrl extends GenerationRow {
  url: string;
}

/**
 * Fetches a user's generations and attaches a short-lived signed URL to each
 * (the storage bucket is private — see supabase/migrations/0001_generations.sql).
 */
export async function listGenerations(userId: string, limit?: number): Promise<GenerationWithUrl[]> {
  const supabase = await createClient();

  let query = supabase
    .from("generations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data: rows, error } = await query;
  return await withSignedUrls(rows, error);
}

/** Same as listGenerations, filtered to the user's starred creations. */
export async function listFavorites(userId: string, limit?: number): Promise<GenerationWithUrl[]> {
  const supabase = await createClient();

  let query = supabase
    .from("generations")
    .select("*")
    .eq("user_id", userId)
    .eq("is_favorite", true)
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data: rows, error } = await query;
  return await withSignedUrls(rows, error);
}

async function withSignedUrls(
  rows: GenerationRow[] | null,
  error: unknown
): Promise<GenerationWithUrl[]> {
  if (error || !rows || rows.length === 0) return [];

  const supabase = await createClient();
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
    .filter((row): row is GenerationWithUrl => row !== null);
}
