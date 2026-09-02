import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveUser } from "@/lib/ai/route-helpers";
import { createCharacter } from "@/lib/characters/save";

const bodySchema = z.object({
  name: z.string().min(1, "Donnez un nom au personnage.").max(60),
  description: z.string().max(500).optional(),
  imageUrl: z.string().min(1, "Image manquante."),
});

export async function POST(request: Request) {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;
  if (!userId) {
    return NextResponse.json(
      { error: "Connectez-vous pour créer un personnage." },
      { status: 401 }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 }
    );
  }

  const created = await createCharacter({
    userId,
    name: parsed.data.name,
    description: parsed.data.description,
    imageUrl: parsed.data.imageUrl,
  });

  if (!created) {
    return NextResponse.json(
      { error: "Impossible de créer le personnage. Réessayez." },
      { status: 502 }
    );
  }

  return NextResponse.json(created);
}
