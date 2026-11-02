import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { getAiProvider } from "@/lib/ai/providers";
import { saveGeneration } from "@/lib/generations/save";
import { logActivity } from "@/lib/activity/log";
import { consumeCredit } from "@/lib/credits/gate";
import {
  finalizeVideoJob,
  type FinalizeEffects,
  type FinalizeResult,
  type VideoJobRow,
  type VideoJobStore,
} from "@/lib/ai/video-jobs";

/** Supabase (service-role) implementation of the video job store. */
function supabaseStore(): VideoJobStore {
  const admin = createAdminClient();
  const table = () => admin.from("video_jobs");
  return {
    async get(id) {
      const { data } = await table().select("*").eq("id", id).maybeSingle();
      return (data as VideoJobRow | null) ?? null;
    },
    async insert(row) {
      const { error } = await table().insert(row);
      if (error) throw new Error(error.message);
    },
    async claim(id, staleBefore) {
      const { data, error } = await table()
        .update({ status: "finalizing", updated_at: new Date().toISOString() })
        .eq("id", id)
        .or(`status.eq.processing,and(status.eq.finalizing,updated_at.lt.${staleBefore.toISOString()})`)
        .select("id");
      if (error) throw new Error(error.message);
      return (data ?? []).length === 1;
    },
    async update(id, patch) {
      const { error } = await table().update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    async listActive(userId, limit) {
      const { data } = await table()
        .select("*")
        .eq("user_id", userId)
        .in("status", ["processing", "finalizing"])
        .order("created_at", { ascending: false })
        .limit(limit);
      return (data as VideoJobRow[] | null) ?? [];
    },
  };
}

function effects(): FinalizeEffects {
  const admin = createAdminClient();
  return {
    async checkProvider(jobId) {
      const provider = getAiProvider();
      if (!provider?.checkVideoGeneration) throw new Error("Aucun fournisseur vidéo configuré.");
      return provider.checkVideoGeneration(jobId);
    },
    async saveVideo(job, providerUrl) {
      return saveGeneration({
        userId: job.user_id,
        type: "video",
        sourceUrl: providerUrl,
        prompt: job.prompt ?? undefined,
        metadata: job.metadata,
        sourceGenerationId: job.source_generation_id ?? undefined,
        client: admin,
      });
    },
    async signedUrl(generationId) {
      const { data: row } = await admin.from("generations").select("storage_path").eq("id", generationId).maybeSingle();
      if (!row?.storage_path) return null;
      const { data } = await admin.storage.from("generations").createSignedUrl(row.storage_path, 60 * 60, { download: true });
      return data?.signedUrl ?? null;
    },
    consumeCredit: (userId) => consumeCredit(userId, "video"),
    logActivity: (userId, status, message) => logActivity(userId, "video", status, message ? { message } : {}),
  };
}

/** Job tracking needs the service-role key (webhooks have no user session). */
export const videoJobsEnabled = isAdminConfigured;

export async function recordVideoJob(input: {
  id: string;
  userId: string;
  prompt: string;
  metadata: Record<string, unknown>;
  sourceGenerationId?: string;
}): Promise<boolean> {
  if (!videoJobsEnabled) return false;
  try {
    await supabaseStore().insert({
      id: input.id,
      user_id: input.userId,
      prompt: input.prompt,
      metadata: input.metadata,
      source_generation_id: input.sourceGenerationId ?? null,
    });
    return true;
  } catch (err) {
    // Missing migration 0019 or transient error: fall back to the legacy
    // polling-only flow rather than failing a job that already started.
    console.error("[video-jobs] record failed:", err);
    return false;
  }
}

export async function finalizeJob(jobId: string, userId?: string): Promise<FinalizeResult> {
  return finalizeVideoJob(supabaseStore(), effects(), jobId, { userId });
}

/** Active jobs of a user, each re-checked (and finalized if done). */
export async function refreshActiveJobs(userId: string) {
  const store = supabaseStore();
  const active = await store.listActive(userId, 5);
  const results = await Promise.all(
    active.map(async (job) => {
      try {
        const result = await finalizeVideoJob(store, effects(), job.id, { userId });
        return { id: job.id, prompt: job.prompt, createdAt: job.created_at, metadata: job.metadata, result };
      } catch (err) {
        console.error("[video-jobs] refresh failed:", err);
        return { id: job.id, prompt: job.prompt, createdAt: job.created_at, metadata: job.metadata, result: { status: "processing" as const } };
      }
    })
  );
  return results;
}

/**
 * Public URL Replicate should call when a video finishes, or null when the
 * webhook isn't configured (then the job is finished by polling / revisits).
 */
export function replicateWebhookUrl(): string | null {
  if (!process.env.REPLICATE_WEBHOOK_SECRET) return null;
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null);
  return base ? `${base.replace(/\/$/, "")}/api/webhooks/replicate` : null;
}
