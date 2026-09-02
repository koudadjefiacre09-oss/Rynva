import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai/providers";
import { AI_CONFIG_ERROR } from "@/lib/ai/config";
import { resolveUser } from "@/lib/ai/route-helpers";
import { saveGeneration } from "@/lib/generations/save";
import { logActivity } from "@/lib/activity/log";

const bodySchema = z.object({
  prompt: z.string().min(3, "Décrivez l'audio que vous voulez générer.").max(4000),
  voice: z.string().max(60).optional(),
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
  if (!provider?.generateAudio) {
    return NextResponse.json({ error: AI_CONFIG_ERROR }, { status: 501 });
  }

  try {
    const result = await provider.generateAudio(parsed.data);

    if (userId) {
      const saved = await saveGeneration({
        userId,
        type: "audio",
        sourceUrl: result.url,
        prompt: result.prompt,
        metadata: { voice: parsed.data.voice ?? "neutral" },
      });
      if (saved) result.url = saved.url;
    }

    if (userId) await logActivity(userId, "audio", "success");
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/ai/audio]", err);
    if (userId) {
      await logActivity(userId, "audio", "error", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
    return NextResponse.json({ error: "La génération a échoué. Réessayez." }, { status: 502 });
  }
}
