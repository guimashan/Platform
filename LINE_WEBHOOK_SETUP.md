# 📱 LINE Bot Webhook 設定指南

## 🎯 目標
讓您的 LINE Bot 能夠接收並回覆用戶訊息，支援關鍵字自動回覆功能

---

## 📋 前置準備

✅ 已有 LINE Developers 帳號  
✅ 已創建 Messaging API Channel  
✅ Webhook URL：`https://go.guimashan.org.tw/api/webhook`

---

## 🔑 支援的關鍵字回覆

系統已內建關鍵字自動回覆功能：

| 關鍵字 | 回覆內容 |
|--------|---------|
| 奉香簽到 | https://go.guimashan.org.tw/checkin |
| 志工排班 | https://go.guimashan.org.tw/schedule |
| 神務服務 | https://go.guimashan.org.tw/service |
| 服務申請 | https://go.guimashan.org.tw/service |
| 首頁 | https://go.guimashan.org.tw |
| 幫助 | 請輸入：奉香簽到、志工排班、神務服務 |

**新增或修改關鍵字**：編輯 `src/app/api/webhook/route.ts` 中的 `KEYWORDS` 對照表

---

## 🔧 設定步驟

### 1️⃣ 登入 LINE Developers Console

前往：https://developers.line.biz/console/

### 2️⃣ 選擇您的 Messaging API Channel

在 Providers 列表中找到您的 Channel

### 3️⃣ 前往 Messaging API 設定頁面

點擊左側選單：**Messaging API**

---

## ⚙️ Webhook 設定

### 步驟 A：設定 Webhook URL

1. 找到 **Webhook settings** 區塊
2. 點擊 **Edit** 按鈕
3. 輸入 Webhook URL：
   ```
   https://go.guimashan.org.tw/api/webhook
   ```
4. 點擊 **Update**

### 步驟 B：驗證 Webhook

1. 點擊 **Verify** 按鈕
2. 應該會看到 ✅ **Success** 訊息
3. 如果失敗，請檢查：
   - URL 是否正確
   - Vercel 環境變數是否已設定
   - `LINE_CHANNEL_SECRET` 是否正確

### 步驟 C：啟用 Webhook

1. 找到 **Use webhook** 開關
2. 將開關切換到 **Enabled** (綠色)

---

## 🔑 取得必要的環境變數

### ✅ Channel Secret (已設置)
1. 在同一頁面找到 **Channel secret** 
2. 點擊 **Show** 查看
3. 已設定到環境變數：`LINE_CHANNEL_SECRET`

### ⚠️ Channel Access Token (需要設置)
1. 向下滾動找到 **Channel access token (long-lived)**
2. 點擊 **Issue** 按鈕（如果還沒有 token）
3. 複製 Long-lived access token
4. **需要設定到環境變數**：
   ```
   LINE_CHANNEL_ACCESS_TOKEN=your_access_token_here
   ```

**重要**：若無 `LINE_CHANNEL_ACCESS_TOKEN`，系統會：
- ✅ 正常接收訊息
- ✅ 記錄到 Firestore (`webhook_logs`)
- ❌ **無法自動回覆**（會在日誌中顯示警告）

### 設置 Access Token 方式

**在 Replit Secrets:**
1. 點擊左側 🔒 Secrets
2. 新增 Key: `LINE_CHANNEL_ACCESS_TOKEN`
3. 貼上 Value
4. 點擊 Add Secret

**在 Vercel:**
1. 前往專案 Settings → Environment Variables
2. 新增變數：`LINE_CHANNEL_ACCESS_TOKEN`
3. 選擇環境：Production, Preview, Development
4. 儲存後重新部署

---

## 🧪 測試 Webhook

### 方法 1：使用 LINE Developers Console

1. 在 Messaging API 頁面
2. 找到 QR Code 或加入好友連結
3. 用手機掃描 QR Code 加 Bot 為好友
4. 發送關鍵字測試（例如：「奉香簽到」）
5. Bot 應該會回覆對應連結

### 方法 2：使用 Webhook 測試功能

1. 在 Webhook settings 區塊
2. 點擊 **Test** 按鈕
3. 查看測試結果

---

## 🔍 驗證環境變數設定

訪問以下 URL 檢查 Bot 健康狀態：

```
https://go.guimashan.org.tw/api/ping-bot
```

**預期回應**：
```json
{
  "ok": true,
  "timestamp": "2025-10-23T...",
  "env": {
    "channelId": true,
    "channelSecret": true,
    "accessToken": true  // 若為 false，關鍵字回覆將無法運作
  }
}
```

如果 `accessToken` 為 `false`，請設定 `LINE_CHANNEL_ACCESS_TOKEN`。

---

## 📊 系統架構

### Webhook 處理流程
```
用戶發訊息
    ↓
LINE Platform 發送 POST 到 Webhook
    ↓
API 驗證簽章 (使用 LINE_CHANNEL_SECRET)
    ↓
記錄事件到 Firestore (webhook_logs)
    ↓
檢查是否為文字訊息
    ↓
比對關鍵字表 (KEYWORDS)
    ↓
若有配對且有 ACCESS_TOKEN
    ↓
呼叫 LINE Reply API 回覆訊息
    ↓
用戶收到回覆
```

### 資料儲存
- **Collection**: `webhook_logs`
- **欄位**:
  - `receivedAt`: 接收時間 (ISO string)
  - `userId`: LINE User ID
  - `eventType`: 事件類型
  - `event`: 完整事件物件

---

## 📝 新 API 端點

### `/api/profile/upsert`
用於用戶資料落地（首次登入或更新資料）

**方法**: POST  
**認證**: Bearer Token (Firebase ID Token)

**請求範例**:
```bash
curl -X POST https://go.guimashan.org.tw/api/profile/upsert \
  -H "Authorization: Bearer <firebase_id_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "使用者名稱",
    "pictureUrl": "https://...",
    "lineUserId": "U1234..."
  }'
```

**回應**:
```json
{
  "ok": true,
  "user": {
    "uid": "firebase_uid",
    "displayName": "使用者名稱",
    "roles": { "user": true, ... },
    "isSuperAdmin": false,
    "createdAt": 1729654321000,
    "lastLoginAt": 1729654321000
  },
  "isFirstUser": false
}
```

**特殊功能**：第一個註冊的用戶自動成為 SuperAdmin

---

## ⚠️ 常見問題

### Q1: Verify 失敗
**原因**：
- Webhook URL 錯誤
- Channel Secret 未設定或錯誤
- 伺服器無法訪問

**解決**：
1. 確認 URL：`https://go.guimashan.org.tw/api/webhook`
2. 檢查 Vercel 環境變數
3. 確認最新代碼已部署

### Q2: Bot 不回覆訊息
**原因**：
- Webhook 未啟用
- Access Token 錯誤或未設定
- 關鍵字不匹配

**解決**：
1. 確認 **Use webhook** 是 Enabled
2. 設定 `LINE_CHANNEL_ACCESS_TOKEN`
3. 檢查日誌：查看 Vercel Logs 或 Firestore `webhook_logs`
4. 確認發送的是完整關鍵字（例如「奉香簽到」而非「簽到」）

### Q3: 收到 401 Unauthorized
**原因**：
- 簽章驗證失敗
- Channel Secret 不匹配

**解決**：
1. 確認 `LINE_CHANNEL_SECRET` 正確
2. 重新從 Console 複製 Channel Secret
3. 在 Vercel 重新設定環境變數後重新部署

---

## 🔐 安全注意事項

1. ✅ **絕對不要**在代碼中硬編碼 Channel Secret 或 Access Token
2. ✅ **絕對不要**將環境變數提交到 Git
3. ✅ **務必**在 Vercel/Replit Secrets 中設定所有密鑰
4. ✅ **定期**更換 Access Token（建議每 6 個月）
5. ✅ **簽章驗證**：所有 Webhook 請求都會驗證簽章

---

## 📝 設定檢查清單

- [ ] Webhook URL 已設定：`https://go.guimashan.org.tw/api/webhook`
- [ ] Webhook Verify 成功 ✅
- [ ] Use webhook 已啟用（綠色）
- [ ] `LINE_CHANNEL_SECRET` 已設定
- [ ] `LINE_CHANNEL_ACCESS_TOKEN` 已設定 ⚠️
- [ ] `/api/ping-bot` 返回 `accessToken: true`
- [ ] 已用手機測試發送關鍵字
- [ ] Bot 成功回覆訊息

---

## 🎉 完成！

當所有檢查項目都完成後，您的 LINE Bot Webhook 就設定完成了！

現在可以：
- ✅ 接收用戶訊息
- ✅ 記錄所有事件到 Firestore
- ✅ 自動回覆關鍵字訊息
- ✅ 用戶資料自動落地（透過 `/api/profile/upsert`）

---

## 🔗 相關連結

- **LINE Developers Console**：https://developers.line.biz/console/
- **Messaging API 文件**：https://developers.line.biz/en/docs/messaging-api/
- **Webhook 參考**：https://developers.line.biz/en/docs/messaging-api/receiving-messages/
- **Reply API**：https://developers.line.biz/en/reference/messaging-api/#send-reply-message

---

**最後更新**：2025-10-23  
**適用版本**：Next.js 14 + Vercel 部署  
**新增功能**：關鍵字自動回覆、用戶資料落地 API
