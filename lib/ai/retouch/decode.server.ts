import sharp from "sharp";

type SharpImage = ReturnType<typeof sharp>;
import { detectImageFormat, type DetectedFormat } from "@/lib/ai/retouch/formats";
import { decodeBmp, BmpError } from "@/lib/ai/retouch/bmp";
import { RETOUCH_LIMITS } from "@/lib/ai/retouch/limits.server";

/**
 * Decoding stage: any accepted file → oriented, sRGB, 8-bit RGB pixels.
 *
 * - Orientation: EXIF orientation is applied (sharp `.rotate()`), HEIC
 *   transforms (irot/imir) are applied by libheif, RAW orientation is read
 *   from the RAW container and applied to its embedded preview.
 * - Colour: embedded ICC profiles are converted to sRGB by libvips/lcms.
 * - RAW: no demosaicing happens here. We use the full-size JPEG the camera
 *   embeds in the RAW file and say so (see `notes`). The RAW data itself is
 *   never modified nor claimed to be preserved.
 */

export class DecodeError extends Error {
  constructor(message: string, readonly status = 422) {
    super(message);
  }
}

export interface DecodedImage {
  /** Interleaved RGB (3 channels, 8 bits). */
  rgb: Buffer;
  /** Alpha plane when the source had real transparency (PNG/WebP/TIFF...). */
  alpha: Buffer | null;
  width: number;
  height: number;
  /** Size of the decoded source before any downscale. */
  sourceWidth: number;
  sourceHeight: number;
  format: DetectedFormat;
  /** Hints shown to the user (RAW preview, GIF first frame, downscale...). */
  notes: string[];
}

export interface DecodeOptions {
  /** Downscale so the long edge fits (used for interactive previews). */
  maxLongEdge?: number;
  /** Downscale so the pixel count fits (export guard). */
  maxPixels?: number;
}

/** Wraps a few common libvips error messages into user-facing French. */
function wrapSharpError(err: unknown): DecodeError {
  const message = err instanceof Error ? err.message : String(err);
  if (/pixel limit/i.test(message)) {
    return new DecodeError("Image trop grande : la résolution dépasse la limite autorisée.", 413);
  }
  return new DecodeError("Fichier image corrompu ou illisible.");
}

/** Finds a JPEG's dimensions by walking its markers (no full decode). */
function jpegInfo(buf: Uint8Array, start: number): { width: number; height: number; components: number } | null {
  let pos = start + 2;
  const len = buf.length;
  while (pos + 9 < len) {
    if (buf[pos] !== 0xff) return null;
    const marker = buf[pos + 1];
    if (marker === 0xff) { pos++; continue; }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { pos += 2; continue; }
    if (marker === 0xda || marker === 0xd9) return null;
    const segLen = (buf[pos + 2] << 8) | buf[pos + 3];
    if (segLen < 2) return null;
    const isSof =
      (marker >= 0xc0 && marker <= 0xcf) && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      // SOF3/7/11/15 are lossless JPEG: that's raw sensor data, not a preview.
      if (marker === 0xc3 || marker === 0xc7 || marker === 0xcb || marker === 0xcf) return null;
      const height = (buf[pos + 5] << 8) | buf[pos + 6];
      const width = (buf[pos + 7] << 8) | buf[pos + 8];
      const components = buf[pos + 9];
      return { width, height, components };
    }
    pos += 2 + segLen;
  }
  return null;
}

/** Locates the largest decodable JPEG preview embedded in a RAW file. */
function findEmbeddedPreview(buf: Buffer): { offset: number; width: number; height: number } | null {
  let best: { offset: number; width: number; height: number } | null = null;
  const end = buf.length - 4;
  for (let i = 0; i < end; i++) {
    if (buf[i] !== 0xff || buf[i + 1] !== 0xd8 || buf[i + 2] !== 0xff) continue;
    const info = jpegInfo(buf, i);
    if (!info || (info.components !== 3 && info.components !== 1)) continue;
    if (!best || info.width * info.height > best.width * best.height) {
      best = { offset: i, width: info.width, height: info.height };
    }
  }
  return best;
}

/** sharp ops that bring a pixel orientation-1 image to the given EXIF orientation. */
function applyExifOrientation(img: SharpImage, orientation: number): SharpImage {
  switch (orientation) {
    case 2: return img.flop();
    case 3: return img.rotate(180);
    case 4: return img.flip();
    case 5: return img.rotate(90).flop();
    case 6: return img.rotate(90);
    case 7: return img.rotate(270).flop();
    case 8: return img.rotate(270);
    default: return img;
  }
}

async function rawOrientation(buf: Buffer): Promise<number> {
  try {
    const exifr = (await import("exifr")).default;
    const value = await exifr.orientation(buf);
    return typeof value === "number" ? value : 1;
  } catch {
    return 1;
  }
}

/** Builds an oriented sharp pipeline for the detected format. */
async function openPipeline(
  buf: Buffer,
  format: DetectedFormat,
  notes: string[]
): Promise<SharpImage> {
  const limitInputPixels = RETOUCH_LIMITS.maxInputPixels;
  const base = { failOn: "error" as const, limitInputPixels };

  switch (format.format) {
    case "jpeg":
    case "png":
    case "webp":
    case "tiff":
    case "avif":
      return sharp(buf, base).rotate();
    case "gif": {
      const meta = await sharp(buf, base).metadata();
      if ((meta.pages ?? 1) > 1) notes.push("GIF animé : seule la première image est retouchée.");
      return sharp(buf, { ...base, page: 0, pages: 1 });
    }
    case "heic": {
      try {
        // AVIF-coded HEIF is handled natively; HEVC needs libheif (wasm).
        const meta = await sharp(buf, base).metadata();
        if (meta.compression === "av1") return sharp(buf, base).rotate();
      } catch {
        /* fall through to libheif */
      }
      const { default: decodeHeic } = await import("heic-decode");
      let image: { width: number; height: number; data: Uint8ClampedArray };
      try {
        image = await decodeHeic({ buffer: buf });
      } catch {
        throw new DecodeError("Fichier HEIC corrompu ou illisible.");
      }
      if (image.width * image.height > limitInputPixels) {
        throw new DecodeError("Image trop grande : la résolution dépasse la limite autorisée.", 413);
      }
      return sharp(Buffer.from(image.data.buffer, image.data.byteOffset, image.data.byteLength), {
        raw: { width: image.width, height: image.height, channels: 4 },
        limitInputPixels,
      });
    }
    case "bmp": {
      try {
        const bmp = decodeBmp(buf, limitInputPixels);
        return sharp(Buffer.from(bmp.data.buffer, bmp.data.byteOffset, bmp.data.byteLength), {
          raw: { width: bmp.width, height: bmp.height, channels: 4 },
          limitInputPixels,
        }).ensureAlpha();
      } catch (err) {
        if (err instanceof BmpError) throw new DecodeError(err.message);
        throw err;
      }
    }
    case "raw": {
      const preview = findEmbeddedPreview(buf);
      if (!preview || Math.max(preview.width, preview.height) < 1000) {
        throw new DecodeError(
          `${format.label} : ce fichier ne contient pas d'aperçu exploitable et le développement RAW n'est pas disponible. Exportez-le en JPEG ou TIFF depuis votre logiciel photo, puis réessayez.`
        );
      }
      notes.push(
        `${format.label} : la retouche utilise l'aperçu JPEG pleine résolution intégré par l'appareil (${preview.width}×${preview.height}). Les données RAW ne sont ni développées ni conservées ; l'export se fait en JPEG, PNG ou WebP.`
      );
      const orientation = await rawOrientation(buf);
      return applyExifOrientation(sharp(buf.subarray(preview.offset), { failOn: "none", limitInputPixels }), orientation);
    }
  }
}

/** Decodes an uploaded file. Throws DecodeError with a user-facing message. */
export async function decodeImage(
  buf: Buffer,
  extension: string,
  options: DecodeOptions = {}
): Promise<DecodedImage> {
  const format = detectImageFormat(buf.subarray(0, 64), extension);
  if (!format) {
    throw new DecodeError(
      "Format non reconnu. Formats acceptés : JPEG, PNG, WebP, HEIC/HEIF, TIFF, BMP, GIF, AVIF et RAW (CR2, CR3, NEF, ARW, DNG, RAF, ORF, RW2...).",
      415
    );
  }

  const notes: string[] = [];
  try {
    // Materialise orientation + ICC→sRGB once, then measure the real size.
    const pipeline = await openPipeline(buf, format, notes);
    const oriented = await pipeline
      .toColourspace("srgb")
      .raw({ depth: "uchar" })
      .toBuffer({ resolveWithObject: true });

    const { width: sourceWidth, height: sourceHeight, channels } = oriented.info;
    if (sourceWidth < 64 || sourceHeight < 64) throw new DecodeError("Image trop petite (64×64 minimum).");

    let width = sourceWidth;
    let height = sourceHeight;
    let scale = 1;
    if (options.maxLongEdge) scale = Math.min(scale, options.maxLongEdge / Math.max(width, height));
    if (options.maxPixels) scale = Math.min(scale, Math.sqrt(options.maxPixels / (width * height)));

    let pixels = oriented.data;
    if (scale < 1) {
      width = Math.max(1, Math.round(sourceWidth * scale));
      height = Math.max(1, Math.round(sourceHeight * scale));
      pixels = await sharp(oriented.data, { raw: { width: sourceWidth, height: sourceHeight, channels } })
        .resize(width, height, { kernel: "lanczos3", fit: "fill" })
        .raw()
        .toBuffer();
    }

    const count = width * height;
    const rgb = Buffer.allocUnsafe(count * 3);
    let alpha: Buffer | null = null;
    if (channels === 3) {
      pixels.copy(rgb);
    } else if (channels === 4) {
      alpha = Buffer.allocUnsafe(count);
      let transparent = false;
      for (let i = 0, j = 0, k = 0; i < count; i++, j += 4, k += 3) {
        rgb[k] = pixels[j];
        rgb[k + 1] = pixels[j + 1];
        rgb[k + 2] = pixels[j + 2];
        alpha[i] = pixels[j + 3];
        if (pixels[j + 3] !== 255) transparent = true;
      }
      if (!transparent) alpha = null;
    } else {
      // 1 or 2 channels (grey / grey+alpha) after toColourspace should not
      // happen, but stay safe.
      for (let i = 0; i < count; i++) {
        const v = pixels[i * channels];
        rgb[i * 3] = rgb[i * 3 + 1] = rgb[i * 3 + 2] = v;
      }
    }

    return { rgb, alpha, width, height, sourceWidth, sourceHeight, format, notes };
  } catch (err) {
    if (err instanceof DecodeError) throw err;
    throw wrapSharpError(err);
  }
}
