import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/ai/route-helpers";
import { checkCreditQuota } from "@/lib/credits/gate";
import { renderPreview, type RetouchStage } from "@/lib/ai/retouch/pipeline.server";
import { readRetouchRequest, retouchErrorResponse } from "@/lib/ai/retouch/request.server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Step 2: analyses and retouches a downscaled preview.
 *
 * Streams NDJSON so the UI shows real progress:
 *   {"type":"stage","stage":"decode"|"detect"|"retouch"|"encode"}
 *   {"type":"result","original":"data:...","retouched":"data:...","analysis":{...}}
 *   {"type":"error","error":"...","status":422,"code"?:"no-face"}
 * Nothing is persisted here.
 */
export async function POST(request: Request) {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;

  let req: Awaited<ReturnType<typeof readRetouchRequest>>;
  try {
    if (userId) {
      const quota = await checkCreditQuota(userId, "image");
      if (!quota.allowed) return NextResponse.json({ error: quota.reason, code: "quota" }, { status: 402 });
    }
    req = await readRetouchRequest(request, userId, false);
  } catch (err) {
    return retouchErrorResponse(err, "api/ai/photo/retouch/process");
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: object) => controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      try {
        const preview = await renderPreview(req.buffer, req.ext, req.settings, (stage: RetouchStage) =>
          send({ type: "stage", stage })
        );
        send({
          type: "result",
          original: `data:image/jpeg;base64,${preview.original.toString("base64")}`,
          retouched: `data:image/jpeg;base64,${preview.retouched.toString("base64")}`,
          analysis: preview.analysis,
        });
      } catch (err) {
        const res = retouchErrorResponse(err, "api/ai/photo/retouch/process");
        const body = await res.json();
        send({ type: "error", status: res.status, ...body });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}
