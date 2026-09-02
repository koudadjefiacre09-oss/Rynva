import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai/providers";
import { AI_CONFIG_ERROR } from "@/lib/ai/config";
import { resolveUser } from "@/lib/ai/route-helpers";
import { createClient } from "@/lib/supabase/server";
import { saveGeneration } from "@/lib/generations/save";
import { logActivity } from "@/lib/activity/log";

const bodySchema = z.object({
  prompt: z.string().min(3, "Décrivez la scène que vous voulez créer.").max(4000),
  characterIds: z
    .array(z.string().uuid())
    .min(2, "Sélectionnez au moins 2 personnages.")
    .max(3, "3 personnages maximum par scène."),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3"]).optional(),
});

/** reference_tags must be alphanumeric, 3-15 chars, and start with a letter. */
function sanitizeTag(name: string, index: number, taken: Set<string>): string {
  let tag = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 15);
  if (!/^[a-zA-Z]/.test(tag)) tag = `perso${tag}`;
  if (tag.length < 3) tag = tag.padEnd(3, "x");
  tag = tag.slice(0, 15);

  let candidate = tag.toLowerCase();
  while (taken.has(candidate)) {
    candidate = `${tag}${index}`.slice(0, 15).toLowerCase();
    index++;
  }
  taken.add(candidate);
  return candidate;
}

export async function POST(request: Request) {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;
  if (!userId) {
    return NextResponse.json({ error: "Connectez-vous pour générer une scène." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 }
    );
  }

  const provider = getAiProvider();
  if (!provider?.generateScene) {
    return NextResponse.json({ error: AI_CONFIG_ERROR }, { status: 501 });
  }

  const supabase = await createClient();
  const { data: rows, error: fetchError } = await supabase
    .from("characters")
    .select("id, name, storage_path")
    .eq("user_id", userId)
    .in("id", parsed.data.characterIds);

  if (fetchError || !rows || rows.length !== parsed.data.characterIds.length) {
    return NextResponse.json({ error: "Personnages introuvables." }, { status: 404 });
  }

  const paths = rows.map((r) => r.storage_path);
  const { data: signedUrls, error: signError } = await supabase.storage
    .from("generations")
    .createSignedUrls(paths, 60 * 10);
  if (signError || !signedUrls) {
    return NextResponse.json({ error: "Impossible de charger les personnages." }, { status: 502 });
  }
  const urlByPath = new Map(signedUrls.map((s) => [s.path, s.signedUrl]));

  const takenTags = new Set<string>();
  const characters = rows.map((row, i) => ({
    tag: sanitizeTag(row.name, i, takenTags),
    imageUrl: urlByPath.get(row.storage_path) ?? "",
  }));

  if (characters.some((c) => !c.imageUrl)) {
    return NextResponse.json({ error: "Impossible de charger un personnage." }, { status: 502 });
  }

  // Prefix the prompt with @tag reminders so the model reliably ties each
  // reference image to its mention in the user's free-form scene prompt.
  const tagHint = characters.map((c) => `@${c.tag}`).join(" and ");
  const finalPrompt = `${tagHint}: ${parsed.data.prompt}`;

  try {
    const result = await provider.generateScene({
      prompt: finalPrompt,
      characters,
      aspectRatio: parsed.data.aspectRatio,
    });
    let generationId: string | undefined;

    const saved = await saveGeneration({
      userId,
      type: "scene",
      sourceUrl: result.url,
      prompt: parsed.data.prompt,
      metadata: { characterIds: parsed.data.characterIds },
    });
    if (saved) {
      result.url = saved.url;
      generationId = saved.id;
    }

    await logActivity(userId, "scene", "success");
    return NextResponse.json({ ...result, generationId });
  } catch (err) {
    console.error("[api/ai/scene]", err);
    await logActivity(userId, "scene", "error", {
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "La génération a échoué. Réessayez." }, { status: 502 });
  }
}
