import type { Metadata } from "next";
import { ChatStudio } from "@/components/ai/chat-studio";

export const metadata: Metadata = { title: "AI Chat" };

export default function AiChatPage() {
  return <ChatStudio />;
}
