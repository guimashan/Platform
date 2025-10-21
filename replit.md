# 龜馬山整合服務平台 (goLine Platform)

## 專案概述
這是一個整合 LINE LIFF 和 Firebase 的服務平台，專為龜馬山社群打造，提供登入、簽到、服務申請和排班管理等功能。

## 核心功能
1. **LINE 登入** - 使用 LINE LIFF SDK 進行使用者認證
2. **奉香簽到系統** - 志工與信眾的簽到管理
3. **神務服務** - 服務申請與查詢系統
4. **志工排班系統** - 班表管理與換班功能

## 技術棧
### 前端
- React 18
- TypeScript
- React Router DOM (路由) - 從 Wouter 遷移
- TanStack Query (資料獲取)
- Tailwind CSS + DaisyUI (UI 組件庫)
- LINE LIFF SDK 2.22.0

### 後端
- Express.js + Vite (開發伺服器整合)
- Firebase Admin SDK (認證)
- Firebase Firestore (資料庫)
- LINE LIFF 認證整合

## 專案結構
```
client/
  src/
    pages/          # 頁面組件
      home.tsx      # 首頁
      login.tsx     # LINE 登入頁
      checkin.tsx   # 簽到系統
      service.tsx   # 服務申請
      schedule.tsx  # 排班管理
    components/
      ui/           # UI 組件
server/
  routes.ts         # API 路由
  storage.ts        # 資料存取層
shared/
  schema.ts         # 資料模型定義
```

## 環境變數
### Firebase (Client)
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

## 最近更改
- 2025-10-21: 修復模組導入和型別錯誤
  - 將 server/routes.ts 中的 `@shared/schema` 改為相對路徑 `../shared/schema`，避免 vite.config.ts 階段的路徑解析問題
  - 修復 LINE 認證 API 中的 `pictureUrl` 處理，當 LINE 未提供頭像時正確省略該欄位
  - 清除所有 LSP 錯誤
- 2025-10-20: 從 GitHub 導入專案結構，設置 Firebase 和 LINE LIFF 整合

## 已知問題
### 端口配置問題
- **問題描述**：`.replit` 檔案中 `waitForPort = 5000`，但應用運行在端口 5175（Vite 預設端口）
- **影響**：工作流顯示為 FAILED，但應用本身啟動成功（Firebase Admin SDK 初始化成功，Vite ready）
- **解決方案**：需要手動修改 `.replit` 檔案：
  ```toml
  [[workflows.workflow.tasks]]
  task = "shell.exec"
  args = "npm run dev"
  waitForPort = 5175  # 改為 5175

  [[ports]]
  localPort = 5175
  externalPort = 80   # 改為 80 以對應外部端口
  ```

## 用戶偏好
- 使用繁體中文 (zh-Hant)
- 移動優先設計 (LINE LIFF 主要使用場景)
- 簡潔清晰的 UI/UX
