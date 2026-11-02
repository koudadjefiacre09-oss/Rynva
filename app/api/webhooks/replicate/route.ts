import { NextResponse } from "next/server";
import { verifyReplicateWebhook } from "@/lib/ai/replicate-webhook";
import { finalizeJob, videoJobsEnabled } from "@/lib/ai/video-jobs.server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Replicate calls this when a video prediction completes, so the video is
 * saved to the gallery (and the user notified) even if every tab is closed.
 * Signed with REPLICATE_WEBHOOK_SECRET; unsigned or replayed calls are refused.
 */
export async function POST(request: Request) {
  const secret = process.env.REPLICATE_WEBHOOK_SECRET;
  if (!secret || !videoJobsEnabled) return NextResponse.json({ error: "Webhook non configuré." }, { status: 404 });

  const body = await request.text();
  const valid = verifyReplicateWebhook(
    {
      id: request.headers.get("webhook-id"),
      timestamp: request.headers.get("webhook-timestamp"),
      signature: request.headers.get("webhook-signature"),
    },
    body,
    secret
  );
  if (!valid) return NextResponse.json({ error: "Signature invalide." }, { status: 401 });

  let id: unknown;
  try {
    id = (JSON.parse(body) as { id?: unknown }).id;
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  if (typeof id !== "string") return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  try {
    const result = await finalizeJob(id);
    // 200 even for unknown jobs (e.g. non-video predictions): nothing to retry.
    return NextResponse.json({ ok: true, status: result.status });
  } catch (err) {
    console.error("[webhooks/replicate]", err);
    // Non-2xx makes Replicate retry later.
    return NextResponse.json({ error: "Échec temporaire." }, { status: 500 });
  }
}
