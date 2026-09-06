"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PromptPreset } from "@/lib/prompts/types";

export type PromptActionResult = { error?: string; preset?: PromptPreset };

export async function savePromptPreset(label: string, prompt: string): Promise<PromptActionResult> {
  const trimmedLabel = label.trim();
  const trimmedPrompt = prompt.trim();
  if (!trimmedLabel) return { error: "Donnez un nom à ce prompt." };
  if (!trimmedPrompt) return { error: "Le prompt est vide." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous pour sauvegarder un prompt." };

  const { data, error } = await supabase
    .from("prompt_presets")
    .insert({ user_id: user.id, label: trimmedLabel.slice(0, 60), prompt: trimmedPrompt })
    .select("id, label, prompt, created_at")
    .single();
  if (error || !data) return { error: error?.message ?? "Échec de l'enregistrement." };

  revalidatePath("/ai/image");
  return {
    preset: {
      id: data.id as string,
      label: data.label as string,
      prompt: data.prompt as string,
      createdAt: data.created_at as string,
    },
  };
}

export async function deletePromptPreset(id: string): Promise<PromptActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous pour continuer." };

  const { error } = await supabase.from("prompt_presets").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/ai/image");
  return {};
}
