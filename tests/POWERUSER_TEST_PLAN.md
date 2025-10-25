# PowerUser 角色測試計劃

## 測試目的
驗證 PowerUser 角色的完整功能：可以查看管理後台的所有資料，但不能修改系統設定。

## 權限架構

### 四層權限系統
1. **user** - 一般使用者
   - ✅ 可使用 LIFF 簽到功能
   - ❌ 無法訪問管理後台

2. **poweruser** - 進階使用者（**本次測試重點**）
   - ✅ 可使用 LIFF 簽到功能
   - ✅ 可訪問 `/admin` 入口頁面
   - ✅ 可查看簽到統計資料 (`/checkin/manage`)
   - ✅ 可查看簽到記錄 (`/checkin/records`)
   - ❌ 無法修改巡邏點設定
   - ❌ 無法修改人員權限

3. **admin** - 管理員
   - ✅ 所有 poweruser 權限
   - ✅ 可修改巡邏點設定
   - ✅ 可修改簽到系統人員權限

4. **superadmin** - 超級管理員
   - ✅ 所有系統管理權限
   - ✅ 跨系統管理（簽到、排班、神服）

---

## 測試前準備

### 1. 設定測試帳號
在 Firebase `platform-bc783` 的 `users` collection 中，建立或更新測試帳號：

```json
{
  "uid": "test-poweruser-uid",
  "email": "poweruser@example.com",
  "displayName": "測試 PowerUser",
  "checkin_role": "poweruser",
  "schedule_role": "user",
  "service_role": "user",
  "isSuperAdmin": false
}
```

### 2. 取得測試 Token
使用 LINE Login OAuth 或 Firebase Email 登入，取得 ID Token。

---

## 測試案例

### ✅ 測試案例 1: PowerUser 可以訪問管理入口頁面
**路徑**: `/admin`

**測試步驟**:
1. 使用 poweruser 帳號登入
2. 訪問 `/admin` 頁面

**預期結果**:
- ✅ 頁面正常載入
- ✅ 顯示「簽到系統」卡片
- ✅ 可以點擊進入簽到管理

**測試狀態**: 🟡 待測試

---

### ✅ 測試案例 2: PowerUser 可以查看簽到統計
**API 端點**: `GET /api/checkin/stats`

**測試步驟**:
1. 使用 poweruser ID Token 呼叫 API
```bash
curl -H "Authorization: Bearer <POWERUSER_TOKEN>" \
  http://localhost:5175/api/checkin/stats
```

**預期結果**:
- ✅ 返回 200 OK
- ✅ 返回統計資料（今日/本週/本月簽到數）
- ✅ 包含使用者列表和巡邏點列表

**測試狀態**: 🟡 待測試

---

### ✅ 測試案例 3: PowerUser 可以查看簽到記錄
**API 端點**: `GET /api/checkin/records`

**測試步驟**:
1. 使用 poweruser ID Token 呼叫 API
```bash
curl -H "Authorization: Bearer <POWERUSER_TOKEN>" \
  http://localhost:5175/api/checkin/records?limit=20
```

**預期結果**:
- ✅ 返回 200 OK
- ✅ 返回簽到記錄列表
- ✅ 包含使用者名稱和巡邏點名稱

**測試狀態**: 🟡 待測試

---

### ✅ 測試案例 4: PowerUser 可以訪問簽到管理頁面
**路徑**: `/checkin/manage`

**測試步驟**:
1. 使用 poweruser 帳號登入
2. 從 `/admin` 點擊「簽到系統」卡片
3. 查看統計頁面

**預期結果**:
- ✅ 頁面正常載入
- ✅ 顯示統計數據
- ✅ 顯示簽到記錄
- ⚠️ 「巡邏點管理」按鈕應該被隱藏或停用

**測試狀態**: 🟡 待測試

---

### ✅ 測試案例 5: PowerUser 可以訪問簽到記錄頁面
**路徑**: `/checkin/records`

**測試步驟**:
1. 使用 poweruser 帳號登入
2. 訪問 `/checkin/records` 頁面

**預期結果**:
- ✅ 頁面正常載入
- ✅ 顯示完整簽到記錄表格
- ✅ 可以使用篩選功能

**測試狀態**: 🟡 待測試

---

### ❌ 測試案例 6: PowerUser 無法修改巡邏點（前端）
**路徑**: `/checkin/manage/points`

**測試步驟**:
1. 使用 poweruser 帳號登入
2. 嘗試直接訪問 `/checkin/manage/points`

**預期結果**:
- ❌ 應該被重定向或顯示「權限不足」
- ❌ 無法看到新增/編輯/刪除按鈕

**測試狀態**: 🟡 待測試

---

### ❌ 測試案例 7: PowerUser 無法修改巡邏點（API）
**API 端點**: `POST /api/checkin/points`

**測試步驟**:
1. 使用 poweruser ID Token 呼叫 API
```bash
curl -X POST \
  -H "Authorization: Bearer <POWERUSER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"測試點","lat":25.0,"lng":121.0,"tolerance":50,"active":true}' \
  http://localhost:5175/api/checkin/points
```

**預期結果**:
- ❌ 返回 403 Forbidden
- ❌ 錯誤訊息：「權限不足：需要 admin 權限」

**測試狀態**: 🟡 待測試

---

### ❌ 測試案例 8: PowerUser 無法修改人員權限（前端）
**路徑**: `/checkin/manage/users`

**測試步驟**:
1. 使用 poweruser 帳號登入
2. 訪問 `/checkin/manage/users` 頁面

**預期結果**:
- ⚠️ 可以查看人員列表
- ❌ 「編輯角色」按鈕應該被隱藏或停用

**測試狀態**: 🟡 待測試

---

### ❌ 測試案例 9: PowerUser 無法修改人員權限（API）
**API 端點**: `PATCH /api/checkin/users/:uid`

**測試步驟**:
1. 使用 poweruser ID Token 呼叫 API
```bash
curl -X PATCH \
  -H "Authorization: Bearer <POWERUSER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"checkin_role":"admin"}' \
  http://localhost:5175/api/checkin/users/test-uid
```

**預期結果**:
- ❌ 返回 403 Forbidden
- ❌ 錯誤訊息：「權限不足：需要 admin 權限」

**測試狀態**: 🟡 待測試

---

## 權限 API 測試

### ✅ 測試案例 10: 權限 API 返回正確的角色資訊
**API 端點**: `GET /api/auth/permissions`

**測試步驟**:
1. 使用 poweruser ID Token 呼叫 API
```bash
curl -H "Authorization: Bearer <POWERUSER_TOKEN>" \
  http://localhost:5175/api/auth/permissions
```

**預期結果**:
```json
{
  "isSuperAdmin": false,
  "roles": {},
  "checkin_role": "poweruser",
  "schedule_role": "user",
  "service_role": "user"
}
```

**測試狀態**: 🟡 待測試

---

## 向後相容性測試

### ✅ 測試案例 11: 舊架構 admin 仍然有效
**測試資料**:
```json
{
  "uid": "legacy-admin-uid",
  "roles": {
    "checkin_admin": true
  }
}
```

**測試步驟**:
1. 使用舊架構的 admin 帳號登入
2. 訪問 `/admin` 和 `/checkin/manage`

**預期結果**:
- ✅ 可以訪問所有頁面
- ✅ 可以修改巡邏點和權限

**測試狀態**: 🟡 待測試

---

## 測試清單

### 前端測試
- [ ] PowerUser 可訪問 `/admin`
- [ ] PowerUser 可訪問 `/checkin/manage`
- [ ] PowerUser 可訪問 `/checkin/records`
- [ ] PowerUser 無法訪問 `/checkin/manage/points`（或按鈕被隱藏）
- [ ] PowerUser 無法編輯人員權限（按鈕被隱藏）

### 後端 API 測試
- [ ] `GET /api/auth/permissions` 返回新角色欄位
- [ ] `GET /api/checkin/stats` poweruser 可訪問
- [ ] `GET /api/checkin/records` poweruser 可訪問
- [ ] `POST /api/checkin/points` poweruser 被拒絕（403）
- [ ] `PATCH /api/checkin/users/:uid` poweruser 被拒絕（403）

### 向後相容性測試
- [ ] 舊架構 `roles.checkin_admin: true` 仍然有效
- [ ] 同時擁有新舊角色欄位時，系統正常運作

---

## 測試結果記錄

### 測試環境
- **日期**: 2025-10-25
- **環境**: Replit Development
- **測試人員**: _____________

### 測試結果摘要
- 通過: __ / 11
- 失敗: __ / 11
- 待測試: 11 / 11

### 已知問題
1. _____________
2. _____________

### 後續行動
1. _____________
2. _____________

---

## 程式碼檢查清單

### ✅ 後端權限檢查
- [x] `src/lib/auth-helpers.ts` - `hasCheckinAccess()` 正確實現
- [x] `src/lib/auth-helpers.ts` - `hasCheckinAdmin()` 正確實現
- [x] `src/app/api/checkin/stats/route.ts` - 使用 `hasCheckinAccess`
- [x] `src/app/api/checkin/records/route.ts` - 使用 `hasCheckinAccess`
- [ ] `src/app/api/checkin/points/route.ts` - 使用 `hasCheckinAdmin`（待檢查）
- [ ] `src/app/api/checkin/users/*/route.ts` - 使用 `hasCheckinAdmin`（待檢查）

### ✅ 前端權限檢查
- [x] `src/app/admin/page.tsx` - 檢查 `checkin_role`
- [ ] `src/app/checkin/manage/page.tsx` - 隱藏管理按鈕給 poweruser（待檢查）
- [ ] `src/app/checkin/manage/points/page.tsx` - 權限檢查（待檢查）
- [ ] `src/app/checkin/manage/users/page.tsx` - 隱藏編輯按鈕給 poweruser（待檢查）

### ✅ API 端點
- [x] `/api/auth/permissions` - 返回新角色欄位

---

## 附錄：權限檢查函數說明

### `hasCheckinAccess(auth)`
**用途**: 檢查是否可以訪問簽到系統後台（查看功能）

**允許角色**:
- SuperAdmin
- `checkin_role === "poweruser"`
- `checkin_role === "admin"`
- `roles.checkin_admin === true`（向後相容）

**回傳**: `boolean`

### `hasCheckinAdmin(auth)`
**用途**: 檢查是否可以修改簽到系統設定

**允許角色**:
- SuperAdmin
- `checkin_role === "admin"`
- `roles.checkin_admin === true`（向後相容）

**回傳**: `boolean`

---

## 自動化測試建議

未來可以使用 Jest 或 Playwright 撰寫自動化測試：

```typescript
describe('PowerUser Permissions', () => {
  it('should allow poweruser to view stats', async () => {
    const token = await getTestToken('poweruser');
    const response = await fetch('/api/checkin/stats', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status).toBe(200);
  });

  it('should deny poweruser to modify points', async () => {
    const token = await getTestToken('poweruser');
    const response = await fetch('/api/checkin/points', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'test' })
    });
    expect(response.status).toBe(403);
  });
});
```
