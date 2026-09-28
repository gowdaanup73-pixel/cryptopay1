/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: 'output: export' and 'trailingSlash: true' have been removed.
  // Static export mode disables all /api/* routes entirely.
  // If you need to deploy as a static site, API routes must be hosted separately.
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    esmExternals: "loose", // This helps with ESM/CommonJS compatibility
  },

  // --- FIX 1: Merged transpilePackages (for 'ERR_REQUIRE_ESM') ---
  transpilePackages: [
    "@vanilla-extract/sprinkles", // Your original
    "@rainbow-me/rainbowkit", // Your original
    "@reown/appkit", // Your original
    "@walletconnect/ethereum-provider", // Your original
    "@walletconnect/universal-provider", // Your original
    "wagmi", // <-- My addition to fix ESM
  ],

  // --- FIX 2: Merged Webpack Config (for '@react-native-async-storage') ---
  webpack: (config, { isServer }) => {
    const path = require("path");
    // Pin React and React-DOM to local node_modules to avoid parent directory duplicates
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    };

    // --- All of your original webpack settings below ---
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      path: false,
      os: false,
    };

    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });

    config.module.rules.push({
      test: /\.m?js$/,
      type: "javascript/auto",
      resolve: {
        fullySpecified: false,
      },
    });

    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
    });

    return config;
  },
};

module.exports = nextConfig;