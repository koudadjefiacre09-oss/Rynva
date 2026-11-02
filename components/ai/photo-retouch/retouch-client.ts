"use client";

import type { ExportOptions, RetouchSettings } from "@/lib/ai/retouch/settings";

/** Browser side of AI Photo Retouch: upload, streamed processing, export. */

export type Job =
  | { mode: "storage"; jobId: string; file: File }
  | { mode: "direct"; file: File };

export interface RetouchAnalysis {
  format: string;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
  facesDetected: number;
  facesRetouched: number;
  blemishesCorrected: number;
  notes: string[];
}

export interface PreviewPayload {
  original: string;
  retouched: string;
  analysis: RetouchAnalysis;
}

export type Stage = "upload" | "decode" | "detect" | "retouch" | "encode";

export class RetouchRequestError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) {
    super(message);
  }
}

async function jsonError(res: Response): Promise<RetouchRequestError> {
  const body = await res.json().catch(() => ({}));
  return new RetouchRequestError(body.error ?? "Une erreur est survenue.", res.status, body.code);
}

/** PUT to a Supabase signed upload URL with progress (fetch has no upload progress). */
function uploadWithProgress(url: string, file: File, onProgress: (ratio: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    xhr.setRequestHeader("apikey", anon);
    xhr.setRequestHeader("authorization", `Bearer ${anon}`);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new RetouchRequestError("L'import a échoué. Vérifiez votre connexion et réessayez.", xhr.status));
    xhr.onerror = () => reject(new RetouchRequestError("Connexion interrompue pendant l'import.", 0));
    const form = new FormData();
    form.append("cacheControl", "3600");
    form.append("", file);
    xhr.send(form);
  });
}

/** Step 1: get an upload target and push the original to private storage. */
export async function uploadOriginal(file: File, onProgress: (ratio: number) => void): Promise<Job> {
  const res = await fetch("/api/ai/photo/retouch/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileName: file.name, fileSize: file.size }),
  });
  if (!res.ok) throw await jsonError(res);
  const target = await res.json();
  if (target.mode === "direct") {
    onProgress(1);
    return { mode: "direct", file };
  }
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
  const encodedPath = String(target.path).split("/").map(encodeURIComponent).join("/");
  const url = `${base}/storage/v1/object/upload/sign/generations/${encodedPath}?token=${encodeURIComponent(target.token)}`;
  await uploadWithProgress(url, file, onProgress);
  return { mode: "storage", jobId: target.jobId, file };
}

function requestInit(job: Job, settings: RetouchSettings, options?: ExportOptions): RequestInit {
  if (job.mode === "storage") {
    return {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId: job.jobId, fileName: job.file.name, settings, options }),
    };
  }
  const form = new FormData();
  form.append("file", job.file);
  form.append("settings", JSON.stringify(settings));
  if (options) form.append("options", JSON.stringify(options));
  return { method: "POST", body: form };
}

/** Step 2: streamed analysis + retouch of the preview. */
export async function processPreview(
  job: Job,
  settings: RetouchSettings,
  onStage: (stage: Stage) => void,
  signal?: AbortSignal
): Promise<PreviewPayload> {
  const res = await fetch("/api/ai/photo/retouch/process", { ...requestInit(job, settings), signal });
  if (!res.ok) throw await jsonError(res);
  if (!res.body) throw new RetouchRequestError("Réponse vide du serveur.", 500);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffered = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (value) buffered += decoder.decode(value, { stream: true });
    let newline: number;
    while ((newline = buffered.indexOf("\n")) >= 0) {
      const line = buffered.slice(0, newline).trim();
      buffered = buffered.slice(newline + 1);
      if (!line) continue;
      const msg = JSON.parse(line);
      if (msg.type === "stage") onStage(msg.stage);
      else if (msg.type === "result") return msg as PreviewPayload;
      else if (msg.type === "error") throw new RetouchRequestError(msg.error, msg.status ?? 500, msg.code);
    }
    if (done) break;
  }
  throw new RetouchRequestError("Le traitement a été interrompu. Réessayez.", 500);
}

export interface ExportedFile {
  url: string;
  fileName: string;
  width: number;
  height: number;
  bytes: number;
  notes: string[];
  /** Object URLs (direct mode) must be revoked by the caller. */
  revoke?: () => void;
}

/** Step 3: full-resolution export. */
export async function exportImage(job: Job, settings: RetouchSettings, options: ExportOptions): Promise<ExportedFile> {
  const res = await fetch("/api/ai/photo/retouch/export", requestInit(job, settings, options));
  if (!res.ok) throw await jsonError(res);
  if (job.mode === "storage") return res.json();

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const disposition = res.headers.get("content-disposition") ?? "";
  const fileName = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "photo-retouche";
  let notes: string[] = [];
  try {
    notes = JSON.parse(decodeURIComponent(res.headers.get("x-retouch-notes") ?? "%5B%5D"));
  } catch {
    /* ignore */
  }
  return {
    url,
    fileName,
    width: Number(res.headers.get("x-retouch-width")),
    height: Number(res.headers.get("x-retouch-height")),
    bytes: blob.size,
    notes,
    revoke: () => URL.revokeObjectURL(url),
  };
}

/** Deletes the job's stored files (best-effort, fire-and-forget). */
export function discardJob(job: Job | null) {
  if (job?.mode !== "storage") return;
  void fetch(`/api/ai/photo/retouch/${job.jobId}`, { method: "DELETE", keepalive: true }).catch(() => undefined);
}

export function triggerDownload(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
