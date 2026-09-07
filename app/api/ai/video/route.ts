import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai/providers";
import { AI_CONFIG_ERROR } from "@/lib/ai/config";
import { resolveUser } from "@/lib/ai/route-helpers";
import { saveGeneration } from "@/lib/generations/save";
import { logActivity } from "@/lib/activity/log";
import { checkCreditQuota, consumeCredit } from "@/lib/credits/gate";

const bodySchema = z.object({
  prompt: z.string().min(3, "Décrivez la vidéo que vous voulez générer.").max(4000),
  durationSeconds: z.coerce.number().int().min(2).max(15).optional(),
  resolution: z.enum(["720p", "1080p"]).optional(),
  // When set, animates this existing image instead of generating from text alone.
  sourceImageUrl: z.string().url().optional(),
  sourceGenerationId: z.string().uuid().optional(),
});

/**
 * Starts a video job and returns immediately with a jobId — it does NOT wait
 * for the video to finish (wan-2.7 routinely takes 5-7+ minutes, see
 * lib/ai/types.ts's VideoJobHandle doc). The client polls GET below until
 * the job resolves.
 */
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
  if (!provider?.startVideoGeneration) {
    return NextResponse.json({ error: AI_CONFIG_ERROR }, { status: 501 });
  }

  // Checked before starting the job, same as before — a blocked request
  // never costs a provider call.
  if (userId) {
    const quota = await checkCreditQuota(userId, "video");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.reason }, { status: 403 });
    }
  }

  try {
    const job = await provider.startVideoGeneration({
      prompt: parsed.data.prompt,
      durationSeconds: parsed.data.durationSeconds,
      resolution: parsed.data.resolution,
      sourceImageUrl: parsed.data.sourceImageUrl,
    });
    return NextResponse.json({ jobId: job.jobId });
  } catch (err) {
    console.error("[api/ai/video POST]", err);
    if (userId) {
      await logActivity(userId, "video", "error", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
    return NextResponse.json({ error: "La génération a échoué. Réessayez." }, { status: 502 });
  }
}

/**
 * Polled by the client every few seconds with the jobId from POST above.
 * Credit consumption, activity logging and gallery persistence all happen
 * here, on the single request that first observes "succeeded" — not in
 * POST, since at that point the video doesn't exist yet.
 */
export async function GET(request: Request) {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;

  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  if (!jobId) {
    return NextResponse.json({ error: "jobId manquant." }, { status: 400 });
  }
  const sourceGenerationId = url.searchParams.get("sourceGenerationId") ?? undefined;
  const resolutionParam = url.searchParams.get("resolution");
  const resolution = resolutionParam === "1080p" ? resolutionParam : "720p";
  const animatedFromImage = url.searchParams.get("animated") === "true";

  const provider = getAiProvider();
  if (!provider?.checkVideoGeneration) {
    return NextResponse.json({ error: AI_CONFIG_ERROR }, { status: 501 });
  }

  try {
    const job = await provider.checkVideoGeneration(jobId);

    if (job.status === "processing") {
      return NextResponse.json({ status: "processing" });
    }

    if (job.status === "failed") {
      if (userId) {
        await logActivity(userId, "video", "error", { message: job.error ?? "Erreur inconnue." });
      }
      return NextResponse.json({
        status: "failed",
        error: job.error ?? "La génération a échoué. Réessayez.",
      });
    }

    let resultUrl = job.url!;
    let generationId: string | undefined;

    if (userId) {
      const saved = await saveGeneration({
        userId,
        type: "video",
        sourceUrl: job.url!,
        prompt: job.prompt,
        metadata: { animatedFromImage, resolution },
        sourceGenerationId,
      });
      if (saved) {
        resultUrl = saved.url;
        generationId = saved.id;
      }
      await logActivity(userId, "video", "success");
      await consumeCredit(userId, "video");
    }

    return NextResponse.json({ status: "succeeded", url: resultUrl, prompt: job.prompt, generationId });
  } catch (err) {
    // A network hiccup polling Replicate isn't the same as the job itself
    // failing — the job may well still be running. Surface as an HTTP
    // error so the client retries instead of giving up on the video.
    console.error("[api/ai/video GET]", err);
    return NextResponse.json({ error: "Impossible de vérifier l'état de la génération." }, { status: 502 });
  }
}
