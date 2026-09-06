import { createClient } from "@/lib/supabase/server";
import type { PromptPreset } from "@/lib/prompts/types";

export async function listPromptPresets(userId: string): Promise<PromptPreset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prompt_presets")
    .select("id, label, prompt, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    label: row.label as string,
    prompt: row.prompt as string,
    createdAt: row.created_at as string,
  }));
}
