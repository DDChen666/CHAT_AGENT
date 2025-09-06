import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true, // 臨時禁用圖片優化來測試
  },
  /* config options here */
};

export default nextConfig;
