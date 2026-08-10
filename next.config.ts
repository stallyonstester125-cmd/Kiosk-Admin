import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const apiTarget = process.env.ADMIN_API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/v1';
    return [{ source: '/api/:path*', destination: `${apiTarget}/:path*` }];
  },
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
