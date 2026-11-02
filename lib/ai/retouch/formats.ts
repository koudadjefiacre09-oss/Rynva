/**
 * Real-format detection from file signatures ("magic bytes").
 *
 * The declared MIME type and the extension are only hints: a file is accepted
 * only when its bytes match a known raster image signature. SVG, PDF, HTML or
 * anything unrecognised is rejected, whatever its name says.
 */
import { RAW_EXTENSIONS } from "@/lib/ai/retouch/settings";

export type ImageFormat =
  | "jpeg"
  | "png"
  | "webp"
  | "gif"
  | "bmp"
  | "tiff"
  | "heic"
  | "avif"
  | "raw";

export interface DetectedFormat {
  format: ImageFormat;
  /** Human label shown to the user, e.g. "HEIC", "RAW Canon CR3". */
  label: string;
  /** Canonical MIME type of the detected format. */
  mime: string;
}

const MIME: Record<ImageFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  tiff: "image/tiff",
  heic: "image/heic",
  avif: "image/avif",
  raw: "image/x-raw",
};

function ascii(bytes: Uint8Array, start: number, length: number): string {
  let out = "";
  for (let i = start; i < start + length && i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

const HEIF_BRANDS = new Set(["heic", "heix", "heim", "heis", "hevc", "hevx", "mif1", "msf1", "mif2"]);
const AVIF_BRANDS = new Set(["avif", "avis"]);

/** Reads the ISO-BMFF `ftyp` box (major + compatible brands). */
function ftypBrands(bytes: Uint8Array): string[] | null {
  if (bytes.length < 16 || ascii(bytes, 4, 4) !== "ftyp") return null;
  const size = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  const end = Math.min(size > 0 ? size : 32, bytes.length);
  const brands = [ascii(bytes, 8, 4)];
  for (let i = 16; i + 4 <= end; i += 4) brands.push(ascii(bytes, i, 4));
  return brands;
}

const RAW_LABEL: Record<string, string> = {
  cr2: "RAW Canon CR2",
  cr3: "RAW Canon CR3",
  nef: "RAW Nikon NEF",
  nrw: "RAW Nikon NRW",
  arw: "RAW Sony ARW",
  srf: "RAW Sony SRF",
  sr2: "RAW Sony SR2",
  dng: "RAW DNG",
  raf: "RAW Fujifilm RAF",
  orf: "RAW Olympus ORF",
  rw2: "RAW Panasonic RW2",
  pef: "RAW Pentax PEF",
  srw: "RAW Samsung SRW",
  raw: "RAW",
};

function raw(ext: string): DetectedFormat {
  return { format: "raw", label: RAW_LABEL[ext] ?? "RAW", mime: MIME.raw };
}

/**
 * Detects the real image format from the first bytes of the file (64 bytes
 * are enough). `extension` is only used to tell TIFF-based RAW files (NEF,
 * ARW, DNG, PEF...) apart from plain TIFFs, since they share a signature.
 * Returns null for anything that is not a supported raster image.
 */
export function detectImageFormat(head: Uint8Array, extension = ""): DetectedFormat | null {
  const b = head;
  if (b.length < 12) return null;
  const ext = extension.toLowerCase();

  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { format: "jpeg", label: "JPEG", mime: MIME.jpeg };
  if (b[0] === 0x89 && ascii(b, 1, 3) === "PNG" && b[4] === 0x0d && b[5] === 0x0a) {
    return { format: "png", label: "PNG", mime: MIME.png };
  }
  if (ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a") return { format: "gif", label: "GIF", mime: MIME.gif };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return { format: "webp", label: "WebP", mime: MIME.webp };
  if (ascii(b, 0, 2) === "BM" && b.length >= 26) {
    // BITMAPFILEHEADER: a DIB header size of 12/40/52/56/108/124 bytes follows.
    const dib = b[14] | (b[15] << 8) | (b[16] << 16) | (b[17] << 24);
    if ([12, 40, 52, 56, 64, 108, 124].includes(dib)) return { format: "bmp", label: "BMP", mime: MIME.bmp };
  }
  if (ascii(b, 0, 15) === "FUJIFILMCCD-RAW") return raw("raf");

  const brands = ftypBrands(b);
  if (brands) {
    if (brands.includes("crx ")) return raw("cr3");
    if (brands.some((x) => AVIF_BRANDS.has(x))) return { format: "avif", label: "AVIF", mime: MIME.avif };
    if (brands.some((x) => HEIF_BRANDS.has(x))) return { format: "heic", label: "HEIC / HEIF", mime: MIME.heic };
    return null;
  }

  const littleTiff = b[0] === 0x49 && b[1] === 0x49;
  const bigTiff = b[0] === 0x4d && b[1] === 0x4d;
  if (littleTiff || bigTiff) {
    const magic = littleTiff ? b[2] | (b[3] << 8) : (b[2] << 8) | b[3];
    if (littleTiff && ascii(b, 2, 2) === "RO") return raw("orf"); // Olympus "IIRO"
    if (littleTiff && ascii(b, 2, 2) === "RS") return raw("orf");
    if (bigTiff && ascii(b, 2, 2) === "OR") return raw("orf");
    if (littleTiff && b[2] === 0x55 && b[3] === 0x00) return raw("rw2"); // Panasonic "IIU\0"
    if (magic !== 42) return null;
    if (littleTiff && ascii(b, 8, 2) === "CR") return raw("cr2");
    if (RAW_EXTENSIONS.has(ext)) return raw(ext);
    return { format: "tiff", label: "TIFF", mime: MIME.tiff };
  }

  return null;
}
