import path from "node:path";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

// Security headers applied to every route (source "/(.*)" covers the root
// path too). CSP notes, all verified against the actual app code:
// - script-src 'unsafe-inline': the root layout ships a tiny inline
//   theme-bootstrap script and Next.js injects inline bootstrap payloads.
// - 'unsafe-eval' is added to script-src outside production only: in dev
//   React uses eval for debug tooling (bundled Next.js CSP guide); neither
//   React nor Next.js use eval in production.
// - style-src 'unsafe-inline': the app styles elements inline everywhere.
// - font-src 'self' is enough: katex.min.css references its fonts with
//   relative url(fonts/...) paths, so Next bundles them as same-origin assets.
// - img-src data: covers inline SVG data URIs; blob: URLs in src/ are only
//   used for file downloads, which CSP does not restrict.
// - connect-src 'self': there are no runtime fetches to external origins —
//   GitHub links are plain <a> navigations, which CSP does not restrict.
const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // React Compiler evaluated 2026-09 (babel-plugin-react-compiler@1.0.0, SWC-selective):
  // runtime-correct (876 tests + 10 E2E green) but +10-35 kB First Load JS per route
  // (6 routes broke the 710 kB budget gate) and 4x slower builds (2.4s -> 9.6s). The
  // calculators already memoize their expensive computations via useMemo, so the
  // auto-memoization win was marginal against those costs. Re-evaluate only if
  // route budgets are raised or the compiler's output size shrinks materially.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
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
