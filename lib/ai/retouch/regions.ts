/**
 * Segmentation stage: turns MediaPipe FaceMesh landmarks into soft masks.
 *
 * - skin       : face oval minus eyes, brows and lips, gated by colour
 *                similarity to the person's own skin (excludes hair strands,
 *                glasses frames, jewellery, hats, scarves...). Everything
 *                outside the face oval (clothes, hair, background) is 0 and is
 *                therefore never modified.
 * - protected  : eyes, brows and lips (identity features), never smoothed.
 * - underEye   : the band under each lower eyelid, for dark circles.
 */
import { fillPolygon, gaussianBlur, smoothstep, quantile, type LabPlanes, type Point } from "@/lib/ai/retouch/imageops";

// MediaPipe FaceMesh canonical indices.
export const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];
const RIGHT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
const LEFT_EYE = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466];
const RIGHT_BROW = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
const LEFT_BROW = [300, 293, 334, 296, 336, 285, 295, 282, 283, 276];
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
const RIGHT_LOWER_LID = [33, 7, 163, 144, 145, 153, 154, 155, 133];
const LEFT_LOWER_LID = [263, 249, 390, 373, 374, 380, 381, 382, 362];
// Nostril openings (dark by nature, not blemishes).
const RIGHT_NOSTRIL = [98, 64, 240, 75, 60, 20, 242, 141, 94, 2, 97, 99];
// Upward extension (× inter-ocular distance) of the oval's forehead points.
const FOREHEAD_LIFT: Record<number, number> = {
  10: 0.32, 338: 0.3, 109: 0.3, 297: 0.26, 67: 0.26, 332: 0.2, 103: 0.2, 284: 0.12, 54: 0.12, 251: 0.05, 21: 0.05,
};
// "Sure skin" probes: cheeks, forehead, nose bridge, chin.
const SKIN_PROBES = [50, 280, 205, 425, 151, 108, 337, 6, 199, 118, 347];
const LEFT_NOSTRIL = [327, 294, 460, 305, 290, 250, 462, 370, 94, 2, 326, 328];

export interface FaceGeometry {
  /** Region of interest in image pixels. */
  roi: { x: number; y: number; w: number; h: number };
  /** Inter-ocular distance in pixels: the scale every radius derives from. */
  eyeDistance: number;
}

export interface FaceMasks {
  skin: Float32Array;
  /** Where blemishes may be detected and healed (skin with small holes filled). */
  blemishZone: Float32Array;
  protectedFeatures: Float32Array;
  underEye: Float32Array;
  /** Reference skin tone just below each eye (for dark circles), per eye. */
  cheekRefs: { L: number; a: number; b: number; mask: Float32Array }[];
}

function dist(p: Point, q: Point) {
  return Math.hypot(p[0] - q[0], p[1] - q[1]);
}

function centroid(points: Point[]): Point {
  let x = 0;
  let y = 0;
  for (const p of points) { x += p[0]; y += p[1]; }
  return [x / points.length, y / points.length];
}

/** Scales a polygon around its centroid (cheap, shape-preserving dilation). */
function scalePoly(points: Point[], factor: number): Point[] {
  const c = centroid(points);
  return points.map(([x, y]) => [c[0] + (x - c[0]) * factor, c[1] + (y - c[1]) * factor]);
}

export function faceGeometry(mesh: Point[], imageWidth: number, imageHeight: number): FaceGeometry {
  const rightIris = mesh[468] ?? centroid(RIGHT_EYE.map((i) => mesh[i]));
  const leftIris = mesh[473] ?? centroid(LEFT_EYE.map((i) => mesh[i]));
  const eyeDistance = dist(rightIris, leftIris);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const i of FACE_OVAL) {
    const [x, y] = mesh[i];
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const pad = 0.15 * Math.max(maxX - minX, maxY - minY);
  const x = Math.max(0, Math.floor(minX - pad));
  const y = Math.max(0, Math.floor(minY - pad));
  const x1 = Math.min(imageWidth, Math.ceil(maxX + pad));
  const y1 = Math.min(imageHeight, Math.ceil(maxY + pad));
  return { roi: { x, y, w: Math.max(1, x1 - x), h: Math.max(1, y1 - y) }, eyeDistance };
}

function median(values: number[]): number {
  return quantile(values, 0.5);
}

export function buildFaceMasks(mesh: Point[], geo: FaceGeometry, lab: LabPlanes): FaceMasks {
  const { w, h } = lab;
  const n = w * h;
  const d = geo.eyeDistance;
  const local = (i: number): Point => [mesh[i][0] - geo.roi.x, mesh[i][1] - geo.roi.y];
  const poly = (ids: number[]) => ids.map(local);

  // 1. Face oval, faded inwards so the jaw line and hairline blend softly.
  //    MediaPipe's oval stops mid-forehead: its upper points are pushed up
  //    (the colour gate below keeps hair out of the mask anyway).
  const chinPt = local(152);
  const topPt = local(10);
  const upLen = Math.hypot(topPt[0] - chinPt[0], topPt[1] - chinPt[1]) || 1;
  const up: Point = [(topPt[0] - chinPt[0]) / upLen, (topPt[1] - chinPt[1]) / upLen];
  const ovalPoly = FACE_OVAL.map((id) => {
    const p = local(id);
    const lift = (FOREHEAD_LIFT[id] ?? 0) * d;
    return [p[0] + up[0] * lift, p[1] + up[1] * lift] as Point;
  });
  const ovalHard = new Float32Array(n);
  fillPolygon(ovalHard, w, h, ovalPoly);
  const ovalBlur = gaussianBlur(ovalHard, w, h, Math.max(1.5, 0.05 * d));
  const oval = new Float32Array(n);
  for (let i = 0; i < n; i++) oval[i] = ovalHard[i] * smoothstep(0.5, 0.95, ovalBlur[i]);

  // 2. Protected identity features (slightly dilated to keep lashes and lip line).
  //    Each feature is drawn as-is AND enlarged: brows are arched (non
  //    convex), so the enlarged copy alone would miss parts of the original.
  const protHard = new Float32Array(n);
  for (const [ids, factor] of [
    [RIGHT_EYE, 1.45],
    [LEFT_EYE, 1.45],
    [RIGHT_BROW, 1.3],
    [LEFT_BROW, 1.3],
    [LIPS_OUTER, 1.12],
  ] as const) {
    fillPolygon(protHard, w, h, poly([...ids]));
    fillPolygon(protHard, w, h, scalePoly(poly([...ids]), factor));
  }
  const nostrils = new Float32Array(n);
  fillPolygon(nostrils, w, h, scalePoly(poly(RIGHT_NOSTRIL), 1.1));
  fillPolygon(nostrils, w, h, scalePoly(poly(LEFT_NOSTRIL), 1.1));
  const protBlur = gaussianBlur(protHard, w, h, Math.max(1, 0.02 * d));
  const protectedFeatures = new Float32Array(n);
  for (let i = 0; i < n; i++) protectedFeatures[i] = Math.max(protHard[i], smoothstep(0.02, 0.45, protBlur[i]));

  // 3. Person's own skin statistics, from small "sure skin" patches
  //    (cheeks, forehead, nose bridge, chin). Patches mostly covered by hair,
  //    a hand or glasses are outvoted: we keep the patches that agree with
  //    the median patch, then measure the spread on those pixels only.
  const patchRadius = Math.max(2, 0.12 * d);
  const patches: { L: number[]; a: number[]; b: number[] }[] = [];
  for (const id of SKIN_PROBES) {
    const [cx, cy] = local(id);
    const p = { L: [] as number[], a: [] as number[], b: [] as number[] };
    const x0 = Math.max(0, Math.floor(cx - patchRadius)), x1 = Math.min(w - 1, Math.ceil(cx + patchRadius));
    const y0 = Math.max(0, Math.floor(cy - patchRadius)), y1 = Math.min(h - 1, Math.ceil(cy + patchRadius));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * w + x;
        if (Math.hypot(x - cx, y - cy) > patchRadius || protectedFeatures[i] > 0.05 || oval[i] < 0.5) continue;
        p.L.push(lab.L[i]); p.a.push(lab.a[i]); p.b.push(lab.b[i]);
      }
    }
    if (p.L.length >= 4) patches.push(p);
  }
  const patchMed = patches.map((p) => ({ L: median(p.L), a: median(p.a), b: median(p.b), p }));
  const cL = median(patchMed.map((p) => p.L));
  const ca = median(patchMed.map((p) => p.a));
  const cb = median(patchMed.map((p) => p.b));
  const agreeing = patchMed.filter((p) => Math.abs(p.L - cL) < 18 && Math.hypot(p.a - ca, p.b - cb) < 12);
  const pool = (agreeing.length ? agreeing : patchMed).map((x) => x.p);
  const Ls = pool.flatMap((p) => p.L);
  const as = pool.flatMap((p) => p.a);
  const bs = pool.flatMap((p) => p.b);
  const mL = median(Ls);
  const ma = median(as);
  const mb = median(bs);
  const madL = Math.min(8, median(Ls.map((v) => Math.abs(v - mL))) || 4);
  const madAb = Math.min(5, median(as.map((v, k) => Math.hypot(v - ma, bs[k] - mb))) || 3);

  // 4. Colour gate: keeps pixels that look like this person's skin.
  const abLo = Math.max(7, 2.8 * madAb);
  const abHi = abLo * 2.2;
  const lLo = 18 + 2.5 * madL;
  const lHi = lLo + 14 + 2 * madL;
  const gateRaw = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    if (oval[i] === 0) continue;
    const dab = Math.hypot(lab.a[i] - ma, lab.b[i] - mb);
    const dl = Math.abs(lab.L[i] - mL);
    gateRaw[i] = (1 - smoothstep(abLo, abHi, dab)) * (1 - smoothstep(lLo, lHi, dl));
  }
  const gate = gaussianBlur(gateRaw, w, h, Math.max(0.8, 0.01 * d));

  // Dark non-skin structures inside the face (glasses frames, beard and
  // stubble, hair strands) plus a small halo: the halo removes their own
  // highlights (e.g. the shiny rim of a frame), which would otherwise look
  // like skin shine.
  const darkHard = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    if (oval[i] > 0 && protHard[i] === 0 && lab.L[i] < mL - 0.9 * lLo) darkHard[i] = 1;
  }
  const darkHalo = gaussianBlur(darkHard, w, h, Math.max(1, 0.03 * d));

  const keepOut = new Float32Array(n);
  for (let i = 0; i < n; i++) keepOut[i] = smoothstep(0.04, 0.25, darkHalo[i]);

  const skin = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    skin[i] = oval[i] * (1 - protectedFeatures[i]) * gate[i] * (1 - 0.85 * nostrils[i]) * (1 - keepOut[i]);
  }

  // Blemish zone: same as skin, but with the colour gate "closed" so that a
  // pimple (too red to pass the gate itself) is not a hole in its own mask.
  // Small holes fill in; large non-skin areas (hair, frames) stay excluded.
  const gateClosed = gaussianBlur(gateRaw, w, h, Math.max(2, 0.05 * d));
  const blemishZone = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    blemishZone[i] =
      oval[i] * (1 - protectedFeatures[i]) * smoothstep(0.35, 0.75, gateClosed[i]) * (1 - nostrils[i]) * (1 - keepOut[i]);
  }

  // 5. Under-eye bands + cheek references for dark-circle correction.
  const chin = local(152);
  const eyeMid = centroid(
    mesh.length > 473 ? [local(468), local(473)] : [centroid(poly(RIGHT_EYE)), centroid(poly(LEFT_EYE))]
  );
  let down: Point = [chin[0] - eyeMid[0], chin[1] - eyeMid[1]];
  const dl = Math.hypot(down[0], down[1]) || 1;
  down = [down[0] / dl, down[1] / dl];

  const underEyeHard = new Float32Array(n);
  const cheekRefs: FaceMasks["cheekRefs"] = [];
  for (const lid of [RIGHT_LOWER_LID, LEFT_LOWER_LID]) {
    const pts = poly(lid);
    const ew = dist(pts[0], pts[pts.length - 1]);
    const top: Point[] = [];
    const bottom: Point[] = [];
    pts.forEach((p, k) => {
      const t = k / (pts.length - 1);
      const depth = 0.42 * ew * (0.3 + 0.7 * Math.sin(Math.PI * t));
      top.push([p[0] + down[0] * 0.08 * ew, p[1] + down[1] * 0.08 * ew]);
      bottom.push([p[0] + down[0] * (0.08 * ew + depth), p[1] + down[1] * (0.08 * ew + depth)]);
    });
    fillPolygon(underEyeHard, w, h, [...top, ...bottom.reverse()]);

    // Cheek patch below the band.
    const mid = pts[Math.floor(pts.length / 2)];
    const c: Point = [mid[0] + down[0] * 0.85 * ew, mid[1] + down[1] * 0.85 * ew];
    const r = 0.2 * ew;
    const patch = new Float32Array(n);
    let sL = 0, sa = 0, sb = 0, cnt = 0;
    const x0 = Math.max(0, Math.floor(c[0] - r)), x1 = Math.min(w - 1, Math.ceil(c[0] + r));
    const y0 = Math.max(0, Math.floor(c[1] - r)), y1 = Math.min(h - 1, Math.ceil(c[1] + r));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * w + x;
        if (Math.hypot(x - c[0], y - c[1]) <= r && skin[i] > 0.5) {
          patch[i] = 1;
          sL += lab.L[i]; sa += lab.a[i]; sb += lab.b[i]; cnt++;
        }
      }
    }
    cheekRefs.push(cnt > 8 ? { L: sL / cnt, a: sa / cnt, b: sb / cnt, mask: patch } : { L: NaN, a: NaN, b: NaN, mask: patch });
  }
  const underEyeBlur = gaussianBlur(underEyeHard, w, h, Math.max(1, 0.05 * d));
  const underEye = new Float32Array(n);
  for (let i = 0; i < n; i++) underEye[i] = underEyeBlur[i] * (1 - protectedFeatures[i]) * gate[i] * oval[i] * (1 - keepOut[i]);

  return { skin, blemishZone, protectedFeatures, underEye, cheekRefs };
}
