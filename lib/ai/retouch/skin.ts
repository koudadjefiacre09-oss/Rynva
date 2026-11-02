/**
 * Skin retouch stage. Local, non-generative and identity-preserving:
 *
 * The face is split, in CIELAB, into frequency bands relative to its own
 * scale (inter-ocular distance d):
 *   - high band (< ~0.007 d) : pores, fine texture  → kept
 *   - mid band               : blotchiness, blemishes → corrected
 *   - low band (> ~0.045 d)  : shading = morphology   → kept
 * so the shape of the face and its texture never change; only small
 * irregularities in between are reduced.
 *
 * Blemishes are "red-dominant" spots: an inflamed pimple is redder than its
 * surroundings (a* up) more than it is darker. Moles and freckles are
 * melanin (darker, not redder) and are deliberately left alone.
 */
import {
  gaussianBlur,
  normalizedBlur,
  smoothstep,
  quantile,
  rgbRegionToLab,
  labToRgb8,
  type Point,
} from "@/lib/ai/retouch/imageops";
import { buildFaceMasks, faceGeometry, type FaceMasks } from "@/lib/ai/retouch/regions";
import type { RetouchSettings } from "@/lib/ai/retouch/settings";

export interface FaceRetouchReport {
  retouched: boolean;
  /** Why a face was skipped, if it was. */
  skippedReason?: string;
  blemishesCorrected: number;
  eyeDistance: number;
  /** Count of pixels actually changed (for tests / diagnostics). */
  changedPixels: number;
}

export interface FaceRetouchDebug {
  roi: { x: number; y: number; w: number; h: number };
  masks: FaceMasks;
  blemishMask: Float32Array;
}

/** Below this inter-ocular distance a face is too small to retouch meaningfully. */
const MIN_EYE_DISTANCE = 22;

function absMedian(values: Float32Array, weights: Float32Array, threshold = 0.5): number {
  const picked: number[] = [];
  const step = Math.max(1, Math.floor(values.length / 60000));
  for (let i = 0; i < values.length; i += step) if (weights[i] > threshold) picked.push(Math.abs(values[i]));
  return quantile(picked, 0.5);
}

/**
 * Keeps only blemish-shaped components of `raw` (in place) and returns how
 * many were kept. A pimple is a compact, roughly round spot: elongated
 * structures (cast shadows of glasses, creases, lip line) and large areas
 * are rejected, whatever their colour.
 */
function keepBlemishShapedBlobs(raw: Float32Array, w: number, h: number, minArea: number, maxArea: number): number {
  const label = new Int32Array(w * h).fill(-1);
  const stack: number[] = [];
  const members: number[] = [];
  let kept = 0;
  for (let start = 0; start < w * h; start++) {
    if (label[start] !== -1 || raw[start] <= 0.05) continue;
    members.length = 0;
    stack.push(start);
    label[start] = start;
    let sw = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, core = 0;
    while (stack.length) {
      const j = stack.pop()!;
      members.push(j);
      const x = j % w;
      const y = (j - x) / w;
      const v = raw[j];
      if (v > 0.25) core++;
      sw += v; sx += v * x; sy += v * y; sxx += v * x * x; syy += v * y * y; sxy += v * x * y;
      const nb = [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, y > 0 ? j - w : -1, y < h - 1 ? j + w : -1];
      for (const k of nb) {
        if (k >= 0 && label[k] === -1 && raw[k] > 0.05) {
          label[k] = start;
          stack.push(k);
        }
      }
    }
    let accept = core >= minArea && members.length <= maxArea && sw > 0;
    if (accept) {
      const mx = sx / sw, my = sy / sw;
      const cxx = sxx / sw - mx * mx, cyy = syy / sw - my * my, cxy = sxy / sw - mx * my;
      const tr = cxx + cyy;
      const disc = Math.sqrt(Math.max(0, (cxx - cyy) * (cxx - cyy) / 4 + cxy * cxy));
      const major = tr / 2 + disc;
      const minor = Math.max(1e-6, tr / 2 - disc);
      if (major / minor > 6.25) accept = false; // axis ratio > 2.5
    }
    if (accept) kept++;
    else for (const j of members) raw[j] = 0;
  }
  return kept;
}

/**
 * Retouches one face in place in `rgb` (interleaved 8-bit, `imageWidth` wide).
 * Pixels whose colour does not actually change keep their exact original bytes.
 */
export function retouchFace(
  rgb: Buffer,
  imageWidth: number,
  imageHeight: number,
  mesh: Point[],
  settings: RetouchSettings,
  debug?: (info: FaceRetouchDebug) => void
): FaceRetouchReport {
  const geo = faceGeometry(mesh, imageWidth, imageHeight);
  const d = geo.eyeDistance;
  if (!(d >= MIN_EYE_DISTANCE)) {
    return { retouched: false, skippedReason: "visage trop petit", blemishesCorrected: 0, eyeDistance: d, changedPixels: 0 };
  }

  const { x: rx, y: ry, w, h } = geo.roi;
  const n = w * h;
  const lab = rgbRegionToLab(rgb, imageWidth, rx, ry, w, h);
  const L0 = Float32Array.from(lab.L);
  const a0 = Float32Array.from(lab.a);
  const b0 = Float32Array.from(lab.b);
  const { L, a, b } = lab;

  const masks = buildFaceMasks(mesh, geo, lab);
  const { skin, blemishZone, protectedFeatures, underEye, cheekRefs } = masks;

  const s = {
    smoothing: settings.smoothing / 100,
    blemishes: settings.blemishes / 100,
    darkCircles: settings.darkCircles / 100,
    shine: settings.shine / 100,
    sharpness: settings.sharpness / 100,
    denoise: settings.denoise / 100,
  };

  const sigmaHi = Math.max(0.7, 0.007 * d);
  const sigmaMid = Math.max(2, 0.045 * d);

  // --- 1. Blemishes (heal from surrounding skin, keep pore texture) --------
  const blemishMask = new Float32Array(n);
  let blemishesCorrected = 0;
  if (s.blemishes > 0) {
    const s1 = Math.max(0.9, 0.01 * d);
    const s2 = Math.max(3, 0.06 * d);
    const g1L = gaussianBlur(L, w, h, s1);
    const g2L = gaussianBlur(L, w, h, s2);
    const g1a = gaussianBlur(a, w, h, s1);
    const g2a = gaussianBlur(a, w, h, s2);
    const tR = 5.5 - 3.3 * s.blemishes; // a* units above surroundings
    const raw = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      if (blemishZone[i] < 0.3) continue;
      const red = g1a[i] - g2a[i];
      const dark = g2L[i] - g1L[i];
      if (red <= tR || dark < -2.5) continue;
      // Red-dominant only: a mole/freckle is darker far more than redder.
      const redDominance = smoothstep(0.35, 0.8, red / (Math.max(dark, 0) + 0.75));
      raw[i] = smoothstep(tR, tR * 1.8, red) * redDominance * blemishZone[i];
    }
    blemishesCorrected = keepBlemishShapedBlobs(
      raw,
      w,
      h,
      Math.max(2, Math.round((0.012 * d) ** 2)),
      Math.round(Math.PI * (0.09 * d) ** 2)
    );
    const grown = gaussianBlur(raw, w, h, s1 * 1.3);
    for (let i = 0; i < n; i++) blemishMask[i] = Math.min(1, 2.4 * grown[i]) * blemishZone[i];

    if (blemishesCorrected > 0) {
      const healWeights = new Float32Array(n);
      for (let i = 0; i < n; i++) healWeights[i] = skin[i] * Math.max(0, 1 - 3 * Math.min(1, 4 * grown[i]));
      const sigmaHeal = Math.max(2, 0.03 * d);
      const SL = normalizedBlur(L, healWeights, w, h, sigmaHeal);
      const Sa = normalizedBlur(a, healWeights, w, h, sigmaHeal);
      const Sb = normalizedBlur(b, healWeights, w, h, sigmaHeal);
      const baseL = gaussianBlur(L, w, h, sigmaHi);
      const hiL = new Float32Array(n);
      for (let i = 0; i < n; i++) hiL[i] = L[i] - baseL[i];
      const texture = 1.4826 * absMedian(hiL, skin) + 0.3;
      const k = 0.6 + 0.4 * s.blemishes;
      for (let i = 0; i < n; i++) {
        const m = blemishMask[i];
        if (m < 1e-3) continue;
        const hi = Math.max(-2.5 * texture, Math.min(2.5 * texture, hiL[i]));
        L[i] += k * m * (SL[i] + hi - L[i]);
        a[i] += k * m * (Sa[i] - a[i]);
        b[i] += k * m * (Sb[i] - b[i]);
      }
    }

    // Diffuse local redness (keeps the overall complexion: only the excess
    // over the large-scale local mean is reduced).
    const ga = gaussianBlur(a, w, h, Math.max(6, 0.2 * d));
    for (let i = 0; i < n; i++) {
      if (skin[i] < 1e-3) continue;
      const excess = a[i] - ga[i] - 1.5;
      if (excess > 0) a[i] -= s.blemishes * 0.4 * excess * skin[i];
    }
  }

  // --- 2. Band-pass smoothing with coring (keeps pores and marked lines) --
  if (s.smoothing > 0) {
    const hiL = gaussianBlur(L, w, h, sigmaHi);
    const midL = gaussianBlur(L, w, h, sigmaMid);
    const band = new Float32Array(n);
    for (let i = 0; i < n; i++) band[i] = hiL[i] - midL[i];
    const tau = 2.2 * 1.4826 * absMedian(band, skin) + 0.5;
    for (let i = 0; i < n; i++) {
      if (skin[i] < 1e-3) continue;
      const v = band[i];
      // Small irregularities are reduced; strong structures (wrinkles,
      // nose/eyelid creases) fall off the gaussian and are mostly kept.
      const att = s.smoothing * 0.8 * skin[i] * Math.exp(-0.5 * (v / tau) * (v / tau));
      L[i] -= att * v;
    }
    // Colour evenness (blotches) on a*/b* mid band.
    for (const plane of [a, b]) {
      const hi = gaussianBlur(plane, w, h, sigmaHi);
      const mid = gaussianBlur(plane, w, h, sigmaMid * 1.5);
      for (let i = 0; i < n; i++) {
        if (skin[i] < 1e-3) continue;
        plane[i] -= s.smoothing * 0.65 * skin[i] * (hi[i] - mid[i]);
      }
    }
  }

  // --- 3. Shine (specular hot-spots: brighter and less saturated) ---------
  if (s.shine > 0) {
    const sigmaShine = Math.max(4, 0.12 * d);
    const gL = gaussianBlur(L, w, h, sigmaShine);
    const C = new Float32Array(n);
    for (let i = 0; i < n; i++) C[i] = Math.hypot(a[i], b[i]);
    const gC = gaussianBlur(C, w, h, sigmaShine);
    for (let i = 0; i < n; i++) {
      if (skin[i] < 1e-3) continue;
      const lRel = L[i] - gL[i];
      if (lRel <= 2) continue;
      const cRatio = C[i] / (gC[i] + 0.5);
      const wgt = smoothstep(2, 9, lRel) * smoothstep(1.05, 0.7, cRatio) * skin[i];
      if (wgt < 1e-3) continue;
      L[i] -= s.shine * 0.65 * wgt * (lRel - 1.5);
      const f = 1 + s.shine * 0.6 * wgt * (Math.min(1.6, 1 / Math.max(cRatio, 0.3)) - 1);
      a[i] *= f;
      b[i] *= f;
    }
  }

  // --- 4. Dark circles (low-frequency lift towards the cheek tone) --------
  if (s.darkCircles > 0) {
    const sigmaLow = Math.max(1.5, 0.025 * d);
    const lowL = gaussianBlur(L, w, h, sigmaLow);
    const lowA = gaussianBlur(a, w, h, sigmaLow);
    const lowB = gaussianBlur(b, w, h, sigmaLow);
    const valid = cheekRefs.filter((r) => Number.isFinite(r.L));
    if (valid.length) {
      // Use the average of both cheeks when available (robust to one-sided light).
      const ref = {
        L: valid.reduce((t, r) => t + r.L, 0) / valid.length,
        a: valid.reduce((t, r) => t + r.a, 0) / valid.length,
        b: valid.reduce((t, r) => t + r.b, 0) / valid.length,
      };
      for (let i = 0; i < n; i++) {
        const m = underEye[i];
        if (m < 1e-3) continue;
        const dL = Math.max(0, Math.min(18, ref.L - lowL[i]));
        L[i] += s.darkCircles * 0.7 * m * dL;
        a[i] += s.darkCircles * 0.45 * m * (ref.a - lowA[i]);
        b[i] += s.darkCircles * 0.45 * m * (ref.b - lowB[i]);
      }
    }
  }

  // --- 5. Noise reduction on skin (chroma first, light luminance coring) --
  if (s.denoise > 0) {
    const sigmaC = Math.max(1, 2 * sigmaHi);
    for (const plane of [a, b]) {
      const blurred = gaussianBlur(plane, w, h, sigmaC);
      for (let i = 0; i < n; i++) if (skin[i] > 1e-3) plane[i] += s.denoise * 0.8 * skin[i] * (blurred[i] - plane[i]);
    }
    const base = gaussianBlur(L, w, h, sigmaHi);
    const hi = new Float32Array(n);
    for (let i = 0; i < n; i++) hi[i] = L[i] - base[i];
    const noise = 1.4826 * absMedian(hi, skin) + 0.2;
    for (let i = 0; i < n; i++) {
      if (skin[i] < 1e-3) continue;
      const v = hi[i];
      L[i] -= s.denoise * 0.45 * skin[i] * v * Math.exp(-(v / noise) * (v / noise));
    }
  }

  // --- 6. Subtle sharpening of eyes, brows and lips only -------------------
  if (s.sharpness > 0) {
    const blurred = gaussianBlur(L, w, h, Math.max(0.6, 0.004 * d));
    for (let i = 0; i < n; i++) {
      const m = protectedFeatures[i];
      if (m < 1e-3) continue;
      L[i] += s.sharpness * 0.9 * m * (L[i] - blurred[i]);
    }
  }

  debug?.({ roi: geo.roi, masks, blemishMask });

  // --- write back only pixels that really changed --------------------------
  let changedPixels = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const delta = Math.abs(L[i] - L0[i]) + Math.abs(a[i] - a0[i]) + Math.abs(b[i] - b0[i]);
      if (delta < 0.15) continue;
      labToRgb8(L[i], a[i], b[i], rgb, ((ry + y) * imageWidth + rx + x) * 3);
      changedPixels++;
    }
  }

  return { retouched: true, blemishesCorrected, eyeDistance: d, changedPixels };
}
