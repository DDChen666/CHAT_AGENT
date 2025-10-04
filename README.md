# 🤖 CHAT_AGENT - AI 聊天機器人平台

基於 Next.js + Prisma + PostgreSQL + Vercel 構建的現代化聊天機器人應用程式，支援多個 AI 模型並提供進階的 Prompt 優化功能。

## ✨ 主要功能

- 🎯 **多模型支援**: Gemini 2.5, DeepSeek 等主流 AI 模型
- 🔄 **動態模型更新**: 自動同步最新的可用模型列表
- ⚡ **Prompt 優化器**: AI 驅動的提示詞優化工具
- 🎨 **現代化 UI**: 可展開的設定面板，順滑的動畫效果
- 🔐 **安全認證**: JWT 認證系統
- 📱 **響應式設計**: 支援桌面和移動端
- 🎭 **多主題支援**: 深色/淺色模式
- 💾 **本地儲存**: Zustand 狀態管理

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
│   │   ├── auth/          # 認證 API
│   │   ├── chat/          # 聊天 API
│   │   ├── conversations/ # 對話管理 API
│   │   ├── keys/          # API 金鑰測試 API
│   │   ├── models/        # 模型列表 API
│   │   ├── optimize/      # Prompt 優化 API
│   │   └── test/          # API 測試 API
│   ├── globals.css        # 全域樣式
│   ├── layout.tsx         # 根佈局
│   └── page.tsx          # 首頁
├── components/            # React 元件
│   ├── auth/             # 認證元件
│   │   └── AuthModal.tsx
│   ├── core/             # 核心功能元件
│   │   ├── ChatInterface.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── OptimizerInterface.tsx
│   │   └── ThinkingAnimation.tsx
│   ├── layout/           # 佈局元件
│   │   ├── AppLayout.tsx
│   │   ├── HomeView.tsx
│   │   └── Sidebar.tsx
│   ├── settings/         # 設定元件
│   │   └── SettingsModal.tsx
│   └── ui/               # UI 元件
│       ├── AvatarButton.tsx
│       └── Dialog.tsx
├── lib/                  # 工具函數和設定
│   ├── api.ts            # API 客戶端
│   ├── auth.ts           # 認證邏輯
│   ├── crypto.ts         # 加密工具
│   ├── prisma.ts         # 資料庫客戶端
│   ├── providers.ts      # AI 模型提供者
│   ├── stream.ts         # 串流處理
│   └── utils.ts          # 通用工具
└── store/                # 狀態管理
    ├── appStore.ts       # 應用狀態
    └── settingsStore.ts  # 設定狀態

prisma/
├── schema.prisma         # 資料庫結構
├── seed.ts              # 測試資料
└── migrations/          # 資料庫遷移

scripts/
└── test-db-connection.ts # 資料庫測試腳本

public/
├── manifest.json        # PWA 配置
├── sw.js               # Service Worker
└── *.svg               # 圖標資源
```

### 📋 專案文檔

- [DATABASE_WORKFLOW.md](./DATABASE_WORKFLOW.md) - 資料庫開發工作流程
- [DEPLOYMENT完整開發工作流程.md](./DEPLOYMENT完整開發工作流程.md) - 完整部署指南
- [DEVELOPMENT_CHECKLIST.md](./DEVELOPMENT_CHECKLIST.md) - 開發檢查清單

## 🔐 環境變數

### 必要變數
- `DATABASE_URL`: PostgreSQL 連接字串
- `DIRECT_URL`: 直接資料庫連接 (Prisma 用)
- `AUTH_SECRET`: JWT 認證密鑰

> [!IMPORTANT]
> 第三方 AI 供應商（例如 Google Gemini、DeepSeek）的 API Key **改由登入後的使用者在前端設定畫面輸入**，並以加密方式儲存在資料庫中。請勿再透過環境變數配置這些敏感金鑰，以降低外洩風險。

### 設定方式
1. **本地開發**: 複製 `.env示範.examples` 為 `.env.local`
2. **Vercel 部署**: 在 Vercel Dashboard 的 Environment Variables 中設定
3. **AI API Key 綁定**: 使用者登入後，在應用程式的 Settings → API Keys 區段輸入金鑰，即可加密後保存於伺服端。

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
- [資料庫工作流程](./DATABASE_WORKFLOW.md)
- [完整部署指南](./DEPLOYMENT完整開發工作流程.md)
- [開發檢查清單](./DEVELOPMENT_CHECKLIST.md)

## 🤝 貢獻

1. Fork 此專案
2. 建立功能分支: `git checkout -b feature/amazing-feature`
3. 提交變更: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 開啟 Pull Request

## 📄 授權

此專案採用 MIT 授權。
