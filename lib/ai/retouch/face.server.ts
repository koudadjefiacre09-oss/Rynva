import path from "node:path";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import sharp from "sharp";

/**
 * Face detection stage.
 *
 * Runs Google MediaPipe BlazeFace + FaceMesh (478 landmarks incl. iris) on
 * the server through @vladmandic/human on TensorFlow.js' WebAssembly backend:
 * no native binary, no external API, and the photo never leaves RYNVA's
 * server. Models ship inside the npm package (node_modules/@vladmandic/human/models).
 *
 * The landmarks are only used to build masks (where to retouch, what to
 * protect). Nothing generative ever redraws the face.
 */

export interface DetectedFace {
  /** 478 landmarks in working-image pixel coordinates. */
  mesh: [number, number][];
  /** [x, y, width, height] in working-image pixels. */
  box: [number, number, number, number];
  score: number;
}

type HumanInstance = {
  load: () => Promise<void>;
  detect: (input: unknown) => Promise<{ face: { mesh: number[][]; box: number[]; score: number }[] }>;
  tf: {
    tensor3d: (data: Uint8Array, shape: [number, number, number], dtype: string) => unknown;
    dispose: (t: unknown) => void;
  };
};

const NODE_MODULES = path.join(process.cwd(), "node_modules");
const MODELS_DIR = path.join(NODE_MODULES, "@vladmandic/human/models");
const WASM_DIR = path.join(NODE_MODULES, "@tensorflow/tfjs-backend-wasm/dist");

/** Longest edge fed to the detector (BlazeFace works on a downscaled copy anyway). */
const DETECT_LONG_EDGE = 1920;

let humanPromise: Promise<HumanInstance> | null = null;

/**
 * tfjs on Node fetches models/wasm with `fetch`, which doesn't support
 * file:// URLs. Serve those from disk; every other URL goes to the real fetch.
 */
function installFileFetch() {
  const g = globalThis as typeof globalThis & { __rynvaFileFetch?: boolean };
  if (g.__rynvaFileFetch) return;
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.startsWith("file://")) {
      const body = await readFile(new URL(url));
      const type = url.endsWith(".json") ? "application/json" : url.endsWith(".wasm") ? "application/wasm" : "application/octet-stream";
      return new Response(body, { status: 200, headers: { "content-type": type } });
    }
    return original(input, init);
  }) as typeof fetch;
  g.__rynvaFileFetch = true;
}

async function loadHuman(): Promise<HumanInstance> {
  installFileFetch();
  // The package's "exports" map is malformed for this entry point, so load
  // the wasm build by path (it is listed in next.config.js' file tracing).
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const { Human } = require(path.join(NODE_MODULES, "@vladmandic/human/dist/human.node-wasm.js"));
  const human: HumanInstance = new Human({
    backend: "wasm",
    wasmPath: `file://${WASM_DIR}/`,
    modelBasePath: `file://${MODELS_DIR}/`,
    debug: false,
    async: true,
    cacheSensitivity: 0,
    face: {
      enabled: true,
      detector: { rotation: true, maxDetected: 20, minConfidence: 0.5, minSize: 24, return: false },
      mesh: { enabled: true },
      iris: { enabled: true },
      attention: { enabled: false },
      description: { enabled: false },
      emotion: { enabled: false },
      antispoof: { enabled: false },
      liveness: { enabled: false },
    },
    body: { enabled: false },
    hand: { enabled: false },
    object: { enabled: false },
    gesture: { enabled: false },
    segmentation: { enabled: false },
    filter: { enabled: false },
  });
  await human.load();
  return human;
}

function getHuman(): Promise<HumanInstance> {
  if (!humanPromise) {
    humanPromise = loadHuman().catch((err) => {
      humanPromise = null; // allow a retry on the next request
      throw err;
    });
  }
  return humanPromise;
}

/** Detection is not re-entrant on one tfjs backend: serialise calls. */
let queue: Promise<unknown> = Promise.resolve();

export async function detectFaces(rgb: Buffer, width: number, height: number): Promise<DetectedFace[]> {
  const run = async () => {
    const human = await getHuman();
    const scale = Math.min(1, DETECT_LONG_EDGE / Math.max(width, height));
    let pixels: Buffer = rgb;
    let w = width;
    let h = height;
    if (scale < 1) {
      w = Math.round(width * scale);
      h = Math.round(height * scale);
      pixels = await sharp(rgb, { raw: { width, height, channels: 3 } }).resize(w, h).raw().toBuffer();
    }
    const tensor = human.tf.tensor3d(new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength), [h, w, 3], "int32");
    try {
      const result = await human.detect(tensor);
      return result.face
        .filter((f) => f.mesh && f.mesh.length >= 468)
        .map((f) => ({
          mesh: f.mesh.map((p) => [p[0] / scale, p[1] / scale] as [number, number]),
          box: f.box.map((v) => v / scale) as [number, number, number, number],
          score: f.score,
        }));
    } finally {
      human.tf.dispose(tensor);
    }
  };
  const next = queue.then(run, run);
  queue = next.catch(() => undefined);
  return next;
}
