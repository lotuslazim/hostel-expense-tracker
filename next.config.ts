
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  }
};

export default nextConfig;

    