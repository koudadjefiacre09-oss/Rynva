import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai/providers";
import { AI_CONFIG_ERROR } from "@/lib/ai/config";
import { resolveUser } from "@/lib/ai/route-helpers";
import { saveGeneration } from "@/lib/generations/save";
import { logActivity } from "@/lib/activity/log";
import { checkCreditQuota, consumeCredit } from "@/lib/credits/gate";

const bodySchema = z.object({
  prompt: z.string().min(3, "Décrivez ce que vous voulez générer.").max(4000),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3"]).optional(),
  // Character creation only ever needs one portrait — asking for 4 there
  // would burn 4x the Replicate cost on 3 images nobody looks at, so it
  // explicitly passes 1. The main Image tool omits this and gets the default.
  variations: z.coerce.number().int().min(1).max(4).optional(),
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

  if (userId) {
    const quota = await checkCreditQuota(userId, "image");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 403 });
    }
  }

  try {
    const result = await provider.generateImage(parsed.data);
    let urls = result.urls;
    let generationIds: (string | undefined)[] = urls.map(() => undefined);

    if (userId) {
      // One request generates up to 4 variations but is still a single
      // credit/activity event (see lib/credits/gate.ts) — each variation
      // still gets its own row in `generations` so all of them show up in
      // Projets/Historique individually, not just whichever one was picked.
      const saved = await Promise.all(
        urls.map((sourceUrl) =>
          saveGeneration({
            userId,
            type: "image",
            sourceUrl,
            prompt: result.prompt,
            metadata: { aspectRatio: parsed.data.aspectRatio ?? "1:1" },
          })
        )
      );
      urls = saved.map((s, i) => s?.url ?? urls[i]);
      generationIds = saved.map((s) => s?.id);
    }

    if (userId) {
      await logActivity(userId, "image", "success");
      await consumeCredit(userId, "image");
    }
    return NextResponse.json({
      url: urls[0],
      urls,
      generationId: generationIds[0],
      generationIds,
      prompt: result.prompt,
    });
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
