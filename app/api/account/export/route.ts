import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { USER_TABLES } from "@/lib/account/data.server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * RGPD right of access / portability: everything RYNVA stores about the
 * signed-in user, as one JSON file. Creations are included as links valid
 * for 7 days (the files themselves stay in private storage).
 */
export async function GET() {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "Service indisponible." }, { status: 503 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });

  // Service role when available (reads every table regardless of RLS
  // nuances), always filtered on this user's id.
  const db = isAdminConfigured ? createAdminClient() : supabase;
  const data: Record<string, unknown> = {};
  for (const { table, column } of USER_TABLES) {
    const { data: rows, error } = await db.from(table).select("*").eq(column, user.id);
    data[table] = error ? { error: "indisponible" } : rows;
  }

  const generations = Array.isArray(data.generations) ? (data.generations as { storage_path: string }[]) : [];
  const links = await Promise.all(
    generations.map(async (g) => {
      const { data: signed } = await db.storage.from("generations").createSignedUrl(g.storage_path, 7 * 24 * 3600);
      return { ...g, download_url_valid_7_days: signed?.signedUrl ?? null };
    })
  );
  data.generations = links;

  const body = {
    exported_at: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      metadata: user.user_metadata,
    },
    ...data,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="rynva-mes-donnees-${date}.json"`,
      "cache-control": "no-store",
    },
  });
}
