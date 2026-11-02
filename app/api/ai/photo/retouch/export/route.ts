import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/ai/route-helpers";
import { consumeCredit } from "@/lib/credits/gate";
import { logActivity } from "@/lib/activity/log";
import { renderExport } from "@/lib/ai/retouch/pipeline.server";
import { saveExport } from "@/lib/ai/retouch/jobs.server";
import { readRetouchRequest, retouchErrorResponse } from "@/lib/ai/retouch/request.server";

export const runtime = "nodejs";
export const maxDuration = 60;

function downloadName(fileName: string, ext: string) {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "_").slice(0, 80) || "photo";
  return `${base}-retouche.${ext}`;
}

/**
 * Step 3: full-resolution export (JPEG / PNG / WebP), rendered once from the
 * original with the validated settings. One image credit is consumed on the
 * first export of a photo; re-exports in another format are free.
 */
export async function POST(request: Request) {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;

  try {
    const req = await readRetouchRequest(request, userId, true);
    const result = await renderExport(req.buffer, req.ext, req.settings, req.options!);
    const name = downloadName(req.fileName, result.extension);

    if (userId && req.jobId) {
      const saved = await saveExport(userId, req.jobId, result.file, result.mime, name);
      if (saved.firstExport) {
        await consumeCredit(userId, "image");
        await logActivity(userId, "photo-retouch", "success");
      }
      return NextResponse.json({
        url: saved.url,
        fileName: name,
        width: result.width,
        height: result.height,
        bytes: result.file.length,
        notes: result.analysis.notes,
      });
    }

    // Direct mode (no storage): stream the file back.
    return new NextResponse(new Uint8Array(result.file), {
      headers: {
        "content-type": result.mime,
        "content-disposition": `attachment; filename="${name}"`,
        "x-retouch-width": String(result.width),
        "x-retouch-height": String(result.height),
        "x-retouch-notes": encodeURIComponent(JSON.stringify(result.analysis.notes)),
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    if (userId) {
      await logActivity(userId, "photo-retouch", "error", { message: err instanceof Error ? err.message : String(err) });
    }
    return retouchErrorResponse(err, "api/ai/photo/retouch/export");
  }
}
