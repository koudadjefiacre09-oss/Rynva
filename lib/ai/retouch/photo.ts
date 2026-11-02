/**
 * Optional whole-photo corrections (off by default): exposure, white
 * balance, natural contrast, shadows and highlights. All of them are capped
 * so the photo keeps its own style; exposure is measured on the whole frame,
 * never on skin, so a darker complexion is never "brightened" artificially.
 */
import { gaussianBlur, smoothstep } from "@/lib/ai/retouch/imageops";

const TO_LINEAR = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  TO_LINEAR[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function toSrgb8(v: number): number {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055;
  return Math.min(255, Math.max(0, Math.round(c * 255)));
}

/** CIE L* (0-100) from linear luminance Y. */
function lStar(Y: number) {
  return Y > 216 / 24389 ? 116 * Math.cbrt(Y) - 16 : (24389 / 27) * Y;
}
function yFromL(L: number) {
  const fy = (L + 16) / 116;
  return L > 8 ? fy * fy * fy : L / (24389 / 27);
}

export interface PhotoCorrectionReport {
  exposureGain: number;
  whiteBalanceGains: [number, number, number];
}

export function applyPhotoCorrections(rgb: Buffer, width: number, height: number): PhotoCorrectionReport {
  const n = width * height;

  // Stats on a ~512px grid.
  const step = Math.max(1, Math.round(Math.sqrt(n / 262144)));
  const gw = Math.ceil(width / step);
  const gh = Math.ceil(height / step);
  const gridL = new Float32Array(gw * gh);
  const lValues: number[] = [];
  let nr = 0, ng = 0, nb = 0, neutralCount = 0;
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const o = (Math.min(height - 1, gy * step) * width + Math.min(width - 1, gx * step)) * 3;
      const r = TO_LINEAR[rgb[o]], g = TO_LINEAR[rgb[o + 1]], b = TO_LINEAR[rgb[o + 2]];
      const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const L = lStar(Y);
      gridL[gy * gw + gx] = L;
      lValues.push(L);
      // Near-neutral, well-exposed pixels drive the white balance estimate.
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      if (L > 25 && L < 92 && max > 0 && (max - min) / max < 0.12) {
        nr += r; ng += g; nb += b; neutralCount++;
      }
    }
  }
  lValues.sort((p, q) => p - q);
  const pct = (q: number) => lValues[Math.min(lValues.length - 1, Math.floor(q * (lValues.length - 1)))];
  const p50 = pct(0.5);
  const p995 = pct(0.995);

  // Exposure: at most ±0.3 EV, never pushes highlights into clipping.
  let gain = 1;
  if (p995 < 90) gain = yFromL(Math.min(94, p995 + 6)) / Math.max(1e-4, yFromL(p995));
  if (p50 < 30) gain = Math.max(gain, yFromL(Math.min(40, p50 + 8)) / Math.max(1e-4, yFromL(p50)));
  if (p50 > 78 && p995 >= 99) gain = 0.92;
  gain = Math.min(1.23, Math.max(0.81, gain));
  const headroom = 1 / Math.max(1e-4, yFromL(Math.min(100, p995)));
  gain = Math.min(gain, Math.max(1, headroom));

  // White balance: half-way towards grey, ±6 % per channel max, and only if
  // enough neutral pixels exist to trust the estimate.
  let wb: [number, number, number] = [1, 1, 1];
  if (neutralCount > 0.02 * gw * gh) {
    const avg = (nr + ng + nb) / 3;
    wb = [avg / nr, avg / ng, avg / nb].map((g) => Math.min(1.06, Math.max(0.94, 1 + 0.5 * (g - 1)))) as [number, number, number];
  }

  // Local base luminance for shadows (blurred low-res map, bilinear lookup).
  const base = gaussianBlur(gridL, gw, gh, Math.max(2, 0.02 * Math.hypot(gw, gh)));
  const baseAt = (x: number, y: number) => {
    const fx = Math.min(gw - 1, x / step), fy = Math.min(gh - 1, y / step);
    const x0 = Math.floor(fx), y0 = Math.floor(fy);
    const x1 = Math.min(gw - 1, x0 + 1), y1 = Math.min(gh - 1, y0 + 1);
    const tx = fx - x0, ty = fy - y0;
    return (
      base[y0 * gw + x0] * (1 - tx) * (1 - ty) +
      base[y0 * gw + x1] * tx * (1 - ty) +
      base[y1 * gw + x0] * (1 - tx) * ty +
      base[y1 * gw + x1] * tx * ty
    );
  };

  const contrast = 0.08;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 3;
      const r = TO_LINEAR[rgb[o]] * gain * wb[0];
      const g = TO_LINEAR[rgb[o + 1]] * gain * wb[1];
      const b = TO_LINEAR[rgb[o + 2]] * gain * wb[2];
      const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (Y <= 0) {
        rgb[o] = toSrgb8(r); rgb[o + 1] = toSrgb8(g); rgb[o + 2] = toSrgb8(b);
        continue;
      }
      const L = lStar(Y);
      let L2 = L;
      const t = (L - 50) / 50;
      L2 += contrast * (L - 50) * (1 - t * t); // gentle S-curve, fixed ends
      L2 += 7 * smoothstep(35, 6, baseAt(x, y)) * (1 - L / 100); // shadows
      if (L2 > 82) L2 -= 0.3 * smoothstep(82, 99, L2) * (L2 - 82); // highlights
      const ratio = yFromL(Math.max(0, Math.min(100, L2))) / Y; // luminance-only change keeps hue
      rgb[o] = toSrgb8(r * ratio);
      rgb[o + 1] = toSrgb8(g * ratio);
      rgb[o + 2] = toSrgb8(b * ratio);
    }
  }

  return { exposureGain: gain, whiteBalanceGains: wb };
}
