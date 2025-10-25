# PowerUser 功能測試摘要

## 測試日期
2025-10-25

## 測試範圍
PowerUser 角色的完整功能：可查看管理後台資料，但不能修改系統設定。

---

## ✅ 已完成的程式碼變更

### 1. 後端 API 權限控制
✅ **檔案**: `src/lib/auth-helpers.ts`
- ✅ `hasCheckinAdmin()` - admin/superadmin 可以修改設定
- ✅ `hasCheckinAccess()` - poweruser/admin/superadmin 可以訪問後台
- ✅ `hasCheckinPowerUser()` - 別名，同 hasCheckinAccess

✅ **檔案**: `src/app/api/auth/permissions/route.ts`
- ✅ 新增返回 `checkin_role`, `schedule_role`, `service_role`
- ✅ 保持向後相容（舊的 `roles` 欄位仍存在）

✅ **檔案**: `src/app/api/checkin/stats/route.ts`
- ✅ 使用 `hasCheckinAccess`（poweruser 可查看）

✅ **檔案**: `src/app/api/checkin/records/route.ts`
- ✅ 使用 `hasCheckinAccess`（poweruser 可查看）

### 2. 前端頁面權限控制
✅ **檔案**: `src/app/admin/page.tsx`
- ✅ 更新 UserPermissions interface 包含新角色欄位
- ✅ poweruser 可以看到簽到系統卡片

✅ **檔案**: `src/app/checkin/manage/page.tsx`
- ✅ 獲取使用者權限資訊
- ✅ 只對 admin 顯示「人員管理」和「巡邏點管理」卡片
- ✅ poweruser 可以看到統計數據和「簽到記錄」卡片

### 3. Architect 審查
✅ **審查結果**: 通過
- ✅ 前後端權限一致
- ✅ 無安全漏洞
- ✅ read-only 流程正確實現

---

## 📋 後續測試步驟

### 在 Firebase 中設定測試帳號

#### PowerUser 測試帳號
在 `platform-bc783` Firestore 的 `users` collection 中建立：

```json
{
  "uid": "test-poweruser-001",
  "email": "poweruser@guimashan.org.tw",
  "displayName": "測試 PowerUser",
  "checkin_role": "poweruser",
  "schedule_role": "user",
  "service_role": "user",
  "isSuperAdmin": false,
  "createdAt": "2025-10-25T08:00:00Z"
}
```

#### Admin 測試帳號
```json
{
  "uid": "test-admin-001",
  "email": "admin@guimashan.org.tw",
  "displayName": "測試 Admin",
  "checkin_role": "admin",
  "schedule_role": "admin",
  "service_role": "admin",
  "isSuperAdmin": false,
  "createdAt": "2025-10-25T08:00:00Z"
}
```

---

## 🧪 手動測試清單

### PowerUser 測試（應該通過）
- [ ] 登入 poweruser 帳號
- [ ] 訪問 `/admin` - 看到簽到系統卡片
- [ ] 點擊簽到系統卡片，進入 `/checkin/manage`
- [ ] 看到統計數據（今日/本週/本月）
- [ ] **只**看到「簽到記錄」卡片
- [ ] **不**看到「人員管理」和「巡邏點管理」卡片
- [ ] 點擊「簽到記錄」，進入 `/checkin/records`
- [ ] 可以查看完整記錄列表

### PowerUser 測試（應該被拒絕）
- [ ] 直接訪問 `/checkin/manage/points` - 應該被拒絕或重定向
- [ ] 直接訪問 `/checkin/manage/users` - 應該被拒絕或重定向

### Admin 測試（應該通過）
- [ ] 登入 admin 帳號
- [ ] 訪問 `/checkin/manage`
- [ ] 看到「人員管理」、「巡邏點管理」、「簽到記錄」三個卡片
- [ ] 可以訪問所有頁面並修改設定

---

## 🔍 API 測試（使用 curl）

### 1. 測試權限 API
```bash
# 使用 poweruser token
curl -H "Authorization: Bearer <POWERUSER_TOKEN>" \
  https://go.guimashan.org.tw/api/auth/permissions

# 預期結果：
{
  "isSuperAdmin": false,
  "roles": {},
  "checkin_role": "poweruser",
  "schedule_role": "user",
  "service_role": "user"
}
```

### 2. 測試統計 API（應該通過）
```bash
curl -H "Authorization: Bearer <POWERUSER_TOKEN>" \
  https://go.guimashan.org.tw/api/checkin/stats

# 預期：200 OK，返回統計數據
```

### 3. 測試記錄 API（應該通過）
```bash
curl -H "Authorization: Bearer <POWERUSER_TOKEN>" \
  https://go.guimashan.org.tw/api/checkin/records?limit=10

# 預期：200 OK，返回簽到記錄
```

### 4. 測試巡邏點 API（應該被拒絕）
```bash
curl -X POST \
  -H "Authorization: Bearer <POWERUSER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"測試點","lat":25.0,"lng":121.0,"tolerance":50,"active":true}' \
  https://go.guimashan.org.tw/api/checkin/points

# 預期：403 Forbidden
```

---

## 📊 權限矩陣

| 功能 | user | poweruser | admin | superadmin |
|------|------|-----------|-------|------------|
| LIFF 簽到 | ✅ | ✅ | ✅ | ✅ |
| 訪問 `/admin` | ❌ | ✅ | ✅ | ✅ |
| 查看簽到統計 | ❌ | ✅ | ✅ | ✅ |
| 查看簽到記錄 | ❌ | ✅ | ✅ | ✅ |
| 修改巡邏點 | ❌ | ❌ | ✅ | ✅ |
| 修改人員權限 | ❌ | ❌ | ✅ | ✅ |
| 跨系統管理 | ❌ | ❌ | ❌ | ✅ |

---

## 🎯 測試重點

### PowerUser 角色的核心需求
1. ✅ **可以查看**：統計數據、簽到記錄
2. ✅ **不能修改**：巡邏點設定、人員權限
3. ✅ **UI 層面隱藏**：管理功能的入口（卡片不顯示）
4. ✅ **API 層面阻擋**：即使直接呼叫 API 也會返回 403

### 向後相容性
- ✅ 舊架構的 `roles.checkin_admin: true` 仍然有效
- ✅ 新舊欄位可以同時存在，系統會自動檢查兩者

---

## 📝 測試結果記錄

### PowerUser 功能測試
| 測試項目 | 預期結果 | 實際結果 | 通過 |
|---------|---------|---------|------|
| 訪問 `/admin` | 看到簽到卡片 | | [ ] |
| 訪問 `/checkin/manage` | 看到統計 | | [ ] |
| 看到快速導航 | 只有「簽到記錄」 | | [ ] |
| 訪問 `/checkin/records` | 可以查看 | | [ ] |
| 訪問 `/checkin/manage/points` | 被拒絕 | | [ ] |
| API: GET stats | 200 OK | | [ ] |
| API: GET records | 200 OK | | [ ] |
| API: POST points | 403 Forbidden | | [ ] |

### Admin 功能測試
| 測試項目 | 預期結果 | 實際結果 | 通過 |
|---------|---------|---------|------|
| 訪問 `/checkin/manage` | 看到 3 個卡片 | | [ ] |
| 修改巡邏點 | 可以修改 | | [ ] |
| 修改人員權限 | 可以修改 | | [ ] |

---

## 🐛 已知問題
（測試後填寫）

---

## 🚀 後續行動
1. [ ] 部署到 Vercel
2. [ ] 在 Firebase 中建立測試帳號
3. [ ] 執行完整的手動測試
4. [ ] 記錄測試結果
5. [ ] 修復發現的問題（如有）

---

## 📄 相關文件
- 詳細測試計劃：`tests/POWERUSER_TEST_PLAN.md`
- 權限檢查函數：`src/lib/auth-helpers.ts`
- 權限 API：`src/app/api/auth/permissions/route.ts`
- 管理頁面：`src/app/checkin/manage/page.tsx`
