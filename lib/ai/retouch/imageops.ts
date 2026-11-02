/**
 * Low-level float image operations used by the retouch engine.
 * Planes are row-major Float32Arrays of size w*h.
 */

/** Box sizes whose 3 successive passes approximate a gaussian of `sigma`. */
function boxRadii(sigma: number, passes = 3): number[] {
  const ideal = Math.sqrt((12 * sigma * sigma) / passes + 1);
  let wl = Math.floor(ideal);
  if (wl % 2 === 0) wl--;
  const wu = wl + 2;
  const m = Math.round((12 * sigma * sigma - passes * wl * wl - 4 * passes * wl - 3 * passes) / (-4 * wl - 4));
  const sizes: number[] = [];
  for (let i = 0; i < passes; i++) sizes.push(i < m ? wl : wu);
  return sizes.map((s) => (s - 1) / 2);
}

function boxH(src: Float32Array, dst: Float32Array, w: number, h: number, r: number) {
  const norm = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    const first = src[row];
    let acc = (r + 1) * first;
    for (let x = 0; x < r; x++) acc += src[row + Math.min(x, w - 1)];
    for (let x = 0; x < w; x++) {
      acc += src[row + Math.min(x + r, w - 1)] - (x - r - 1 >= 0 ? src[row + x - r - 1] : first);
      dst[row + x] = acc * norm;
    }
  }
}

function boxV(src: Float32Array, dst: Float32Array, w: number, h: number, r: number) {
  const norm = 1 / (2 * r + 1);
  for (let x = 0; x < w; x++) {
    const first = src[x];
    let acc = (r + 1) * first;
    for (let y = 0; y < r; y++) acc += src[Math.min(y, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      acc += src[Math.min(y + r, h - 1) * w + x] - (y - r - 1 >= 0 ? src[(y - r - 1) * w + x] : first);
      dst[y * w + x] = acc * norm;
    }
  }
}

/** Gaussian blur (3-pass box approximation, O(n) whatever sigma). */
export function gaussianBlur(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
  const out = new Float32Array(src);
  if (sigma < 0.35) return out;
  const tmp = new Float32Array(src.length);
  for (const r of boxRadii(sigma)) {
    const radius = Math.max(0, Math.round(r));
    if (radius === 0) continue;
    boxH(out, tmp, w, h, radius);
    boxV(tmp, out, w, h, radius);
  }
  return out;
}

/**
 * Normalized convolution: blur of (values * weights) / blur(weights).
 * Fills holes (weight 0) from their weighted surroundings, used to "heal"
 * blemishes from the healthy skin around them.
 */
export function normalizedBlur(
  values: Float32Array,
  weights: Float32Array,
  w: number,
  h: number,
  sigma: number
): Float32Array {
  const vw = new Float32Array(values.length);
  for (let i = 0; i < values.length; i++) vw[i] = values[i] * weights[i];
  const num = gaussianBlur(vw, w, h, sigma);
  const den = gaussianBlur(weights, w, h, sigma);
  const fallback = gaussianBlur(values, w, h, sigma);
  for (let i = 0; i < num.length; i++) num[i] = den[i] > 1e-3 ? num[i] / den[i] : fallback[i];
  return num;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// ---------- colour ---------------------------------------------------------

const SRGB_TO_LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  SRGB_TO_LINEAR[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return c * 255;
}

// D65 reference white
const XN = 0.95047;
const YN = 1.0;
const ZN = 1.08883;
const EPS = 216 / 24389;
const KAPPA = 24389 / 27;

function fLab(t: number) {
  return t > EPS ? Math.cbrt(t) : (KAPPA * t + 16) / 116;
}
function fLabInv(t: number) {
  const t3 = t * t * t;
  return t3 > EPS ? t3 : (116 * t - 16) / KAPPA;
}

export interface LabPlanes {
  L: Float32Array;
  a: Float32Array;
  b: Float32Array;
  w: number;
  h: number;
}

/** Converts an RGB region [x0,y0,w,h] of an interleaved 8-bit image to CIELAB planes. */
export function rgbRegionToLab(
  rgb: Uint8Array,
  imageWidth: number,
  x0: number,
  y0: number,
  w: number,
  h: number
): LabPlanes {
  const n = w * h;
  const L = new Float32Array(n);
  const A = new Float32Array(n);
  const B = new Float32Array(n);
  for (let y = 0; y < h; y++) {
    let src = ((y0 + y) * imageWidth + x0) * 3;
    let dst = y * w;
    for (let x = 0; x < w; x++, src += 3, dst++) {
      const r = SRGB_TO_LINEAR[rgb[src]];
      const g = SRGB_TO_LINEAR[rgb[src + 1]];
      const bl = SRGB_TO_LINEAR[rgb[src + 2]];
      const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * bl) / XN;
      const Y = (0.2126729 * r + 0.7151522 * g + 0.072175 * bl) / YN;
      const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * bl) / ZN;
      const fx = fLab(X);
      const fy = fLab(Y);
      const fz = fLab(Z);
      L[dst] = 116 * fy - 16;
      A[dst] = 500 * (fx - fy);
      B[dst] = 200 * (fy - fz);
    }
  }
  return { L, a: A, b: B, w, h };
}

/** Converts one Lab pixel back to 8-bit sRGB (clamped, rounded). */
export function labToRgb8(L: number, a: number, b: number, out: Uint8Array | Buffer, offset: number) {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const X = fLabInv(fx) * XN;
  const Y = (L > KAPPA * EPS ? fy * fy * fy : L / KAPPA) * YN;
  const Z = fLabInv(fz) * ZN;
  const r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
  const g = -0.969266 * X + 1.8760108 * Y + 0.041556 * Z;
  const bl = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;
  out[offset] = Math.min(255, Math.max(0, Math.round(linearToSrgb(Math.max(0, r)))));
  out[offset + 1] = Math.min(255, Math.max(0, Math.round(linearToSrgb(Math.max(0, g)))));
  out[offset + 2] = Math.min(255, Math.max(0, Math.round(linearToSrgb(Math.max(0, bl)))));
}

// ---------- geometry -------------------------------------------------------

export type Point = [number, number];

/** Rasterises a closed polygon (even-odd) into `mask` (w*h) with value 1. */
export function fillPolygon(mask: Float32Array, w: number, h: number, poly: Point[], value = 1) {
  if (poly.length < 3) return;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of poly) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(h - 1, Math.ceil(maxY));
  const xs: number[] = [];
  for (let y = y0; y <= y1; y++) {
    const sy = y + 0.5;
    xs.length = 0;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if ((yi > sy) !== (yj > sy)) xs.push(xi + ((sy - yi) / (yj - yi)) * (xj - xi));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.max(0, Math.ceil(xs[k] - 0.5));
      const xb = Math.min(w - 1, Math.floor(xs[k + 1] - 0.5));
      for (let x = xa; x <= xb; x++) mask[y * w + x] = value;
    }
  }
}

/** Value at the given fraction (0..1) of the samples (copy-sorted). */
export function quantile(values: Float32Array | number[], q: number): number {
  if (values.length === 0) return 0;
  const sorted = Float32Array.from(values).sort();
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))));
  return sorted[idx];
}
