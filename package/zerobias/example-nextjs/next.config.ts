import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  distDir: "dist",
  // output: "export",
  // basePath: "/example-nextjs",
  trailingSlash: true, // Optional: Adds a trailing slash to all generated HTML files
  skipTrailingSlashRedirect: true,
  sassOptions: {
    implementation: 'sass-embedded',
  },
  async rewrites() {
    return [
      {
        source: "/api/portal/:slug",
        destination: "https://ci.zerobias.com/api/portal/:slug",
      },
      {
        source: "/api/dana/api/v2/me",
        destination: "https://ci.zerobias.com/api/dana/api/v2/me",
      },
      {
        source: "/api/dana/api/v2/orgs",
        destination: "https://ci.zerobias.com/api/dana/api/v2/orgs",
      },
      {
        source: "/api/dana/api/v2/me/session/logout",
        destination: "https://ci.zerobias.com/api/dana/api/v2/me/session/logout",
      },
      {
        source: "/api/dana/api/v2/orgs/:slug",
        destination:
          "https://ci.zerobias.com/api/dana/api/v2/orgs/:slug",
      },
      {
        source: "/graphql/boundaries/:slug",
        destination: "https://ci.zerobias.com/graphql/boundaries/:slug",
      },
    ];
  },
};

export default nextConfig;
