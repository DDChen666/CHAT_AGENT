import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用standalone输出模式，支持Docker部署
  output: 'standalone',

  // 禁用遥测
  telemetry: false,

  // 实验性功能
  experimental: {
    // 如果需要的话可以启用
  },

  // 图片优化配置
  images: {
    unoptimized: true, // Docker环境可能需要此配置
  },
};

export default nextConfig;
