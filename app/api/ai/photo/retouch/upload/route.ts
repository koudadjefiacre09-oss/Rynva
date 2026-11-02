import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveUser } from "@/lib/ai/route-helpers";
import { createUploadTarget, storageMode, validateFileMeta } from "@/lib/ai/retouch/jobs.server";
import { retouchErrorResponse } from "@/lib/ai/retouch/request.server";
import { RETOUCH_LIMITS } from "@/lib/ai/retouch/limits.server";

export const runtime = "nodejs";

const bodySchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
});

/**
 * Step 1 of AI Photo Retouch: returns where the browser should upload the
 * original (one-time signed URL to the private bucket), or "direct" when
 * storage isn't configured (local development).
 */
export async function POST(request: Request) {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;

  try {
    const body = bodySchema.parse(await request.json().catch(() => null));
    if (!storageMode || !userId) {
      validateFileMeta(body.fileName, body.fileSize);
      return NextResponse.json({ mode: "direct", maxUploadMb: RETOUCH_LIMITS.maxUploadMb });
    }
    const target = await createUploadTarget(userId, body.fileName, body.fileSize);
    return NextResponse.json({ mode: "storage", maxUploadMb: RETOUCH_LIMITS.maxUploadMb, ...target });
  } catch (err) {
    return retouchErrorResponse(err, "api/ai/photo/retouch/upload");
  }
}
