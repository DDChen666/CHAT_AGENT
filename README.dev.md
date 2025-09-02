# 开发指南 - 混合方案最佳实践

## 🎯 开发模式选择

### 当前项目特点
- ✅ **纯前端应用** - Next.js + React
- ✅ **无传统数据库** - 使用IndexedDB（浏览器本地存储）
- ✅ **无外部服务依赖** - 只有Google Gemini AI（云服务）
- ✅ **单体架构** - 前后端API都在同一个Next.js应用中

### 最佳实践：本地优先开发

根据[通用混合方案开发最佳实践](./1.通用混合方案（容器與本地）開發最佳實踐.md)，**当前项目应该采用本地开发模式**：

> **你在 actively 地编写和修改它的代码，就让它在本地运行。**
> **你只是把它当作一个"黑盒子"服务来使用，就把它容器化。**

## 🚀 本地开发工作流

### 1. 环境准备
```bash
# 克隆项目
git clone <repository-url>
cd synapse-ui

# 安装依赖
npm install

# 设置环境变量（如果需要）
cp .env.example .env
# 编辑 .env 文件，添加你的API密钥
```

### 2. 启动开发服务器
```bash
# 启动Next.js开发服务器
npm run dev

# 或者使用其他脚本
npm run build    # 生产构建
npm run start    # 生产启动
npm run lint     # 代码检查
```

### 3. 开发特性
- ✅ **毫秒级热重载** - 修改代码立即看到效果
- ✅ **完整调试支持** - 可以使用浏览器DevTools和VS Code调试器
- ✅ **原生文件监控** - 利用操作系统原生性能
- ✅ **灵活的开发体验** - 可以自由使用本地工具和扩展

## 📦 Docker的使用场景

### 生产部署
只有在**生产环境**才使用Docker：

```bash
# 生产部署
docker-compose up --build -d

# 或者单独使用Docker
docker build -t synapse-ui .
docker run -p 3000:3000 synapse-ui
```

### 将来扩展时的混合方案
如果将来添加了数据库或其他服务，才需要混合方案：

```yaml
# docker-compose.dev.yml (将来使用)
version: '3.8'

services:
  # 数据库服务 (将来添加)
  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - db_data_dev:/var/lib/postgresql/data

volumes:
  db_data_dev:
```

## 🔍 为什么当前不需要混合方案？

### 项目分析
| 组件 | 当前状态 | 是否需要容器化 | 理由 |
|------|----------|------------------|------|
| **Next.js应用** | ✅ 本地运行 | ❌ 不需要 | 正在actively开发 |
| **API路由** | ✅ 本地运行 | ❌ 不需要 | 集成在Next.js中 |
| **IndexedDB** | ✅ 浏览器本地 | ❌ 不需要 | 不需要服务器 |
| **Google Gemini AI** | ✅ 云服务 | ❌ 不需要 | 外部API调用 |

### 符合决策法则
- ✅ **你的应用代码** → 本地运行（正在开发）
- ❌ **背景基础设施** → 无需容器化（没有数据库/缓存等）
- ❌ **团队内其他服务** → 不适用（单体应用）

## 💡 开发建议

### 1. 本地开发优势
- **速度最快** - 原生热重载，无容器开销
- **调试最方便** - 完整的开发工具支持
- **学习成本最低** - 无需理解Docker网络配置

### 2. Docker仅用于
- **生产部署** - 确保环境一致性
- **CI/CD** - 自动化构建和测试
- **将来扩展** - 当添加外部服务时

### 3. 监控开发体验
```bash
# 查看开发服务器状态
curl http://localhost:3000/api/health

# 检查应用是否正常运行
npm run lint
npm run build
```

## 🎯 结论

**当前项目应该采用纯本地开发模式**，这完全符合混合方案的最佳实践：

- 开发时获得最佳速度和体验
- 生产时使用Docker确保一致性
- 架构清晰，维护简单
- 为将来扩展预留了空间

只有当项目复杂度增加（添加数据库、微服务等）时，才需要引入完整的混合方案。
