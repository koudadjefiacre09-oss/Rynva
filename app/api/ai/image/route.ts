import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai/providers";
import { AI_CONFIG_ERROR } from "@/lib/ai/config";
import { resolveUser } from "@/lib/ai/route-helpers";
import { saveGeneration } from "@/lib/generations/save";
import { logActivity } from "@/lib/activity/log";

const bodySchema = z.object({
  prompt: z.string().min(3, "Décrivez ce que vous voulez générer.").max(4000),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3"]).optional(),
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
  if (!provider?.generateImage) {
    return NextResponse.json({ error: AI_CONFIG_ERROR }, { status: 501 });
  }

  try {
    const result = await provider.generateImage(parsed.data);
    let generationId: string | undefined;

    if (userId) {
      const saved = await saveGeneration({
        userId,
        type: "image",
        sourceUrl: result.url,
        prompt: result.prompt,
        metadata: { aspectRatio: parsed.data.aspectRatio ?? "1:1" },
      });
      if (saved) {
        result.url = saved.url;
        generationId = saved.id;
      }
    }

    if (userId) await logActivity(userId, "image", "success");
    return NextResponse.json({ ...result, generationId });
  } catch (err) {
    console.error("[api/ai/image]", err);
    if (userId) {
      await logActivity(userId, "image", "error", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
    return NextResponse.json({ error: "La génération a échoué. Réessayez." }, { status: 502 });
  }
}
