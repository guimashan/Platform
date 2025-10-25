# PowerUser 權限系統 - 手動測試指南

## 📋 測試狀態總覽

### ✅ 已完成（自動驗證）
- ✅ 後端權限檢查函數已實作（`hasCheckinAccess`, `hasCheckinAdmin`）
- ✅ 權限 API 已更新（返回新角色欄位）
- ✅ 前端 UI 權限控制已實作
- ✅ Architect 代碼審查通過（2 次）
- ✅ 無授權 API 請求正確被拒絕
- ✅ 應用程式正常運行（HTTP 200）

### 🔧 需要手動測試
由於 Firebase Service Account 權限限制，無法自動創建測試帳號。
需要在 Firebase Console 中手動建立測試帳號並執行以下測試。

---

## 📝 步驟 1：在 Firebase Console 建立測試帳號

### 1.1 建立 PowerUser 測試帳號

#### 在 Firebase Authentication 中：
1. 前往 Firebase Console：https://console.firebase.google.com/
2. 選擇專案：`platform-bc783`
3. 進入 **Authentication** → **Users**
4. 點擊 **Add user**
5. 輸入：
   - Email: `poweruser-test@guimashan.org.tw`
   - Password: `Test1234!`
6. 點擊 **Add user**
7. 記下生成的 **User UID**

#### 在 Firestore Database 中：
1. 進入 **Firestore Database** → **Data**
2. 找到 `users` collection
3. 點擊 **Add document**
4. Document ID: 輸入上一步記下的 User UID
5. 新增以下欄位：

```json
{
  "email": "poweruser-test@guimashan.org.tw",
  "displayName": "測試 PowerUser",
  "checkin_role": "poweruser",
  "schedule_role": "user",
  "service_role": "user",
  "isSuperAdmin": false,
  "createdAt": [選擇 Timestamp 類型，設為現在]
}
```

### 1.2 建立 Admin 測試帳號

重複上述步驟，但使用以下資料：

**Authentication:**
- Email: `admin-test@guimashan.org.tw`
- Password: `Test1234!`

**Firestore:**
```json
{
  "email": "admin-test@guimashan.org.tw",
  "displayName": "測試 Admin",
  "checkin_role": "admin",
  "schedule_role": "admin",
  "service_role": "admin",
  "isSuperAdmin": false,
  "createdAt": [Timestamp - 現在]
}
```

### 1.3 建立舊架構 Admin 測試帳號（測試向後相容）

**Authentication:**
- Email: `legacy-admin-test@guimashan.org.tw`
- Password: `Test1234!`

**Firestore:**
```json
{
  "email": "legacy-admin-test@guimashan.org.tw",
  "displayName": "測試舊架構 Admin",
  "roles": {
    "checkin_admin": true
  },
  "isSuperAdmin": false,
  "createdAt": [Timestamp - 現在]
}
```

---

## 🧪 步驟 2：執行前端測試

### 測試 2.1：PowerUser 登入測試

1. **開啟應用程式**：
   - 訪問：`https://go.guimashan.org.tw/admin/login`
   - 或本地：`http://localhost:5175/admin/login`

2. **登入 PowerUser 帳號**：
   - Email: `poweruser-test@guimashan.org.tw`
   - Password: `Test1234!`

3. **驗證管理入口頁面** (`/admin`)：
   - ✅ 應該看到「龜馬山管理中心」標題
   - ✅ 應該看到「簽到系統」卡片
   - ❌ **不應該**看到「總管理中心」卡片（SuperAdmin 專用）

4. **進入簽到管理頁面** (`/checkin/manage`)：
   - 點擊「簽到系統」卡片
   - ✅ 應該看到統計數據（今日/本週/本月簽到數）
   - ✅ 應該看到圖表（巡邏點分布、時段分布）

5. **檢查快速導航區域**：
   - ✅ 應該**只**看到「簽到記錄」卡片
   - ❌ **不應該**看到「人員管理」卡片
   - ❌ **不應該**看到「巡邏點管理」卡片

6. **訪問簽到記錄頁面** (`/checkin/records`)：
   - 點擊「簽到記錄」卡片
   - ✅ 應該看到完整的簽到記錄表格
   - ✅ 應該可以使用篩選功能

7. **嘗試直接訪問限制頁面**：
   - 在瀏覽器網址列輸入：`/checkin/manage/points`
   - ❌ 應該被重定向或顯示「權限不足」
   
### 測試 2.2：Admin 登入測試

1. **登出 PowerUser**
2. **登入 Admin 帳號**：
   - Email: `admin-test@guimashan.org.tw`
   - Password: `Test1234!`

3. **驗證管理入口頁面** (`/admin`)：
   - ✅ 應該看到「簽到系統」卡片

4. **進入簽到管理頁面** (`/checkin/manage`)：
   - ✅ 應該看到統計數據

5. **檢查快速導航區域**：
   - ✅ 應該看到「人員管理」卡片
   - ✅ 應該看到「巡邏點管理」卡片
   - ✅ 應該看到「簽到記錄」卡片
   - **共 3 個卡片**

6. **訪問巡邏點管理** (`/checkin/manage/points`)：
   - 點擊「巡邏點管理」卡片
   - ✅ 應該可以正常進入
   - ✅ 應該可以看到「新增巡邏點」按鈕

7. **訪問人員管理** (`/checkin/manage/users`)：
   - 返回 `/checkin/manage`
   - 點擊「人員管理」卡片
   - ✅ 應該可以正常進入
   - ✅ 應該可以看到「編輯角色」按鈕

### 測試 2.3：舊架構 Admin 測試（向後相容）

1. **登出 Admin**
2. **登入舊架構 Admin**：
   - Email: `legacy-admin-test@guimashan.org.tw`
   - Password: `Test1234!`

3. **驗證功能**：
   - ✅ 應該可以訪問 `/admin`
   - ✅ 應該可以訪問 `/checkin/manage`
   - ✅ 應該看到 3 個快速導航卡片（與新架構 admin 相同）

---

## 🔬 步驟 3：執行 API 測試（選用）

如果你想測試 API 層面的權限控制，可以使用瀏覽器開發者工具：

### 3.1 取得 ID Token

1. 登入任一測試帳號
2. 開啟瀏覽器開發者工具（F12）
3. 切換到 **Console** 標籤
4. 執行以下程式碼：

```javascript
// 取得當前用戶的 ID Token
import { platformAuth } from './lib/firebase-platform';
const user = platformAuth.currentUser;
if (user) {
  user.getIdToken().then(token => {
    console.log('ID Token:', token);
    // 複製這個 token 用於下一步
  });
}
```

### 3.2 測試權限 API

在 **Network** 標籤或使用 curl：

```bash
# 將 <YOUR_ID_TOKEN> 替換為上一步取得的 token

# 測試權限 API
curl -H "Authorization: Bearer <YOUR_ID_TOKEN>" \
  https://go.guimashan.org.tw/api/auth/permissions

# PowerUser 應該返回：
{
  "isSuperAdmin": false,
  "roles": {},
  "checkin_role": "poweruser",
  "schedule_role": "user",
  "service_role": "user"
}

# 測試統計 API（PowerUser 應該可以訪問）
curl -H "Authorization: Bearer <YOUR_ID_TOKEN>" \
  https://go.guimashan.org.tw/api/checkin/stats
# 應該返回 200 OK 和統計數據

# 測試記錄 API（PowerUser 應該可以訪問）
curl -H "Authorization: Bearer <YOUR_ID_TOKEN>" \
  https://go.guimashan.org.tw/api/checkin/records?limit=5
# 應該返回 200 OK 和記錄列表
```

---

## ✅ 測試結果記錄表

### PowerUser 測試

| 測試項目 | 預期結果 | 實際結果 | 通過 |
|---------|---------|---------|:----:|
| 登入成功 | ✅ 可以登入 | | [ ] |
| 訪問 `/admin` | ✅ 看到簽到卡片 | | [ ] |
| 訪問 `/checkin/manage` | ✅ 看到統計 | | [ ] |
| 快速導航卡片數量 | ✅ 只有 1 個（簽到記錄） | | [ ] |
| 看到「人員管理」卡片 | ❌ 不應該看到 | | [ ] |
| 看到「巡邏點管理」卡片 | ❌ 不應該看到 | | [ ] |
| 看到「簽到記錄」卡片 | ✅ 應該看到 | | [ ] |
| 訪問 `/checkin/records` | ✅ 可以查看 | | [ ] |
| 訪問 `/checkin/manage/points` | ❌ 被拒絕 | | [ ] |

### Admin 測試

| 測試項目 | 預期結果 | 實際結果 | 通過 |
|---------|---------|---------|:----:|
| 登入成功 | ✅ 可以登入 | | [ ] |
| 訪問 `/checkin/manage` | ✅ 看到統計 | | [ ] |
| 快速導航卡片數量 | ✅ 有 3 個 | | [ ] |
| 訪問「人員管理」 | ✅ 可以訪問 | | [ ] |
| 訪問「巡邏點管理」 | ✅ 可以訪問 | | [ ] |
| 修改巡邏點 | ✅ 可以修改 | | [ ] |

### 舊架構 Admin 測試

| 測試項目 | 預期結果 | 實際結果 | 通過 |
|---------|---------|---------|:----:|
| 登入成功 | ✅ 可以登入 | | [ ] |
| 功能與新架構 Admin 相同 | ✅ 完全相同 | | [ ] |

---

## 📸 測試截圖建議

建議截圖記錄以下畫面：

1. **PowerUser `/checkin/manage`** - 只顯示 1 個卡片
2. **Admin `/checkin/manage`** - 顯示 3 個卡片
3. **PowerUser 嘗試訪問 `/checkin/manage/points`** - 顯示拒絕訊息

---

## 🐛 問題回報

如果測試過程中發現問題，請記錄：

1. **測試帳號**：使用的帳號 email
2. **測試步驟**：執行的具體操作
3. **預期結果**：應該發生什麼
4. **實際結果**：實際發生了什麼
5. **截圖**：如果可能，提供截圖
6. **瀏覽器 Console 錯誤**：開啟 F12 查看是否有錯誤訊息

---

## 📊 測試完成後

測試完成後，請更新 `tests/POWERUSER_TEST_SUMMARY.md` 中的測試結果表格。

如果所有測試通過，PowerUser 權限系統就可以正式上線了！🎉
