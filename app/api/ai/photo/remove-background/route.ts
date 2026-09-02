import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai/providers";
import { AI_CONFIG_ERROR } from "@/lib/ai/config";
import { resolveUser } from "@/lib/ai/route-helpers";
import { saveGeneration } from "@/lib/generations/save";
import { logActivity } from "@/lib/activity/log";

// A data: URL of a reasonably sized photo, base64-encoded, comfortably stays
// under ~15MB of JSON body — enough for a 10MB source image.
const bodySchema = z.object({
  imageDataUrl: z
    .string()
    .startsWith("data:image/", "Le fichier doit être une image.")
    .max(15_000_000, "L'image est trop volumineuse (10 Mo max)."),
});

export async function POST(request: Request) {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 }
    );
  }

  const provider = getAiProvider();
  if (!provider?.removeBackground) {
    return NextResponse.json({ error: AI_CONFIG_ERROR }, { status: 501 });
  }

  try {
    const result = await provider.removeBackground(parsed.data);
    let generationId: string | undefined;

    if (userId) {
      const saved = await saveGeneration({
        userId,
        type: "photo-bg-remove",
        sourceUrl: result.url,
      });
      if (saved) {
        result.url = saved.url;
        generationId = saved.id;
      }
    }

    if (userId) await logActivity(userId, "photo-bg-remove", "success");
    return NextResponse.json({ ...result, generationId });
  } catch (err) {
    console.error("[api/ai/photo/remove-background]", err);
    if (userId) {
      await logActivity(userId, "photo-bg-remove", "error", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
    return NextResponse.json({ error: "Le traitement a échoué. Réessayez." }, { status: 502 });
  }
}
