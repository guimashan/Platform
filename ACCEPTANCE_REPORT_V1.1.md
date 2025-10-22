# 🧾 龜馬山 goLine 平台｜驗收報告 V1.1（R社 → G社 同步）

更新時間：2025-10-22  
環境：Replit + Firebase + GitHub  
對應 Commit：`fix(admin): 完成 Firebase Admin SDK 初始化與 projectId 正確解析`

---

## 🧩 A. 更新摘要（本次變更）
| 類別 | 說明 |
|------|------|
| 🔧 修正 | Firebase Admin SDK 未能正確讀取 Service Account 導致 projectId 為 unknown |
| 🧠 改進 | 多路徑 projectId 推導（Service Account → NEXT_PUBLIC_FIREBASE_PROJECT_ID → GOOGLE_CLOUD_PROJECT） |
| ⚙️ 新增 | `/api/ping-admin` 可穩定返回 projectId 與 Admin 認證狀態 |
| ✅ 驗證結果 | `{"ok":true,"projectId":"platform-bc783","hasAdminAuth":true,"hasAdminDb":true}` |
| 🌐 部署環境 | Replit Dev 執行正常，Vite 前端端口 :5175 對外綁定 External :80 |
| 🔒 安全性 | 無敏感憑證洩漏，所有金鑰留於 Replit Secrets |

---

## 🧱 B. 檔案變更（R社 提交 → G社 同步）
| 檔案 | 狀態 | 備註 |
|-------|------|------|
| `server/lib/firebase-admin.ts` | 🆕 重構 | 完整支援 Base64/JSON 解析與 projectId 推導 |
| `server/routes.ts` | 🆕 調整 | 回傳 `projectId` 與 Admin 狀態 |
| `server/index.ts` | ⚙️ 確認 | 已呼叫 `mountRoutes(app)` 並正常啟動 |
| `.replit` | ⚙️ 確認 | port 5175 → external 80 映射設定正確 |

---

## 🧭 C. 驗收結果
| 模組 | 狀態 | 備註 |
|------|------|------|
| Firebase Admin | ✅ 初始化成功 |
| Admin API 檢測 | ✅ 通過 `/api/ping-admin` |
| GitHub 同步 | ✅ 已推送到 main 分支 |
| Replit Dev 運行 | ✅ 正常 |
| LINE / LIFF | 🔜 預計下階段整合 |

---

## 🪜 D. 下一步計劃（M3 起點）
1. 整合 LINE Login + LIFF 模組（使用者登入 / 身份綁定）  
2. 建立會員資料結構（Firestore）  
3. 上傳與檢查 LINE Channel Token 設定  
4. 預備接入 Firebase Hosting / Vercel 部署鏡像  

---

📦 **目前版本標記**：  
- Release Tag：`v1.1.0-admin-stable`  
- 來源倉庫：<https://replit.com/@guimashan/Gui-Ma-Shan-Zheng-He-Fu-Wu-Ping-Tai>  
- 同步目標：<https://github.com/guimashan/Platform>

---

👨‍💻 **驗收人員註記**：  
> 本次驗收完成 M1 + M2 所有核心功能，系統運作穩定。  
> Firebase Admin SDK 與 GitHub 同步流程測試通過。  
> 準備進入 M3：「LINE 登入與會員整合」階段。