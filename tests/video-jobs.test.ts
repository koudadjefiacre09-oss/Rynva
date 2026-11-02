import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import {
  finalizeVideoJob,
  STALE_FINALIZE_MS,
  type FinalizeEffects,
  type ProviderStatus,
  type VideoJobRow,
  type VideoJobStore,
} from "@/lib/ai/video-jobs";
import { verifyReplicateWebhook } from "@/lib/ai/replicate-webhook";

function memoryStore(): VideoJobStore & { rows: Map<string, VideoJobRow> } {
  const rows = new Map<string, VideoJobRow>();
  return {
    rows,
    async get(id) {
      const r = rows.get(id);
      return r ? { ...r } : null;
    },
    async insert(row) {
      const now = new Date().toISOString();
      rows.set(row.id, { ...row, status: "processing", generation_id: null, error: null, created_at: now, updated_at: now, finished_at: null });
    },
    async claim(id, staleBefore) {
      const r = rows.get(id);
      if (!r) return false;
      const stale = r.status === "finalizing" && new Date(r.updated_at) < staleBefore;
      if (r.status !== "processing" && !stale) return false;
      r.status = "finalizing";
      r.updated_at = new Date().toISOString();
      return true;
    },
    async update(id, patch) {
      Object.assign(rows.get(id)!, patch);
    },
    async listActive(userId) {
      return [...rows.values()].filter((r) => r.user_id === userId && (r.status === "processing" || r.status === "finalizing"));
    },
  };
}

function fakeEffects(provider: ProviderStatus, opts: { saveFails?: boolean; slowSave?: boolean } = {}) {
  const calls = { saves: 0, credits: 0, logs: [] as string[] };
  const effects: FinalizeEffects = {
    checkProvider: async () => provider,
    saveVideo: async () => {
      calls.saves++;
      if (opts.slowSave) await new Promise((r) => setTimeout(r, 20));
      return opts.saveFails ? null : { id: "gen-1", url: "https://signed/video.mp4" };
    },
    signedUrl: async () => "https://signed/again.mp4",
    consumeCredit: async () => {
      calls.credits++;
    },
    logActivity: async (_u, status) => {
      calls.logs.push(status);
    },
  };
  return { effects, calls };
}

async function seeded() {
  const store = memoryStore();
  await store.insert({ id: "job-1", user_id: "alice", prompt: "un chat", metadata: {}, source_generation_id: null });
  return store;
}

describe("finalizeVideoJob", () => {
  it("keeps processing while the provider is still running, without side effects", async () => {
    const store = await seeded();
    const { effects, calls } = fakeEffects({ status: "processing" });
    expect(await finalizeVideoJob(store, effects, "job-1")).toEqual({ status: "processing" });
    expect(calls).toEqual({ saves: 0, credits: 0, logs: [] });
    expect(store.rows.get("job-1")!.status).toBe("processing");
  });

  it("saves the video, consumes the credit and logs exactly once, even with concurrent callers", async () => {
    const store = await seeded();
    const { effects, calls } = fakeEffects({ status: "succeeded", url: "https://replicate/out.mp4" }, { slowSave: true });
    // tab poll + webhook + jobs endpoint, at the same time
    const results = await Promise.all([1, 2, 3].map(() => finalizeVideoJob(store, effects, "job-1")));
    expect(calls.saves).toBe(1);
    expect(calls.credits).toBe(1);
    expect(calls.logs).toEqual(["success"]);
    expect(results.filter((r) => r.status === "succeeded")).toHaveLength(1);
    expect(store.rows.get("job-1")).toMatchObject({ status: "succeeded", generation_id: "gen-1" });

    // Later callers get the stored result, still without new side effects.
    const again = await finalizeVideoJob(store, effects, "job-1");
    expect(again).toMatchObject({ status: "succeeded", generationId: "gen-1", url: "https://signed/again.mp4" });
    expect(calls.saves).toBe(1);
    expect(calls.credits).toBe(1);
  });

  it("refuses another user's job", async () => {
    const store = await seeded();
    const { effects, calls } = fakeEffects({ status: "succeeded", url: "x" });
    expect(await finalizeVideoJob(store, effects, "job-1", { userId: "mallory" })).toEqual({ status: "forbidden" });
    expect(calls.saves).toBe(0);
  });

  it("records a provider failure once, without consuming a credit", async () => {
    const store = await seeded();
    const { effects, calls } = fakeEffects({ status: "failed", error: "NSFW" });
    expect(await finalizeVideoJob(store, effects, "job-1")).toEqual({ status: "failed", error: "NSFW" });
    expect(await finalizeVideoJob(store, effects, "job-1")).toEqual({ status: "failed", error: "NSFW" });
    expect(calls.credits).toBe(0);
    expect(calls.logs).toEqual(["error"]);
  });

  it("releases the claim when saving fails, so a later call retries", async () => {
    const store = await seeded();
    const failing = fakeEffects({ status: "succeeded", url: "x" }, { saveFails: true });
    expect(await finalizeVideoJob(store, failing.effects, "job-1")).toEqual({ status: "processing" });
    expect(store.rows.get("job-1")!.status).toBe("processing");
    expect(failing.calls.credits).toBe(0);

    const ok = fakeEffects({ status: "succeeded", url: "x" });
    expect((await finalizeVideoJob(store, ok.effects, "job-1")).status).toBe("succeeded");
    expect(ok.calls.credits).toBe(1);
  });

  it("takes over a finalize abandoned by a crashed attempt", async () => {
    const store = await seeded();
    const row = store.rows.get("job-1")!;
    row.status = "finalizing";
    row.updated_at = new Date(Date.now() - 60_000).toISOString();
    const { effects, calls } = fakeEffects({ status: "succeeded", url: "x" });
    // recent claim: left alone
    expect(await finalizeVideoJob(store, effects, "job-1")).toEqual({ status: "processing" });
    expect(calls.saves).toBe(0);
    // stale claim: taken over
    const later = new Date(Date.now() + STALE_FINALIZE_MS);
    expect((await finalizeVideoJob(store, effects, "job-1", { now: later })).status).toBe("succeeded");
    expect(calls.saves).toBe(1);
  });

  it("reports unknown jobs", async () => {
    const { effects } = fakeEffects({ status: "processing" });
    expect(await finalizeVideoJob(memoryStore(), effects, "nope")).toEqual({ status: "not-found" });
  });
});

describe("verifyReplicateWebhook", () => {
  const secret = `whsec_${Buffer.from("super-secret-key-material").toString("base64")}`;
  const body = JSON.stringify({ id: "job-1", status: "succeeded" });
  const now = 1_800_000_000;
  const sign = (id: string, ts: number, payload: string) =>
    `v1,${createHmac("sha256", Buffer.from("super-secret-key-material")).update(`${id}.${ts}.${payload}`).digest("base64")}`;

  it("accepts a correctly signed, fresh request", () => {
    const headers = { id: "msg_1", timestamp: String(now), signature: `v1,bogus ${sign("msg_1", now, body)}` };
    expect(verifyReplicateWebhook(headers, body, secret, now)).toBe(true);
  });

  it("rejects tampered bodies, wrong secrets, missing headers and replays", () => {
    const headers = { id: "msg_1", timestamp: String(now), signature: sign("msg_1", now, body) };
    expect(verifyReplicateWebhook(headers, body.replace("succeeded", "failed"), secret, now)).toBe(false);
    expect(verifyReplicateWebhook(headers, body, `whsec_${Buffer.from("other").toString("base64")}`, now)).toBe(false);
    expect(verifyReplicateWebhook({ ...headers, signature: null }, body, secret, now)).toBe(false);
    expect(verifyReplicateWebhook(headers, body, secret, now + 3600)).toBe(false);
  });
});
