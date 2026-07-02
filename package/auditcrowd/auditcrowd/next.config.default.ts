import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  /*   output: "export",
  distDir: "dist",
  basePath: "/example-nextjs", */
  skipTrailingSlashRedirect: true,
  trailingSlash: true,
  images: {
    remotePatterns: [
      new URL('https://cdn.auditmation.io/**')
    ]
  },
  // Local-dev proxy. The zb-client-lib targets a unified `{host}/api/*` gateway
  // (ci/app.zerobias.com), but our AuditCrowd data + key live in ZB UAT, whose
  // API is service-prefixed (e.g. /dana/*). For step-1 (prove whoAmI/login) we
  // route the client's `/api/*` calls to UAT's dana service.
  async rewrites() {
    return [
      // zb-client-lib calls the dana service at `{host}/api/dana/api/v2/*`.
      // UAT collapses the versioned alias `/dana/api/v2/*` -> `/dana/*` (308),
      // so map straight to the collapsed path to avoid a proxied redirect.
      {
        source: "/api/dana/api/v2/:path*",
        destination: "https://api.uat.zerobias.com/dana/:path*",
      },
      // Fallback: everything else under the unified `/api/*` gateway maps to the
      // UAT service router at the host root.
      {
        source: "/api/:path*",
        destination: "https://api.uat.zerobias.com/:path*",
      },
    ]
  },
};

export default nextConfig;
