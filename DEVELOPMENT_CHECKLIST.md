# 🚀 本地開發品質檢查清單

## 📋 開發前準備

### 1. 環境設定
- [ ] 安裝 Node.js (建議 v18+)
- [ ] 安裝 PostgreSQL (本地開發用)
- [ ] 複製環境變數: `cp .env示範.examples .env.local`
- [ ] 設定本地資料庫連接字串

### 2. 專案初始化
```bash
npm install
npm run db:generate
```

## 🔧 開發流程檢查清單

### 階段一: 程式碼修改前
- [ ] 確認當前分支為開發分支 (非 main)
- [ ] 拉取最新程式碼: `git pull origin main`
- [ ] 建立功能分支: `git checkout -b feature/your-feature-name`

### 階段二: 資料庫變更時
- [ ] 修改 `prisma/schema.prisma`
- [ ] 產生遷移: `npm run db:migrate`
- [ ] 測試遷移: `npm run db:test-connection`
- [ ] 檢查資料完整性

### 階段三: 程式碼修改時
- [ ] 運行 ESLint: `npm run lint`
- [ ] 類型檢查: `npm run type-check`
- [ ] 單元測試: `npm run test:unit` (如果有)
- [ ] 建置測試: `npm run build:test`

### 階段四: 整合測試
- [ ] 完整品質檢查: `npm run quality-check`
- [ ] 本地端到端測試:
  ```bash
  npm run dev
  # 在瀏覽器中手動測試主要功能
  ```
- [ ] API 端點測試:
  ```bash
  curl http://localhost:3000/api/db
  ```

### 階段五: 推送前最終檢查
- [ ] 所有測試通過
- [ ] 程式碼審查 (如果有團隊成員)
- [ ] 更新文檔 (如果需要)
- [ ] 提交訊息清晰: `git commit -m "feat: 功能描述"`
- [ ] 推送測試: `git push origin feature/your-branch`

## 🎯 快速檢查命令

### 完整品質檢查 (推薦)
```bash
npm run quality-check
```

### 手動檢查流程
```bash
# 1. 程式碼品質
npm run lint
npm run type-check

# 2. 資料庫
npm run db:test-connection

# 3. 建置
npm run build

# 4. 本地測試
npm run dev
```

## 🚨 問題排查

### 資料庫連接問題
```bash
# 檢查環境變數
echo $DATABASE_URL

# 測試連接
npm run db:test-connection

# 查看 Prisma Studio
npm run db:studio
```

### 建置失敗
```bash
# 清除快取
npm run clean

# 重新安裝依賴
rm -rf node_modules
npm install

# 重新建置
npm run build
```

### 測試失敗
```bash
# 查看詳細日誌
DEBUG=* npm run test

# 單獨測試特定部分
npm run lint
npm run type-check
npm run db:test-connection
```

## 📊 檢查結果記錄

| 檢查項目 | 狀態 | 備註 |
|---------|------|------|
| ESLint | ⭕/❌ | |
| TypeScript | ⭕/❌ | |
| 資料庫連接 | ⭕/❌ | |
| 建置測試 | ⭕/❌ | |
| 功能測試 | ⭕/❌ | |

## 🎉 推送條件

**必須全部滿足:**
- ✅ 所有品質檢查通過
- ✅ 資料庫遷移成功 (如果有)
- ✅ 本地功能測試通過
- ✅ 建置成功
- ✅ 團隊審查完成 (如果適用)

只有在所有檢查通過後，才能執行:
```bash
git push origin main  # 或合併到 main
```
