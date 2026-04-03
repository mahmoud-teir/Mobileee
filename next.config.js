/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js handles /api/* natively — no proxy needed
  transpilePackages: ['recharts'],

  // Increase body size limit for backup import operations
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
