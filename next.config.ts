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
    "/api/hdfc/session": hdfcTrace,
    "/api/hdfc/return": hdfcTrace,
    "/api/hdfc/webhook": hdfcTrace,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
