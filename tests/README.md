# 自動化測試指南

## 📋 測試腳本說明

### `api-test.js`
完整的 API 端點測試，包括：
- 權限系統測試
- 使用者管理 API 測試
- 角色設定 API 測試
- 巡邏點 API 測試
- 健康檢查測試

## 🚀 執行測試

### 方式一：基本測試（不需要 Token）
```bash
node tests/api-test.js
```
這會執行不需要認證的測試，如：
- 健康檢查
- 查詢巡邏點

### 方式二：完整測試（需要 Token）

#### 1. 獲取測試 Token
先登入系統，在瀏覽器 Console 執行：
```javascript
// 獲取當前登入者的 ID Token
firebase.auth().currentUser.getIdToken().then(token => console.log(token))
```

#### 2. 設定環境變數
```bash
export TEST_SUPERADMIN_TOKEN="your_superadmin_token_here"
export TEST_CHECKIN_ADMIN_TOKEN="your_checkin_admin_token_here"
export TEST_USER_TOKEN="your_user_token_here"
```

#### 3. 執行完整測試
```bash
node tests/api-test.js
```

## 📊 測試項目清單

### ✅ 健康檢查
- [ ] Firebase Admin 連接正常
- [ ] LINE Bot 連接正常

### ✅ 巡邏點 API
- [ ] 可以查詢所有巡邏點
- [ ] 巡邏點包含 GPS 座標

### ✅ 使用者列表 API
- [ ] SuperAdmin 可以查詢所有使用者
- [ ] checkin admin 可以查詢 checkin 系統使用者
- [ ] 一般 user 不能查詢使用者列表
- [ ] checkin admin 不能查詢其他系統

### ✅ 角色設定 API
- [ ] SuperAdmin 可以設定任何系統的角色
- [ ] checkin admin 只能設定 checkin_role
- [ ] 一般 user 不能設定角色

## 🎯 測試結果範例

```
🚀 開始執行自動化測試...

測試目標: http://localhost:5175

💊 測試群組：健康檢查
✓ Firebase Admin 連接正常
  → 專案 ID: checkin-76c77
✓ LINE Bot 連接正常
  → Channel ID: 1234567890

📍 測試群組：巡邏點 API
✓ 可以查詢所有巡邏點
  → 找到 3 個巡邏點
  → 第一個巡邏點：玉旨牌 (25.147924, 121.410296)

📋 測試群組：使用者列表 API
✓ SuperAdmin 可以查詢所有使用者
  → 找到 5 位使用者
✓ checkin admin 可以查詢 checkin 系統使用者
  → 找到 3 位 checkin 系統使用者
✓ 一般 user 不能查詢使用者列表
  → 正確拒絕訪問：需要 checkin admin 或 SuperAdmin 權限
✓ checkin admin 不能查詢其他系統
  → 正確拒絕跨系統訪問

==================================================
測試結果統計
==================================================
✓ 通過: 8
✗ 失敗: 0
總計: 8
通過率: 100.00%

🎉 所有測試通過！
```

## 🔧 進階用法

### 測試特定 API
修改 `runAllTests()` 函數，註解掉不需要的測試：

```javascript
async function runAllTests() {
  await testHealthChecks();
  // await testPatrolPointsAPI();  // 暫時跳過
  await testUserListAPI();
  // await testRoleManagementAPI();  // 暫時跳過
}
```

### 自訂測試目標
```bash
BASE_URL=https://go.guimashan.org.tw node tests/api-test.js
```

## 📝 注意事項

1. **Token 有效期**：Firebase ID Token 會過期（通常 1 小時），需要重新獲取
2. **生產環境**：在生產環境執行測試時，避免修改真實資料
3. **權限測試**：確保測試帳號有對應的權限設定

## 🐛 故障排除

### 問題：所有測試都失敗
- 檢查 `BASE_URL` 是否正確
- 確認應用程式正在運行
- 查看錯誤訊息中的詳細資訊

### 問題：Token 相關測試失敗
- 確認環境變數已正確設定
- 檢查 Token 是否過期
- 確認測試帳號的角色設定正確

### 問題：403 權限錯誤
- 確認測試帳號有對應權限
- 檢查資料庫中的角色設定
- 查看 API 的權限邏輯是否正確
