import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The analysis route reads the skill's knowledge base from disk at runtime;
  // make sure Vercel bundles those files with the function.
  outputFileTracingIncludes: {
    "/api/analyze": ["./SKILL.md", "./knowledge/**/*.md"],
  },
  images: { unoptimized: true },
};

export default nextConfig;
