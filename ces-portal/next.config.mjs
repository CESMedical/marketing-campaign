import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const projectRoot = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const scriptSrc = isProd ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-eval' 'unsafe-inline'";
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  scriptSrc,
  "img-src 'self' data: blob: https://res.cloudinary.com https://*.r2.dev https://*.sharepoint.com https://onedrive.live.com https://*.1drv.ms",
  "media-src 'self' blob: https://res.cloudinary.com https://*.sharepoint.com https://onedrive.live.com https://*.1drv.ms",
  "connect-src 'self' https://login.microsoftonline.com https://graph.microsoft.com https://api.resend.com https://res.cloudinary.com https://*.cloudflarestorage.com https://*.r2.cloudflarestorage.com https://*.sharepoint.com https://onedrive.live.com https://*.1drv.ms",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig = {
  trailingSlash: true,
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
