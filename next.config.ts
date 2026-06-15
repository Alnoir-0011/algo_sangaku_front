import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    testProxy: true,
  },
  webpack: (config) => {
    // E2E テスト時は実 Google Maps をロードせずモックに差し替える
    if (process.env.E2E_MOCK_MAPS === "true") {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@vis.gl/react-google-maps": path.resolve(
          __dirname,
          "tests/__mocks__/react-google-maps.tsx",
        ),
      };
    }
    return config;
  },
};

export default nextConfig;
