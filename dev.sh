#!/bin/bash

# 本地开发启动脚本
# 符合混合方案最佳实践 - 应用代码本地运行

echo "🚀 启动 Synapse UI 本地开发环境"
echo "================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 未找到 package.json，请确保在项目根目录运行此脚本"
    exit 1
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装项目依赖..."
    npm install
fi

# 设置环境变量（如果.env文件存在）
if [ -f ".env" ]; then
    echo "🔧 加载环境变量..."
    export $(grep -v '^#' .env | xargs)
fi

echo "🎯 启动 Next.js 开发服务器..."
echo "📱 应用将在: http://localhost:3000"
echo "🛑 按 Ctrl+C 停止服务器"
echo ""

# 启动开发服务器
npm run dev
