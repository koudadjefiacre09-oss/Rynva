/**
 * Server-side limits for AI Photo Retouch, configurable through env vars so
 * they can follow the hosting plan (memory, function duration, storage).
 */
function intEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = Number(process.env[name]);
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return Math.min(max, Math.max(min, Math.round(raw)));
}

export const RETOUCH_LIMITS = {
  /** Max uploaded file size in MB (RAW files are often 25-60 MB). */
  maxUploadMb: intEnv("RETOUCH_MAX_UPLOAD_MB", 50, 1, 500),
  /** Hard ceiling on decoded pixels, against decompression bombs. */
  maxInputPixels: intEnv("RETOUCH_MAX_INPUT_MEGAPIXELS", 120, 4, 500) * 1_000_000,
  /**
   * Largest export processed at full resolution. Bigger sources are
   * downscaled to fit (and the user is told) rather than failing.
   */
  maxExportPixels: intEnv("RETOUCH_MAX_EXPORT_MEGAPIXELS", 40, 2, 200) * 1_000_000,
  /** Long edge of the interactive before/after preview. */
  previewLongEdge: intEnv("RETOUCH_PREVIEW_LONG_EDGE", 2048, 512, 4096),
} as const;
