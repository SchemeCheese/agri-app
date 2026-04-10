import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      // Cho phép tải ảnh từ backend deploy (Railway/Render...) và các URL nhập tay
      { protocol: 'http', hostname: '**' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
