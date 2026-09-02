import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveUser } from "@/lib/ai/route-helpers";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  name: z.string().min(1, "Le nom ne peut pas être vide.").max(60).optional(),
  description: z.string().max(500).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;
  if (!userId) {
    return NextResponse.json({ error: "Connectez-vous." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  // RLS scopes this to the caller's own rows — no need for an extra
  // ownership check, an update targeting someone else's character just
  // matches zero rows.
  const { error } = await supabase
    .from("characters")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "Impossible de modifier le personnage." }, { status: 502 });
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

  const { data: character } = await supabase
    .from("characters")
    .select("storage_path")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (!character) {
    return NextResponse.json({ error: "Personnage introuvable." }, { status: 404 });
  }

  await supabase.storage.from("generations").remove([character.storage_path]);

  const { error } = await supabase
    .from("characters")
    .delete()
    .eq("id", params.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: "Impossible de supprimer le personnage." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
