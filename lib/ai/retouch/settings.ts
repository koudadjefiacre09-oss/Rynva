/**
 * AI Photo Retouch: user-facing settings, presets and limits.
 *
 * Shared by the client (sliders, presets) and the server (validation, engine),
 * so it must stay free of Node-only imports.
 */
import { z } from "zod";

export type RetouchPreset = "natural" | "balanced" | "intense";

/** Every control is a 0-100 slider. */
export interface RetouchSettings {
  /** Band-pass smoothing of skin unevenness (pores and relief are kept). */
  smoothing: number;
  /** Red, inflamed spots (pimples, small marks, local redness). Never moles or freckles. */
  blemishes: number;
  /** Lifts the low-frequency darkness under the eyes towards the cheek tone. */
  darkCircles: number;
  /** Tames specular hot-spots on skin. */
  shine: number;
  /** Unsharp mask on eyes, brows and lips only. Never on skin or clothes. */
  sharpness: number;
  /** Chroma (and light luminance) noise reduction on skin only. */
  denoise: number;
  /** Global mix between the original (0) and the full retouch (100). */
  intensity: number;
  /**
   * Optional whole-photo corrections: exposure, white balance, contrast,
   * shadows/highlights. Off by default because, unlike the skin retouch,
   * these touch every pixel (clothes included).
   */
  photoCorrections: boolean;
}

export const RETOUCH_PRESETS: Record<RetouchPreset, RetouchSettings> = {
  natural: {
    smoothing: 30,
    blemishes: 70,
    darkCircles: 30,
    shine: 35,
    sharpness: 15,
    denoise: 15,
    intensity: 80,
    photoCorrections: false,
  },
  balanced: {
    smoothing: 50,
    blemishes: 85,
    darkCircles: 50,
    shine: 55,
    sharpness: 25,
    denoise: 25,
    intensity: 90,
    photoCorrections: false,
  },
  intense: {
    smoothing: 70,
    blemishes: 100,
    darkCircles: 70,
    shine: 75,
    sharpness: 35,
    denoise: 35,
    intensity: 100,
    photoCorrections: false,
  },
};

export const DEFAULT_PRESET: RetouchPreset = "natural";

export const PRESET_LABELS: Record<RetouchPreset, string> = {
  natural: "Naturel",
  balanced: "Équilibré",
  intense: "Intensif",
};

const slider = z.number().min(0).max(100);

export const retouchSettingsSchema = z.object({
  smoothing: slider,
  blemishes: slider,
  darkCircles: slider,
  shine: slider,
  sharpness: slider,
  denoise: slider,
  intensity: slider,
  photoCorrections: z.boolean(),
});

export type ExportFormat = "jpeg" | "png" | "webp";

export const exportOptionsSchema = z.object({
  format: z.enum(["jpeg", "png", "webp"]),
  /** 1-100, ignored for PNG (lossless). */
  quality: z.number().int().min(1).max(100),
  /** Long edge in px, or "original". */
  resolution: z.union([z.literal("original"), z.number().int().min(256).max(20000)]),
});
export type ExportOptions = z.infer<typeof exportOptionsSchema>;

/** Extensions the importer accepts (also used for the <input accept> list). */
export const ACCEPTED_EXTENSIONS = [
  "jpg", "jpeg", "jpe", "jfif", "png", "webp", "heic", "heif", "tif", "tiff", "bmp", "gif", "avif",
  "cr2", "cr3", "nef", "nrw", "arw", "srf", "sr2", "dng", "raf", "orf", "rw2", "pef", "srw", "raw",
] as const;

export const RAW_EXTENSIONS = new Set([
  "cr2", "cr3", "nef", "nrw", "arw", "srf", "sr2", "dng", "raf", "orf", "rw2", "pef", "srw", "raw",
]);

/** Client-side guard only; the server enforces its own (env-configurable) limit. */
export const DEFAULT_MAX_UPLOAD_MB = 50;

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}
