/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a self-contained .next/standalone bundle for Docker production builds
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
}

module.exports = nextConfig
