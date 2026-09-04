import type { NextConfig } from "next";

const repo = "ickdeath";
const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGithubPages ? `/${repo}` : "";

const nextConfig: NextConfig = {
  // Static export only for GitHub Pages (no API routes).
  // Local / Vercel builds keep Route Handlers for Razorpay.
  ...(isGithubPages ? { output: "export" as const } : {}),
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
