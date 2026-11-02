import sharp from "sharp";
import { decodeImage, type DecodedImage } from "@/lib/ai/retouch/decode.server";
import { detectFaces } from "@/lib/ai/retouch/face.server";
import { retouchFace, type FaceRetouchDebug, type FaceRetouchReport } from "@/lib/ai/retouch/skin";
import { applyPhotoCorrections } from "@/lib/ai/retouch/photo";
import { RETOUCH_LIMITS } from "@/lib/ai/retouch/limits.server";
import type { ExportOptions, RetouchSettings } from "@/lib/ai/retouch/settings";

/**
 * Orchestrates: decode → (optional photo corrections) → face detection →
 * per-face masked skin retouch → intensity mix → encode.
 *
 * The same deterministic engine runs for the preview (downscaled) and for
 * the export (full resolution), so what the user validated is what they get,
 * and the export is encoded exactly once from the decoded source (no
 * recompression chain).
 */

export interface RetouchAnalysis {
  format: string;
  sourceWidth: number;
  sourceHeight: number;
  width: number;
  height: number;
  facesDetected: number;
  facesRetouched: number;
  blemishesCorrected: number;
  notes: string[];
  timingsMs: Record<string, number>;
}

export class NoFaceError extends Error {}

/** Real pipeline stages, streamed to the client as progress. */
export type RetouchStage = "decode" | "detect" | "retouch" | "encode";
type OnStage = (stage: RetouchStage) => void;

interface RunResult {
  decoded: DecodedImage;
  retouched: Buffer;
  analysis: RetouchAnalysis;
  faces: FaceRetouchReport[];
}

async function run(
  file: Buffer,
  extension: string,
  settings: RetouchSettings,
  decodeOptions: { maxLongEdge?: number; maxPixels?: number },
  debug?: (info: FaceRetouchDebug) => void,
  onStage?: OnStage
): Promise<RunResult> {
  const t0 = Date.now();
  onStage?.("decode");
  const decoded = await decodeImage(file, extension, decodeOptions);
  const tDecode = Date.now();

  const work = Buffer.from(decoded.rgb);
  const notes = [...decoded.notes];
  if (settings.photoCorrections) applyPhotoCorrections(work, decoded.width, decoded.height);
  const tPhoto = Date.now();

  onStage?.("detect");
  const faces = await detectFaces(work, decoded.width, decoded.height);
  const tDetect = Date.now();

  onStage?.("retouch");
  const reports: FaceRetouchReport[] = [];
  for (const face of faces) {
    reports.push(retouchFace(work, decoded.width, decoded.height, face.mesh, settings, debug));
  }
  const tSkin = Date.now();

  const skipped = reports.filter((r) => !r.retouched).length;
  if (skipped > 0) notes.push(`${skipped} visage(s) trop petit(s) pour être retouché(s) sans risque.`);

  return {
    decoded,
    retouched: work,
    faces: reports,
    analysis: {
      format: decoded.format.label,
      sourceWidth: decoded.sourceWidth,
      sourceHeight: decoded.sourceHeight,
      width: decoded.width,
      height: decoded.height,
      facesDetected: faces.length,
      facesRetouched: reports.filter((r) => r.retouched).length,
      blemishesCorrected: reports.reduce((t, r) => t + r.blemishesCorrected, 0),
      notes,
      timingsMs: {
        decode: tDecode - t0,
        photoCorrections: tPhoto - tDecode,
        faceDetection: tDetect - tPhoto,
        skinRetouch: tSkin - tDetect,
      },
    },
  };
}

/** original + intensity * (retouched - original), in place on `retouched`. */
function mix(original: Buffer, retouched: Buffer, intensity: number) {
  const k = Math.min(1, Math.max(0, intensity / 100));
  if (k === 1) return retouched;
  for (let i = 0; i < retouched.length; i++) {
    retouched[i] = Math.round(original[i] + k * (retouched[i] - original[i]));
  }
  return retouched;
}

function withAlpha(rgb: Buffer, alpha: Buffer): Buffer {
  const n = alpha.length;
  const out = Buffer.allocUnsafe(n * 4);
  for (let i = 0; i < n; i++) {
    out[i * 4] = rgb[i * 3];
    out[i * 4 + 1] = rgb[i * 3 + 1];
    out[i * 4 + 2] = rgb[i * 3 + 2];
    out[i * 4 + 3] = alpha[i];
  }
  return out;
}

/**
 * Encodes pixels. Only an sRGB ICC profile is written: EXIF (GPS, serial
 * numbers...) is stripped for privacy, and orientation is already baked in.
 */
async function encode(
  rgb: Buffer,
  alpha: Buffer | null,
  width: number,
  height: number,
  format: ExportOptions["format"],
  quality: number
): Promise<Buffer> {
  const keepAlpha = Boolean(alpha) && format !== "jpeg";
  const input = keepAlpha ? withAlpha(rgb, alpha!) : rgb;
  let img = sharp(input, { raw: { width, height, channels: keepAlpha ? 4 : 3 } }).withIccProfile("srgb");
  if (format === "jpeg") {
    img = img.jpeg({ quality, mozjpeg: true, chromaSubsampling: quality >= 90 ? "4:4:4" : "4:2:0" });
  } else if (format === "webp") {
    img = img.webp({ quality, smartSubsample: true, effort: 4 });
  } else {
    img = img.png({ compressionLevel: 6 });
  }
  return img.toBuffer();
}

export interface PreviewResult {
  original: Buffer;
  retouched: Buffer;
  analysis: RetouchAnalysis;
}

/** Interactive preview: downscaled original + retouched (at intensity 100). */
export async function renderPreview(
  file: Buffer,
  extension: string,
  settings: RetouchSettings,
  onStage?: OnStage
): Promise<PreviewResult> {
  const result = await run(file, extension, settings, { maxLongEdge: RETOUCH_LIMITS.previewLongEdge }, undefined, onStage);
  if (result.analysis.facesDetected === 0) {
    throw new NoFaceError("Aucun visage détecté. La retouche de la peau a besoin d'un visage net et visible.");
  }
  const { decoded } = result;
  onStage?.("encode");
  const t = Date.now();
  const [original, retouched] = await Promise.all([
    encode(decoded.rgb, null, decoded.width, decoded.height, "jpeg", 90),
    encode(result.retouched, null, decoded.width, decoded.height, "jpeg", 90),
  ]);
  result.analysis.timingsMs.encode = Date.now() - t;
  return { original, retouched, analysis: result.analysis };
}

export interface ExportResult {
  file: Buffer;
  width: number;
  height: number;
  mime: string;
  extension: string;
  analysis: RetouchAnalysis;
}

const MIME_BY_FORMAT = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
const EXT_BY_FORMAT = { jpeg: "jpg", png: "png", webp: "webp" } as const;

/** Full-resolution export (single encode from the decoded source). */
export async function renderExport(
  file: Buffer,
  extension: string,
  settings: RetouchSettings,
  options: ExportOptions,
  debug?: (info: FaceRetouchDebug) => void,
  onStage?: OnStage
): Promise<ExportResult> {
  const decodeOptions =
    options.resolution === "original"
      ? { maxPixels: RETOUCH_LIMITS.maxExportPixels }
      : { maxLongEdge: options.resolution, maxPixels: RETOUCH_LIMITS.maxExportPixels };
  const result = await run(file, extension, settings, decodeOptions, debug, onStage);
  const { decoded, analysis } = result;
  if (options.resolution === "original" && decoded.width !== decoded.sourceWidth) {
    analysis.notes.push(
      `Résolution réduite à ${decoded.width}×${decoded.height} (limite d'export : ${Math.round(RETOUCH_LIMITS.maxExportPixels / 1e6)} Mpx).`
    );
  }
  mix(decoded.rgb, result.retouched, settings.intensity);
  onStage?.("encode");
  const t = Date.now();
  const out = await encode(result.retouched, decoded.alpha, decoded.width, decoded.height, options.format, options.quality);
  analysis.timingsMs.encode = Date.now() - t;
  return {
    file: out,
    width: decoded.width,
    height: decoded.height,
    mime: MIME_BY_FORMAT[options.format],
    extension: EXT_BY_FORMAT[options.format],
    analysis,
  };
}
