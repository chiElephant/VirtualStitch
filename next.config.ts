import type { NextConfig } from 'next';

// Temporarily removed overly restrictive CSP that was blocking Next.js/React
// TODO: Add back a more permissive CSP later
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ['three'],
  headers: async () => [
    {
      source: '/(.*)',
      headers: securityHeaders
    }
  ],
};

export default nextConfig;
