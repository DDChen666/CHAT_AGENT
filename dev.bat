@echo off
REM Windows本地开发启动脚本
REM 符合混合方案最佳实践 - 应用代码本地运行

echo 🚀 启动 Synapse UI 本地开发环境
echo =================================

REM 检查Node.js是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js 18+
    pause
    exit /b 1
)

REM 检查npm是否安装
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm 未安装，请先安装 npm
    pause
    exit /b 1
)

REM 检查是否在正确的目录
if not exist "package.json" (
    echo ❌ 未找到 package.json，请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

REM 安装依赖（如果需要）
if not exist "node_modules" (
    echo 📦 安装项目依赖...
    npm install
)

REM 设置环境变量（如果.env文件存在）
if exist ".env" (
    echo 🔧 加载环境变量...
    for /f "tokens=*" %%i in (.env) do set %%i
)

echo 🎯 启动 Next.js 开发服务器...
echo 📱 应用将在: http://localhost:3000
echo 🛑 按 Ctrl+C 停止服务器
echo.

REM 启动开发服务器
npm run dev
