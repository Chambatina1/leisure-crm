import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin "standalone" para que "next start" funcione con el comando por defecto
  // de Render (npm run start) y escuche en el PORT correcto.
  reactStrictMode: false,
};

export default nextConfig;
