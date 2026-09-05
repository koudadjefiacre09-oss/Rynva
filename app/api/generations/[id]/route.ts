import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveUser } from "@/lib/ai/route-helpers";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z.union([
  z.object({ isFavorite: z.boolean() }),
  z.object({ restore: z.literal(true) }),
]);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;
  if (!userId) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const update =
    "isFavorite" in parsed.data
      ? { is_favorite: parsed.data.isFavorite }
      : { deleted_at: null };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generations")
    .update(update)
    .eq("id", params.id)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * By default, moves the generation to the trash (sets deleted_at) rather
 * than deleting anything — that's what lets /trash offer a restore action.
 * Pass ?permanent=1 (only exposed from within the trash UI) to actually
 * remove the storage file and the row, which cannot be undone.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;
  if (!userId) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const permanent = new URL(request.url).searchParams.get("permanent") === "1";
  const supabase = await createClient();

  if (!permanent) {
    const { data, error } = await supabase
      .from("generations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", params.id)
      .eq("user_id", userId)
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Introuvable." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  const { data: generation } = await supabase
    .from("generations")
    .select("storage_path")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (!generation) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }

  await supabase.storage.from("generations").remove([generation.storage_path]);

  const { error } = await supabase
    .from("generations")
    .delete()
    .eq("id", params.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "Impossible de supprimer." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
