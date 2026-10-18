import type { NextConfig } from "next";

const repo = "ickdeath";
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? `/${repo}` : "";

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
  // The HDFC SDK reads package.json from the process working directory as
  // soon as the route loads. Tracing drops that file, so the Vercel function
  // dies on startup and the browser sees an empty response.
  outputFileTracingIncludes: {
    "/api/hdfc/session": ["./package.json"],
    "/api/hdfc/return": ["./package.json"],
    "/api/hdfc/webhook": ["./package.json"],
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
