import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  distDir: "dist",
  output: "export",
  basePath: "/example-nextjs",
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      new URL('https://cdn.auditmation.io/**')
    ]
  },
  env: {
    NEXT_PUBLIC_API_HOSTNAME: process.env.NEXT_PUBLIC_API_HOSTNAME,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
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
