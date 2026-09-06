"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getConversationMessages } from "@/lib/chat/list";
import type { ChatMessageRow } from "@/lib/chat/types";

export type ChatActionResult = { error?: string };

/** Loads one conversation's messages — called when the sidebar switches to it. */
export async function loadConversation(conversationId: string): Promise<ChatMessageRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return getConversationMessages(user.id, conversationId);
}

/**
 * Deletes a conversation (and its messages, via the FK's on delete cascade —
 * see migration 0017). RLS already scopes the delete to the caller's own
 * row, but the explicit .eq is kept for clarity/defense-in-depth.
 */
export async function deleteConversation(conversationId: string): Promise<ChatActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connectez-vous pour continuer." };

  const { error } = await supabase
    .from("chat_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/ai/chat");
  return {};
}
