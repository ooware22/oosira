import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── SEO & Performance Headers ───────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // ─── Compression ──────────────────────────────────────
  compress: true,

  // ─── Powered By ───────────────────────────────────────
  poweredByHeader: false,

  // ─── Performance Optimizations ────────────────────────
  experimental: {
    optimizePackageImports: [
      '@heroicons/react',
      'framer-motion',
    ],
  },
};

export default nextConfig;
