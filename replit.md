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
-   **Authentication**: LINE LIFF SDK 2.22.0, Firebase (client-side), Firebase Admin SDK (server-side).
-   **SuperAdmin Mechanism**: The first registered user automatically becomes a SuperAdmin with full administrative privileges across check-in, schedule, and service systems.

**System Design Choices:**
-   **Multi-layer Firebase Architecture (2/4 implemented)**: 
    - ✅ `platform-bc783` (Authentication Layer): Unified authentication (LINE + Email/Password)
    - ✅ `checkin-76c77` (Check-in Business Layer): Check-in records, patrol points
    - 📋 `schedule-48ff9` (Schedule Business Layer): Planned - Volunteer schedules, shift management
    - 📋 `service-b9d4a` (神服 Business Layer): Planned - Service applications, inquiries
-   **Login Flow**: For administrators, the initial login is via LINE, followed by password setup for subsequent Email logins.
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