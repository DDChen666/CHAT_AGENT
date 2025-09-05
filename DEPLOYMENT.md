# 🚀 CHAT_AGENT 部署指南

## 📋 專案狀態
- ✅ GitHub 連線: `https://github.com/DDChen666/CHAT_AGENT.git`
- ✅ Vercel 部署: 已通過 GitHub 整合
- ✅ 本地環境: 已設定完成

## 🔄 開發與部署工作流程

### 1. 本地開發
```bash
# 啟動開發伺服器
npm run dev

# 本地預覽建置結果
npm run preview
```

### 2. 提交變更
```bash
# 方法一: 使用新增的部署指令
npm run deploy

# 方法二: 手動提交
git add .
git commit -m "你的提交訊息"
git push origin main
```

### 3. 自動部署
一旦推送到 `main` 分支，Vercel 會自動：
- 觸發建置
- 部署到生產環境
- 更新網站

## ⚙️ 環境變數設定

### 在 Vercel 控制台設定
前往 [Vercel Dashboard](https://vercel.com/dashboard) → 你的專案 → Settings → Environment Variables

需要設定的變數：
```bash
DATABASE_URL=你的資料庫連接字串
AUTH_SECRET=隨機產生的密鑰
GOOGLE_GEMINI_API_KEY=你的 Gemini API 金鑰
DEEPSEEK_API_KEY=你的 DeepSeek API 金鑰（可選）
```

## 🔍 檢查部署狀態

### 在 Vercel 控制台
1. 前往你的專案
2. 查看 Deployments 分頁
3. 檢查最新部署的狀態

### 本地檢查
```bash
# 檢查 git 狀態
git status

# 查看提交歷史
git log --oneline -5

# 檢查遠端狀態
git remote -v
```

## 🚨 常見問題

### Q: 推送到 GitHub 後，Vercel 沒有自動部署？
A: 檢查以下項目：
- 確保推送到 `main` 分支
- 確認 Vercel 專案已正確連結到 GitHub repository
- 查看 Vercel 控制台的部署日誌

### Q: 環境變數沒有生效？
A: 環境變數變更後需要重新部署：
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

### Q: 本地開發時資料庫連線錯誤？
A: 設定本地的 `.env` 檔案：
```bash
cp .env示範.examples .env
# 編輯 .env 檔案設定本地資料庫
```

## 📞 支援
如遇到問題，請檢查：
1. Vercel 部署日誌
2. GitHub Actions（如果有設定）
3. 本地建置測試：`npm run build`
