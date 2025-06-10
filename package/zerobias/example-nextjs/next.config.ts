import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  distDir: "dist",
  output: "export",
  basePath: "/example-nextjs",
  trailingSlash: true, // Optional: Adds a trailing slash to all generated HTML files
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      new URL('https://cdn.auditmation.io/**')
    ]
  },
/*   async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://qa.zerobias.com/api/:path*",
      }
    ]
  }, */
};

export default nextConfig;
