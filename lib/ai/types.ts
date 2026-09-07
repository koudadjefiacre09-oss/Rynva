export type AiCapability = "image" | "video" | "design" | "audio" | "chat";

export interface ImageGenerationInput {
  prompt: string;
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3";
  /** How many variations to generate in one call (1-4, default 4). */
  variations?: number;
}
export interface ImageGenerationOutput {
  /** First image — kept for callers (design, character preview) that only ever want one. */
  url: string;
  /** Every variation generated (length 1-4). `url` above is always `urls[0]`. */
  urls: string[];
  prompt: string;
}

export interface VideoGenerationInput {
  prompt: string;
  durationSeconds?: number;
  resolution?: "720p" | "1080p";
  /** When set, animates this existing image instead of generating from text alone. */
  sourceImageUrl?: string;
}
/**
 * Video generation on Replicate (wan-2.7) can take 5-7+ minutes — far past
 * Vercel's Hobby-plan 60s function timeout, so /api/ai/video can't just
 * `await` a video the way it does for images. Instead the provider starts
 * the job and hands back an opaque `jobId`; the client polls
 * checkVideoGeneration until it's done. See app/api/ai/video/route.ts.
 */
export interface VideoJobHandle {
  jobId: string;
}

export interface VideoJobStatusResult {
  status: "processing" | "succeeded" | "failed";
  url?: string;
  prompt?: string;
  error?: string;
}

export interface DesignGenerationInput {
  prompt: string;
  format?: "post" | "story" | "poster" | "banner";
}
export interface DesignGenerationOutput {
  url: string;
  prompt: string;
}

export interface AudioGenerationInput {
  prompt: string;
  voice?: string;
}
export interface AudioGenerationOutput {
  url: string;
  prompt: string;
}

export interface PhotoBackgroundRemovalInput {
  /** A data: URL (e.g. "data:image/png;base64,...") of the uploaded photo. */
  imageDataUrl: string;
}
export interface PhotoBackgroundRemovalOutput {
  url: string;
}

export interface PhotoEnhanceInput {
  /** A data: URL (e.g. "data:image/png;base64,...") of the uploaded photo. */
  imageDataUrl: string;
  scale?: 2 | 4;
  faceEnhance?: boolean;
}
export interface PhotoEnhanceOutput {
  url: string;
}

export interface SceneCharacterRef {
  /** Alphanumeric tag (3-15 chars, starts with a letter) referenced in the
   * prompt as @tag — see components/ai/scene-studio.tsx for how it's built
   * from the character's name. */
  tag: string;
  imageUrl: string;
}
export interface SceneGenerationInput {
  prompt: string;
  characters: SceneCharacterRef[];
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3";
}
export interface SceneGenerationOutput {
  url: string;
  prompt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
export interface ChatCompletionInput {
  messages: ChatMessage[];
}
export interface ChatCompletionOutput {
  message: ChatMessage;
}
