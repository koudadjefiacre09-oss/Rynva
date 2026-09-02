import type {
  ImageGenerationInput,
  ImageGenerationOutput,
  VideoGenerationInput,
  VideoGenerationOutput,
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
  generateVideo?(input: VideoGenerationInput): Promise<VideoGenerationOutput>;
  generateDesign?(input: DesignGenerationInput): Promise<DesignGenerationOutput>;
  generateAudio?(input: AudioGenerationInput): Promise<AudioGenerationOutput>;
  removeBackground?(input: PhotoBackgroundRemovalInput): Promise<PhotoBackgroundRemovalOutput>;
  enhancePhoto?(input: PhotoEnhanceInput): Promise<PhotoEnhanceOutput>;
  generateScene?(input: SceneGenerationInput): Promise<SceneGenerationOutput>;
  chatComplete?(input: ChatCompletionInput): Promise<ChatCompletionOutput>;
}
