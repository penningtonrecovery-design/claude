import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  experimental: {
    // Keepsake photos are resized in the browser first; this leaves room for
    // one up to 4 MB plus form overhead, under Vercel's 4.5 MB request limit.
    serverActions: { bodySizeLimit: "4.4mb" },
  },
  partialPrefetching: true,
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
