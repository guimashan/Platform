# 🚀 PowerUser 功能部署指南

## 📋 本次更新內容

### ✅ 完成的功能
1. **四層權限系統**：user / poweruser / admin / superadmin
2. **後端 API 權限控制**：poweruser 可查看，admin 可修改
3. **前端 UI 權限控制**：根據角色顯示不同功能
4. **向後相容**：舊架構 `roles.checkin_admin` 仍然有效
5. **安全性審查**：通過 2 次 Architect 審查

### 📝 變更的檔案

#### 後端
- `src/lib/auth-helpers.ts` - 新增 `hasCheckinAccess()` 和 `hasCheckinPowerUser()`
- `src/app/api/auth/permissions/route.ts` - 返回新角色欄位
- `src/app/api/checkin/stats/route.ts` - 使用 `hasCheckinAccess`
- `src/app/api/checkin/records/route.ts` - 使用 `hasCheckinAccess`

#### 前端
- `src/app/admin/page.tsx` - 更新權限檢查
- `src/app/checkin/manage/page.tsx` - 條件顯示管理卡片

#### 文檔與測試
- `tests/POWERUSER_TEST_PLAN.md` - 詳細測試計劃
- `tests/POWERUSER_TEST_SUMMARY.md` - 測試摘要
- `tests/MANUAL_TEST_GUIDE.md` - 手動測試指南
- `tests/test-poweruser-permissions.js` - 自動化測試腳本
- `DEPLOYMENT_GUIDE.md` - 本文件
- `replit.md` - 已更新最新進度

---

## 🔧 部署步驟

### 步驟 1：提交代碼到 Git

在 Replit Shell 中執行以下指令：

```bash
# 查看變更
git status

# 添加所有變更
git add .

# 提交變更
git commit -m "feat: 新增 PowerUser 角色支援

- 四層權限系統：user/poweruser/admin/superadmin
- PowerUser 可查看管理後台但不能修改設定
- 前端 UI 根據角色條件顯示功能
- 後端 API 權限控制完整實作
- 向後相容舊架構 roles.checkin_admin
- 通過 Architect 安全性審查"

# 推送到 GitHub
git push origin main
```

### 步驟 2：Vercel 自動部署

推送到 GitHub 後，Vercel 會自動開始部署。

#### 檢查部署狀態
1. 前往 Vercel Dashboard: https://vercel.com/dashboard
2. 找到專案：`goLine Platform`
3. 查看 Deployments 標籤
4. 等待部署完成（通常 2-3 分鐘）

#### Vercel 環境變數確認
確保以下環境變數已設定（您已經設定好）：

**Firebase Platform (認證層)**
- `NEXT_PUBLIC_PLATFORM_FIREBASE_API_KEY`
- `NEXT_PUBLIC_PLATFORM_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_PLATFORM_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_PLATFORM_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_PLATFORM_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_PLATFORM_FIREBASE_APP_ID`
- `PLATFORM_SERVICE_ACCOUNT_JSON`

**Firebase Checkin (業務層)**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_CHECKIN_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_CHECKIN_FIREBASE_STORAGE_BUCKET`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

**LINE**
- `NEXT_PUBLIC_LINE_LIFF_ID`
- `LINE_CHANNEL_ID`
- `LINE_CHANNEL_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`

**其他**
- `NEXT_PUBLIC_BASE_URL` = `https://go.guimashan.org.tw`
- `SESSION_SECRET`

### 步驟 3：驗證部署

#### 3.1 檢查應用程式可訪問性
```bash
# 測試首頁
curl -I https://go.guimashan.org.tw/

# 測試管理入口
curl -I https://go.guimashan.org.tw/admin

# 測試簽到頁面
curl -I https://go.guimashan.org.tw/checkin
```

應該都返回 `200 OK` 或 `307 Redirect`

#### 3.2 檢查 API 端點
```bash
# 測試權限 API（應該返回 401）
curl https://go.guimashan.org.tw/api/auth/permissions

# 應該返回：{"error":"未授權"}
```

#### 3.3 檢查構建日誌
在 Vercel Dashboard 中：
1. 點擊最新的 Deployment
2. 查看 Build Logs
3. 確認沒有錯誤

---

## 🧪 正式環境測試

### 準備工作：建立測試帳號

#### 方法 1：使用 Firebase Console（推薦）

1. **前往 Firebase Console**:
   - https://console.firebase.google.com/
   - 選擇專案：`platform-bc783`

2. **建立 PowerUser 測試帳號**:
   
   **Authentication:**
   - 進入 Authentication → Users
   - 點擊 **Add user**
   - Email: `poweruser@guimashan.org.tw`
   - Password: `Gouma2025!`
   - 記下 User UID

   **Firestore:**
   - 進入 Firestore Database → Data
   - 找到 `users` collection
   - 新增 document（使用上面的 User UID）
   
   ```json
   {
     "email": "poweruser@guimashan.org.tw",
     "displayName": "測試 PowerUser",
     "checkin_role": "poweruser",
     "schedule_role": "user",
     "service_role": "user",
     "isSuperAdmin": false,
     "createdAt": [Timestamp - 現在]
   }
   ```

3. **建立 Admin 測試帳號**:
   
   **Authentication:**
   - Email: `admin@guimashan.org.tw`
   - Password: `Gouma2025!`
   
   **Firestore:**
   ```json
   {
     "email": "admin@guimashan.org.tw",
     "displayName": "測試 Admin",
     "checkin_role": "admin",
     "schedule_role": "admin",
     "service_role": "admin",
     "isSuperAdmin": false,
     "createdAt": [Timestamp - 現在]
   }
   ```

### 測試流程

#### ✅ PowerUser 測試

1. **登入**
   - 訪問：https://go.guimashan.org.tw/admin/login
   - Email: `poweruser@guimashan.org.tw`
   - Password: `Gouma2025!`

2. **驗證 `/admin` 頁面**
   - ✅ 應該看到「簽到系統」卡片
   - ❌ 不應該看到「總管理中心」卡片

3. **進入簽到管理** (`/checkin/manage`)
   - 點擊「簽到系統」卡片
   - ✅ 應該看到統計數據
   - ✅ 應該看到圖表

4. **檢查快速導航**
   - ✅ **只**應該看到「簽到記錄」卡片
   - ❌ 不應該看到「人員管理」
   - ❌ 不應該看到「巡邏點管理」

5. **訪問簽到記錄**
   - 點擊「簽到記錄」
   - ✅ 應該可以正常查看

6. **測試限制**
   - 在網址列輸入：`https://go.guimashan.org.tw/checkin/manage/points`
   - ❌ 應該被拒絕或重定向

#### ✅ Admin 測試

1. **登出 PowerUser**

2. **登入 Admin**
   - Email: `admin@guimashan.org.tw`
   - Password: `Gouma2025!`

3. **驗證 `/checkin/manage`**
   - ✅ 應該看到**3 個**快速導航卡片：
     - 人員管理
     - 巡邏點管理
     - 簽到記錄

4. **測試管理功能**
   - ✅ 可以進入「巡邏點管理」
   - ✅ 可以進入「人員管理」

### 測試結果記錄

| 測試項目 | PowerUser | Admin | 狀態 |
|---------|:---------:|:-----:|:----:|
| 登入成功 | ⬜ | ⬜ | |
| 訪問 `/admin` | ⬜ | ⬜ | |
| 訪問 `/checkin/manage` | ⬜ | ⬜ | |
| 快速導航卡片數量 | 1 個 | 3 個 | ⬜ |
| 訪問巡邏點管理 | ❌ | ✅ | ⬜ |
| 訪問人員管理 | ❌ | ✅ | ⬜ |

---

## 📊 部署檢查清單

### 代碼提交
- [ ] 執行 `git status` 確認變更
- [ ] 執行 `git add .` 添加所有變更
- [ ] 執行 `git commit` 提交變更
- [ ] 執行 `git push origin main` 推送到 GitHub

### Vercel 部署
- [ ] 確認 Vercel 自動開始部署
- [ ] 等待部署完成（綠色勾勾）
- [ ] 檢查 Build Logs 無錯誤
- [ ] 訪問正式網址確認可訪問

### 測試帳號建立
- [ ] 在 Firebase Console 建立 PowerUser 帳號
- [ ] 在 Firebase Console 建立 Admin 帳號
- [ ] 確認 Firestore 資料正確

### 功能測試
- [ ] PowerUser 登入測試
- [ ] PowerUser 功能限制測試
- [ ] Admin 登入測試
- [ ] Admin 完整功能測試

---

## ✨ 預期結果

### PowerUser
- ✅ 可以登入管理後台
- ✅ 可以查看簽到統計
- ✅ 可以查看簽到記錄
- ❌ 不能看到管理功能入口
- ❌ 不能修改系統設定

### Admin
- ✅ 所有 PowerUser 權限
- ✅ 可以管理巡邏點
- ✅ 可以管理人員權限

---

## 🎯 完成標準

當以下條件都滿足時，部署成功：

1. ✅ 代碼成功推送到 GitHub
2. ✅ Vercel 部署成功（綠色勾勾）
3. ✅ 正式網址可以訪問
4. ✅ PowerUser 可以登入並查看資料
5. ✅ PowerUser 無法訪問管理功能
6. ✅ Admin 可以訪問所有功能

---

## 📞 問題排查

### 如果部署失敗
1. 檢查 Vercel Build Logs
2. 確認環境變數是否都已設定
3. 檢查 Next.js 版本相容性

### 如果功能異常
1. 開啟瀏覽器開發者工具（F12）
2. 查看 Console 錯誤訊息
3. 查看 Network 標籤的 API 請求
4. 確認 Firebase 帳號資料正確

### 如果權限不正確
1. 檢查 Firestore `users` collection
2. 確認 `checkin_role` 欄位值正確
3. 登出後重新登入
4. 清除瀏覽器快取

---

## 🚀 部署完成後

### 給用戶的網址
部署成功後，提供以下網址：

**正式網站**:
- 首頁：https://go.guimashan.org.tw/
- 管理登入：https://go.guimashan.org.tw/admin/login
- LIFF 簽到：https://go.guimashan.org.tw/checkin

**測試帳號**（如果已建立）:
- PowerUser: `poweruser@guimashan.org.tw` / `Gouma2025!`
- Admin: `admin@guimashan.org.tw` / `Gouma2025!`

---

**部署指南版本**: 1.0  
**最後更新**: 2025-10-25  
**功能狀態**: ✅ Ready for Production
