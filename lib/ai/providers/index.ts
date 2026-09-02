import {
  isReplicateConfigured,
  isAnthropicConfigured,
  isGrokConfigured,
  isOpenAiConfigured,
} from "@/lib/ai/config";
import type { AiProvider } from "@/lib/ai/provider";
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
 * the first configured of Anthropic (Claude) > xAI (Grok) > OpenAI.
 */
export function getAiProvider(): AiProvider | null {
  if (!isReplicateConfigured && !isAnthropicConfigured && !isGrokConfigured && !isOpenAiConfigured) {
    return null;
  }

  const replicate = isReplicateConfigured
    ? createReplicateProvider(process.env.REPLICATE_API_TOKEN!)
    : null;

  const chatProvider = isAnthropicConfigured
    ? createAnthropicProvider(process.env.ANTHROPIC_API_KEY!)
    : isGrokConfigured
      ? createGrokProvider(process.env.XAI_API_KEY!)
      : isOpenAiConfigured
        ? createOpenAiProvider(process.env.OPENAI_API_KEY!)
        : null;

  return {
    name: "rynva",
    generateImage: replicate?.generateImage,
    generateVideo: replicate?.generateVideo,
    generateDesign: replicate?.generateDesign,
    generateAudio: replicate?.generateAudio,
    removeBackground: replicate?.removeBackground,
    enhancePhoto: replicate?.enhancePhoto,
    generateScene: replicate?.generateScene,
    chatComplete: chatProvider?.chatComplete,
  };
}
