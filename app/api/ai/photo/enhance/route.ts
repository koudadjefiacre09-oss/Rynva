import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai/providers";
import { AI_CONFIG_ERROR } from "@/lib/ai/config";
import { resolveUser } from "@/lib/ai/route-helpers";
import { saveGeneration } from "@/lib/generations/save";
import { logActivity } from "@/lib/activity/log";

const bodySchema = z.object({
  imageDataUrl: z
    .string()
    .startsWith("data:image/", "Le fichier doit être une image.")
    .max(15_000_000, "L'image est trop volumineuse (10 Mo max)."),
  scale: z.coerce.number().refine((v) => v === 2 || v === 4, "Facteur invalide.").optional(),
  faceEnhance: z.boolean().optional(),
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
  if (!provider?.enhancePhoto) {
    return NextResponse.json({ error: AI_CONFIG_ERROR }, { status: 501 });
  }

  try {
    const result = await provider.enhancePhoto(
      parsed.data as { imageDataUrl: string; scale?: 2 | 4; faceEnhance?: boolean }
    );
    let generationId: string | undefined;

    if (userId) {
      const saved = await saveGeneration({
        userId,
        type: "photo-enhance",
        sourceUrl: result.url,
        metadata: { scale: parsed.data.scale ?? 4, faceEnhance: parsed.data.faceEnhance ?? false },
      });
      if (saved) {
        result.url = saved.url;
        generationId = saved.id;
      }
    }

    if (userId) await logActivity(userId, "photo-enhance", "success");
    return NextResponse.json({ ...result, generationId });
  } catch (err) {
    console.error("[api/ai/photo/enhance]", err);
    if (userId) {
      await logActivity(userId, "photo-enhance", "error", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
    return NextResponse.json({ error: "Le traitement a échoué. Réessayez." }, { status: 502 });
  }
}
