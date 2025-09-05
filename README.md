# 🤖 CHAT_AGENT - AI 聊天機器人平台

基於 Next.js + Prisma + PostgreSQL + Vercel 構建的現代化聊天機器人應用程式。

## 🚀 快速開始

### 環境準備
1. 安裝 Node.js (v18+)
2. 安裝 PostgreSQL (本地開發用)
3. 複製專案: `git clone https://github.com/DDChen666/CHAT_AGENT.git`

### 本地開發設定
```bash
# 安裝依賴
npm install

# 設定環境變數
cp .env示範.examples .env.local
# 編輯 .env.local 填入實際的資料庫連接資訊

# 產生 Prisma 客戶端
npm run db:generate

# 執行資料庫遷移
npm run db:migrate

# 填充測試資料 (可選)
npm run db:seed

# 啟動開發伺服器
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000) 查看應用程式。

## 🧪 品質檢查流程

### 完整檢查 (推薦)
```bash
npm run quality-check
```

### 分步檢查
```bash
# 程式碼品質
npm run lint
npm run type-check

# 資料庫連接
npm run db:test-connection

# 建置測試
npm run build:test
```

## 📊 資料庫管理

```bash
# 產生客戶端
npm run db:generate

# 開發環境遷移
npm run db:migrate

# 生產環境遷移
npm run db:migrate:deploy

# 資料庫瀏覽器
npm run db:studio

# 強制同步結構 (開發用)
npm run db:push
```

## 🔧 開發指令

```bash
# 開發伺服器
npm run dev

# 建置
npm run build

# 預覽建置結果
npm run preview

# 程式碼檢查
npm run lint
npm run type-check

# 測試
npm run test
npm run test:integration

# 清理快取
npm run clean
```

## 📁 專案結構

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   ├── globals.css        # 全域樣式
│   └── page.tsx          # 首頁
├── components/            # React 元件
│   ├── auth/             # 認證元件
│   ├── core/             # 核心功能元件
│   ├── layout/           # 佈局元件
│   └── ui/               # UI 元件
├── lib/                  # 工具函數和設定
│   ├── prisma.ts         # 資料庫客戶端
│   ├── auth.ts           # 認證邏輯
│   └── api.ts            # API 客戶端
└── store/                # 狀態管理

prisma/
├── schema.prisma         # 資料庫結構
├── seed.ts              # 測試資料
└── migrations/          # 資料庫遷移

scripts/
└── test-db-connection.ts # 資料庫測試腳本
```

## 🔐 環境變數

### 必要變數
- `DATABASE_URL`: PostgreSQL 連接字串
- `DIRECT_URL`: 直接資料庫連接 (Prisma 用)
- `AUTH_SECRET`: JWT 認證密鑰
- `GOOGLE_GEMINI_API_KEY`: Gemini AI API 金鑰
- `DEEPSEEK_API_KEY`: DeepSeek AI API 金鑰 (可選)

### 設定方式
1. **本地開發**: 複製 `.env示範.examples` 為 `.env.local`
2. **Vercel 部署**: 在 Vercel Dashboard 的 Environment Variables 中設定

## 🚀 部署

### 自動部署 (GitHub + Vercel)
1. 推送到 main 分支: `git push origin main`
2. Vercel 自動觸發建置和部署
3. 檢查部署狀態: [Vercel Dashboard](https://vercel.com/dashboard)

### 手動部署
```bash
npm run deploy  # 快速提交並推送
```

## 📋 開發檢查清單

詳見 [DEVELOPMENT_CHECKLIST.md](./DEVELOPMENT_CHECKLIST.md)

## 🐛 問題排查

### 常見問題
1. **資料庫連接失敗**
   ```bash
   npm run db:test-connection
   ```

2. **建置失敗**
   ```bash
   npm run clean
   npm install
   npm run build
   ```

3. **環境變數問題**
   - 檢查 `.env.local` 檔案
   - 確認 Vercel 環境變數設定

## 📚 相關文檔

- [Next.js 文檔](https://nextjs.org/docs)
- [Prisma 文檔](https://www.prisma.io/docs)
- [Vercel 文檔](https://vercel.com/docs)
- [部署指南](./DEPLOYMENT.md)
- [開發檢查清單](./DEVELOPMENT_CHECKLIST.md)

## 🤝 貢獻

1. Fork 此專案
2. 建立功能分支: `git checkout -b feature/amazing-feature`
3. 提交變更: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 開啟 Pull Request

## 📄 授權

此專案採用 MIT 授權。
