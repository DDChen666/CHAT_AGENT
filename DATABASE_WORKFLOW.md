# 🗄️ 資料庫變更與測試工作流程

## 📋 資料庫環境架構

### 三種資料庫環境

#### 1. **生產環境** (Vercel PostgreSQL)
- **位置**: Vercel 雲端 PostgreSQL
- **用途**: 實際運行的生產應用程式
- **連線方式**: 通過 Vercel 環境變數自動注入
- **更新時機**: 部署時自動執行遷移

#### 2. **本地開發環境**
- **位置**: 本機 PostgreSQL 或 Docker
- **用途**: 開發時的資料庫測試
- **連線方式**: `.env.local` 檔案中的 `DATABASE_URL`
- **更新時機**: 手動執行遷移

#### 3. **測試環境**
- **位置**: 視測試類型而定
- **用途**: 自動化測試和品質檢查
- **連線方式**: 依測試腳本設定

## 🔄 資料庫變更流程 (超詳細解釋)

### 階段一: 結構變更 📝
```bash
# 1. 修改資料庫結構
# 編輯 prisma/schema.prisma

# 2. 產生遷移檔案 (只在本機執行，不會動到 Vercel 資料庫)
npm run db:migrate

# 這會建立新的遷移檔案在 prisma/migrations/
# 例如: 20241201120000_add_user_age.sql
```

**🔍 遷移是什麼？**
- 遷移檔案 = 描述資料庫變化的 SQL 腳本
- 範例: 如果您新增 `age` 欄位到 User 表，遷移檔案會包含:
  ```sql
  ALTER TABLE "User" ADD COLUMN "age" INTEGER;
  ```

**🚫 這個階段不會改動任何資料庫！**
- 只產生「變更說明書」(遷移檔案)
- 遷移檔案會被提交到 Git，成為專案的一部分

### 階段二: 本地測試 🏠
```bash
# 1. 在本地資料庫執行遷移 (測試用)
npm run db:test-connection

# 2. 填充測試資料 (可選)
npm run db:seed

# 3. 啟動開發伺服器測試功能
npm run dev
```

**🎯 這個階段改動的是:**
- **您的本地資料庫** (如果您有設定的話)
- **不會改動 Vercel 生產資料庫**

### 階段三: 完整品質檢查 ✅
```bash
# 執行所有檢查
npm run quality-check

# 包含:
# - 程式碼品質檢查
# - 類型檢查
# - 資料庫連接測試
# - 建置測試
```

**🎯 這個階段:**
- 不會改動任何資料庫
- 只檢查程式碼和連接受否正常

### 階段四: 推送到生產 🚀
```bash
# 1. 提交變更 (包含遷移檔案)
git add .
git commit -m "feat: 資料庫結構更新 - 新增XXX欄位"

# 2. 推送 (觸發 Vercel 自動部署)
git push origin main

# 3. Vercel 會自動執行:
#    ✅ 安裝依賴
#    ✅ 產生 Prisma 客戶端
#    🔴 執行資料庫遷移 (npm run db:migrate:deploy) ← 這裡會改動 Vercel 資料庫！
#    ✅ 建置應用程式
#    ✅ 部署到生產環境
```

**🎯 只有這個階段會改動 Vercel 資料庫！**
- `npm run db:migrate:deploy` 會在 Vercel 環境執行
- 使用您在 Vercel Environment Variables 設定的生產資料庫
- 執行 `prisma/migrations/` 資料夾中的遷移檔案

## 📊 資料庫變更流程圖解

```
┌─────────────────────────────────────┐
│         您的電腦 (本地開發)          │
├─────────────────────────────────────┤
│                                     │
│  📝 階段一: 結構變更                │
│     修改 prisma/schema.prisma       │
│     ↓                              │
│     npm run db:migrate             │ ←─── 只在本機執行
│     ↓                              │
│     產生遷移檔案 📄                 │ ←─── 不會動到資料庫
│                                     │
├─────────────────────────────────────┤
│                                     │
│  🏠 階段二: 本地測試                │
│     npm run db:test-connection      │ ←─── 測試您的本地資料庫
│     npm run dev                     │ ←─── 使用本地資料庫
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ✅ 階段三: 品質檢查                │
│     npm run quality-check           │ ←─── 不會動到資料庫
│                                     │
├─────────────────────────────────────┤
│                                     │
│  🚀 階段四: 推送到生產              │
│     git push origin main            │
│     ↓                              │
│     Vercel 自動部署                 │
│     ↓                              │
│  🔴 npm run db:migrate:deploy       │ ←─── 這裡會改動 Vercel 資料庫！
│                                     │
└─────────────────────────────────────┘
```

## 🎯 測試時使用的資料庫

### 完整測試 (`npm run quality-check`) 使用的資料庫：

#### **開發環境資料庫**
```bash
# 檢查 scripts/test-db-connection.ts
# 使用 .env.local 中的 DATABASE_URL
# 如果沒有設定，會報錯並提示設定
```

#### **建置測試** 使用的資料庫：
```bash
# Next.js 建置時不會實際連接資料庫
# 只檢查 TypeScript 類型和程式碼結構
# 不需要實際的資料庫連接
```

### 本地端到端測試 (`npm run dev`) 使用的資料庫：

#### **優先順序**:
1. **`.env.local`** 中的 `DATABASE_URL` (推薦)
2. **系統環境變數** 中的 `DATABASE_URL`
3. **錯誤**: 如果都沒有設定

#### **設定本地資料庫**:

**選項一: 使用本地 PostgreSQL**
```bash
# 1. 安裝 PostgreSQL
brew install postgresql

# 2. 啟動服務
brew services start postgresql

# 3. 建立資料庫
createdb chatbot_dev

# 4. 設定 .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/chatbot_dev"
DIRECT_URL="postgresql://username:password@localhost:5432/chatbot_dev"
```

**選項二: 使用 Docker**
```bash
# 1. 啟動 PostgreSQL 容器
docker run --name postgres-dev -e POSTGRES_PASSWORD=mypassword -p 5432:5432 -d postgres

# 2. 設定 .env.local
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/postgres"
DIRECT_URL="postgresql://postgres:mypassword@localhost:5432/postgres"
```

**選項三: 使用雲端資料庫**
```bash
# 設定 .env.local 連接到雲端 PostgreSQL
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
DIRECT_URL="postgresql://user:pass@host:5432/dbname"
```

## ⚠️ 重要注意事項與風險評估

### 🚨 高風險：直接推送 Main 分支

**當前流程的潛在問題:**
```bash
# ❌ 當前流程：直接推送 main
git push origin main  # 立即觸發生產部署
```

**風險分析:**
- 🔴 **無 Code Review**: 無法確保程式碼品質
- 🔴 **立即影響生產**: 任何錯誤都會直接影響用戶
- 🔴 **難以追蹤變更**: 無法知道誰做了什麼
- 🔴 **無預覽環境**: 無法在生產前測試完整功能

**建議的改進流程 (GitHub Flow):**
```bash
# 1. 建立功能分支
git checkout -b feature/add-user-profile

# 2. 開發和測試
npm run quality-check

# 3. 推送功能分支
git push origin feature/add-user-profile

# 4. 建立 Pull Request
# - Vercel 自動建立預覽環境
# - 團隊進行 Code Review
# - 在預覽環境進行端到端測試

# 5. 合併到 main (觸發生產部署)
# Merge PR → Vercel 自動部署
```

**向團隊提出的問題:**
> 「我看到我們的部署流程是直接推送到 main，這是為了保持開發速度嗎？我們有沒有考慮過引入 Pull Request 和預覽環境的流程來增加一層審查和測試？」

### 資料庫遷移安全
```bash
# ✅ 正確: 先測試遷移，再推送
npm run db:migrate          # 本地測試
npm run db:test-connection  # 驗證連接
git push origin main        # 推送到生產

# ❌ 錯誤: 直接推送未測試的遷移
# 可能導致生產環境資料庫錯誤
```

### 🚨 關鍵風險：資料庫回滾策略

#### 程式碼回滾 (相對簡單)
```bash
# Vercel 上一鍵回滾到上一個版本
# 1. 進入 Vercel Dashboard
# 2. 選擇之前的部署版本
# 3. 點擊 "Redeploy"
```

#### 資料庫回滾 (非常困難) ⚠️

**問題分析:**
- 🔴 **Prisma Migrate 主要是「向前」遷移**
- 🔴 **無法自動產生「向後」遷移**
- 🔴 **破壞性變更會造成舊程式碼崩潰**

**危險範例:**
```sql
-- 遷移: 新增 NOT NULL 欄位
ALTER TABLE "User" ADD COLUMN "phone" TEXT NOT NULL DEFAULT '';

-- 問題: 如果回滾到舊版程式碼
-- 舊程式碼不知道 phone 欄位，插入資料時會失敗
```

**進階回滾策略:**

1. **兩階段部署 (Two-Phase Deployment)**
   ```sql
   -- 階段一: 先允許 NULL
   ALTER TABLE "User" ADD COLUMN "phone" TEXT NULL;

   -- 階段二: 資料遷移完成後
   ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;
   ```

2. **藍綠部署 (Blue-Green Deployment)**
   - 同時運行新舊版本
   - 逐步切換流量
   - 出現問題時立即切回

3. **功能旗標 (Feature Flags)**
   ```typescript
   // 使用功能旗標控制新功能
   if (process.env.FEATURE_PHONE_FIELD) {
     // 新功能程式碼
   }
   ```

### 環境變數管理
```bash
# 本地開發: .env.local (不會提交到 Git)
# 生產環境: Vercel Environment Variables
# 測試環境: 視測試需求設定
```

### 資料完整性
- 🔄 **遷移**: 使用 Prisma Migrate 確保結構一致性
- 🧪 **測試資料**: 使用 `npm run db:seed` 填充測試資料
- 🔍 **驗證**: 總是執行 `npm run db:test-connection`

### 🎯 生產就緒檢查清單

#### 推送到生產前必須確認:
- [ ] 本地完整測試通過 (`npm run quality-check`)
- [ ] 資料庫遷移在本機測試成功
- [ ] 功能在本地端到端測試正常
- [ ] 破壞性變更有回滾計劃
- [ ] 相關文檔已更新
- [ ] 團隊成員已通知重要變更

## 🚀 快速參考

### 常見命令
```bash
# 資料庫操作
npm run db:migrate          # 開發環境遷移
npm run db:migrate:deploy   # 生產環境遷移
npm run db:test-connection  # 測試連接
npm run db:studio          # 開啟 Prisma Studio
npm run db:seed            # 填充測試資料

# 品質檢查
npm run quality-check      # 完整檢查
npm run build:test         # 建置測試
```

### 環境變數範例 (.env.local)
```bash
# 本地開發用
DATABASE_URL="postgresql://user:pass@localhost:5432/chatbot_dev"
DIRECT_URL="postgresql://user:pass@localhost:5432/chatbot_dev"
AUTH_SECRET="your-dev-secret"
GOOGLE_GEMINI_API_KEY="your-key"
```

### 故障排除
```bash
# 如果遷移失敗
npm run db:push  # 強制同步結構 (開發用)

# 如果連接失敗
npm run db:test-connection  # 詳細錯誤資訊

# 如果建置失敗
npm run clean && npm install
```

## 🏆 專業建議總結

### 🎯 風險評估的重要性

這份文件不僅涵蓋了基本的操作流程，更重要的是納入了**專業的風險評估**：

#### 1. **開發流程風險**
- **當前**: Trunk-Based Development (直接推送 main)
- **風險**: 缺乏 Code Review、無預覽環境
- **建議**: 引入 GitHub Flow + PR + 預覽環境

#### 2. **資料庫操作風險**
- **程式碼回滾**: 相對簡單 (Vercel 一鍵搞定)
- **資料庫回滾**: 極為困難 (需要精心策劃)
- **建議**: 採用兩階段部署、功能旗標等進階策略

### 💡 向團隊提出的關鍵問題

> 「我們目前的部署流程是否已經足夠安全？對於資料庫變更這樣的高風險操作，我們有沒有完整的回滾計劃？」

### 🎖️ 生產就緒的三大支柱

1. **🚀 自動化部署** (已實現)
2. **🛡️ 風險評估** (已完善)
3. **🔄 回滾策略** (需要團隊討論)

### 📈 持續改進建議

- **短期**: 引入 PR 和預覽環境
- **中期**: 建立資料庫回滾策略
- **長期**: 考慮藍綠部署和功能旗標系統

---

*這份文件現在不僅是操作指南，更是專業的架構決策參考。記住：好的系統不僅能正常運行，更能在出錯時優雅地處理問題。*
