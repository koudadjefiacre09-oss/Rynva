/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    // The auth proxy buffers request bodies (10 MB by default). AI Photo
    // Retouch's local "direct" upload mode posts RAW files up to
    // RETOUCH_MAX_UPLOAD_MB (50 MB); production uploads go straight to
    // Supabase Storage and never hit this.
    proxyClientMaxBodySize: "55mb",
  },
  // AI Photo Retouch: native/wasm image + ML packages stay plain Node requires.
  serverExternalPackages: ["sharp", "heic-decode", "libheif-js", "exifr", "@vladmandic/human"],
  // Files loaded at runtime by path (face models, wasm binaries, the Human
  // wasm build and its TensorFlow.js deps) are invisible to file tracing:
  // list them so they ship with the retouch routes.
  outputFileTracingIncludes: {
    "/api/ai/photo/retouch/**": [
      "./node_modules/@vladmandic/human/package.json",
      "./node_modules/@vladmandic/human/dist/human.node-wasm.js",
      "./node_modules/@vladmandic/human/models/{blazeface,facemesh,iris}.{json,bin}",
      "./node_modules/@tensorflow/{tfjs-core,tfjs-converter,tfjs-backend-cpu,tfjs-backend-wasm}/package.json",
      "./node_modules/@tensorflow/{tfjs-core,tfjs-converter,tfjs-backend-cpu,tfjs-backend-wasm}/dist/*.node.js",
      "./node_modules/@tensorflow/tfjs-backend-wasm/dist/*.wasm",
      "./node_modules/@tensorflow/tfjs-backend-wasm/wasm-out/*.{js,wasm}",
      "./node_modules/@tensorflow/tfjs-backend-wasm/dist/wasm-out/*.{js,wasm}",
      "./node_modules/{long,seedrandom,node-fetch,whatwg-url,tr46,webidl-conversions}/**/*.{js,json}",
    ],
  },
};

module.exports = nextConfig;
