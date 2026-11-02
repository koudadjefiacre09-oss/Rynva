/**
 * Engine invariants on a synthetic portrait built around a real FaceMesh
 * geometry (tests/retouch/fixtures/face-mesh.json, coordinates only).
 *
 * Known defects are injected at known places (red pimples, brown moles,
 * freckles) so the behaviour can be measured, not eyeballed.
 */
import { describe, expect, it } from "vitest";
import fixture from "./fixtures/face-mesh.json";
import { retouchFace } from "@/lib/ai/retouch/skin";
import { FACE_OVAL } from "@/lib/ai/retouch/regions";
import { fillPolygon, labToRgb8, rgbRegionToLab, type Point } from "@/lib/ai/retouch/imageops";
import { RETOUCH_PRESETS, type RetouchSettings } from "@/lib/ai/retouch/settings";

const W = 900;
const H = 1100;
const FACE = { x: 200, y: 140, size: 500 };
const mesh: Point[] = (fixture.mesh as number[][]).map(([x, y]) => [FACE.x + x * FACE.size, FACE.y + y * FACE.size]);
const eyeDistance = Math.hypot(mesh[468][0] - mesh[473][0], mesh[468][1] - mesh[473][1]);

/** Deterministic pseudo-random in [-1, 1]. */
function noise(x: number, y: number) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (s - Math.floor(s)) * 2 - 1;
}

type Spot = { x: number; y: number; r: number; dL: number; da: number; db: number };

function offset(id: number, dx: number, dy: number): [number, number] {
  return [mesh[id][0] + dx * eyeDistance, mesh[id][1] + dy * eyeDistance];
}

const pimples: Spot[] = [
  offset(205, 0, 0),
  offset(425, 0.05, 0.02),
  offset(151, -0.15, 0.05),
  offset(151, 0.2, -0.05),
  offset(199, 0.1, 0.05),
  offset(50, -0.05, 0.12),
].map(([x, y]) => ({ x, y, r: 0.025 * eyeDistance, dL: -5, da: 18, db: 3 }));
const moles: Spot[] = [offset(280, 0.05, 0.08), offset(108, 0, 0.1), offset(425, -0.25, 0.25)].map(([x, y]) => ({
  x, y, r: 0.02 * eyeDistance, dL: -28, da: 3, db: 8,
}));
const freckles: Spot[] = Array.from({ length: 8 }, (_, k) => offset(6, -0.35 + k * 0.1, 0.35 + (k % 2) * 0.06)).map(([x, y]) => ({
  x, y, r: 0.011 * eyeDistance, dL: -9, da: 1, db: 5,
}));

const POLY = (ids: number[]) => ids.map((i) => mesh[i]);
const EYES = [
  [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466],
];
const BROWS = [
  [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
];
const LIPS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];

function render(spots: Spot[]): Buffer {
  const face = new Float32Array(W * H);
  fillPolygon(face, W, H, POLY(FACE_OVAL));
  const eyes = new Float32Array(W * H);
  EYES.forEach((e) => fillPolygon(eyes, W, H, POLY(e)));
  const brows = new Float32Array(W * H);
  BROWS.forEach((b) => fillPolygon(brows, W, H, POLY(b)));
  const lips = new Float32Array(W * H);
  fillPolygon(lips, W, H, POLY(LIPS));

  const rgb = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let L: number, a: number, b: number;
      if (y > 860) {
        // clothes: red/white stripes with a woven texture
        const stripe = Math.floor(x / 18) % 2 === 0;
        L = stripe ? 45 + 3 * noise(x, y) : 92 + 2 * noise(x, y);
        a = stripe ? 55 : 1;
        b = stripe ? 35 : 2;
      } else if (face[i]) {
        // skin: complexion + soft shading + pore-scale texture
        L = 62 + 4 * Math.sin((x - FACE.x) / 120) + 1.8 * noise(x, y);
        a = 14 + 0.6 * noise(x + 7, y);
        b = 18 + 0.6 * noise(x, y + 7);
        if (eyes[i]) { L = 85; a = 0; b = 2; }
        if (brows[i]) { L = 22; a = 4; b = 8; }
        if (lips[i]) { L = 45; a = 38; b = 18; }
      } else if (y < 470) {
        L = 18 + 4 * noise(x, y); a = 6; b = 10; // hair
      } else {
        L = 70; a = -4; b = -22; // background
      }
      for (const s of spots) {
        const d2 = (x - s.x) ** 2 + (y - s.y) ** 2;
        if (d2 > 9 * s.r * s.r) continue;
        const g = Math.exp(-d2 / (2 * s.r * s.r));
        L += s.dL * g; a += s.da * g; b += s.db * g;
      }
      labToRgb8(L, a, b, rgb, i * 3);
    }
  }
  return rgb;
}

function labAt(rgb: Buffer, x: number, y: number) {
  const r = 2;
  const p = rgbRegionToLab(rgb, W, Math.round(x) - r, Math.round(y) - r, 2 * r + 1, 2 * r + 1);
  const avg = (arr: Float32Array) => arr.reduce((t, v) => t + v, 0) / arr.length;
  return [avg(p.L), avg(p.a), avg(p.b)];
}
const dE = (p: number[], q: number[]) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

function run(settings: RetouchSettings) {
  const clean = render([]);
  const input = render([...pimples, ...moles, ...freckles]);
  const output = Buffer.from(input);
  const report = retouchFace(output, W, H, mesh, settings);
  return { clean, input, output, report };
}

describe("retouchFace on a synthetic portrait", () => {
  const natural = run({ ...RETOUCH_PRESETS.natural, intensity: 100 });

  it("finds a face big enough to retouch", () => {
    expect(eyeDistance).toBeGreaterThan(100);
    expect(natural.report.retouched).toBe(true);
  });

  it("never touches clothes, hair or background (bit-identical)", () => {
    const { input, output } = natural;
    let changedClothes = 0;
    let changedOutsideFace = 0;
    const face = new Float32Array(W * H);
    fillPolygon(face, W, H, POLY(FACE_OVAL));
    for (let i = 0; i < W * H; i++) {
      const diff = input[i * 3] !== output[i * 3] || input[i * 3 + 1] !== output[i * 3 + 1] || input[i * 3 + 2] !== output[i * 3 + 2];
      if (!diff) continue;
      const y = Math.floor(i / W);
      if (y > 860) changedClothes++;
      // allow the forehead extension above the oval, nothing else
      const x = i % W;
      const nearFace = face[i] || (y < mesh[10][1] && y > mesh[10][1] - 0.4 * eyeDistance && Math.abs(x - mesh[10][0]) < 1.2 * eyeDistance);
      if (!nearFace) changedOutsideFace++;
    }
    expect(changedClothes).toBe(0);
    expect(changedOutsideFace).toBe(0);
  });

  it("removes red pimples (≥ 65 % of their visibility)", () => {
    const { clean, input, output, report } = natural;
    expect(report.blemishesCorrected).toBeGreaterThanOrEqual(pimples.length - 1);
    for (const p of pimples) {
      const before = dE(labAt(input, p.x, p.y), labAt(clean, p.x, p.y));
      const after = dE(labAt(output, p.x, p.y), labAt(clean, p.x, p.y));
      expect(after / before).toBeLessThan(0.35);
    }
  });

  it("keeps moles and freckles (identity marks)", () => {
    const { clean, input, output } = natural;
    for (const m of moles) {
      const before = dE(labAt(input, m.x, m.y), labAt(clean, m.x, m.y));
      const after = dE(labAt(output, m.x, m.y), labAt(clean, m.x, m.y));
      expect(after / before).toBeGreaterThan(0.8);
    }
    for (const f of freckles) {
      const before = dE(labAt(input, f.x, f.y), labAt(clean, f.x, f.y));
      const after = dE(labAt(output, f.x, f.y), labAt(clean, f.x, f.y));
      expect(after / before).toBeGreaterThan(0.7);
    }
  });

  it("keeps the complexion (mean skin colour shift < 1 ΔE) and the pore texture", () => {
    const { input, output } = natural;
    // clean cheek patch away from injected spots
    const [cx, cy] = offset(330, 0, 0);
    const size = Math.round(0.25 * eyeDistance);
    const a = rgbRegionToLab(input, W, Math.round(cx), Math.round(cy), size, size);
    const b = rgbRegionToLab(output, W, Math.round(cx), Math.round(cy), size, size);
    const mean = (arr: Float32Array) => arr.reduce((t, v) => t + v, 0) / arr.length;
    expect(Math.hypot(mean(a.L) - mean(b.L), mean(a.a) - mean(b.a), mean(a.b) - mean(b.b))).toBeLessThan(1);
    // texture: std of the pixel-to-pixel L differences
    const roughness = (p: Float32Array) => {
      let s = 0;
      for (let i = 1; i < p.length; i++) s += (p[i] - p[i - 1]) ** 2;
      return Math.sqrt(s / (p.length - 1));
    };
    expect(roughness(b.L) / roughness(a.L)).toBeGreaterThan(0.75);
  });

  it("leaves eyes, brows and lips untouched when sharpening is off", () => {
    const { input, output } = run({ ...RETOUCH_PRESETS.intense, sharpness: 0 });
    const features = new Float32Array(W * H);
    [...EYES, ...BROWS, LIPS].forEach((ids) => fillPolygon(features, W, H, POLY(ids)));
    let changed = 0;
    for (let i = 0; i < W * H; i++) {
      if (!features[i]) continue;
      if (input[i * 3] !== output[i * 3] || input[i * 3 + 1] !== output[i * 3 + 1] || input[i * 3 + 2] !== output[i * 3 + 2]) changed++;
    }
    expect(changed).toBe(0);
  });

  it("does nothing at all when every control is at 0", () => {
    const zero: RetouchSettings = { smoothing: 0, blemishes: 0, darkCircles: 0, shine: 0, sharpness: 0, denoise: 0, intensity: 100, photoCorrections: false };
    const { input, output } = run(zero);
    expect(Buffer.compare(input, output)).toBe(0);
  });

  it("skips faces too small to retouch safely", () => {
    const tiny = mesh.map(([x, y]) => [x * 0.1, y * 0.1] as Point);
    const out = Buffer.alloc(W * H * 3, 128);
    const report = retouchFace(out, W, H, tiny, RETOUCH_PRESETS.natural);
    expect(report.retouched).toBe(false);
  });
});
