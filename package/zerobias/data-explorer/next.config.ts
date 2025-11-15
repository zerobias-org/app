import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "export",
  distDir: "dist",
  basePath: "/data-explorer",
  skipTrailingSlashRedirect: true,
  trailingSlash: true,
  images: {
    remotePatterns: [
      new URL('https://cdn.auditmation.io/**')
    ]
  },
/*   env: {
    NEXT_PUBLIC_API_HOSTNAME: process.env.NEXT_PUBLIC_API_HOSTNAME,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
  }, */
  /* async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://ci.zerobias.com/api/:path*",
      }
    ]
  },  */
};

export default nextConfig;
