import { NextResponse } from "next/server";
import { z } from "zod";
import { DecodeError } from "@/lib/ai/retouch/decode.server";
import { NoFaceError } from "@/lib/ai/retouch/pipeline.server";
import { JobError, loadSource, storageMode, validateFileMeta } from "@/lib/ai/retouch/jobs.server";
import { exportOptionsSchema, fileExtension, retouchSettingsSchema, type ExportOptions, type RetouchSettings } from "@/lib/ai/retouch/settings";

export interface RetouchRequest {
  buffer: Buffer;
  ext: string;
  fileName: string;
  jobId: string | null;
  settings: RetouchSettings;
  options: ExportOptions | null;
}

const jsonBody = z.object({
  jobId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  settings: retouchSettingsSchema,
  options: exportOptionsSchema.optional(),
});

/**
 * Reads a retouch request. Two shapes:
 *  - JSON { jobId, fileName, settings, options? } → the source is read from
 *    private storage (production path, no big request bodies);
 *  - multipart (file, settings, options?) → local development without Supabase.
 */
export async function readRetouchRequest(request: Request, userId: string | null, withOptions: boolean): Promise<RetouchRequest> {
  const type = request.headers.get("content-type") ?? "";

  if (type.startsWith("multipart/form-data")) {
    if (storageMode) throw new JobError("Import direct désactivé : utilisez l'import sécurisé.", 400);
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) throw new JobError("Aucun fichier reçu.");
    const ext = validateFileMeta(file.name, file.size);
    const settings = retouchSettingsSchema.parse(JSON.parse(String(form?.get("settings") ?? "null")));
    const options = withOptions ? exportOptionsSchema.parse(JSON.parse(String(form?.get("options") ?? "null"))) : null;
    return { buffer: Buffer.from(await file.arrayBuffer()), ext, fileName: file.name, jobId: null, settings, options };
  }

  const body = jsonBody.parse(await request.json().catch(() => null));
  if (!storageMode || !userId) throw new JobError("Stockage indisponible : importez le fichier directement.", 400);
  if (withOptions && !body.options) throw new JobError("Options d'export manquantes.");
  const { buffer, ext } = await loadSource(userId, body.jobId, body.fileName);
  return {
    buffer,
    ext: ext || fileExtension(body.fileName),
    fileName: body.fileName,
    jobId: body.jobId,
    settings: body.settings,
    options: body.options ?? null,
  };
}

/** Maps engine errors to user-facing JSON responses. */
export function retouchErrorResponse(err: unknown, tag: string): NextResponse {
  if (err instanceof DecodeError || err instanceof JobError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof NoFaceError) {
    return NextResponse.json({ error: err.message, code: "no-face" }, { status: 422 });
  }
  if (err instanceof z.ZodError || err instanceof SyntaxError) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  console.error(`[${tag}]`, err);
  return NextResponse.json({ error: "Le traitement a échoué. Votre photo originale est intacte : réessayez." }, { status: 500 });
}
