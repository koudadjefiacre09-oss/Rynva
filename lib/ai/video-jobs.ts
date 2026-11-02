/**
 * Video job lifecycle, independent of the browser.
 *
 * A video takes 5-7+ minutes on Replicate. The job used to be finished only
 * by the tab that started it (polling until the end): closing it lost a video
 * that was already produced and billed, and its credit was never consumed.
 *
 * Now every started job is recorded, and `finalizeVideoJob` can be called by
 * anyone who notices it may be done (the polling tab, the Replicate webhook,
 * the "jobs in progress" endpoint when the user comes back). It is
 * idempotent: an atomic claim (processing → finalizing) guarantees the video
 * is saved, the credit consumed and the activity logged exactly once.
 *
 * Storage and side effects are injected so the logic is unit-tested without
 * Supabase or Replicate (tests/video-jobs.test.ts).
 */

export type VideoJobStatus = "processing" | "finalizing" | "succeeded" | "failed";

export interface VideoJobRow {
  id: string;
  user_id: string;
  prompt: string | null;
  metadata: Record<string, unknown>;
  source_generation_id: string | null;
  status: VideoJobStatus;
  generation_id: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
}

export interface VideoJobStore {
  get(id: string): Promise<VideoJobRow | null>;
  insert(row: Pick<VideoJobRow, "id" | "user_id" | "prompt" | "metadata" | "source_generation_id">): Promise<void>;
  /**
   * Atomically moves the job to `finalizing` if it is `processing`, or if it
   * is a `finalizing` left behind by a crashed attempt (updated before
   * `staleBefore`). Returns true only for the single caller that won.
   */
  claim(id: string, staleBefore: Date): Promise<boolean>;
  update(id: string, patch: Partial<VideoJobRow>): Promise<void>;
  listActive(userId: string, limit: number): Promise<VideoJobRow[]>;
}

export interface ProviderStatus {
  status: "processing" | "succeeded" | "failed";
  url?: string;
  prompt?: string;
  error?: string;
}

export interface FinalizeEffects {
  checkProvider(jobId: string): Promise<ProviderStatus>;
  /** Persists the finished video; returns null if storage failed. */
  saveVideo(job: VideoJobRow, providerUrl: string): Promise<{ id: string; url: string } | null>;
  /** Signed URL for an already-saved generation. */
  signedUrl(generationId: string): Promise<string | null>;
  consumeCredit(userId: string): Promise<void>;
  logActivity(userId: string, status: "success" | "error", message?: string): Promise<void>;
}

export type FinalizeResult =
  | { status: "processing" }
  | { status: "succeeded"; url: string; prompt: string | null; generationId: string | null }
  | { status: "failed"; error: string }
  | { status: "not-found" }
  | { status: "forbidden" };

/** A "finalizing" claim older than this is considered abandoned (crash, timeout). */
export const STALE_FINALIZE_MS = 3 * 60 * 1000;

export async function finalizeVideoJob(
  store: VideoJobStore,
  effects: FinalizeEffects,
  jobId: string,
  options: { userId?: string; now?: Date } = {}
): Promise<FinalizeResult> {
  const now = options.now ?? new Date();
  const job = await store.get(jobId);
  if (!job) return { status: "not-found" };
  if (options.userId && job.user_id !== options.userId) return { status: "forbidden" };

  if (job.status === "succeeded") {
    const url = job.generation_id ? await effects.signedUrl(job.generation_id) : null;
    return { status: "succeeded", url: url ?? "", prompt: job.prompt, generationId: job.generation_id };
  }
  if (job.status === "failed") return { status: "failed", error: job.error ?? "La génération a échoué." };

  const staleBefore = new Date(now.getTime() - STALE_FINALIZE_MS);
  if (job.status === "finalizing" && new Date(job.updated_at) > staleBefore) {
    return { status: "processing" }; // someone else is saving it right now
  }

  const provider = await effects.checkProvider(jobId);
  if (provider.status === "processing") return { status: "processing" };

  if (!(await store.claim(jobId, staleBefore))) return { status: "processing" };

  if (provider.status === "failed") {
    const error = provider.error ?? "La génération a échoué.";
    await store.update(jobId, { status: "failed", error, finished_at: now.toISOString(), updated_at: now.toISOString() });
    await effects.logActivity(job.user_id, "error", error);
    return { status: "failed", error };
  }

  try {
    const saved = await effects.saveVideo(job, provider.url!);
    if (!saved) throw new Error("save failed");
    await store.update(jobId, {
      status: "succeeded",
      generation_id: saved.id,
      prompt: job.prompt ?? provider.prompt ?? null,
      finished_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
    await effects.consumeCredit(job.user_id);
    await effects.logActivity(job.user_id, "success");
    return { status: "succeeded", url: saved.url, prompt: job.prompt ?? provider.prompt ?? null, generationId: saved.id };
  } catch {
    // Release the claim so the next poll / webhook / visit retries the save.
    await store.update(jobId, { status: "processing", updated_at: now.toISOString() });
    return { status: "processing" };
  }
}
