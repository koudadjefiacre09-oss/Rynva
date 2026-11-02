import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteUserFiles, listAllObjects } from "@/lib/account/data.server";

/** Minimal fake of supabase.storage with nested folders and paging. */
function fakeAdmin(files: Record<string, string[]>) {
  const removed: Record<string, string[]> = {};
  const storage = {
    from(bucket: string) {
      const all = files[bucket] ?? [];
      return {
        async list(folder: string, { limit, offset }: { limit: number; offset: number }) {
          const children = new Map<string, boolean>(); // name -> isFile
          for (const path of all) {
            if (!path.startsWith(`${folder}/`)) continue;
            const rest = path.slice(folder.length + 1);
            const [head, ...tail] = rest.split("/");
            children.set(head, tail.length === 0);
          }
          const entries = [...children].map(([name, isFile]) => ({ name, id: isFile ? `id-${name}` : null }));
          return { data: entries.slice(offset, offset + limit), error: null };
        },
        async remove(paths: string[]) {
          (removed[bucket] ??= []).push(...paths);
          return { error: null };
        },
      };
    },
  };
  return { admin: { storage } as unknown as SupabaseClient, removed };
}

describe("account data helpers", () => {
  const user = "user-1";
  const many = Array.from({ length: 230 }, (_, i) => `${user}/img-${i}.png`);
  const files = {
    generations: [...many, `${user}/retouch/job-1/source.jpg`, `${user}/retouch/job-1/export-1.jpg`, `${user}/uploads/a.jpg`, `other/secret.png`],
    avatars: [`${user}/avatar.png`, `other/avatar.png`],
  };

  it("lists every nested file of the user, across pages, and nobody else's", async () => {
    const { admin } = fakeAdmin(files);
    const paths = await listAllObjects(admin, "generations", user);
    expect(paths).toHaveLength(233);
    expect(paths).toContain(`${user}/retouch/job-1/export-1.jpg`);
    expect(paths.some((p) => p.startsWith("other/"))).toBe(false);
  });

  it("deletes all the user's files in both buckets", async () => {
    const { admin, removed } = fakeAdmin(files);
    await deleteUserFiles(admin, user);
    expect(removed.generations).toHaveLength(233);
    expect(removed.avatars).toEqual([`${user}/avatar.png`]);
  });
});
