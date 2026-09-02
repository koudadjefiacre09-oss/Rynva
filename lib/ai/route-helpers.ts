import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Resolves the signed-in user for an /api/ai/* route. Before Supabase is
 * configured, routes stay ungated (same "don't block on a phase that isn't
 * wired yet" behavior as the rest of the app) and `userId` is null — callers
 * use it to decide whether to persist the result (see lib/generations/save.ts).
 */
export async function resolveUser(): Promise<{
  response: NextResponse | null;
  userId: string | null;
}> {
  if (!isSupabaseConfigured) return { response: null, userId: null };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Connectez-vous pour générer un contenu." },
        { status: 401 }
      ),
      userId: null,
    };
  }

  return { response: null, userId: user.id };
}
