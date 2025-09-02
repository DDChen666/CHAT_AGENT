# Docker 部署指南

## ⚠️ 重要提醒：开发 vs 生产

### 开发模式推荐
**当前项目推荐使用本地开发模式**，详情请参考：[开发指南 - 混合方案最佳实践](./README.dev.md)

**为什么？**
- 项目是纯前端应用，无需容器化开发
- 本地开发提供最佳的热重载和调试体验
- 符合[通用混合方案开发最佳实践](./1.通用混合方案（容器與本地）開發最佳實踐.md)的指导原则

### Docker的使用场景
- ✅ **生产部署** - 确保环境一致性
- ✅ **CI/CD流程** - 自动化构建和测试
- ✅ **团队部署** - 简化生产环境部署

## 环境要求

- Docker >= 20.0
- Docker Compose >= 2.0

## 快速开始

### 1. 克隆项目并进入目录
```bash
cd synapse-ui
```

### 2. 创建环境变量文件
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的API密钥：
```env
GOOGLE_GEMINI_API_KEY=your_actual_google_gemini_api_key
DEEPSEEK_API_KEY=your_actual_deepseek_api_key
```

### 3. 使用 Docker Compose 构建和运行
```bash
# 构建并启动服务（生产模式）
docker-compose up --build

# 或者后台运行
docker-compose up -d --build
```

### 4. 访问应用
打开浏览器访问: http://localhost:3000

## 单独使用 Docker

### 构建镜像
```bash
docker build -t synapse-ui .
```

### 运行容器
```bash
docker run -p 3000:3000 \
  -e GOOGLE_GEMINI_API_KEY=your_key \
  -e DEEPSEEK_API_KEY=your_key \
  synapse-ui
```

## 部署到生产环境

### 使用 Docker Compose 生产配置
```yaml
version: '3.8'

services:
  synapse-ui:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:3000"  # 生产环境使用80端口
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - GOOGLE_GEMINI_API_KEY=${GOOGLE_GEMINI_API_KEY}
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 环境变量说明

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `GOOGLE_GEMINI_API_KEY` | 是 | Google Gemini AI API 密钥 |
| `DEEPSEEK_API_KEY` | 否 | DeepSeek AI API 密钥 |
| `NODE_ENV` | 否 | 运行环境 (production/development) |
| `PORT` | 否 | 应用端口 (默认: 3000) |
| `HOSTNAME` | 否 | 主机名 (默认: 0.0.0.0) |

## 故障排除

### 常见问题

1. **构建失败**
   ```bash
   # 清理Docker缓存
   docker system prune -f
   # 重新构建
   docker-compose build --no-cache
   ```

2. **端口占用**
   ```bash
   # 检查端口占用
   lsof -i :3000
   # 修改docker-compose.yml中的端口映射
   ```

3. **API密钥问题**
   - 确保API密钥有效
   - 检查环境变量是否正确设置
   - 查看容器日志：`docker-compose logs`

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs synapse-ui

# 实时查看日志
docker-compose logs -f synapse-ui
```

## 监控和维护

### 健康检查
应用内置健康检查端点，你可以通过以下方式监控：

```bash
# 检查应用状态
curl http://localhost:3000

# 或者使用Docker健康检查
docker-compose ps
```

### 更新部署
```bash
# 重新构建并重启
docker-compose up --build -d

# 查看更新后的日志
docker-compose logs -f
```

## 安全建议

1. **不要将API密钥提交到版本控制**
2. **使用环境变量管理敏感信息**
3. **定期更新Docker镜像**
4. **在生产环境中使用HTTPS**
5. **限制容器权限和网络访问**
