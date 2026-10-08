import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" es ignorado por Vercel (Vercel tiene su propio build)
  // Se mantiene para compatibilidad si se despliega en un VPS propio
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Límite de tamaño del body para Server Actions
  turbopack: {
    root: process.cwd(),
  },
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/cilindro-de-gas-la-habana', destination: '/balitas-de-gas-en-cuba', permanent: true },
      { source: '/combustible-en-cuba', destination: '/diesel-y-gasolina-en-cuba', permanent: true },
      // Rastreo desactivado por ahora (redirección temporal)
      { source: '/rastreo', destination: '/', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
