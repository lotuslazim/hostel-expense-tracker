/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin requests in development
  allowedDevOrigins: [
    "6000-firebase-studio-1758833665992.cluster-aic6jbiihrhmyrqafasatvzbwe.cloudworkstations.dev",
    "9000-firebase-studio-1758833665992.cluster-aic6jbiihrhmyrqafasatvzbwe.cloudworkstations.dev"
  ],
  // Disable turbopack if causing issues
  experimental: {
    turbo: {
      // Turbopack configuration if needed
    }
  }
}

module.exports = nextConfig
