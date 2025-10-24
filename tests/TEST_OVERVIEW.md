# 🧪 測試系統總覽

## 📁 測試檔案結構

```
tests/
├── README.md              # API 測試使用指南
├── TEST_OVERVIEW.md       # 本檔案 - 測試系統總覽
├── api-test.js            # API 自動化測試腳本
├── integration-test.js    # 整合測試腳本
└── frontend-test.md       # 前端功能測試清單

scripts/
└── init-patrol-points.js  # 巡邏點資料初始化腳本
```

---

## 🎯 測試類型

### 1️⃣ API 自動化測試（`api-test.js`）

**測試範圍**：
- 健康檢查 API
- 巡邏點查詢 API
- 使用者列表 API（權限分層）
- 角色設定 API（權限控制）

**執行方式**：
```bash
# 基本測試（不需要 Token）
node tests/api-test.js

# 完整測試（需要 Token）
export TEST_SUPERADMIN_TOKEN="..."
export TEST_CHECKIN_ADMIN_TOKEN="..."
export TEST_USER_TOKEN="..."
node tests/api-test.js
```

**當前狀態**：
- ✅ 健康檢查：通過（2/2）
- ✅ 巡邏點 API：通過（1/1）
- ⏸️ 權限測試：需要 Token
- ⏸️ 角色管理：需要 Token

---

### 2️⃣ 整合測試（`integration-test.js`）

**測試範圍**：
- 使用者完整簽到流程
- 角色權限完整流程
- 管理介面操作流程
- 資料一致性檢查

**執行方式**：
```bash
node tests/integration-test.js
```

**當前狀態**：
- ✅ 資料一致性：通過（1/1）
- ⏸️ 使用者流程：需要 Token
- ⏸️ 管理流程：需要 Token

---

### 3️⃣ 前端功能測試（`frontend-test.md`）

**測試範圍**：
- 登入與認證流程
- 權限系統測試
- 簽到系統測試
- 管理介面測試
- 響應式設計測試
- 錯誤處理測試

**執行方式**：
- 📋 **手動測試清單**
- 在瀏覽器中逐項測試
- 記錄測試結果

**測試項目**：
- 登入流程：7 項
- 權限測試：12 項
- 簽到系統：15 項
- 總管理中心：14 項
- 奉香人員管理：11 項
- 簽到管理後台：16 項
- 管理中心首頁：9 項
- 響應式設計：9 項
- 錯誤處理：9 項
- 效能測試：3 項

**總計**：105 項測試點

---

## 🚀 快速開始

### Step 1：執行基本測試
```bash
# 不需要任何設定，直接執行
node tests/api-test.js
node tests/integration-test.js
```

### Step 2：獲取測試 Token
1. 在瀏覽器開啟應用程式
2. 以不同角色登入（SuperAdmin、checkin admin、一般 user）
3. 在 Console 執行：
```javascript
firebase.auth().currentUser.getIdToken().then(token => {
  console.log('Token:', token);
  navigator.clipboard.writeText(token);
});
```

### Step 3：設定環境變數
```bash
# SuperAdmin Token
export TEST_SUPERADMIN_TOKEN="eyJhbGciOiJSUzI1..."

# checkin admin Token
export TEST_CHECKIN_ADMIN_TOKEN="eyJhbGciOiJSUzI1..."

# 一般 user Token
export TEST_USER_TOKEN="eyJhbGciOiJSUzI1..."

# poweruser Token（選用）
export TEST_POWERUSER_TOKEN="eyJhbGciOiJSUzI1..."
```

### Step 4：執行完整測試
```bash
node tests/api-test.js
node tests/integration-test.js
```

### Step 5：手動測試前端
打開 `tests/frontend-test.md`，逐項勾選測試

---

## 📊 測試覆蓋率

### API 端點覆蓋
- ✅ `/api/ping-admin` - 健康檢查
- ✅ `/api/ping-bot` - LINE Bot 健康檢查
- ✅ `/api/checkin/points` - 巡邏點查詢
- ✅ `/api/users/list` - 使用者列表（含權限測試）
- ✅ `/api/users/role` - 角色設定（含權限測試）
- ⏸️ `/api/checkin/create` - 簽到 API（需要整合測試）
- ⏸️ `/api/checkin/history` - 簽到歷史（需要整合測試）
- ⏸️ `/api/checkin/stats` - 統計數據（需要整合測試）

### 權限測試覆蓋
- ✅ SuperAdmin 全局權限
- ✅ checkin admin 系統權限
- ✅ 一般 user 權限限制
- ✅ 跨系統權限隔離

### 功能測試覆蓋
- ✅ 健康檢查
- ✅ 巡邏點管理
- ✅ 使用者管理
- ✅ 角色設定
- ⏸️ GPS 簽到流程
- ⏸️ 簽到記錄查詢
- ⏸️ 統計圖表顯示

---

## 🎯 測試目標

### 短期目標（本週）
- [x] 建立 API 自動化測試框架
- [x] 建立整合測試框架
- [x] 建立前端測試清單
- [ ] 完成所有 API 測試（需 Token）
- [ ] 初始化測試資料
- [ ] 完成一輪完整的手動測試

### 中期目標（本月）
- [ ] 增加簽到流程測試
- [ ] 增加統計功能測試
- [ ] 建立效能測試基準
- [ ] 建立持續整合（CI）流程

### 長期目標
- [ ] 建立自動化 E2E 測試（Playwright）
- [ ] 建立負載測試
- [ ] 建立安全性測試
- [ ] 達到 90% 測試覆蓋率

---

## 🐛 已知問題

### 測試資料
- ⚠️ **巡邏點資料為空**：需要執行初始化腳本
  ```bash
  # 需要 Firebase Admin 權限
  node scripts/init-patrol-points.js
  ```

### Token 管理
- ⚠️ **Token 有效期限**：Firebase Token 約 1 小時後過期
- 💡 **解決方案**：定期更新 Token 或建立 Token 刷新機制

### 環境限制
- ⚠️ **環境變數**：Replit 環境中某些 secrets 可能無法直接讀取
- 💡 **解決方案**：通過 API 間接測試，或在本地環境執行

---

## 📝 測試報告範本

### 基本報告
```
測試日期：YYYY-MM-DD
測試環境：[開發 / 正式]
測試者：[姓名]

API 測試：__/__ 通過
整合測試：__/__ 通過
前端測試：__/__ 通過

主要問題：
1. [問題描述]
2. [問題描述]

建議：
1. [建議]
2. [建議]
```

### 詳細報告
參考 `frontend-test.md` 中的完整報告範本

---

## 🔧 故障排除

### 問題：測試全部失敗
**可能原因**：
- 應用程式未啟動
- BASE_URL 設定錯誤
- 網路連接問題

**解決方案**：
```bash
# 檢查應用程式狀態
curl http://localhost:5175/api/ping-admin

# 檢查環境變數
echo $BASE_URL
```

### 問題：權限測試失敗
**可能原因**：
- Token 過期
- Token 角色不符
- 資料庫角色設定錯誤

**解決方案**：
1. 重新獲取 Token
2. 檢查資料庫中的使用者角色
3. 查看 API 錯誤訊息

### 問題：資料測試失敗
**可能原因**：
- 測試資料未初始化
- 資料格式錯誤

**解決方案**：
```bash
# 初始化巡邏點資料
node scripts/init-patrol-points.js

# 手動檢查資料
# 在 Firebase Console 查看 Firestore 資料
```

---

## 📚 相關文件

- [API 測試指南](./README.md)
- [前端測試清單](./frontend-test.md)
- [專案文檔](../replit.md)
- [開發指南](../VERCEL_DEPLOYMENT_GUIDE.md)

---

## 🎓 測試最佳實踐

### 1. 先寫測試，後寫代碼（TDD）
雖然目前是後補測試，但未來新功能應該先寫測試

### 2. 獨立性
每個測試應該能夠獨立執行，不依賴其他測試的結果

### 3. 可重複性
測試應該可以重複執行，每次結果一致

### 4. 快速反饋
測試應該快速執行，提供即時反饋

### 5. 清晰的錯誤訊息
測試失敗時應該提供清晰的錯誤訊息，方便除錯

---

**最後更新**：2025-10-24  
**維護者**：Replit Agent  
**版本**：1.0.0
