import type {
  ImageGenerationInput,
  ImageGenerationOutput,
  VideoGenerationInput,
  VideoJobHandle,
  VideoJobStatusResult,
  DesignGenerationInput,
  DesignGenerationOutput,
  AudioGenerationInput,
  AudioGenerationOutput,
  PhotoBackgroundRemovalInput,
  PhotoBackgroundRemovalOutput,
  PhotoEnhanceInput,
  PhotoEnhanceOutput,
  SceneGenerationInput,
  SceneGenerationOutput,
  ChatCompletionInput,
  ChatCompletionOutput,
} from "@/lib/ai/types";

/**
 * Provider-agnostic contract. A given provider only implements the
 * capabilities it actually supports (e.g. an image-only provider omits
 * `generateVideo`) — routes check for the method before calling it.
 */
export interface AiProvider {
  name: string;
  generateImage?(input: ImageGenerationInput): Promise<ImageGenerationOutput>;
  /** Starts an async video job — see VideoJobHandle for why this isn't a single await. */
  startVideoGeneration?(input: VideoGenerationInput): Promise<VideoJobHandle>;
  checkVideoGeneration?(jobId: string): Promise<VideoJobStatusResult>;
  generateDesign?(input: DesignGenerationInput): Promise<DesignGenerationOutput>;
  generateAudio?(input: AudioGenerationInput): Promise<AudioGenerationOutput>;
  removeBackground?(input: PhotoBackgroundRemovalInput): Promise<PhotoBackgroundRemovalOutput>;
  enhancePhoto?(input: PhotoEnhanceInput): Promise<PhotoEnhanceOutput>;
  generateScene?(input: SceneGenerationInput): Promise<SceneGenerationOutput>;
  chatComplete?(input: ChatCompletionInput): Promise<ChatCompletionOutput>;
}
