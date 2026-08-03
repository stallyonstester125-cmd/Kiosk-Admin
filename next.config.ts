import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kiosk-server-production-e08d.up.railway.app",
        pathname: "/uploads/**",
      },
    ],
  },
  generateEtags: false,
};

export default nextConfig;
