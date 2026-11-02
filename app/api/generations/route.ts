import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/ai/route-helpers";
import { listGenerations } from "@/lib/generations/list";
import type { GenerationType } from "@/lib/generations/types";

const IMAGE_TYPES = new Set<GenerationType>(["image", "design", "photo-bg-remove", "photo-enhance", "scene"]);

/**
 * The signed-in user's recent still images (signed URLs), used by pickers
 * such as "Animer une image → choisir dans mes projets".
 */
export async function GET() {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;
  if (!userId) return NextResponse.json({ items: [] });

  const rows = await listGenerations(userId, 60);
  const items = rows
    .filter((row) => IMAGE_TYPES.has(row.type))
    .slice(0, 30)
    .map((row) => ({ id: row.id, url: row.url, prompt: row.prompt, type: row.type, createdAt: row.created_at }));
  return NextResponse.json({ items });
}
