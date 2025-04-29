import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  distDir: "dist",
  output: "export",
  trailingSlash: true, // Optional: Adds a trailing slash to all generated HTML files
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/portal/:slug",
        destination: "https://api.app.zerobias.com/portal/:slug",
      },
      {
        source: "/portal/portal/:slug",
        destination: "https://api.app.zerobias.com/portal/:slug",
      },
      {
        source: "/graphql/:slug",
        destination: "https://api.app.zerobias.com/graphql/:slug",
      },
      {
        source: "/graphql/boundaries/:slug",
        destination: "https://api.app.zerobias.com/graphql/boundaries/:slug",
      },
    ];
  },
};

export default nextConfig;
