import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ACCEPTED_EXTENSIONS, fileExtension } from "@/lib/ai/retouch/settings";
import { RETOUCH_LIMITS } from "@/lib/ai/retouch/limits.server";

/**
 * Import & storage stage.
 *
 * In production the original never transits through a serverless request
 * body (Vercel caps those at 4.5 MB): the browser uploads it straight to the
 * private `generations` bucket with a one-time signed URL, under
 * `<userId>/retouch/<jobId>/`. Routes then read it server-side. RLS on the
 * bucket already restricts every path to its owner's folder.
 *
 * Originals are never overwritten. Job folders are deleted when the user
 * leaves/reset the tool, and any job older than JOB_TTL is purged
 * opportunistically on the next upload.
 *
 * Without Supabase (local development) the file is posted directly to the
 * route instead ("direct" mode) and nothing is stored.
 */

const BUCKET = "generations";
const JOB_TTL_MS = 24 * 60 * 60 * 1000;
const JOB_ID = /^(\d{13})-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export class JobError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export const storageMode = isSupabaseConfigured;

export function validateFileMeta(fileName: string, size: number): string {
  const ext = fileExtension(fileName);
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new JobError("Extension non prise en charge.", 415);
  }
  if (!Number.isFinite(size) || size <= 0) throw new JobError("Fichier vide.");
  if (size > RETOUCH_LIMITS.maxUploadMb * 1024 * 1024) {
    throw new JobError(`Fichier trop volumineux (${RETOUCH_LIMITS.maxUploadMb} Mo maximum).`, 413);
  }
  return ext;
}

function assertJobId(jobId: string) {
  if (!JOB_ID.test(jobId)) throw new JobError("Identifiant de retouche invalide.");
}

function jobFolder(userId: string, jobId: string) {
  assertJobId(jobId);
  return `${userId}/retouch/${jobId}`;
}

function sourcePath(userId: string, jobId: string, ext: string) {
  return `${jobFolder(userId, jobId)}/source.${ext}`;
}

/** Removes the user's retouch jobs older than JOB_TTL (best-effort). */
async function purgeExpiredJobs(userId: string) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.storage.from(BUCKET).list(`${userId}/retouch`, { limit: 100 });
    const expired = (data ?? [])
      .map((entry) => entry.name)
      .filter((name) => {
        const m = JOB_ID.exec(name);
        return m && Date.now() - Number(m[1]) > JOB_TTL_MS;
      });
    for (const jobId of expired) await deleteJob(userId, jobId);
  } catch (err) {
    console.error("[retouch] purge failed:", err);
  }
}

export async function createUploadTarget(userId: string, fileName: string, size: number) {
  const ext = validateFileMeta(fileName, size);
  const jobId = `${Date.now()}-${crypto.randomUUID()}`;
  const path = sourcePath(userId, jobId, ext);
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[retouch] signed upload URL failed:", error?.message);
    throw new JobError("Impossible de préparer l'import. Réessayez.", 502);
  }
  void purgeExpiredJobs(userId);
  return { jobId, path: data.path, token: data.token };
}

export async function loadSource(userId: string, jobId: string, fileName: string): Promise<{ buffer: Buffer; ext: string }> {
  const ext = fileExtension(fileName);
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) throw new JobError("Extension non prise en charge.", 415);
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(sourcePath(userId, jobId, ext));
  if (error || !data) throw new JobError("Photo originale introuvable : importez-la à nouveau.", 404);
  if (data.size > RETOUCH_LIMITS.maxUploadMb * 1024 * 1024) {
    throw new JobError(`Fichier trop volumineux (${RETOUCH_LIMITS.maxUploadMb} Mo maximum).`, 413);
  }
  return { buffer: Buffer.from(await data.arrayBuffer()), ext };
}

/** Stores an export next to its source and returns a 1-hour download URL. */
export async function saveExport(
  userId: string,
  jobId: string,
  file: Buffer,
  mime: string,
  downloadName: string
): Promise<{ url: string; firstExport: boolean }> {
  const supabase = await createClient();
  const folder = jobFolder(userId, jobId);
  const { data: existing } = await supabase.storage.from(BUCKET).list(folder, { limit: 100 });
  const firstExport = !(existing ?? []).some((entry) => entry.name.startsWith("export-"));
  const ext = downloadName.split(".").pop();
  const path = `${folder}/export-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: mime, upsert: false });
  if (error) {
    console.error("[retouch] export upload failed:", error.message);
    throw new JobError("Impossible d'enregistrer l'export. Réessayez.", 502);
  }
  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60, { download: downloadName });
  if (signError || !signed) throw new JobError("Impossible de préparer le téléchargement.", 502);
  return { url: signed.signedUrl, firstExport };
}

export async function deleteJob(userId: string, jobId: string) {
  const supabase = await createClient();
  const folder = jobFolder(userId, jobId);
  const { data } = await supabase.storage.from(BUCKET).list(folder, { limit: 100 });
  const paths = (data ?? []).map((entry) => `${folder}/${entry.name}`);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}
