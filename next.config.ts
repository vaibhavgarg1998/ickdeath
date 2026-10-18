import type { NextConfig } from "next";

const repo = "ickdeath";
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? `/${repo}` : "";

const hdfcTrace = [
  "expresscheckout-nodejs",
  "winston",
  "winston-transport",
  "logform",
  "triple-beam",
  "@dabh/diagnostics",
  "@colors/colors",
  "@so-ric/colorspace",
  "async",
  "color",
  "color-convert",
  "color-name",
  "color-string",
  "enabled",
  "fecha",
  "fn.name",
  "inherits",
  "is-stream",
  "kuler",
  "ms",
  "one-time",
  "readable-stream",
  "safe-buffer",
  "safe-stable-stringify",
  "stack-trace",
  "string_decoder",
  "text-hex",
  "util-deprecate",
].map((name) => `./node_modules/${name}/**/*`);

// Next loads these with a dynamic path, so the file tracer never sees them.
// On Vercel the function only has traced files, so a missing manifest makes
// every Route Handler throw before it can return JSON (empty HTTP 500).
const serverManifests = [
  "./.next/BUILD_ID",
  "./.next/routes-manifest.json",
  "./.next/prerender-manifest.json",
  "./.next/build-manifest.json",
  "./.next/react-loadable-manifest.json",
  "./.next/required-server-files.json",
  "./.next/server/next-font-manifest.json",
  "./.next/server/server-reference-manifest.json",
  "./.next/server/prefetch-hints.json",
];

// The HDFC SDK reads package.json from the function working directory
// (/var/task on Vercel) as soon as it is loaded. Tracing drops that file.
const serverFiles = ["./package.json", ...serverManifests];

const nextConfig: NextConfig = {
  // Static export only for GitHub Pages (no API routes).
  // Local / Vercel builds keep Route Handlers for HDFC SmartGateway.
  ...(isGithubPages ? { output: "export" as const } : {}),
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Keep POST webhooks (WhatsApp) from being 308'd to a trailing slash.
  skipTrailingSlashRedirect: true,
  // Keep the HDFC SDK and winston as real node_modules files. The route
  // loads them on demand so a bad package.json cannot crash function startup.
  serverExternalPackages: ["expresscheckout-nodejs", "winston"],
  outputFileTracingIncludes: {
    "/**": serverFiles,
    "/api/hdfc/session": [...hdfcTrace, ...serverFiles],
    "/api/hdfc/return": [...hdfcTrace, ...serverFiles],
    "/api/hdfc/webhook": [...hdfcTrace, ...serverFiles],
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
