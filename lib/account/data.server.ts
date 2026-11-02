import type { SupabaseClient } from "@supabase/supabase-js";

/** Every table holding a user's rows, with the column that links them. */
export const USER_TABLES: { table: string; column: string }[] = [
  { table: "profiles", column: "id" },
  { table: "generations", column: "user_id" },
  { table: "characters", column: "user_id" },
  { table: "activity_logs", column: "user_id" },
  { table: "notifications", column: "user_id" },
  { table: "chat_conversations", column: "user_id" },
  { table: "chat_messages", column: "user_id" },
  { table: "prompt_presets", column: "user_id" },
  { table: "video_jobs", column: "user_id" },
];

/** Recursively lists every object path under `prefix` in a bucket. */
export async function listAllObjects(admin: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const queue = [prefix];
  while (queue.length) {
    const folder = queue.shift()!;
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 100, offset });
      if (error || !data?.length) break;
      for (const entry of data) {
        const path = `${folder}/${entry.name}`;
        // Folders come back without an id.
        if (entry.id) out.push(path);
        else queue.push(path);
      }
      if (data.length < 100) break;
    }
  }
  return out;
}

/** Deletes every stored file of the user (creations, retouch jobs, uploads, avatar). */
export async function deleteUserFiles(admin: SupabaseClient, userId: string) {
  for (const bucket of ["generations", "avatars"]) {
    const paths = await listAllObjects(admin, bucket, userId);
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await admin.storage.from(bucket).remove(paths.slice(i, i + 100));
      if (error) throw new Error(`${bucket}: ${error.message}`);
    }
  }
}
