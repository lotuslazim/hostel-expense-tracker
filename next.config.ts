import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Add this line for static exports
  trailingSlash: true, // Recommended for static exports
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
    unoptimized: true, // Required for static exports
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https", // Fixed: removed the comma at the end
        hostname: "res.cloudinary.com",
      },
    ],
  }
};

export default nextConfig;