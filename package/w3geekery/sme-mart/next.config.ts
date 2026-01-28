import type { NextConfig } from "next";
import webpack from 'webpack';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  skipTrailingSlashRedirect: true,
  trailingSlash: true,

  // Webpack config to handle node: protocol imports for browser
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Replace node: protocol imports with polyfills
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^node:buffer$/,
          require.resolve('buffer/')
        ),
        new webpack.NormalModuleReplacementPlugin(
          /^node:url$/,
          require.resolve('url/')
        )
      );

      // Polyfill fallbacks
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer/'),
        url: require.resolve('url/'),
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
      };
    }
    return config;
  },

  // API rewrites for local dev - proxy to ZeroBias
  async rewrites() {
    const zerobiasHost = process.env.NEXT_PUBLIC_ZEROBIAS_HOST || 'https://ci.zerobias.com';

    return [
      // API endpoints
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
    ];
  },
};

export default nextConfig;
