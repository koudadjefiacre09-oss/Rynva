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
  resolution?: "480p" | "720p" | "1080p";
  /** When set, animates this existing image instead of generating from text alone. */
  sourceImageUrl?: string;
}
export interface VideoGenerationOutput {
  url: string;
  prompt: string;
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
