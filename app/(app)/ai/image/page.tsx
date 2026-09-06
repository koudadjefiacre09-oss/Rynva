import type { Metadata } from "next";
import { ImageStudio } from "@/components/ai/image-studio";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listPromptPresets } from "@/lib/prompts/list";
import type { PromptPreset } from "@/lib/prompts/types";

export const metadata: Metadata = { title: "Image" };
export const dynamic = "force-dynamic";

export default async function AiImagePage() {
  let presets: PromptPreset[] = [];

  // Guests can still generate (same "try before you sign up" pattern as
  // every other /ai/* tool) — the prompt library just doesn't apply to
  // them, there's no account to attach saved prompts to.
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      presets = await listPromptPresets(user.id);
    }
  }

  return <ImageStudio initialPresets={presets} />;
}
