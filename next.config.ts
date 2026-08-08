import type { NextConfig } from "next";

const repo = "ickdeath";
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPages ? `/${repo}` : undefined,
  assetPrefix: isGithubPages ? `/${repo}/` : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
