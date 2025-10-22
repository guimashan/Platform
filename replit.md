# 龜馬山整合服務平台 (goLine Platform)

## 專案概述
這是一個整合 LINE LIFF 和 Firebase 的服務平台，專為龜馬山社群打造，提供登入、簽到、服務申請和排班管理等功能。

## 核心功能
1. **LINE 登入** - 使用 LINE LIFF SDK 進行使用者認證
2. **奉香簽到系統** - 志工與信眾的簽到管理
3. **神務服務** - 服務申請與查詢系統
4. **志工排班系統** - 班表管理與換班功能

## 技術棧
### 前端 & 後端
- **Next.js 14.2.33** (App Router)
- React 18
- TypeScript
- LINE LIFF SDK 2.22.0
- Firebase (客戶端)
- Firebase Admin SDK (伺服器端認證)

## 專案結構
```
src/
  app/
    page.tsx           # 首頁
    login/page.tsx     # LINE 登入頁
    checkin/page.tsx   # 簽到系統
    service/page.tsx   # 神務服務
    schedule/page.tsx  # 志工排班系統
    ok/page.tsx        # 成功頁面
    layout.tsx         # 根布局
    api/
      auth/line/route.ts      # LINE 認證 API
      checkin/create/route.ts # 簽到 API
      webhook/route.ts        # LINE Webhook
      ping/route.ts           # 健康檢查
  lib/
    firebase.ts        # Firebase 客戶端配置
    admin.ts           # Firebase Admin 配置
    verifyLine.ts      # LINE 驗證工具
public/              # 靜態資源
next.config.mjs      # Next.js 配置
tsconfig.json        # TypeScript 配置
```

## 環境變數
### Firebase (Client) - 需加 NEXT_PUBLIC_ 前綴
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_APP_ID

### Firebase (Server)
- FIREBASE_SERVICE_ACCOUNT_JSON

### LINE LIFF
- LINE_CHANNEL_ID
- LINE_CHANNEL_SECRET
- NEXT_PUBLIC_LINE_LIFF_ID

### Vercel 部署
- VERCEL_ADMIN_API_KEY
- VERCEL_PROJECT_ID
- VERCEL_ORG_ID

## 資料模型
### 使用者 (User)
- id: LINE User ID
- displayName: 顯示名稱
- pictureUrl: 頭像
- createdAt: 建立時間

### 簽到記錄 (CheckIn)
- id: 記錄 ID
- userId: 使用者 ID
- timestamp: 簽到時間
- location: 簽到地點
- type: 簽到類型

### 服務申請 (Service)
- id: 申請 ID
- userId: 申請者 ID
- serviceType: 服務類型
- status: 狀態
- createdAt: 申請時間

### 排班 (Schedule)
- id: 排班 ID
- userId: 志工 ID
- date: 日期
- shift: 班別
- status: 狀態

## Vercel 部署管理

### Vercel 專案資訊
- **專案名稱**：`platform`（不是 `Replit_guimashan_go`）
- **框架**：Next.js
- **部署來源**：GitHub `guimashan/Platform` 倉庫
- **正式域名**：`go.guimashan.org.tw`
- **Commit SHA**：`ca3c28b6ab36e01a960948b382adcc19740426a0`（Next.js 版本）

### SuperAdmin 機制
- 第一個註冊的使用者自動成為 SuperAdmin
- 擁有所有系統的 admin 權限（checkin、schedule、service）
- `isSuperAdmin: true` 標記於 Firestore user 文件

詳細部署指南請參閱 `VERCEL_DEPLOYMENT_GUIDE.md`

## 最近更改
- **2025-10-22 17:30**: 🧹 清理專案目錄結構
  - 刪除舊版驗收報告（V1.0、V1.1）
  - 移除 Vite 殘留檔案（.vite/ 目錄）
  - 清理不需要的腳本（start.sh、scripts/）
  - 刪除測試用附件（attached_assets/）
  - 專案目錄更加簡潔清晰
- **2025-10-22 16:40**: ✅ 完全恢復到 Next.js 架構
  - 從 Vercel 部署（commit ca3c28b6）下載原始 Next.js 版本
  - 移除 Express + Vite 架構（client/、server/、shared/ 目錄）
  - 恢復 Next.js App Router 結構（src/app/ 目錄）
  - 安裝 Next.js 14.2.33 及相關依賴
  - 修改 package.json 端口為 5175 以配合 .replit 配置
- 2025-10-22: 新增 Vercel 自動部署管理系統
  - 實作環境變數同步到 Vercel 功能
  - 整合 Deploy Hook 觸發機制
  - 新增 SuperAdmin 自動授權（第一個用戶）
  - 建立完整的部署指南文件
- 2025-10-21: 修復模組導入和型別錯誤（Express + Vite 時期）
- 2025-10-20: 從 GitHub 導入專案結構，設置 Firebase 和 LINE LIFF 整合

## 已知問題

### ⚠️ 端口配置衝突（需手動修正）
- **問題描述**：
  - Next.js 運行在 port **3000**（Next.js 標準端口）
  - `.replit` 檔案配置等待 port **5175**（舊 Vite 配置）
  - 導致 workflow 顯示 FAILED（錯誤：`didn't open port 5175`）
  
- **影響**：
  - Next.js 應用正常啟動並運行（✓ Ready in 1573ms）
  - 但外部訪問無法連接（端口映射不正確）
  - Replit workflow 狀態顯示 FAILED
  
- **解決方案**：由於 `.replit` 和 `package.json` 受 Replit 系統保護，請選擇以下任一方案：

  **方案 A：重啟虛擬機器後手動編輯**
  1. 在 Replit Shell 中執行：`kill 1`（會重啟環境）
  2. 等待約 30 秒環境重啟完成
  3. 在檔案樹點擊三點選單，勾選「Show hidden files」
  4. 打開 `.replit` 檔案，手動修改：
     - 第 35 行：`waitForPort = 3000`（從 5175 改為 3000）
     - 第 38 行：`localPort = 3000`（從 5175 改為 3000）
  
  **方案 B：修改 Next.js 端口配合 .replit**
  1. 在檔案樹中打開 `package.json`
  2. 找到第 3 行：`"dev": "next dev -p 3000",`
  3. 手動修改為：`"dev": "next dev -p 5175",`
  4. 儲存後點擊 Run 按鈕重啟
  
- **為什麼無法自動修正**：
  - `.replit` 和 `package.json` 受 Replit 系統保護
  - 防止意外破壞環境配置
  - AI 無法直接編輯這些受保護的檔案

### 備份位置
Express + Vite 版本備份在：`/tmp/express_backup/`（如需回退）

## 用戶偏好
- 使用繁體中文 (zh-Hant)
- 移動優先設計 (LINE LIFF 主要使用場景)
- 簡潔清晰的 UI/UX
