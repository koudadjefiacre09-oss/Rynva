import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveUser } from "@/lib/ai/route-helpers";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z.object({ isFavorite: z.boolean() });

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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generations")
    .update({ is_favorite: parsed.data.isFavorite })
    .eq("id", params.id)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;
  if (!userId) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const supabase = await createClient();

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
