import type { NextConfig } from "next";

// ── Derive the backend origin from the API URL for CSP ──
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const apiOrigin = new URL(apiUrl).origin; // e.g. "http://localhost:8000" or "https://api.oosira.com"
const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // ─── Security & Performance Headers ───────────────────
  // Centralised here (single source of truth) — do NOT duplicate in Cloudflare.
  async headers() {
    // Build CSP directives
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com",
      // Allow API backend + payment gateway
      `connect-src 'self' ${apiOrigin} https://api.oosira.com https://pay.chargily.com`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    // Only enforce HTTPS upgrade in production (localhost uses HTTP)
    if (!isDev) {
      cspDirectives.push("upgrade-insecure-requests");
    }

    return [
      {
        source: '/(.*)',
        headers: [
          // ── F-03 · HSTS ─────────────────────────────────
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // ── F-02 · CSP (enforcing — SEC-10) ──
          {
            key: 'Content-Security-Policy',
            value: cspDirectives.join('; '),
          },
          // ── F-09 · Clean security headers ──
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
          // X-XSS-Protection intentionally REMOVED (obsolete, replaced by CSP)
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
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // ─── F-07 · Modern Image Formats ──────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
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
