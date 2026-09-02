import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai/providers";
import { AI_CONFIG_ERROR } from "@/lib/ai/config";
import { resolveUser } from "@/lib/ai/route-helpers";
import { saveGeneration } from "@/lib/generations/save";
import { logActivity } from "@/lib/activity/log";

const bodySchema = z.object({
  prompt: z.string().min(3, "Décrivez la vidéo que vous voulez générer.").max(4000),
  durationSeconds: z.coerce.number().int().min(2).max(15).optional(),
  resolution: z.enum(["480p", "720p", "1080p"]).optional(),
  // When set, animates this existing image instead of generating from text alone.
  sourceImageUrl: z.string().url().optional(),
  sourceGenerationId: z.string().uuid().optional(),
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
  if (!provider?.generateVideo) {
    return NextResponse.json({ error: AI_CONFIG_ERROR }, { status: 501 });
  }

  try {
    const result = await provider.generateVideo({
      prompt: parsed.data.prompt,
      durationSeconds: parsed.data.durationSeconds,
      resolution: parsed.data.resolution,
      sourceImageUrl: parsed.data.sourceImageUrl,
    });

    if (userId) {
      const saved = await saveGeneration({
        userId,
        type: "video",
        sourceUrl: result.url,
        prompt: result.prompt,
        metadata: {
          animatedFromImage: Boolean(parsed.data.sourceImageUrl),
          resolution: parsed.data.resolution ?? "720p",
        },
        sourceGenerationId: parsed.data.sourceGenerationId,
      });
      if (saved) result.url = saved.url;
    }

    if (userId) await logActivity(userId, "video", "success");
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/ai/video]", err);
    if (userId) {
      await logActivity(userId, "video", "error", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
    return NextResponse.json({ error: "La génération a échoué. Réessayez." }, { status: 502 });
  }
}
