# 龜馬山整合服務平台 (goLine Platform)

### Overview
The 龜馬山整合服務平台 (goLine Platform) is a comprehensive service platform designed for the Guimashan community, integrating LINE LIFF and Firebase. Its primary purpose is to provide essential functionalities such as login, check-ins, service applications, and shift management for staff and volunteers. The platform aims to streamline community operations and enhance user engagement through a mobile-first approach.

### User Preferences
- 使用繁體中文 (zh-Hant)
- 移動優先設計 (LINE LIFF 主要使用場景)
- 簡潔清晰的 UI/UX

### System Architecture
The platform utilizes a dual-layer Firebase architecture (`platform-bc783` for authentication and `checkin-76c77` for business data) to ensure robust security and data separation.

**Core Features:**
1.  **LINE Login**: User authentication via LINE LIFF SDK.
2.  **Incense Offering Check-in System**: Manages check-ins for volunteers and devotees.
3.  **Divine Service System**: Handles service applications and inquiries.
4.  **Volunteer Shift Management**: Manages schedules and shift changes.

**Technical Implementations:**
-   **Frontend & Backend**: Next.js 14.2.33 (App Router), React 18, TypeScript.
-   **Authentication**: LINE LIFF SDK 2.22.0, Firebase (client-side), Firebase Admin SDK (server-side).
-   **SuperAdmin Mechanism**: The first registered user automatically becomes a SuperAdmin with full administrative privileges across check-in, schedule, and service systems.

**System Design Choices:**
-   **Dual-layer Firebase**: `platform-bc783` for unified authentication (LINE + Email/Password) and `checkin-76c77` for operational data (check-in records, patrol points).
-   **Login Flow**: For administrators, the initial login is via LINE, followed by password setup for subsequent Email logins.
-   **Data Separation**: User data resides in the `platform` project, while business-specific data is in the `checkin` project.
-   **Hybrid Management Interface**: Includes a central administration panel (`/admin`) for SuperAdmins and specific management interfaces (e.g., `/checkin/manage`) for role-based access.
-   **QR Code System**: Uses QR codes for patrol point check-ins.

### External Dependencies
-   **LINE Platform**: LINE LIFF SDK, LINE Channel ID, LINE Channel Secret, LINE Channel Access Token.
-   **Firebase**:
    -   **`platform-bc783` (Authentication Layer)**: Firebase Authentication, Firestore (for user data).
    -   **`checkin-76c77` (Business Data Layer)**: Firebase Firestore (for check-in records, patrol points, service applications, schedules).
    -   Firebase Admin SDK for server-side operations.
-   **Vercel**: For deployment and hosting, integrated with Vercel Admin API, Project ID, Org ID, and Deploy Hooks for automated deployments.