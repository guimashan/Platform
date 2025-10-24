# 🕯️ 龜馬山 goLine 平台  
## 奉香簽到系統 完整需求規格書 v1.1（正式版）  
**制定單位：** 龜馬山紫皇天乙真慶宮 goLine 專案小組  
**發佈日期：** 2025 年 10 月  

---

## 一、系統概要

奉香簽到系統（Check-in System）為「龜馬山 goLine 平台」核心子系統之一，  
主要提供龜馬山紫皇天乙真慶宮之**工作人員**與**志工**於每日執勤時，透過 **LINE 登入** 進行巡邏點打卡與簽到紀錄。  

本系統建立於雙層 Firebase 架構（`platform-bc783`、`checkin-76c77`），以確保登入驗證與業務資料分離，  
並提升資料安全與維運彈性。

---

## 二、系統定位與目標

| 項目 | 說明 |
|------|------|
| 系統名稱 | 龜馬山 goLine 平台 - 奉香簽到系統 |
| 系統定位 | 工作人員與志工簽到管理平台 |
| 主要使用者 | 志工、工作人員、管理者、系統管理員 |
| 開發平台 | Next.js 14 + Firebase + LINE Login + Vercel |
| 系統目標 | 以行動裝置為主體，實現「一鍵簽到、自動記錄、雲端管理」的工作流程 |

---

## 三、系統整體架構

| 分層 | 技術 | 功能說明 |
|------|------|-----------|
| 前端應用 | Next.js 14 + DaisyUI | 響應式介面，行動優先設計 |
| 後端服務 | Firebase Functions + Firestore | 資料存取與簽到業務邏輯 |
| 認證系統 | LINE Login + Firebase Auth | 雙層身分驗證（使用者 / 管理者） |
| 部署環境 | Vercel（正式） / Replit（開發） | 雙環境分流，快速部署 |
| 資料庫 | Firestore（`platform-bc783` / `checkin-76c77`） | 分工式資料架構 |

---

## 四、Firebase 資料庫分工說明

### `platform-bc783` — 平台層（登入與會員管理）

| 項目 | 說明 |
|------|------|
| 資料庫型別 | Firebase Authentication + Firestore |
| 主要功能 | LINE 登入授權、會員資料管理、平台共用身分驗證 |
| 對應子系統 | 奉香簽到、神務服務、志工排班 |
| 資料集合 | `users`（共用會員表） |
| 權限範圍 | 所有子系統共用（唯讀） |
| 安全原則 | 僅保存身份與登入紀錄，不包含業務資料 |

> **platform-bc783**：負責「誰是誰」的管理，僅紀錄登入身分與授權。

### `checkin-76c77` — 奉香簽到層（業務邏輯與紀錄）

| 項目 | 說明 |
|------|------|
| 資料庫型別 | Firestore Database |
| 主要功能 | 打卡紀錄、巡邏點設定、簽到日誌、系統記錄 |
| 對應子系統 | 奉香簽到系統 |
| 資料集合 | `checkins`（簽到紀錄）、`points`（巡邏點設定）、`logs`（系統日誌） |
| 權限範圍 | 僅限奉香簽到系統使用 |
| 安全原則 | 僅可透過後端 API 寫入，防止客戶端竄改 |

> **checkin-76c77**：負責「發生了什麼事」，包含簽到地點與時間記錄。

---

## 五、主要使用者分類與行為

| 使用者 | 登入方式 | 權限 | 使用場景 |
|----------|------------|--------|-------------|
| 工作人員 / 志工 | LINE 登入（`platform-bc783`） | 打卡、查看歷史紀錄 | 使用手機掃描巡邏點 QR 簽到 |
| 管理者 | Firebase Email + Password 登入（`checkin-76c77`） | 查看報表、匯出資料 | 電腦端登入後台管理 |
| 系統管理員 | Firebase Admin SDK | 全系統權限 | 維護巡邏點與權限設定 |

---

## 六、系統功能模組總覽

| 模組名稱 | 功能說明 | 主要端點 / 頁面 |
|-----------|------------|----------------|
| LINE 登入模組 | LINE OAuth 2.1 登入授權流程，綁定 Firebase 使用者 | `/login` |
| 奉香簽到模組 | 掃描 QR 打卡、顯示巡邏點與簽到結果 | `/checkin` |
| 成功畫面 | 顯示「簽到成功」動畫與時間地點 | `/checkin/success` |
| 失敗畫面 | 顯示「重複簽到」或「簽到失敗」提示 | `/checkin/fail` |
| 歷史紀錄 | 顯示個人簽到歷史 | `/checkin/history` |
| 管理後台 | 檢視簽到記錄、匯出報表 | `/checkin/manage` |
| 管理登入 | 後台管理登入頁面 | `/admin/login` |

---

## 七、Firestore 資料結構摘要

```plaintext
checkins {
  userId: string,
  pointId: string,
  timestamp: Timestamp,
  location: string,
  status: "success" | "fail",
  note?: string
}

points {
  id: string,
  name: string, // 例如：玉旨牌、萬應公、辦公室
  qrCode: string,
  active: boolean
}

users {
  uid: string,
  name: string,
  lineId: string,
  role: "user" | "admin" | "superadmin",
  createdAt: Timestamp
}
```

---

## 八、安全與驗證設計

1. **身分驗證層**  
   - 使用 LINE OAuth 與 Firebase Auth 雙重驗證。  
   - 使用者登入時自動綁定 LINE UID 至 Firebase `users` 集合。  

2. **資料操作層**  
   - 所有簽到資料（`checkins`）僅能透過 Firebase Admin SDK 代為寫入。  
   - 禁止前端直接操作 Firestore，防止竄改。

3. **後台安全層**  
   - `/admin/login` 採 Email + Password 登入，僅限管理者群組。
   - 各管理者帳號設有「角色權限」，可細分管理巡邏點、簽到報表等功能。

4. **API 保護**  
   - 所有 API 均設置 LINE Channel Secret 驗證簽章。
   - 伺服端驗證後才接受簽到請求。

---

## 九、未來擴充方向

1. **整合神務服務（Service）**  
   - 預計於下一階段整合奉香報名與祈福項目支付功能。
2. **志工排班系統（Schedule）**  
   - 導入工作班表與自動通知，連結簽到紀錄統計。
3. **行為分析報表**  
   - 對簽到資料進行趨勢分析（活躍度、出勤率、常駐地點）。
4. **多語系支援**  
   - 未來將支援繁體中文 / 英文切換，以利外籍志工使用。

---

## 十、結語

本系統為龜馬山數位化工程的重要支柱，將於神務服務、志工排班等模組陸續導入後，形成完整的龜馬山 goLine 生態圈。  
以「淨化人心、安樂人生、心願歸真、道法自然」為信念，  
讓每一次簽到、每一筆紀錄，都成為誠心奉香與修行之路的數位印記。

