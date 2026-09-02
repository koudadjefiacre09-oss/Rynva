import Replicate from "replicate";
import type { AiProvider } from "@/lib/ai/provider";
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
} from "@/lib/ai/types";

// Defaults chosen for cost/speed as a starting point for RYNVA — swap freely,
// every model on Replicate takes the same { prompt } shape at minimum.
// Verify each model's exact optional parameters on its Replicate page before
// relying on them: schemas occasionally change between model versions.
const IMAGE_MODEL = "black-forest-labs/flux-schnell";
// wan-2.2-*-fast is silent (no audio track at all). wan-2.7 costs more and is
// slower, but auto-generates matching audio when no `audio` file is given —
// worth it since AI Video is meant to produce a finished, watchable clip.
const VIDEO_MODEL = "wan-video/wan-2.7-t2v";
const IMAGE_TO_VIDEO_MODEL = "wan-video/wan-2.7-i2v";
const TTS_MODEL = "xai/grok-text-to-speech";
const BG_REMOVE_MODEL_OWNER = "851-labs";
const BG_REMOVE_MODEL_NAME = "background-remover";
const UPSCALE_MODEL_OWNER = "nightmareai";
const UPSCALE_MODEL_NAME = "real-esrgan";
// Runway Gen-4 Image: the one model in this file actually built for
// *consistent characters* — up to 3 reference images, each tagged, and the
// prompt references them as @tag to compose a new scene while preserving
// each face/outfit. Verified end-to-end before wiring this in.
const SCENE_MODEL = "runwayml/gen4-image";

const ASPECT_RATIO_BY_DESIGN_FORMAT: Record<
  NonNullable<DesignGenerationInput["format"]>,
  string
> = {
  post: "1:1",
  story: "9:16",
  poster: "4:3",
  banner: "16:9",
};

interface ReplicateFileOutput {
  url(): string | URL;
}

function isFileOutput(value: unknown): value is ReplicateFileOutput {
  return Boolean(value) && typeof (value as ReplicateFileOutput).url === "function";
}

/** Normalize a prediction's `output` (a plain URL string, an array of them,
 * or occasionally a FileOutput-like object) to a single URL string. */
function outputToUrl(output: unknown): string {
  const first = Array.isArray(output) ? output[0] : output;
  if (isFileOutput(first)) return String(first.url());
  return String(first);
}

/**
 * Run a model via the low-level predictions API instead of the SDK's
 * `replicate.run()` convenience wrapper — on this model/account combo,
 * `run()` resolved to `null` even though the prediction actually succeeded
 * (confirmed via a raw predictions.create + wait call). This path is also
 * easier to reason about: we get the full prediction object, including
 * `error`/`status`, instead of a bare output.
 */
async function runModel(
  replicate: Replicate,
  model: `${string}/${string}`,
  input: Record<string, unknown>
): Promise<unknown> {
  let prediction = await replicate.predictions.create({ model, input });
  prediction = await replicate.wait(prediction);

  if (prediction.status !== "succeeded") {
    throw new Error(prediction.error ? String(prediction.error) : `La prédiction a échoué (${prediction.status}).`);
  }

  return prediction.output;
}

// Community (non-"official") models like 851-labs/background-remover or
// nightmareai/real-esrgan don't support the `model: "owner/name"` shorthand
// in predictions.create() — that only works for Replicate's curated official
// models (flux-schnell, wan-video, xai/*). Community models need a specific
// version id instead. Resolved lazily and cached per process (keyed by
// "owner/name") to avoid a lookup on every request.
const versionCache = new Map<string, string>();

async function runVersionedModel(
  replicate: Replicate,
  owner: string,
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const key = `${owner}/${name}`;
  let version = versionCache.get(key);

  if (!version) {
    const model = await replicate.models.get(owner, name);
    if (!model.latest_version?.id) {
      throw new Error(`Impossible de résoudre la version du modèle ${key}.`);
    }
    version = model.latest_version.id;
    versionCache.set(key, version);
  }

  let prediction = await replicate.predictions.create({ version, input });
  prediction = await replicate.wait(prediction);

  if (prediction.status !== "succeeded") {
    throw new Error(prediction.error ? String(prediction.error) : `La prédiction a échoué (${prediction.status}).`);
  }

  return prediction.output;
}

export function createReplicateProvider(apiToken: string): AiProvider {
  const replicate = new Replicate({ auth: apiToken });

  return {
    name: "replicate",

    async generateImage(input: ImageGenerationInput): Promise<ImageGenerationOutput> {
      const output = await runModel(replicate, IMAGE_MODEL, {
        prompt: input.prompt,
        aspect_ratio: input.aspectRatio ?? "1:1",
      });
      return { url: outputToUrl(output), prompt: input.prompt };
    },

    async generateDesign(input: DesignGenerationInput): Promise<DesignGenerationOutput> {
      // No dedicated "design" model on Replicate — reuse the image model
      // with a format-aware aspect ratio and a design-oriented prompt suffix.
      const format = input.format ?? "post";
      const output = await runModel(replicate, IMAGE_MODEL, {
        prompt: `${input.prompt}, professional graphic design, clean composition`,
        aspect_ratio: ASPECT_RATIO_BY_DESIGN_FORMAT[format],
      });
      return { url: outputToUrl(output), prompt: input.prompt };
    },

    async generateVideo(input: VideoGenerationInput): Promise<VideoGenerationOutput> {
      const duration = input.durationSeconds ?? 5;
      // 720p default — cheaper/faster than the model's 1080p default. The
      // resolution picker in the UI now overrides this; "480p"/"1080p" are
      // assumed valid enum values for wan-2.7 but weren't individually
      // confirmed against the model's Replicate page — verify if either
      // starts erroring.
      const resolution = input.resolution ?? "720p";
      const output = input.sourceImageUrl
        ? await runModel(replicate, IMAGE_TO_VIDEO_MODEL, {
            first_frame: input.sourceImageUrl,
            prompt: input.prompt,
            duration,
            resolution,
          })
        : await runModel(replicate, VIDEO_MODEL, {
            prompt: input.prompt,
            duration,
            resolution,
          });
      return { url: outputToUrl(output), prompt: input.prompt };
    },

    async generateAudio(input: AudioGenerationInput): Promise<AudioGenerationOutput> {
      const output = await runModel(replicate, TTS_MODEL, {
        text: input.prompt,
        voice: input.voice && input.voice !== "neutral" ? input.voice : "eve",
      });
      return { url: outputToUrl(output), prompt: input.prompt };
    },

    async removeBackground(
      input: PhotoBackgroundRemovalInput
    ): Promise<PhotoBackgroundRemovalOutput> {
      const output = await runVersionedModel(
        replicate,
        BG_REMOVE_MODEL_OWNER,
        BG_REMOVE_MODEL_NAME,
        { image: input.imageDataUrl, background_type: "rgba" }
      );
      return { url: outputToUrl(output) };
    },

    async enhancePhoto(input: PhotoEnhanceInput): Promise<PhotoEnhanceOutput> {
      const output = await runVersionedModel(
        replicate,
        UPSCALE_MODEL_OWNER,
        UPSCALE_MODEL_NAME,
        {
          image: input.imageDataUrl,
          scale: input.scale ?? 4,
          face_enhance: input.faceEnhance ?? false,
        }
      );
      return { url: outputToUrl(output) };
    },

    async generateScene(input: SceneGenerationInput): Promise<SceneGenerationOutput> {
      const output = await runModel(replicate, SCENE_MODEL, {
        prompt: input.prompt,
        reference_tags: input.characters.map((c) => c.tag),
        reference_images: input.characters.map((c) => c.imageUrl),
        aspect_ratio: input.aspectRatio ?? "16:9",
      });
      return { url: outputToUrl(output), prompt: input.prompt };
    },
  };
}
