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
};

export default nextConfig;
