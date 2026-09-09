import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai/providers";
import { AI_CONFIG_ERROR } from "@/lib/ai/config";
import { resolveUser } from "@/lib/ai/route-helpers";

const bodySchema = z.object({
  prompt: z.string().min(3, "Décrivez d'abord ce que vous voulez générer.").max(4000),
});

// Instructions live inside the user message rather than a "system" role
// because ChatCompletionInput only carries "user"/"assistant" turns — every
// provider (see lib/ai/providers/*) already injects its own fixed RYNVA
// system prompt, so there's no per-request override today. Cheapest way to
// get a distinct behavior out of the same chatComplete() used by /api/ai/chat.
function buildRequest(prompt: string): string {
  return (
    "Tu améliores des prompts pour un générateur d'images texte-vers-image (Flux). " +
    "Réécris la description suivante en un seul prompt plus riche et évocateur : précise le " +
    "sujet, le style artistique, l'ambiance, la lumière et la composition. Réponds uniquement " +
    "avec le prompt amélioré en français, sans guillemets ni commentaire, en moins de 400 " +
    `caractères.\n\nDescription originale : ${prompt}`
  );
}

/**
 * "Améliorer le prompt" on the Image tool — reuses the same chat fallback
 * chain as /api/ai/chat (Anthropic > Grok > OpenAI) instead of a dedicated
 * provider method, since this is just a chat completion with a specific
 * instruction, not a new AI capability. Not gated by checkCreditQuota (that
 * only covers image/video generation, see lib/credits/gate.ts) and not
 * persisted anywhere — it only returns a better prompt for the client to
 * drop into the composer.
 */
export async function POST(request: Request) {
  const { response: authError } = await resolveUser();
  if (authError) return authError;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 }
    );
  }

  const provider = getAiProvider();
  if (!provider?.chatComplete) {
    return NextResponse.json({ error: AI_CONFIG_ERROR }, { status: 501 });
  }

  try {
    const result = await provider.chatComplete({
      messages: [{ role: "user", content: buildRequest(parsed.data.prompt) }],
    });
    const enhanced = result.message.content.trim().replace(/^"|"$/g, "");
    return NextResponse.json({ prompt: enhanced || parsed.data.prompt });
  } catch (err) {
    console.error("[api/ai/image/enhance-prompt]", err);
    return NextResponse.json({ error: "L'amélioration a échoué. Réessayez." }, { status: 502 });
  }
}
