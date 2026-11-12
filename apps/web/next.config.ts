import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necesario para el Dockerfile de producción (server.js autónomo).
  output: "standalone",
  reactStrictMode: true,
};

export default nextConfig;
