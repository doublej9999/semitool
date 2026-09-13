import path from "node:path";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
};

// Bundle analysis baseline (run via `npm run analyze`, see scripts/analyze.mjs).
// The analyzer hooks into the webpack pipeline: with the default Turbopack
// build it is a no-op, so the analyze build runs `next build --webpack`.
// Reports are written to .next/analyze/*.html. When ANALYZE !== "true" this
// wrapper is a pass-through and leaves the config above untouched.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

export default withBundleAnalyzer(nextConfig);
