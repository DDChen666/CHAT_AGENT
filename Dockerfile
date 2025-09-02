# 多阶段构建：第一阶段用于构建
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci

# 确保TypeScript已安装
RUN npm install --save-dev typescript

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 第二阶段：生产镜像
FROM node:18-alpine AS runner

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 复制node_modules（包含所有依赖）
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# 创建用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./

# 创建必要的目录并设置权限
RUN mkdir -p /app/.next/cache && chown -R nextjs:nodejs /app/.next

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["npm", "start"]
