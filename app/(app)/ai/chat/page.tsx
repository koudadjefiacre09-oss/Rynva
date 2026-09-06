import type { Metadata } from "next";
import { ChatStudio } from "@/components/ai/chat-studio";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { listConversations } from "@/lib/chat/list";
import type { ChatConversation } from "@/lib/chat/types";

export const metadata: Metadata = { title: "Chat" };
// Conversation list must reflect the latest exchange the moment you come
// back to /ai/chat (new one just created, another renamed by a new first
// message) — same reasoning as the profile page's dynamic export.
export const dynamic = "force-dynamic";

export default async function AiChatPage() {
  let conversations: ChatConversation[] = [];

  // Guests can still use the chat itself (same "try before you sign up"
  // pattern as every other /ai/* tool) — history just doesn't apply to
  // them, there's no account to attach it to.
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      conversations = await listConversations(user.id);
    }
  }

  return <ChatStudio initialConversations={conversations} />;
}
