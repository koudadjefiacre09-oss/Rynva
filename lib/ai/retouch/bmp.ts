/**
 * Minimal, defensive BMP decoder (libvips has no BMP loader).
 * Supports the variants cameras/editors actually write: 1/4/8-bit palette,
 * 16-bit (555/565 bitfields), 24-bit and 32-bit (BI_RGB / BI_BITFIELDS),
 * bottom-up or top-down. RLE-compressed BMPs are rejected explicitly.
 */
export interface DecodedBmp {
  width: number;
  height: number;
  /** RGBA, 8 bits per channel. */
  data: Uint8Array;
  hasAlpha: boolean;
}

export class BmpError extends Error {}

function maskShift(mask: number): { shift: number; bits: number } {
  if (mask === 0) return { shift: 0, bits: 0 };
  let shift = 0;
  while (((mask >>> shift) & 1) === 0) shift++;
  let bits = 0;
  while (((mask >>> (shift + bits)) & 1) === 1) bits++;
  return { shift, bits };
}

export function decodeBmp(buf: Uint8Array, maxPixels: number): DecodedBmp {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (buf.length < 26 || buf[0] !== 0x42 || buf[1] !== 0x4d) throw new BmpError("Signature BMP invalide.");
  const pixelOffset = view.getUint32(10, true);
  const dibSize = view.getUint32(14, true);

  let width: number;
  let rawHeight: number;
  let bpp: number;
  let compression = 0;
  let paletteSize = 0;
  if (dibSize === 12) {
    width = view.getUint16(18, true);
    rawHeight = view.getInt16(20, true);
    bpp = view.getUint16(24, true);
  } else {
    width = view.getInt32(18, true);
    rawHeight = view.getInt32(22, true);
    bpp = view.getUint16(28, true);
    compression = view.getUint32(30, true);
    paletteSize = view.getUint32(46, true);
  }

  const topDown = rawHeight < 0;
  const height = Math.abs(rawHeight);
  if (width <= 0 || height <= 0) throw new BmpError("Dimensions BMP invalides.");
  if (width * height > maxPixels) throw new BmpError("Image BMP trop grande.");
  if (compression === 1 || compression === 2) throw new BmpError("BMP compressé RLE non pris en charge.");
  if (compression !== 0 && compression !== 3 && compression !== 6) throw new BmpError("Compression BMP non prise en charge.");
  if (![1, 4, 8, 16, 24, 32].includes(bpp)) throw new BmpError("Profondeur BMP non prise en charge.");

  // Channel masks (BI_BITFIELDS in the V3+ header, or right after a 40-byte header).
  let rMask = 0x00ff0000;
  let gMask = 0x0000ff00;
  let bMask = 0x000000ff;
  let aMask = 0;
  if (bpp === 16) {
    rMask = 0x7c00;
    gMask = 0x03e0;
    bMask = 0x001f;
  }
  if (compression === 3 || compression === 6) {
    rMask = view.getUint32(54, true);
    gMask = view.getUint32(58, true);
    bMask = view.getUint32(62, true);
    if (dibSize >= 56 || compression === 6) aMask = view.getUint32(66, true);
  } else if (bpp === 32 && dibSize >= 108) {
    aMask = view.getUint32(66, true) || 0;
  }

  const palette: number[][] = [];
  if (bpp <= 8) {
    const count = paletteSize || 1 << bpp;
    const entry = dibSize === 12 ? 3 : 4;
    const start = 14 + dibSize;
    for (let i = 0; i < count; i++) {
      const o = start + i * entry;
      if (o + 2 >= buf.length) break;
      palette.push([buf[o + 2], buf[o + 1], buf[o]]);
    }
  }

  const rowSize = Math.floor((bpp * width + 31) / 32) * 4;
  if (pixelOffset + rowSize * height > buf.length) throw new BmpError("Fichier BMP tronqué ou corrompu.");

  const out = new Uint8Array(width * height * 4);
  const R = maskShift(rMask);
  const G = maskShift(gMask);
  const B = maskShift(bMask);
  const A = maskShift(aMask);
  const scale = (v: number, bits: number) => (bits >= 8 ? v >>> (bits - 8) : Math.round((v * 255) / ((1 << bits) - 1)));
  let anyAlpha = false;

  for (let y = 0; y < height; y++) {
    const srcRow = pixelOffset + (topDown ? y : height - 1 - y) * rowSize;
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      if (bpp <= 8) {
        const bitPos = x * bpp;
        const byte = buf[srcRow + (bitPos >> 3)];
        const idx = (byte >> (8 - bpp - (bitPos & 7))) & ((1 << bpp) - 1);
        const c = palette[idx] ?? [0, 0, 0];
        out[o] = c[0];
        out[o + 1] = c[1];
        out[o + 2] = c[2];
        out[o + 3] = 255;
      } else if (bpp === 24) {
        const s = srcRow + x * 3;
        out[o] = buf[s + 2];
        out[o + 1] = buf[s + 1];
        out[o + 2] = buf[s];
        out[o + 3] = 255;
      } else {
        const s = srcRow + x * (bpp / 8);
        const v = bpp === 16 ? view.getUint16(s, true) : view.getUint32(s, true);
        out[o] = scale((v & rMask) >>> R.shift, R.bits);
        out[o + 1] = scale((v & gMask) >>> G.shift, G.bits);
        out[o + 2] = scale((v & bMask) >>> B.shift, B.bits);
        if (A.bits) {
          const a = scale((v & aMask) >>> A.shift, A.bits);
          out[o + 3] = a;
          if (a !== 255) anyAlpha = true;
        } else {
          out[o + 3] = 255;
        }
      }
    }
  }

  // Some writers set an alpha mask but leave it all-zero: treat as opaque.
  if (anyAlpha) {
    let allZero = true;
    for (let i = 3; i < out.length; i += 4) if (out[i] !== 0) { allZero = false; break; }
    if (allZero) {
      for (let i = 3; i < out.length; i += 4) out[i] = 255;
      anyAlpha = false;
    }
  }

  return { width, height, data: out, hasAlpha: anyAlpha };
}
