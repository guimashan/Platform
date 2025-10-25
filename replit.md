# 龜馬山整合服務平台 (goLine Platform)

### Overview
The 龜馬山整合服務平台 (goLine Platform) is a comprehensive service platform designed for the Guimashan community, integrating LINE LIFF and Firebase. Its primary purpose is to provide essential functionalities such as login, check-ins, service applications, and shift management for staff and volunteers. The platform aims to streamline community operations and enhance user engagement through a mobile-first approach.

### User Preferences
- 使用繁體中文 (zh-Hant)
- 移動優先設計 (LINE LIFF 主要使用場景)
- 簡潔清晰的 UI/UX

### System Architecture
The platform is designed with a four-layer Firebase architecture. Currently implemented: `platform-bc783` (authentication layer) and `checkin-76c77` (check-in business layer). Planned for future: `schedule-48ff9` (scheduling) and `service-b9d4a` (divine services).

**Core Features:**
1.  **LINE Login**: User authentication via LINE LIFF SDK.
2.  **Incense Offering Check-in System**: Manages check-ins for volunteers and devotees with GPS-verified patrol points.
3.  **神服服務系統 (Divine Service System)**: Handles service applications and inquiries.
4.  **Volunteer Shift Management**: Manages schedules and shift changes.

**Technical Implementations:**
-   **Frontend & Backend**: Next.js 14.2.33 (App Router), React 18, TypeScript.
-   **Dual Authentication System**:
    - **LIFF (Front-end)**: LINE LIFF SDK 2.22.0 for in-app check-in interface
    - **LINE Login OAuth (Back-end)**: Browser-based OAuth flow for admin access
    - Full ID token verification with JOSE + LINE JWKS
    - HTTP-only cookies for secure credential transmission
-   **SuperAdmin Mechanism**: The first registered user automatically becomes a SuperAdmin with full administrative privileges across check-in, schedule, and service systems.

**System Design Choices:**
-   **Multi-layer Firebase Architecture (2/4 implemented)**: 
    - ✅ `platform-bc783` (Authentication Layer): Unified authentication (LINE + Email/Password)
    - ✅ `checkin-76c77` (Check-in Business Layer): Check-in records, patrol points
    - 📋 `schedule-48ff9` (Schedule Business Layer): Planned - Volunteer schedules, shift management
    - 📋 `service-b9d4a` (神服 Business Layer): Planned - Service applications, inquiries
-   **Login Flow**: 
    - **Front-end (LIFF)**: Direct LINE login in LINE app for check-in features
    - **Back-end (OAuth)**: LINE Login OAuth in browser for admin management
    - Environment auto-detection routes users to appropriate login method
-   **Data Separation**: User data resides in the `platform` project, while business-specific data is in respective business layer projects.
-   **Hybrid Management Interface**: Includes a central administration panel (`/admin`) for SuperAdmins and specific management interfaces (e.g., `/checkin/manage`) for role-based access.
-   **QR Code System**: Uses QR codes for patrol point check-ins.

### External Dependencies
-   **LINE Platform**: LINE LIFF SDK, LINE Channel ID, LINE Channel Secret, LINE Channel Access Token.
-   **Firebase (Four-layer Architecture)**:
    -   **`platform-bc783` (Authentication Layer)**: Firebase Authentication, Firestore (for user data and roles).
    -   **`checkin-76c77` (Check-in Business Layer)**: Firebase Firestore (for check-in records, patrol points).
    -   **`schedule-48ff9` (Schedule Business Layer)**: Firebase Firestore (for volunteer schedules, shift management).
    -   **`service-b9d4a` (神服 Business Layer)**: Firebase Firestore (for service applications, inquiries).
    -   Firebase Admin SDK for server-side operations.
-   **Vercel/Replit**: For deployment and hosting.

## Recent Updates

### 2025-10-25 17:00 - PowerUser 角色完整支援（✅ 完成）
- ✅ **四層權限系統完成**：
  - **user** - 一般使用者（只能使用 LIFF 簽到）
  - **poweruser** - 進階使用者（可查看管理後台，但**不能修改**設定）
  - **admin** - 管理員（可查看和修改所有設定）
  - **superadmin** - 超級管理員（跨系統管理）
  
- ✅ **後端 API 完整實作**：
  - 權限 API (`/api/auth/permissions`)：新增返回 `checkin_role`, `schedule_role`, `service_role`
  - 統計 API (`/api/checkin/stats`)：poweruser 可查看（使用 `hasCheckinAccess`）
  - 記錄 API (`/api/checkin/records`)：poweruser 可查看（使用 `hasCheckinAccess`）
  - 修改類 API：需要 admin 權限（使用 `hasCheckinAdmin`）
  - 保持向後相容（舊的 `roles.checkin_admin` 仍然有效）
  
- ✅ **前端 UI 權限控制**：
  - `/admin` - poweruser 可看到簽到系統卡片
  - `/checkin/manage` - poweruser 只看到「簽到記錄」卡片
  - `/checkin/manage` - admin 看到「人員管理」、「巡邏點管理」、「簽到記錄」三個卡片
  - 自動適配新舊架構（同時檢查 `roles.checkin_admin` 和 `checkin_role`）
  
- ✅ **安全性雙重審查通過**：
  - 前後端權限完全一致
  - UI 層面隱藏 admin 功能
  - API 層面阻擋未授權請求
  - 無安全漏洞
  
- ✅ **測試文檔**：
  - 詳細測試計劃：`tests/POWERUSER_TEST_PLAN.md`（11 個測試案例）
  - 測試摘要：`tests/POWERUSER_TEST_SUMMARY.md`（包含權限矩陣）
  
- 📋 **後續測試步驟**：
  1. 在 Firebase 建立測試帳號（poweruser 和 admin）
  2. 執行手動測試確認 UI 正確顯示
  3. 測試 API 權限控制（curl 或 Postman）
  4. 確認向後相容性（舊架構 admin 仍有效）

### 2025-10-25 14:45 - LIFF 統一入口架構（方案 2：根路徑）
- ✅ **採用方案 2：根路徑入口** (`https://go.guimashan.org.tw/`)
  - 一個 LIFF App 支援所有業務系統（簽到、神服、排班）
  - 首頁作為統一選單，顯示所有可用服務
  - 用戶可直接訪問子路徑（如 `/checkin`）無需經過首頁
- ✅ **LIFF 初始化策略**：
  - 首頁：初始化 LIFF 但不強制登入（僅顯示選單）
  - `/checkin`：完整 LIFF 流程（初始化 + 自動登入）
  - `/service`、`/schedule`：未來實作，同樣模式
- ✅ **使用情境支援**：
  - LINE Bot 關鍵字 → 直接跳轉功能頁（如 `/checkin`）✅
  - LIFF App 選單 → 選擇服務 → 跳轉功能頁 ✅
  - 分享連結 → 直接開啟特定功能 ✅
- 🔧 **LINE 設定需求**：
  - LIFF Endpoint URL: `https://go.guimashan.org.tw/`
  - LINE Login Callback: `https://go.guimashan.org.tw/api/auth/line-oauth/callback`
  - `NEXT_PUBLIC_BASE_URL`: `https://go.guimashan.org.tw`

### 2025-10-25 12:00 - 雙登入架構改造完成（LIFF + LINE Login OAuth）
- ✅ **雙登入系統實現**：
  - 前台（LIFF）：`/checkin` - LINE LIFF SDK，供志工簽到使用
  - 後台（OAuth）：`/admin/login` - LINE Login OAuth，供管理員使用
- ✅ **環境自動判斷**：首頁依據 User-Agent 自動分流至 LIFF 或 OAuth
- ✅ **安全性強化**：
  - ID Token 完整驗證（使用 JOSE + LINE JWKS 公鑰）
  - Nonce 防重放攻擊
  - State 參數 CSRF 防護
  - HTTP-only Cookie 安全傳遞憑證
- ✅ **LIFF 簽到介面**：
  - GPS 定位功能
  - QR Code 掃描（`liff.scanCodeV2`）
  - 巡邏點列表顯示
  - 完整登入流程
- ✅ **後台管理中心**：
  - 統一管理首頁（`/admin`）
  - 角色卡片導航（SuperAdmin、checkin_admin）
  - OAuth 登入後正確跳轉
- ✅ **Firebase 服務帳號配置**：正確設定 `PLATFORM_SERVICE_ACCOUNT_JSON`（伺服器端）
- ✅ **整合測試通過**：所有頁面正常運作（200 OK），OAuth 流程正確（307 redirect）
- 📋 **準備部署到 Vercel**

### 2025-10-24 19:30 - 雙層架構完成，準備上傳倉庫
- ✅ 已實現雙層架構：platform-bc783 (認證) + checkin-76c77 (奉香簽到)
- ✅ 核心功能完整：LINE/Email 登入、巡邏點管理、權限控制
- 📋 已規劃但未實現：schedule-48ff9 (排班) + service-b9d4a (神服)
- 🧹 代碼清理完成：移除 .next/ 建置文件
- 📦 準備上傳到 Git 倉庫

### 2025-10-24 17:45 - 巡邏點管理功能
- ✅ 建立網頁管理介面（`/checkin/manage/points`）
- ✅ admin 可新增/編輯/刪除/啟用/停用巡邏點
- ✅ 使用 react-hook-form + Zod schema 驗證
- ✅ 完整的 shadcn 元件系統（Dialog, Table, Form, Badge）
- ✅ GPS 座標驗證（緯度 -90~90、經度 -180~180）
- ✅ 權限控制：只有 checkin admin 和 SuperAdmin 可訪問
- ✅ 通過 Architect 代碼審查

### 2025-10-24 17:20 - 完整測試系統
- ✅ API 自動化測試（`tests/api-test.js`）
- ✅ 整合測試（`tests/integration-test.js`）
- ✅ 前端功能測試清單（`tests/frontend-test.md`）- 105 項測試點
- ✅ 測試系統總覽（`tests/TEST_OVERVIEW.md`）

### 2025-10-24 17:15 - 混合式管理介面
- ✅ 總管理中心（`/admin/users`）- SuperAdmin 可管理所有系統
- ✅ 奉香人員管理（`/checkin/manage/users`）- checkin admin 管理奉香系統
- ✅ 權限分層正確實現
- ✅ 修正 GPS 非同步問題