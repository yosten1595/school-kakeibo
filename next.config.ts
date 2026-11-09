import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Docker イメージ用に、本番で必要なファイルだけを .next/standalone にまとめる
  output: "standalone",
  cacheComponents: true,
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
