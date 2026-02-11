import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  skipTrailingSlashRedirect: true,
  trailingSlash: true,

  // API rewrites for local dev - proxy to ZeroBias
  // Using fallback so local Next.js API routes (/api/providers, /api/profile, etc.)
  // are served first; only unmatched /api/* requests get proxied to ZeroBias.
  async rewrites() {
    const zerobiasHost = process.env.NEXT_PUBLIC_ZEROBIAS_HOST || 'https://ci.zerobias.com';

    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        // ZeroBias API proxy (only when no local API route matches)
        {
          source: "/api/:path*",
          destination: `${zerobiasHost}/api/:path*`,
        },
        // Dana API endpoints (ZeroBias core API)
        {
          source: "/dana/:path*",
          destination: `${zerobiasHost}/dana/:path*`,
        },
        // Login pages (ZeroBias authentication)
        {
          source: "/login/:path*",
          destination: `${zerobiasHost}/login/:path*`,
        },
        // Session socket
        {
          source: "/session/:path*",
          destination: `${zerobiasHost}/session/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
