/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  webpack: (config, { dev }) => {
    // The on-disk webpack cache has repeatedly corrupted in this environment
    // (`PackFileCacheStrategy... hasStartTime` errors → `__webpack_require__.n
    // is not a function` at runtime). Disabling it in dev trades a bit of
    // rebuild speed for not needing a manual `.next` wipe after every change.
    if (dev) config.cache = false;
    return config;
  },
};

module.exports = nextConfig;
