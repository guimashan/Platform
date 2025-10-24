# 龜馬山整合服務平台 (goLine Platform)

## 專案概述
這是一個整合 LINE LIFF 和 Firebase 的服務平台，專為龜馬山社群打造，提供登入、簽到、服務申請和排班管理等功能。

## 系統架構圖
```
使用者（工作人員/志工）
   ↓ 📱 掃描巡邏點 QR Code
   ↓
https://go.guimashan.org.tw/checkin
   ↓ 🔐 LINE 登入 (LIFF)
   ↓
平台後端 (Next.js @ Vercel)
   ├─ /api/checkin/create    ← 打卡上傳
   ├─ /api/ping-bot          ← LINE Bot 健康檢查
   ├─ /api/ping-admin        ← Firebase Admin 健康檢查
   └─ /api/webhook           ← LINE 關鍵字自動回覆
   ↓
📊 Firestore 專案：checkin-76c77
   ├─ checkins/    打卡紀錄
   ├─ points/      巡邏點（玉旨牌/萬應公/辦公室）
   └─ users/       使用者資料（含 SuperAdmin 標記）

💻 管理後台
   /checkin/manage
   └─ 用 Email + Password（Firebase Auth Admin）
      不需要 LINE 登入
```

### ⚠️ 重要筆記
- **後端連接專案**：`checkin-76c77`（不是 `platform-bc783`）
- **未來報表/管理**：都要從 `checkin-76c77` 讀取
- **管理後台**：電腦用，Email/Password 登入
- **Next.js 專案代號**：`platform`（≠ Firestore 專案名稱）

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
      auth/line/route.ts        # LINE 認證 API
      checkin/
        create/route.ts         # 簽到 API
        points/route.ts         # 查詢巡邏點 API
        history/route.ts        # 查詢簽到歷史 API
      webhook/route.ts          # LINE Webhook
      ping-bot/route.ts         # LINE Bot 健康檢查
      ping-admin/route.ts       # Firebase Admin 健康檢查
  types/
    index.ts                    # TypeScript 型別定義
  lib/
    firebase.ts                 # Firebase 客戶端配置
    admin.ts                    # Firebase Admin 配置
    liff.ts                     # LINE LIFF 工具函數
scripts/
  init-patrol-points.ts         # 初始化巡邏點腳本
  m8_auto_tasks.sh              # M8 自動化任務腳本
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
- FIREBASE_SERVICE_ACCOUNT_JSON（⚠️ 必須使用 checkin-76c77 專案）

### LINE LIFF
- LINE_CHANNEL_ID
- LINE_CHANNEL_SECRET
- LINE_CHANNEL_ACCESS_TOKEN（用於 Webhook 關鍵字回覆）
- NEXT_PUBLIC_LINE_LIFF_ID

### Vercel 部署
- VERCEL_ADMIN_API_KEY
- VERCEL_PROJECT_ID
- VERCEL_ORG_ID
- VERCEL_DEPLOY_HOOK_URL（觸發自動重新部署）

### 其他
- NEXT_PUBLIC_BASE_URL（應設為 https://go.guimashan.org.tw）

## 資料模型
### 使用者 (UserDoc)
- displayName: 顯示名稱
- pictureUrl?: 頭像
- lineUserId?: LINE User ID
- roles: 角色權限 (Record<string, boolean>)
- isSuperAdmin?: 是否為超級管理員
- createdAt: 建立時間 (timestamp)
- lastLoginAt: 最後登入時間 (timestamp)

### 巡邏點 (Patrol)
- id: 巡邏點 ID (例如：point-yuji)
- name: 巡邏點名稱 (例如：玉旨牌)
- qr: QR Code 內容 (例如：PATROL_YUJI_2025)
- active: 是否啟用 (boolean)
- createdAt: 建立時間 (timestamp)

### 簽到記錄 (Checkin)
- id: 記錄 ID
- uid: 使用者 Firebase UID
- patrolId: 巡邏點 ID
- ts: 簽到時間戳 (timestamp)
- meta?: 額外資訊 { ua?: 用戶代理, ip?: IP 地址 }

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

## 自動化腳本

### M8 Auto Tasks（全面自檢）
執行 `bash scripts/m8_auto_tasks.sh` 進行：
1. 環境變數檢查（包含 checkin-76c77 專案驗證）
2. API 健康檢查（/api/ping-bot, /api/ping-admin）
3. Git 同步到 GitHub
4. 觸發 Vercel 自動部署

## 最近更改
- **2025-10-24 11:45**: ✅ 完成奉香簽到系統核心功能
  - ✅ 建立巡邏點系統（玉旨牌/萬應公/辦公室）並初始化到 Firestore
  - ✅ 實作 /api/checkin/create 核心簽到邏輯（寫入 Firestore checkin-76c77）
    - 驗證 Firebase ID Token
    - 驗證 QR Code 對應有效巡邏點
    - 檢查重複簽到（5分鐘內）
    - 記錄用戶資訊和 metadata (UA, IP)
  - ✅ 實作 /api/checkin/points API（查詢啟用的巡邏點）
  - ✅ 實作 /api/checkin/history API（查詢使用者簽到歷史）
  - ✅ 完全重構前端 /checkin 頁面
    - 整合 LINE LIFF 登入流程
    - LINE LIFF Token → Firebase Custom Token → Firebase ID Token
    - QR Code 手動輸入（可擴展為掃描）
    - 即時簽到狀態顯示
    - 簽到歷史列表（最近 20 筆）
    - 移動優先設計（台灣宗教文化風格）
  - ✅ 修正關鍵認證錯誤：使用 Firebase ID Token（而非 LINE LIFF Token）呼叫 API
  - ✅ 通過 Architect 代碼審查
  - 📋 已初始化三個巡邏點：
    - 玉旨牌 (point-yuji): PATROL_YUJI_2025
    - 萬應公 (point-wanying): PATROL_WANYING_2025
    - 辦公室 (point-office): PATROL_OFFICE_2025
- **2025-10-24 15:48**: 🔧 修正 Firebase 專案配置並新增自動化
  - 修正 /api/ping-admin 正確返回實際連接的專案 ID（checkin-76c77）
  - 新增 M8 Auto Tasks 自動化腳本（scripts/m8_auto_tasks.sh）
  - 新增型別定義系統（src/types/index.ts）
  - 新增 /api/profile/upsert - 用戶資料落地 API
  - 增強 /api/webhook - 支援 6 個關鍵字自動回覆
  - 修復 SuperAdmin 競態條件（使用 Firestore Transaction）
  - 確保所有 API 使用正確的 checkin-76c77 專案
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
