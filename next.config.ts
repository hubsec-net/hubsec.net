import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
  // Security headers are handled by Cloudflare _headers file in production.
  // Set a subset here for local development (next dev).
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '0' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
        ],
      },
    ];
  },
  // Proxy Subscan API calls through same-origin to avoid CORS.
  // In dev: Next.js handles the rewrite.
  // In production: Cloudflare Pages Function at /api/subscan/* handles it.
  async rewrites() {
    return [
      {
        source: '/api/subscan/:chain/:path*',
        destination: 'https://:chain.api.subscan.io/:path*',
      },
      {
        source: '/api/etherscan',
        destination: 'https://api.etherscan.io/v2/api',
      },
    ];
  },
};

export default nextConfig;
