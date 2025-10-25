# Production 測試計劃

## 🎯 測試目標
驗證 LINE OAuth 登入流程和 PowerUser 角色權限控制在 Production 環境正常運作。

---

## 📝 測試帳號

| 帳號 | Email | 預期角色 | 用途 |
|------|-------|---------|------|
| 帳號 A | guimashan.service@gmail.com | SuperAdmin | 首次登入，成為超級管理員 |
| 帳號 B | obnana@gmail.com | PowerUser/Admin | 測試 PowerUser 權限控制 |

---

## 🧪 測試步驟

### **階段 1：SuperAdmin 首次登入**

1. **開啟管理員登入頁面**（使用 Safari 或 Chrome，不要用 LINE App）
   ```
   https://go.guimashan.org.tw/admin/login
   ```

2. **點擊「使用 LINE 登入」**
   - 應該會跳轉到 LINE 授權頁面

3. **完成 LINE 授權**
   - 使用 `guimashan.service@gmail.com` 的 LINE 帳號

4. **設定初始密碼**
   - 應該會看到「設定密碼」頁面
   - 設定一個強密碼

5. **進入管理後台**
   - 應該會自動跳轉到 `/admin`
   - 確認看到「超級管理員」權限

6. **檢查 SuperAdmin 權限**
   - [ ] 可以看到「簽到系統」卡片
   - [ ] 可以看到「排班系統」卡片（即將推出）
   - [ ] 可以看到「神服系統」卡片（即將推出）
   - [ ] 可以看到「使用者管理」卡片

---

### **階段 2：第二個帳號登入**

1. **登出 SuperAdmin 帳號**

2. **使用另一個 LINE 帳號登入**
   - 再次訪問 `https://go.guimashan.org.tw/admin/login`
   - 使用 `obnana@gmail.com` 的 LINE 帳號
   - 完成授權並設定密碼

3. **確認一般使用者狀態**
   - [ ] 應該無法訪問 `/admin`（沒有任何系統權限）
   - [ ] 可以正常使用 LIFF 簽到功能（在 LINE App 內開啟 `https://go.guimashan.org.tw/checkin`）

---

### **階段 3：設定 PowerUser 角色**

1. **在本地執行腳本**（在您的電腦終端機）：
   
   ```bash
   cd ~/workspace  # 或您的專案路徑
   
   # 設定為 PowerUser
   node scripts/set-role-by-email.js obnana@gmail.com poweruser
   ```

2. **確認輸出**：
   ```
   ✅ 角色已更新為: poweruser
   checkin_role: poweruser
   schedule_role: user
   service_role: user
   ```

---

### **階段 4：測試 PowerUser 權限**

使用 `obnana@gmail.com` 帳號登入後，測試以下功能：

#### ✅ **應該可以訪問的頁面**

1. **管理首頁** (`/admin`)
   - [ ] 可以看到「簽到系統」卡片
   - [ ] 點擊後跳轉到 `/checkin/manage`

2. **簽到管理頁** (`/checkin/manage`)
   - [ ] 可以看到「簽到記錄」卡片
   - [ ] 點擊後可以查看簽到記錄
   - [ ] **不應該**看到「人員管理」卡片
   - [ ] **不應該**看到「巡邏點管理」卡片

3. **簽到記錄頁** (`/checkin/records`)
   - [ ] 可以查看所有簽到記錄
   - [ ] 可以使用篩選功能
   - [ ] **不能**刪除記錄
   - [ ] **不能**編輯記錄

4. **統計頁面**
   - [ ] 可以查看簽到統計圖表
   - [ ] 可以查看巡邏點統計

#### ❌ **不應該訪問的頁面**

1. **人員管理** (`/checkin/manage/users`)
   - [ ] 訪問時應該顯示「權限不足」錯誤
   - [ ] 或自動跳轉回首頁

2. **巡邏點管理** (`/checkin/manage/points`)
   - [ ] 訪問時應該顯示「權限不足」錯誤
   - [ ] 或自動跳轉回首頁

3. **使用者管理** (`/admin/users`)
   - [ ] 訪問時應該顯示「權限不足」錯誤

---

### **階段 5：升級為 Admin 並測試**

1. **升級為 Admin**：
   ```bash
   node scripts/set-role-by-email.js obnana@gmail.com admin
   ```

2. **重新登入測試**：

   使用 `obnana@gmail.com` 帳號重新登入，確認：

   - [ ] 可以訪問 `/admin`
   - [ ] 可以訪問 `/checkin/manage`
   - [ ] **可以**看到「人員管理」卡片
   - [ ] **可以**看到「巡邏點管理」卡片
   - [ ] **可以**看到「簽到記錄」卡片
   - [ ] 可以新增/編輯/刪除巡邏點
   - [ ] 可以修改使用者角色
   - [ ] **不能**跨系統管理（只能管理簽到系統）

---

## 🐛 常見問題排查

### **問題 1：登入後顯示「權限不足」**
**原因**：角色尚未設定或設定錯誤
**解決方法**：
1. 確認已執行 `set-role-by-email.js` 腳本
2. 檢查 Firebase Console 中的使用者文件是否有 `checkin_role` 欄位

---

### **問題 2：PowerUser 可以看到管理功能**
**原因**：前端權限判斷有誤
**解決方法**：
1. 清除瀏覽器快取
2. 確認 API `/api/auth/permissions` 返回正確的角色資料
3. 檢查前端是否正確使用 `checkin_role` 而非 `roles.checkin_admin`

---

### **問題 3：API 返回 403 錯誤**
**原因**：後端權限檢查阻擋了請求
**解決方法**：
1. 確認 PowerUser 訪問的是查詢類 API（如 `/api/checkin/stats`）
2. 確認 Admin 才訪問修改類 API（如 `/api/checkin/points/manage`）
3. 檢查後端使用 `hasCheckinAccess` 而非 `hasCheckinAdmin`

---

## 📊 測試結果記錄

完成測試後，請記錄以下資訊：

- **SuperAdmin 登入**: ✅ / ❌
- **PowerUser 角色設定**: ✅ / ❌
- **PowerUser 查看權限**: ✅ / ❌
- **PowerUser 修改限制**: ✅ / ❌
- **Admin 完整權限**: ✅ / ❌
- **API 權限控制**: ✅ / ❌

---

## 🎉 測試完成

測試完成後，您應該確認：

1. ✅ LINE OAuth 登入流程正常
2. ✅ 首次登入成為 SuperAdmin
3. ✅ PowerUser 可以查看但不能修改
4. ✅ Admin 有完整管理權限
5. ✅ 前後端權限一致，無安全漏洞

**如有任何問題，請回報給開發團隊！**
