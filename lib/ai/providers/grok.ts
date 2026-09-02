import OpenAI from "openai";
import type { AiProvider } from "@/lib/ai/provider";
import type { ChatCompletionInput, ChatCompletionOutput } from "@/lib/ai/types";

// xAI's API is OpenAI-compatible — same SDK, just a different base URL.
// grok-4.5 is xAI's recommended model for chat/coding/agentic workloads.
const CHAT_MODEL = "grok-4.5";

const SYSTEM_PROMPT =
  "Tu es l'assistant créatif de RYNVA, une plateforme de création par IA (image, vidéo, design, audio, chat). Réponds en français, de façon concise et utile.";

export function createGrokProvider(apiKey: string): AiProvider {
  const client = new OpenAI({ apiKey, baseURL: "https://api.x.ai/v1" });

  return {
    name: "grok",

    async chatComplete(input: ChatCompletionInput): Promise<ChatCompletionOutput> {
      const completion = await client.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...input.messages.map((message) => ({ role: message.role, content: message.content })),
        ],
      });

      const content = completion.choices[0]?.message?.content ?? "";
      return { message: { role: "assistant", content } };
    },
  };
}
