import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output standalone: imagen Docker pequeña, runtime node server.js
  output: "standalone",
  reactStrictMode: false,
};

export default nextConfig;
