import {
  isReplicateConfigured,
  isAnthropicConfigured,
  isGrokConfigured,
  isOpenAiConfigured,
} from "@/lib/ai/config";
import type { AiProvider } from "@/lib/ai/provider";
import type { ChatCompletionInput, ChatCompletionOutput } from "@/lib/ai/types";
import { createReplicateProvider } from "@/lib/ai/providers/replicate";
import { createAnthropicProvider } from "@/lib/ai/providers/anthropic";
import { createGrokProvider } from "@/lib/ai/providers/grok";
import { createOpenAiProvider } from "@/lib/ai/providers/openai";

/**
 * Single resolution point for AI capabilities. Every /api/ai/* route calls
 * this instead of importing a provider SDK directly, so swapping or adding
 * providers later never touches route or UI code.
 *
 * RYNVA composes: Replicate for image/video/design/audio, and — for chat —
 * Anthropic (Claude) > xAI (Grok) > OpenAI, tried in that order AT REQUEST
 * TIME, not just picked once by which key is present. A configured key only
 * proves the key exists, not that the account behind it can actually serve
 * a request right now (found in practice: a correctly configured Grok key
 * whose account had zero credits, returning 403 on every call — the old
 * "first configured wins" logic had no way to notice and just kept failing
 * instead of falling through to the working OpenAI key sitting right there).
 */
export function getAiProvider(): AiProvider | null {
  if (!isReplicateConfigured && !isAnthropicConfigured && !isGrokConfigured && !isOpenAiConfigured) {
    return null;
  }

  const replicate = isReplicateConfigured
    ? createReplicateProvider(process.env.REPLICATE_API_TOKEN!)
    : null;

  const chatChain: { name: string; provider: AiProvider }[] = [];
  if (isAnthropicConfigured) {
    chatChain.push({ name: "anthropic", provider: createAnthropicProvider(process.env.ANTHROPIC_API_KEY!) });
  }
  if (isGrokConfigured) {
    chatChain.push({ name: "grok", provider: createGrokProvider(process.env.XAI_API_KEY!) });
  }
  if (isOpenAiConfigured) {
    chatChain.push({ name: "openai", provider: createOpenAiProvider(process.env.OPENAI_API_KEY!) });
  }

  async function chatComplete(input: ChatCompletionInput): Promise<ChatCompletionOutput> {
    let lastError: unknown;
    for (const { name, provider } of chatChain) {
      try {
        return await provider.chatComplete!(input);
      } catch (err) {
        console.error(`[getAiProvider] chat provider "${name}" failed, trying next:`, err);
        lastError = err;
      }
    }
    throw lastError ?? new Error("Aucun fournisseur de chat configuré.");
  }

  return {
    name: "rynva",
    generateImage: replicate?.generateImage,
    generateVideo: replicate?.generateVideo,
    generateDesign: replicate?.generateDesign,
    generateAudio: replicate?.generateAudio,
    removeBackground: replicate?.removeBackground,
    enhancePhoto: replicate?.enhancePhoto,
    generateScene: replicate?.generateScene,
    chatComplete: chatChain.length > 0 ? chatComplete : undefined,
  };
}
