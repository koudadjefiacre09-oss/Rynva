import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai/providers";
import { AI_CONFIG_ERROR } from "@/lib/ai/config";
import { resolveUser } from "@/lib/ai/route-helpers";
import { saveGeneration } from "@/lib/generations/save";
import { logActivity } from "@/lib/activity/log";

const bodySchema = z.object({
  prompt: z.string().min(3, "Décrivez le design que vous voulez créer.").max(4000),
  format: z.enum(["post", "story", "poster", "banner"]).optional(),
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
  if (!provider?.generateDesign) {
    return NextResponse.json({ error: AI_CONFIG_ERROR }, { status: 501 });
  }

  try {
    const result = await provider.generateDesign(parsed.data);
    let generationId: string | undefined;

    if (userId) {
      const saved = await saveGeneration({
        userId,
        type: "design",
        sourceUrl: result.url,
        prompt: result.prompt,
        metadata: { format: parsed.data.format ?? "post" },
      });
      if (saved) {
        result.url = saved.url;
        generationId = saved.id;
      }
    }

    if (userId) await logActivity(userId, "design", "success");
    return NextResponse.json({ ...result, generationId });
  } catch (err) {
    console.error("[api/ai/design]", err);
    if (userId) {
      await logActivity(userId, "design", "error", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
    return NextResponse.json({ error: "La génération a échoué. Réessayez." }, { status: 502 });
  }
}
