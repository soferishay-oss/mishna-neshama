import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  allowedDevOrigins: ['192.168.100.199', 'localhost'],
  experimental: {
    // Also try adding it here if root fails
    // @ts-ignore
    allowedDevOrigins: ['192.168.100.199', 'localhost']
  }
};

export default nextConfig;
