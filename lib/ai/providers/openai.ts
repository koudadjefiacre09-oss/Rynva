import OpenAI from "openai";
import type { AiProvider } from "@/lib/ai/provider";
import type { ChatCompletionInput, ChatCompletionOutput } from "@/lib/ai/types";

// GPT-5.6 Luna: OpenAI's fast, low-cost tier (July 2026 lineup) — a good fit
// for a high-volume creative chat assistant. Swap for "gpt-5.6-terra" or
// "gpt-5.6-sol" if you need stronger reasoning at a higher cost.
const CHAT_MODEL = "gpt-5.6-luna";

const SYSTEM_PROMPT =
  "Tu es l'assistant créatif de RYNVA, une plateforme de création par IA (image, vidéo, design, audio, chat). Réponds en français, de façon concise et utile.";

export function createOpenAiProvider(apiKey: string): AiProvider {
  const client = new OpenAI({ apiKey });

  return {
    name: "openai",

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
