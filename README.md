# Synapse UI 🤖

一个现代化的AI聊天机器人应用，基于Next.js构建，支持多标签页对话和AI提示词优化。

## ✨ 功能特性

- 🎯 **智能聊天** - 支持Google Gemini AI的实时对话
- 📑 **多标签页** - 同时进行多个独立对话
- 🔧 **Prompt优化器** - AI驱动的提示词迭代优化
- 💾 **本地存储** - 使用IndexedDB保存对话历史
- 🎨 **现代化UI** - 基于Tailwind CSS的响应式设计
- ⚡ **实时流式响应** - 逐字显示AI回复

## 🚀 快速开始

### 本地开发（推荐）

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd synapse-ui
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **设置环境变量**（可选）
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，添加你的API密钥
   ```

4. **启动开发服务器**
   ```bash
   # 使用便捷脚本（推荐）
   ./dev.sh

   # 或者直接使用npm
   npm run dev
   ```

5. **访问应用**
   打开浏览器访问: [http://localhost:3000](http://localhost:3000)

### Docker部署（生产环境）

```bash
# 构建并运行
docker-compose up --build

# 或者后台运行
docker-compose up -d --build
```

## 📋 开发模式说明

### 🎯 为什么推荐本地开发？

本项目采用**混合方案开发最佳实践**：

- ✅ **应用代码本地运行** - 获得最佳的热重载和调试体验
- ✅ **纯前端架构** - 无需数据库等背景服务容器化
- ✅ **符合决策法则** - "你在actively开发"的代码应该本地运行

详细说明请参考：[开发指南](./README.dev.md)

### 🐳 Docker的使用场景

- **生产部署** - 确保环境一致性
- **CI/CD流程** - 自动化构建和测试
- **团队协作** - 简化部署流程

## 🛠️ 技术栈

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI, Framer Motion
- **State**: Zustand (状态管理)
- **Storage**: IndexedDB (本地存储)
- **AI**: Google Gemini AI
- **Build**: Docker (生产部署)

## 📁 项目结构

```
synapse-ui/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API路由
│   │   ├── layout.tsx      # 根布局
│   │   └── page.tsx        # 首页
│   ├── components/         # React组件
│   │   ├── core/          # 核心功能组件
│   │   ├── layout/        # 布局组件
│   │   └── ui/            # UI组件
│   ├── lib/               # 工具函数
│   └── store/             # 状态管理
├── public/                # 静态资源
├── Dockerfile            # Docker构建配置
├── docker-compose.yml    # Docker Compose配置
└── package.json          # 项目配置
```

## 🎮 使用说明

### 聊天功能
1. 在侧边栏点击"+"按钮创建新聊天
2. 在输入框输入问题，按`⌘+Enter`发送
3. AI回复会实时流式显示
4. 支持复制消息和查看Token使用量

### Prompt优化器
1. 点击侧边栏的优化按钮
2. 输入原始提示词
3. AI会进行多轮迭代优化
4. 查看优化评分和改进建议

## 🔧 环境变量

创建 `.env.local` 文件并配置：

```env
# Google Gemini AI API Key
GOOGLE_GEMINI_API_KEY=your_api_key_here

# DeepSeek AI API Key (可选)
DEEPSEEK_API_KEY=your_api_key_here
```

## 📚 相关文档

- [开发指南](./README.dev.md) - 详细的开发环境配置
- [Docker部署指南](./DEPLOYMENT.md) - 生产环境部署说明
- [混合方案最佳实践](./1.通用混合方案（容器與本地）開發最佳實踐.md) - 开发模式选择指南

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License
