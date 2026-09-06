import { NextResponse } from "next/server";
import { z } from "zod";
import { getAiProvider } from "@/lib/ai/providers";
import { AI_CONFIG_ERROR } from "@/lib/ai/config";
import { resolveUser } from "@/lib/ai/route-helpers";
import { logActivity } from "@/lib/activity/log";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1)
    .max(50),
  // Omitted on the first message of a new conversation — the route creates
  // one and reports its id back so the client can keep sending it.
  conversationId: z.string().uuid().optional(),
});

// Sidebar label — first ~60 chars of the opening message, same idea as an
// email subject line. Not re-derived from later turns.
function titleFrom(firstMessage: string): string {
  const trimmed = firstMessage.trim().replace(/\s+/g, " ");
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
}

export async function POST(request: Request) {
  const { response: authError, userId } = await resolveUser();
  if (authError) return authError;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const provider = getAiProvider();
  if (!provider?.chatComplete) {
    return NextResponse.json({ error: AI_CONFIG_ERROR }, { status: 501 });
  }

  const { messages } = parsed.data;
  const latestUserMessage = messages[messages.length - 1];
  let conversationId = parsed.data.conversationId;

  try {
    const result = await provider.chatComplete({ messages });

    // Persistence is best-effort: a save failure should never break the
    // reply the user is actually waiting for, so every step here is
    // wrapped and swallowed on error rather than failing the request.
    if (userId) {
      try {
        const supabase = await createClient();

        if (!conversationId) {
          const { data: conversation, error: createError } = await supabase
            .from("chat_conversations")
            .insert({ user_id: userId, title: titleFrom(latestUserMessage.content) })
            .select("id")
            .single();
          if (createError) throw createError;
          conversationId = conversation.id as string;
        }

        await supabase.from("chat_messages").insert([
          { conversation_id: conversationId, user_id: userId, role: "user", content: latestUserMessage.content },
          { conversation_id: conversationId, user_id: userId, role: "assistant", content: result.message.content },
        ]);
        await supabase
          .from("chat_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      } catch (persistError) {
        console.error("[api/ai/chat] failed to persist conversation:", persistError);
      }

      await logActivity(userId, "chat", "success");
    }

    return NextResponse.json({ ...result, conversationId });
  } catch (err) {
    console.error("[api/ai/chat]", err);
    if (userId) {
      await logActivity(userId, "chat", "error", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
    return NextResponse.json({ error: "La génération a échoué. Réessayez." }, { status: 502 });
  }
}
