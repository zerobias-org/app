import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  distDir: "build",
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
