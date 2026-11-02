import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/ai/route-helpers";
import { deleteJob, storageMode } from "@/lib/ai/retouch/jobs.server";
import { retouchErrorResponse } from "@/lib/ai/retouch/request.server";

export const runtime = "nodejs";

/** Deletes a retouch job's files (original + exports) from private storage. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;
  if (!storageMode || !userId) return NextResponse.json({ ok: true });

  try {
    const { jobId } = await params;
    await deleteJob(userId, jobId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return retouchErrorResponse(err, "api/ai/photo/retouch/[jobId]");
  }
}
