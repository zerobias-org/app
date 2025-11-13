import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Remove output: "export" and basePath for dev mode to enable rewrites
  // output: "export",
  // distDir: "dist",
  // basePath: "/data-explorer",
  skipTrailingSlashRedirect: true,
  trailingSlash: true,
  devIndicators: {
    buildActivity: false,
  },
  images: {
    remotePatterns: [
      new URL('https://cdn.auditmation.io/**')
    ]
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://ci.zerobias.com/api/:path*",
      }
    ]
  },
};

export default nextConfig;
