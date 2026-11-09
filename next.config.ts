import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page in this app is per-user and read at request time, so we use the
  // plain dynamic rendering model instead of Cache Components (which would
  // require Suspense boundaries around every session read).
  cacheComponents: false,
  experimental: {
    serverActions: {
      // Uploads are capped at 500 KB and document bodies at 1.5 MB by our own
      // validation; this framework limit sits above both so users see our errors.
      bodySizeLimit: "2mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
