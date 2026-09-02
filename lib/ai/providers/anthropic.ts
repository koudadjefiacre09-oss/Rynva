import Anthropic from "@anthropic-ai/sdk";
import type { AiProvider } from "@/lib/ai/provider";
import type { ChatCompletionInput, ChatCompletionOutput } from "@/lib/ai/types";

// Claude Sonnet 5 — Anthropic's latest, most capable general-purpose model;
// a strong default for a creative assistant. Swap for "claude-haiku-4-5-20251001"
// for a faster/cheaper tier on high-volume chat.
const CHAT_MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT =
  "Tu es l'assistant créatif de RYNVA, une plateforme de création par IA (image, vidéo, design, audio, chat). Réponds en français, de façon concise et utile.";

export function createAnthropicProvider(apiKey: string): AiProvider {
  const client = new Anthropic({ apiKey });

  return {
    name: "anthropic",

    async chatComplete(input: ChatCompletionInput): Promise<ChatCompletionOutput> {
      const message = await client.messages.create({
        model: CHAT_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
      });

      const content = message.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      return { message: { role: "assistant", content } };
    },
  };
}
